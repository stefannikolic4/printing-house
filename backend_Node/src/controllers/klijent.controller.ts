import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { imageSize } from 'image-size';
import { Types } from 'mongoose';

import FakturaModel from '../models/faktura';
import KomentarModel from '../models/komentar';
import OcenaModel from '../models/ocena';
import ProizvodModel from '../models/proizvod';
import StamparijaModel from '../models/stamparija';
import UserModel from '../models/user';

const ID = /^[a-f\d]{24}$/i;
const TELEFON = /^\+?[0-9 \/\-]{6,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MATICNI_BROJ = /^\d{8}$/;
const PIB = /^[1-9]\d{8}$/;
const EKSTENZIJE: Record<string, string> = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif' };
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const PUBLIC_URL = 'http://localhost:4000';

function proveriSliku(buffer: Buffer, dimenzije?: { min: number; max: number }): { ekstenzija: string } | { greska: string } {
  let dim: ReturnType<typeof imageSize>;
  try {
    dim = imageSize(buffer);
  } catch {
    return { greska: 'Fajl nije moguće očitati kao sliku.' };
  }
  let ekstenzija = EKSTENZIJE[String(dim.type)];
  if (!ekstenzija) return { greska: 'Slika mora biti u JPG, PNG ili GIF formatu.' };

  if (dimenzije) {
    let sirina = dim.width ?? 0;
    let visina = dim.height ?? 0;
    if (sirina < dimenzije.min || visina < dimenzije.min || sirina > dimenzije.max || visina > dimenzije.max) {
      return {
        greska: `Slika mora biti između ${dimenzije.min}x${dimenzije.min} i ${dimenzije.max}x${dimenzije.max} piksela (poslata slika: ${sirina}x${visina}).`,
      };
    }
  }
  return { ekstenzija };
}

async function snimiSliku(buffer: Buffer, ekstenzija: string, podfolder = ''): Promise<string> {
  let ime = path.posix.join(podfolder, crypto.randomUUID() + '.' + ekstenzija);
  await fs.mkdir(path.join(UPLOAD_DIR, podfolder), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, ime), buffer);
  return ime;
}

async function obrisiSliku(ime: string | undefined | null): Promise<void> {
  if (!ime || ime === 'default_profile_image.jpg' || ime === 'default_profile_image.svg') return;
  let putanja = path.join(UPLOAD_DIR, ime);
  if (!putanja.startsWith(UPLOAD_DIR + path.sep)) return;
  await fs.unlink(putanja).catch(() => {});
}

const apsolutniUrl = (u: string): string =>
  /^https?:\/\//i.test(u) ? u : `${PUBLIC_URL}/uploads/${u.replace(/^\/+/, '')}`;

export class KlijentController {
  getProfil = async (req: express.Request, res: express.Response) => {
    let user = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).lean();
    if (!user) return res.status(404).json({ message: 'Korisnik ne postoji.' });

