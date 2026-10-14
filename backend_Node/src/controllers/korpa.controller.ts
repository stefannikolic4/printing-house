import express from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import crypto from 'crypto';
import path from 'path';
import { imageSize } from 'image-size';
import { Types } from 'mongoose';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

import BrojacModel from '../models/brojac';
import FakturaModel from '../models/faktura';
import KorpaModel from '../models/korpa';
import NabavkaModel from '../models/nabavka';
import ProizvodModel from '../models/proizvod';
import StamparijaModel from '../models/stamparija';
import UserModel from '../models/user';

const ID = /^[a-f\d]{24}$/i;
const EKSTENZIJE: Record<string, string> = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif' };
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const FONTOVI = path.join(__dirname, '..', '..', 'assets', 'fonts');
const NABAVKA_TRAJANJE_MS = 10 * 60 * 1000;

const zaokruzi = (n: number): number => Math.round(n * 100) / 100;

async function obrisiFajl(ime: string | undefined | null): Promise<void> {
  if (!ime) return;
  let putanja = path.join(UPLOAD_DIR, ime);
  if (!putanja.startsWith(UPLOAD_DIR + path.sep)) return;
  await fs.unlink(putanja).catch(() => {});
}

const transporter = nodemailer.createTransport({ jsonTransport: true });

export interface Mejl {
  to?: string;
  bcc?: string[];
  subject: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function posaljiMejl(mejl: Mejl): Promise<void> {
  await transporter.sendMail({ from: 'Printing House <no-reply@printinghouse.local>', ...mejl });
  let prilozi = (mejl.attachments ?? []).map((p) => p.filename).join(', ');
  console.log(
    `[mejl] SMTP nije podešen, poruka nije poslata. Za: ${mejl.to ?? mejl.bcc?.join(', ')} | ${mejl.subject}` +
      (prilozi ? ` | prilozi: ${prilozi}` : ''),
  );
}

interface PodaciKupca {
  ime: string;
  prezime: string;
  email: string;
  nazivInstitucije: string;
  adresaSedista: string;
  pib: string;
}

const iznos = (n: number) => n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const datumPdf = (d: Date) => {
  let dan = String(d.getDate()).padStart(2, '0');
  let mesec = String(d.getMonth() + 1).padStart(2, '0');
  return `${dan}.${mesec}.${d.getFullYear()}.`;
};

export function napraviPdfFakture(
  faktura: { broj: number; stavke: any[]; ukupno: number; datum: Date },
  kupac: PodaciKupca,
  prodavac: { naziv: string; adresa: string; grad: string },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let doc = new PDFDocument({ size: 'A4', margin: 50 });
    let delovi: Buffer[] = [];
    doc.on('data', (deo: Buffer) => delovi.push(deo));
    doc.on('end', () => resolve(Buffer.concat(delovi)));
    doc.on('error', reject);

    let redovanFont = path.join(FONTOVI, 'DejaVuSans.ttf');
    let boldFont = path.join(FONTOVI, 'DejaVuSans-Bold.ttf');
    if (fsSync.existsSync(redovanFont) && fsSync.existsSync(boldFont)) {
      doc.registerFont('regular', redovanFont);
      doc.registerFont('bold', boldFont);
    } else {
      doc.registerFont('regular', 'Helvetica');
      doc.registerFont('bold', 'Helvetica-Bold');
    }

    doc.font('bold').fontSize(20).text(`Faktura br. ${faktura.broj}`);
    doc.font('regular').fontSize(10).fillColor('#555555').text(`Datum izdavanja: ${datumPdf(new Date(faktura.datum))}`);
    doc.moveDown();

    let vrh = doc.y;
    doc.fillColor('#000000').font('bold').fontSize(11).text('Izdaje', 50, vrh, { width: 240 });
    doc.font('regular').fontSize(10).text(`${prodavac.naziv}\n${prodavac.adresa}\n${prodavac.grad}`, 50, doc.y, { width: 240 });
    let kupacNaziv = kupac.nazivInstitucije || `${kupac.ime} ${kupac.prezime}`;
    doc.font('bold').fontSize(11).text('Kupac', 320, vrh, { width: 225 });
    doc
      .font('regular')
      .fontSize(10)
      .text(
        [kupacNaziv, kupac.adresaSedista, kupac.pib ? `PIB: ${kupac.pib}` : '', kupac.email].filter(Boolean).join('\n'),
        320,
        doc.y,
        { width: 225 },
      );
    doc.moveDown(2);

    let kolone = { naziv: 50, kolicina: 285, cena: 355, ukupno: 450 };
    let y = Math.max(doc.y, vrh + 90);
    let zaglavlje = (yy: number) => {
      doc.font('bold').fontSize(10);
      doc.text('Proizvod', kolone.naziv, yy, { width: 230 });
      doc.text('Količina', kolone.kolicina, yy, { width: 60, align: 'right' });
      doc.text('Cena (RSD)', kolone.cena, yy, { width: 90, align: 'right' });
      doc.text('Ukupno (RSD)', kolone.ukupno, yy, { width: 95, align: 'right' });
      doc.moveTo(50, yy + 15).lineTo(545, yy + 15).strokeColor('#999999').stroke();
    };
    zaglavlje(y);
    y += 22;

    for (let s of faktura.stavke) {
      let opis = [s.naziv, `boja: ${s.boja}`, s.tipStampe ? `štampa: ${s.tipStampe}` : '', s.tekst ? `tekst: „${s.tekst}“` : '']
        .filter(Boolean)
        .join(', ');
      if (y > 730) {
        doc.addPage();
        y = 50;
        zaglavlje(y);
        y += 22;
      }
      doc.font('regular').fontSize(9);
      let visina = doc.heightOfString(opis, { width: 230 });
      doc.text(opis, kolone.naziv, y, { width: 230 });
      doc.text(String(s.kolicina), kolone.kolicina, y, { width: 60, align: 'right' });
      doc.text(s.cenaPoKomadu ? iznos(s.cenaPoKomadu) : '—', kolone.cena, y, { width: 90, align: 'right' });
      doc.text(s.ukupno ? iznos(s.ukupno) : '—', kolone.ukupno, y, { width: 95, align: 'right' });
      y += Math.max(visina, 12) + 6;
    }

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#999999').stroke();
    doc.font('bold').fontSize(12).text(`Ukupno za uplatu: ${iznos(faktura.ukupno)} RSD`, 50, y + 10, { width: 495, align: 'right' });

    doc.end();
  });
}