    let { lozinkaHash, resetTokenHash, resetTokenIstice, ...zaKlijenta } = user;
    res.json(zaKlijenta);
  };

  izmeniProfil = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let user = await UserModel.findOne({ korisnickoIme: String(req.body.korisnickoIme ?? '') });
    if (!user) return res.status(404).json({ message: 'Korisnik ne postoji.' });

    let ime = req.body.ime;
    let prezime = req.body.prezime;
    let telefon = req.body.telefon;
    let email = req.body.email;
    let nazivInstitucije = req.body.nazivInstitucije;
    let adresaSedista = req.body.adresaSedista;
    let maticniBroj = req.body.maticniBroj;
    let pib = req.body.pib;
    let slika = req.files ? req.files.slika : undefined;
    let pravno = user.tip === 'pravno';

    let obavezna = [ime, prezime, telefon, email];
    if (pravno) obavezna.push(nazivInstitucije, adresaSedista, maticniBroj, pib);
    if (obavezna.some((v) => typeof v !== 'string' || v.trim() === '')) {
      return res.status(400).json({ message: 'Popunite sva obavezna polja.' });
    }
    if (!TELEFON.test(telefon)) return res.status(400).json({ message: 'Unesite ispravan broj telefona.' });
    if (!EMAIL.test(email)) return res.status(400).json({ message: 'Unesite ispravnu e-mail adresu.' });
    if (pravno && !MATICNI_BROJ.test(maticniBroj)) {
      return res.status(400).json({ message: 'Matični broj mora imati tačno 8 cifara.' });
    }
    if (pravno && !PIB.test(pib)) {
      return res.status(400).json({ message: 'PIB mora imati 9 cifara i ne sme počinjati nulom.' });
    }

    let novaSlika: string | null = null;
    if (slika) {
      if (Array.isArray(slika)) return res.status(400).json({ message: 'Pošaljite samo jednu sliku.' });
      if (slika.size > 1024 * 1024) return res.status(400).json({ message: 'Slika je prevelika (najviše 1 MB).' });
      let provera = proveriSliku(slika.data, { min: 100, max: 250 });
      if ('greska' in provera) return res.status(400).json({ message: provera.greska });
      novaSlika = await snimiSliku(slika.data, provera.ekstenzija);
    }

    let staraSlika = user.fajl;
    user.ime = ime;
    user.prezime = prezime;
    user.telefon = telefon;
    user.email = email;
    if (pravno) {
      user.nazivInstitucije = nazivInstitucije;
      user.adresaSedista = adresaSedista;
      user.maticniBroj = maticniBroj;
      user.pib = pib;
    }
    if (novaSlika) user.fajl = novaSlika;

    try {
      await user.save();
    } catch (err: any) {
      await obrisiSliku(novaSlika);
      if (err.code === 11000) return res.status(409).json({ message: 'E-mail adresa je već registrovana.' });
      throw err;
    }
    if (novaSlika) await obrisiSliku(staraSlika);

    let { lozinkaHash, resetTokenHash, resetTokenIstice, ...zaKlijenta } = user.toObject();
    res.json(zaKlijenta);
  };

  getNarudzbine = async (req: express.Request, res: express.Response) => {
    let klijent = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });

    let fakture = await FakturaModel.find({ klijent: klijent._id }).sort({ broj: -1 }).lean();
    let stamparije = await StamparijaModel.find({ _id: { $in: fakture.map((f) => f.stamparija) } })
      .select('naziv grad')
      .lean();

    res.json(
      fakture.map((f) => {
        let st = stamparije.find((s) => s._id.toString() === f.stamparija.toString());
        return {
          id: f.broj,
          stamparija: st ? st.naziv : '',
          grad: st ? st.grad : '',
          stavke: f.stavke.map((s) => ({ naziv: s.naziv, kolicina: s.kolicina })),
          ukupno: f.ukupno,
          status: f.status,
        };
      }),
    );
  };

  otkaziNarudzbinu = async (req: express.Request, res: express.Response) => {
    let broj = Number(req.params.id);
    if (!Number.isInteger(broj)) return res.status(404).json({ message: 'Narudžbina ne postoji.' });
    let klijent = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });
    let klijentId = klijent._id.toString();

    let faktura = await FakturaModel.findOneAndDelete({ broj, klijent: klijentId, status: 'naručeno' });
    if (!faktura) {
      let postoji = await FakturaModel.exists({ broj, klijent: klijentId });
      if (postoji) return res.status(409).json({ message: 'Narudžbina se više ne može otkazati jer je štampa započeta.' });
      return res.status(404).json({ message: 'Narudžbina ne postoji.' });
    }
    for (let s of faktura.stavke) {
      if (s.proizvod) await ProizvodModel.updateOne({ _id: s.proizvod }, { $inc: { kolicinaNaLageru: s.kolicina } });
    }
    res.json({ message: 'Narudžbina je otkazana.' });
  };

  getProizvod = async (req: express.Request, res: express.Response) => {
    let nijeDostupan = { message: 'Proizvod ne postoji ili više nije dostupan.' };
    let id = String(req.params.id);
    if (!ID.test(id)) return res.status(404).json(nijeDostupan);

    let p = await ProizvodModel.findOne({ _id: id, aktivan: true }).lean();
    if (!p) return res.status(404).json(nijeDostupan);
    let stamparija = await StamparijaModel.findById(p.stamparija).lean();
    if (!stamparija || !stamparija.aktivna) return res.status(404).json(nijeDostupan);

    let komentari = await KomentarModel.find({ proizvod: p._id }).sort({ datum: -1 }).limit(5).lean();
    let mojeKorisnickoIme = String(req.query.korisnickoIme ?? '');

    res.json({
      id: p._id.toString(),
      naziv: p.naziv,
      opis: p.opis,
      cena: p.jedinicnaCena,
      stamparija: stamparija.naziv,
      grad: stamparija.grad,
      adresa: stamparija.adresa,
      lat: stamparija.lat ?? null,
      lng: stamparija.lng ?? null,
      brojLajkova: p.lajkovi.length,
      brojDislajkova: p.dislajkovi.length,
      naStanju: p.kolicinaNaLageru,
      slike: [p.slikaUrl, ...p.dodatneSlike.slice(0, 3)].filter(Boolean).map(apsolutniUrl),
      boje: p.dostupneBoje.length > 0 ? p.dostupneBoje : ['Bela'],
      usluge: p.uslugeStampe.map((u) => ({
        id: u._id!.toString(),
        tip: u.tipStampe,
        maxSirina: u.maxSirinaMm,
        maxVisina: u.maxVisinaMm,
        dodatnaCena: u.dodatnaCenaPoKomadu,
      })),
      komentari: komentari.map((k) => ({
        id: k._id.toString(),
        korisnickoIme: k.korisnickoIme,
        datum: k.datum,
        tekst: k.tekst,
        moj: k.korisnickoIme === mojeKorisnickoIme,
      })),
    });
  };

  getArhiva = async (req: express.Request, res: express.Response) => {
    let klijent = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });
    let klijentId = klijent._id.toString();

    let fakture = await FakturaModel.find({ klijent: klijentId, status: { $in: ['isporučeno', 'primljeno'] } })
      .sort({ datum: -1 })
      .lean();

    let proizvodIds = fakture.flatMap((f) => f.stavke.map((s) => s.proizvod)).filter((x): x is Types.ObjectId => !!x);
    let proizvodi = await ProizvodModel.find({ _id: { $in: proizvodIds } }).select('lajkovi dislajkovi').lean();
    let komentari = await KomentarModel.find({ klijent: klijentId, proizvod: { $in: proizvodIds } }).lean();
    let stamparije = await StamparijaModel.find({ _id: { $in: fakture.map((f) => f.stamparija) } })
      .select('naziv')
      .lean();

    let redovi = fakture.flatMap((f) =>
      f.stavke.map((s, i) => {
        let pid = s.proizvod ? s.proizvod.toString() : null;
        let p = pid ? proizvodi.find((x) => x._id.toString() === pid) : undefined;
        let k = pid ? komentari.find((x) => x.proizvod.toString() === pid) : undefined;
        let ocena: 'svidja' | 'nesvidja' | null = null;
        if (p && p.lajkovi.some((u) => u.toString() === klijentId)) ocena = 'svidja';
        else if (p && p.dislajkovi.some((u) => u.toString() === klijentId)) ocena = 'nesvidja';
        let st = stamparije.find((x) => x._id.toString() === f.stamparija.toString());
        return {
          id: `${f.broj}-${i}`,
          fakturaId: f.broj,
          proizvodId: pid,
          naziv: s.naziv,
          kolicina: s.kolicina,
          stamparija: st ? st.naziv : '',
          datum: f.datum,
          status: f.status,
          ocena,
          komentar: k ? k.tekst : '',
        };
      }),
    );
    res.json(redovi);
  };

  oznaciPrimljeno = async (req: express.Request, res: express.Response) => {
    let broj = Number(req.params.id);
    if (!Number.isInteger(broj)) return res.status(404).json({ message: 'Narudžbina ne postoji.' });
    let klijent = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });
    let klijentId = klijent._id.toString();

    let faktura = await FakturaModel.findOneAndUpdate({ broj, klijent: klijentId, status: 'isporučeno' }, { status: 'primljeno' });
    if (!faktura) {
      let postoji = await FakturaModel.exists({ broj, klijent: klijentId });
      if (postoji) return res.status(409).json({ message: 'Narudžbina nije u statusu „isporučeno“.' });
      return res.status(404).json({ message: 'Narudžbina ne postoji.' });
    }
    res.json({ message: 'Narudžbina je označena kao primljena.' });
  };

  oceni = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let korisnickoIme = String(req.body.korisnickoIme ?? '');
    let klijent = await UserModel.findOne({ korisnickoIme }).select('_id korisnickoIme').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });
    let klijentId = klijent._id.toString();

    let proizvodId = req.body.proizvodId;
    let ocena = req.body.ocena;
    let komentar = req.body.komentar;

    if (typeof proizvodId !== 'string' || !ID.test(proizvodId)) {
      return res.status(400).json({ message: 'Proizvod nije ispravan.' });
    }
    if (ocena !== undefined && ocena !== null && ocena !== 'svidja' && ocena !== 'nesvidja') {
      return res.status(400).json({ message: 'Ocena nije ispravna.' });
    }
    if (komentar !== undefined && komentar !== null && typeof komentar !== 'string') {
      return res.status(400).json({ message: 'Komentar nije ispravan.' });
    }
    komentar = (komentar ?? '').trim();
    if (komentar.length > 500) return res.status(400).json({ message: 'Komentar može imati najviše 500 karaktera.' });
    if (!ocena && !komentar) return res.status(400).json({ message: 'Izaberite ocenu ili unesite komentar.' });

    let primljen = await FakturaModel.exists({ klijent: klijentId, status: 'primljeno', 'stavke.proizvod': proizvodId });
    if (!primljen) return res.status(403).json({ message: 'Ocenjivati možete samo primljene proizvode.' });

    if (ocena) {
      let korisnikId = new Types.ObjectId(klijentId);
      let izmena: any =
        ocena === 'svidja'
          ? { $addToSet: { lajkovi: korisnikId }, $pull: { dislajkovi: korisnikId } }
          : { $addToSet: { dislajkovi: korisnikId }, $pull: { lajkovi: korisnikId } };
      await ProizvodModel.updateOne({ _id: proizvodId }, izmena);
      await OcenaModel.updateOne(
        { proizvod: proizvodId, klijent: klijentId },
        { vrednost: ocena === 'svidja' ? 5 : 1, datum: new Date() },
        { upsert: true },
      );
    }
    if (komentar) {
      await KomentarModel.updateOne(
        { proizvod: proizvodId, klijent: klijentId },
        { korisnickoIme: klijent.korisnickoIme, tekst: komentar, datum: new Date() },
        { upsert: true },
      );
    }
    res.json({ message: 'Ocena je sačuvana.' });
  };
}