export async function sledeciBrojFakture(): Promise<number> {
  let brojac = await BrojacModel.findOneAndUpdate({ _id: 'faktura' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return 1000 + brojac!.seq;
}

export async function posaljiFakturuMejlom(broj: number): Promise<void> {
  try {
    let faktura = await FakturaModel.findOne({ broj }).lean();
    if (!faktura) return;
    let klijent = await UserModel.findById(faktura.klijent).lean();
    let stamparija = await StamparijaModel.findById(faktura.stamparija).lean();
    if (!klijent || !stamparija || !klijent.ime || !klijent.prezime || !klijent.email) return;

    let kupac: PodaciKupca = {
      ime: klijent.ime,
      prezime: klijent.prezime,
      email: klijent.email,
      nazivInstitucije: klijent.nazivInstitucije ?? '',
      adresaSedista: klijent.adresaSedista ?? '',
      pib: klijent.pib ?? '',
    };

    let pdf = await napraviPdfFakture(faktura, kupac, {
      naziv: stamparija.naziv,
      adresa: stamparija.adresa,
      grad: stamparija.grad,
    });
    await posaljiMejl({
      to: klijent.email,
      subject: `Faktura br. ${faktura.broj} - Printing House`,
      text: `Poštovani ${klijent.ime} ${klijent.prezime},\n\nu prilogu se nalazi faktura br. ${faktura.broj} za narudžbinu u štampariji ${stamparija.naziv}.\n\nPrinting House`,
      attachments: [{ filename: `faktura-${faktura.broj}.pdf`, content: pdf }],
    });
  } catch (err) {
    console.error(`Slanje fakture ${broj} nije uspelo:`, err);
  }
}

export async function obavestiStamparije(nabavka: { stavke: any[]; istice: Date; _id: Types.ObjectId }): Promise<void> {
  try {
    let vlasnici = await UserModel.find({ tip: 'stamparija', status: 'odobren' }).select('email').lean();
    let mejlovi = vlasnici.map((v) => v.email).filter((e): e is string => !!e);
    if (mejlovi.length === 0) return;

    let spisak = nabavka.stavke
      .map((s, i) => `${i + 1}. ${s.naziv} (količina: ${s.kolicina}${s.tipStampe ? `, štampa: ${s.tipStampe}` : ''})`)
      .join('\n');
    let minuta = Math.round(NABAVKA_TRAJANJE_MS / 60000);
    await posaljiMejl({
      bcc: mejlovi,
      subject: 'Otvorena javna nabavka - Printing House',
      text:
        `Otvorena je javna nabavka. Ponude se primaju narednih ${minuta} minuta, ` +
        `do ${new Date(nabavka.istice).toLocaleString('sr-RS')}.\n\nPotrebni proizvodi:\n${spisak}\n\n` +
        `Nabavku dobija štamparija sa najnižom ukupnom ponudom koja ima dovoljnu količinu svakog proizvoda na stanju.`,
    });
  } catch (err) {
    console.error('Slanje obaveštenja o nabavci nije uspelo:', err);
  }
}

interface StavkaKorpeSastav {
  proizvod: Types.ObjectId;
  naziv: string;
  kolicina: number;
  boja: string;
  tipStampe: string;
  tekst: string;
  slicica: string;
  cenaPoKomadu: number;
  ukupno: number;
}

interface GrupaKorpe {
  stamparija: { id: string; naziv: string; grad: string };
  stavke: StavkaKorpeSastav[];
  ukupno: number;
}

export async function sastaviKorpu(klijentId: string): Promise<{ grupe: GrupaKorpe[]; ukupno: number; preskoceno: number }> {
  let korpa = await KorpaModel.findOne({ klijent: klijentId }).lean();
  if (!korpa || korpa.stavke.length === 0) return { grupe: [], ukupno: 0, preskoceno: 0 };

  let proizvodi = await ProizvodModel.find({ _id: { $in: korpa.stavke.map((s) => s.proizvod) }, aktivan: true }).lean();
  let stamparije = await StamparijaModel.find({
    _id: { $in: proizvodi.map((p) => p.stamparija) },
    aktivna: true,
  })
    .select('naziv grad')
    .lean();

  let grupe: GrupaKorpe[] = [];
  let preskoceno = 0;
  for (let stavka of korpa.stavke) {
    let p = proizvodi.find((x) => x._id.toString() === stavka.proizvod.toString());
    let st = p ? stamparije.find((x) => x._id.toString() === p!.stamparija.toString()) : undefined;
    if (!p || !st) {
      preskoceno++;
      continue;
    }
    let usluga = stavka.usluga ? p.uslugeStampe.find((u) => u._id!.toString() === stavka.usluga!.toString()) : undefined;
    let cenaPoKomadu = zaokruzi(p.jedinicnaCena + (usluga ? usluga.dodatnaCenaPoKomadu : 0));

    let grupa = grupe.find((g) => g.stamparija.id === st!._id.toString());
    if (!grupa) {
      grupa = { stamparija: { id: st._id.toString(), naziv: st.naziv, grad: st.grad }, stavke: [], ukupno: 0 };
      grupe.push(grupa);
    }
    let ukupnoStavka = zaokruzi(cenaPoKomadu * stavka.kolicina);
    grupa.stavke.push({
      proizvod: p._id,
      naziv: p.naziv,
      kolicina: stavka.kolicina,
      boja: stavka.boja,
      tipStampe: usluga ? usluga.tipStampe : '',
      tekst: stavka.tekst,
      slicica: stavka.slicica,
      cenaPoKomadu,
      ukupno: ukupnoStavka,
    });
    grupa.ukupno = zaokruzi(grupa.ukupno + ukupnoStavka);
  }
  return { grupe, ukupno: zaokruzi(grupe.reduce((z, g) => z + g.ukupno, 0)), preskoceno };
}

const TIPOVI_KARTICA = ['Visa', 'Mastercard', 'Maestro', 'DinaCard'];
const ODBIJENE: Record<string, string> = {
  '4000000000000002': 'Kartica je odbijena.',
  '4000000000009995': 'Nedovoljno sredstava na kartici.',
  '4000000000000069': 'Kartica je istekla.',
  '4000000000000127': 'CVC kod nije ispravan.',
};

function luhn(broj: string): boolean {
  let zbir = 0;
  for (let i = 0; i < broj.length; i++) {
    let cifra = Number(broj[broj.length - 1 - i]);
    if (i % 2 === 1) {
      cifra *= 2;
      if (cifra > 9) cifra -= 9;
    }
    zbir += cifra;
  }
  return zbir % 10 === 0;
}

function naplati(kartica: { tip: string; broj: string; cvc: string; istek: string }, iznosZaPlacanje: number): { uspeh: boolean; poruka: string } {
  if (!TIPOVI_KARTICA.includes(kartica.tip)) return { uspeh: false, poruka: 'Izaberite tip kartice.' };
  if (!/^\d{13,19}$/.test(kartica.broj) || !luhn(kartica.broj)) {
    return { uspeh: false, poruka: 'Broj kartice nije ispravan.' };
  }
  if (!/^\d{3,4}$/.test(kartica.cvc)) return { uspeh: false, poruka: 'CVC kod nije ispravan.' };

  let istek = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(kartica.istek);
  if (!istek) return { uspeh: false, poruka: 'Datum isteka mora biti u formatu MM/GG.' };
  let krajMeseca = new Date(2000 + Number(istek[2]), Number(istek[1]), 1);
  if (krajMeseca.getTime() <= Date.now()) return { uspeh: false, poruka: 'Kartica je istekla.' };

  if (!(iznosZaPlacanje > 0)) return { uspeh: false, poruka: 'Iznos za plaćanje nije ispravan.' };

  let razlog = ODBIJENE[kartica.broj];
  if (razlog) return { uspeh: false, poruka: `Plaćanje nije uspelo: ${razlog}` };

  return { uspeh: true, poruka: 'Plaćanje je uspešno.' };
}

export class KorpaController {
  dodajUKorpu = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let klijent = await UserModel.findOne({ korisnickoIme: String(req.body.korisnickoIme ?? '') }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });
    let klijentId = klijent._id.toString();

    let proizvodId = req.body.proizvodId;
    let boja = req.body.boja;
    let usluga = req.body.usluga;
    let tekst = typeof req.body.tekst === 'string' ? req.body.tekst.trim() : '';
    let kolicina = Number(req.body.kolicina);
    let slicica = req.files ? req.files.slicica : undefined;

    if (typeof proizvodId !== 'string' || !ID.test(proizvodId)) {
      return res.status(404).json({ message: 'Proizvod ne postoji ili više nije dostupan.' });
    }
    if (!Number.isInteger(kolicina) || kolicina < 1 || kolicina > 100000) {
      return res.status(400).json({ message: 'Količina mora biti ceo broj, najmanje 1.' });
    }
    if (tekst.length > 200) return res.status(400).json({ message: 'Tekst može imati najviše 200 karaktera.' });

    let p = await ProizvodModel.findOne({ _id: proizvodId, aktivan: true }).lean();
    if (!p) return res.status(404).json({ message: 'Proizvod ne postoji ili više nije dostupan.' });

    let boje = p.dostupneBoje.length > 0 ? p.dostupneBoje : ['Bela'];
    if (typeof boja !== 'string' || !boje.includes(boja)) {
      return res.status(400).json({ message: 'Izabrana boja nije dostupna.' });
    }
    let uslugaId: Types.ObjectId | null = null;
    if (p.uslugeStampe.length > 0) {
      let u = p.uslugeStampe.find((x) => x._id!.toString() === usluga);
      if (!u) return res.status(400).json({ message: 'Izaberite vrstu štampe.' });
      uslugaId = u._id!;
    }

    let korpa = await KorpaModel.findOne({ klijent: klijentId }).lean();
    let uKorpi = korpa
      ? korpa.stavke.filter((s) => s.proizvod.toString() === proizvodId).reduce((zbir, s) => zbir + s.kolicina, 0)
      : 0;
    if (uKorpi + kolicina > p.kolicinaNaLageru) {
      return res.status(409).json({ message: 'Nema dovoljno proizvoda trenutno na stanju' });
    }

    let sacuvanaSlicica = '';
    if (slicica) {
      if (Array.isArray(slicica)) return res.status(400).json({ message: 'Pošaljite samo jednu sličicu.' });
      let dim: ReturnType<typeof imageSize>;
      try {
        dim = imageSize(slicica.data);
      } catch {
        return res.status(400).json({ message: 'Fajl nije moguće očitati kao sliku.' });
      }
      let ekstenzija = EKSTENZIJE[String(dim.type)];
      if (!ekstenzija) return res.status(400).json({ message: 'Slika mora biti u JPG, PNG ili GIF formatu.' });
      let ime = path.posix.join('slicice', crypto.randomUUID() + '.' + ekstenzija);
      await fs.mkdir(path.join(UPLOAD_DIR, 'slicice'), { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, ime), slicica.data);
      sacuvanaSlicica = ime;
    }

    try {
      await KorpaModel.updateOne(
        { klijent: klijentId },
        { $push: { stavke: { proizvod: p._id, kolicina, boja, usluga: uslugaId, tekst, slicica: sacuvanaSlicica } } },
        { upsert: true },
      );
    } catch (err) {
      await obrisiFajl(sacuvanaSlicica);
      throw err;
    }
    res.status(201).json({ message: 'Proizvod je dodat u korpu.' });
  };

  getKorpa = async (req: express.Request, res: express.Response) => {
    let klijent = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });

    let { grupe, ukupno } = await sastaviKorpu(klijent._id.toString());
    res.json({
      grupe: grupe.map((g) => ({
        stamparijaId: g.stamparija.id,
        stamparija: g.stamparija.naziv,
        grad: g.stamparija.grad,
        ukupno: g.ukupno,
        stavke: g.stavke.map((s) => ({ naziv: s.naziv, kolicina: s.kolicina, tipStampe: s.tipStampe, ukupno: s.ukupno })),
      })),
      ukupno,
    });
  };

  potvrdiKorpu = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let user = await UserModel.findOne({ korisnickoIme: String(req.body.korisnickoIme ?? '') }).select('_id tip').lean();
    if (!user) return res.status(404).json({ message: 'Korisnik ne postoji.' });
    let klijentId = user._id.toString();

    let { grupe, ukupno, preskoceno } = await sastaviKorpu(klijentId);
    if (grupe.length === 0) return res.status(400).json({ message: 'Korpa je prazna.' });
    let napomena = preskoceno > 0 ? ' Neki proizvodi više nisu dostupni i nisu uključeni.' : '';

    if (user.tip === 'pravno') {
      let sada = Date.now();
      let nabavka = await NabavkaModel.create({
        klijent: klijentId,
        stavke: grupe.flatMap((g) =>
          g.stavke.map((s) => ({
            naziv: s.naziv,
            kolicina: s.kolicina,
            boja: s.boja,
            tipStampe: s.tipStampe,
            tekst: s.tekst,
            slicica: s.slicica,
          })),
        ),
        pokrenuta: new Date(sada),
        istice: new Date(sada + NABAVKA_TRAJANJE_MS),
      });
      await KorpaModel.deleteOne({ klijent: klijentId });
      obavestiStamparije(nabavka);
      let minuta = Math.round(NABAVKA_TRAJANJE_MS / 60000);
      return res.status(201).json({
        message: `Poziv za ponude je otvoren i traje ${minuta} minuta. Tok nabavke pratite na strani „Javne nabavke“.${napomena}`,
        fakture: [],
        ukupno,
      });
    }

    let rezervisano: { id: Types.ObjectId; kolicina: number }[] = [];
    let vratiZalihu = async () => {
      for (let r of rezervisano) await ProizvodModel.updateOne({ _id: r.id }, { $inc: { kolicinaNaLageru: r.kolicina } });
    };
    for (let g of grupe) {
      for (let s of g.stavke) {
        let p = await ProizvodModel.findOneAndUpdate(
          { _id: s.proizvod, aktivan: true, kolicinaNaLageru: { $gte: s.kolicina } },
          { $inc: { kolicinaNaLageru: -s.kolicina } },
        );
        if (!p) {
          await vratiZalihu();
          return res.status(409).json({ message: `Nema dovoljno proizvoda trenutno na stanju: ${s.naziv}` });
        }
        rezervisano.push({ id: s.proizvod, kolicina: s.kolicina });
      }
    }

    let napravljene: number[] = [];
    try {
      for (let g of grupe) {
        let faktura = await FakturaModel.create({
          broj: await sledeciBrojFakture(),
          klijent: klijentId,
          stamparija: g.stamparija.id,
          stavke: g.stavke,
          ukupno: g.ukupno,
          status: 'naručeno',
        });
        napravljene.push(faktura.broj);
      }
      await KorpaModel.deleteOne({ klijent: klijentId });
    } catch (err) {
      await vratiZalihu();
      await FakturaModel.deleteMany({ broj: { $in: napravljene } });
      throw err;
    }

    napravljene.forEach((broj) => posaljiFakturuMejlom(broj));
    res.status(201).json({
      message: `Narudžbina je potvrđena. Formirano faktura: ${napravljene.length}.${napomena}`,
      fakture: grupe.map((g, i) => ({ id: napravljene[i], ukupno: g.ukupno })),
      ukupno,
    });
  };

  plati = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let klijent = await UserModel.findOne({ korisnickoIme: String(req.body.korisnickoIme ?? '') }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });
    let klijentId = klijent._id.toString();

    let fakture = req.body.fakture;
    let kartica = req.body.kartica;

    if (!Array.isArray(fakture) || fakture.length === 0 || !fakture.every((f: any) => Number.isInteger(f))) {
      return res.status(400).json({ message: 'Nisu izabrane narudžbine za plaćanje.' });
    }
    if (typeof kartica !== 'object' || kartica === null) {
      return res.status(400).json({ message: 'Unesite podatke o kartici.' });
    }

    let zaPlacanje = await FakturaModel.find({ broj: { $in: fakture }, klijent: klijentId, status: 'naručeno' }).lean();
    if (zaPlacanje.length !== new Set(fakture).size) {
      return res.status(409).json({ message: 'Neke narudžbine više ne čekaju plaćanje.' });
    }
    let ukupno = Math.round(zaPlacanje.reduce((z, f) => z + f.ukupno, 0) * 100) / 100;

    let rezultat = naplati(
      {
        tip: String(kartica.tip ?? ''),
        broj: String(kartica.broj ?? ''),
        cvc: String(kartica.cvc ?? ''),
        istek: String(kartica.istek ?? ''),
      },
      ukupno,
    );
    if (!rezultat.uspeh) return res.status(402).json({ message: rezultat.poruka });

    await FakturaModel.updateMany({ broj: { $in: fakture }, klijent: klijentId, status: 'naručeno' }, { status: 'plaćeno' });
    res.json({ message: `Plaćanje je uspešno. Naručeno: ${zaPlacanje.length}, plaćeno ukupno ${ukupno.toFixed(2)} RSD.` });
  };
}
