import express from 'express';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

import FakturaModel from '../models/faktura';
import NabavkaModel from '../models/nabavka';
import ProizvodModel from '../models/proizvod';
import StamparijaModel from '../models/stamparija';
import UserModel from '../models/user';
import { posaljiFakturuMejlom, sledeciBrojFakture } from './korpa.controller';

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FONTOVI = path.join(__dirname, '..', '..', 'assets', 'fonts');
const iznos = (n: number) => n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function zatvoriIstekleNabavke(): Promise<void> {
  let istekle = await NabavkaModel.find({ status: 'otvorena', istice: { $lte: new Date() } });

  for (let nabavka of istekle) {
    let zauzeta = await NabavkaModel.findOneAndUpdate({ _id: nabavka._id, status: 'otvorena' }, { status: 'bez-ponude' });
    if (!zauzeta) continue;

    let ponude = [...nabavka.ponude].sort((a, b) => a.iznos - b.iznos);
    for (let ponuda of ponude) {
      let stamparija = await StamparijaModel.findOne({ _id: ponuda.stamparija, aktivna: true }).lean();
      if (!stamparija) continue;

      let rezervisano: { id: any; kolicina: number }[] = [];
      let stavke: any[] = [];
      let uspelo = true;
      for (let s of nabavka.stavke) {
        let p = await ProizvodModel.findOneAndUpdate(
          {
            stamparija: ponuda.stamparija,
            naziv: { $regex: `^${escapeRegex(s.naziv)}$`, $options: 'i' },
            aktivan: true,
            kolicinaNaLageru: { $gte: s.kolicina },
          },
          { $inc: { kolicinaNaLageru: -s.kolicina } },
        );
        if (!p) {
          uspelo = false;
          break;
        }
        rezervisano.push({ id: p._id, kolicina: s.kolicina });
        stavke.push({
          proizvod: p._id,
          naziv: s.naziv,
          kolicina: s.kolicina,
          boja: s.boja,
          tipStampe: s.tipStampe,
          tekst: s.tekst,
          slicica: s.slicica,
          cenaPoKomadu: 0,
          ukupno: 0,
        });
      }
      if (!uspelo) {
        for (let r of rezervisano) await ProizvodModel.updateOne({ _id: r.id }, { $inc: { kolicinaNaLageru: r.kolicina } });
        continue;
      }

      let faktura = await FakturaModel.create({
        broj: await sledeciBrojFakture(),
        klijent: nabavka.klijent,
        stamparija: ponuda.stamparija,
        stavke,
        ukupno: ponuda.iznos,
        status: 'u štampi',
        nabavka: nabavka._id,
      });
      await NabavkaModel.updateOne(
        { _id: nabavka._id },
        { status: 'zavrsena', pobednik: ponuda.stamparija, iznos: ponuda.iznos, faktura: faktura._id },
      );
      posaljiFakturuMejlom(faktura.broj);
      break;
    }
  }
}

export class NabavkeController {
  getNabavke = async (req: express.Request, res: express.Response) => {
    await zatvoriIstekleNabavke();

    let klijent = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });

    let nabavke = await NabavkaModel.find({ klijent: klijent._id }).sort({ pokrenuta: -1 }).lean();
    let stamparije = await StamparijaModel.find({ _id: { $in: nabavke.map((n) => n.pobednik).filter(Boolean) } })
      .select('naziv')
      .lean();

    res.json(
      nabavke.map((n) => ({
        id: n._id.toString(),
        pokrenuta: n.pokrenuta,
        istice: n.istice,
        stavke: n.stavke.map((s) => ({ naziv: s.naziv, kolicina: s.kolicina })),
        status: n.status,
        pobednik: n.pobednik ? (stamparije.find((s) => s._id.toString() === n.pobednik!.toString())?.naziv ?? null) : null,
        iznos: n.iznos ?? null,
      })),
    );
  };

  getIzvestaj = async (req: express.Request, res: express.Response) => {
    let nabavkaId = String(req.params.id ?? '');
    if (!/^[a-f\d]{24}$/i.test(nabavkaId)) return res.status(404).json({ message: 'Nabavka ne postoji.' });

    let klijent = await UserModel.findOne({ korisnickoIme: String(req.query.korisnickoIme ?? '') }).select('_id').lean();
    if (!klijent) return res.status(404).json({ message: 'Korisnik ne postoji.' });

    let nabavka = await NabavkaModel.findOne({ _id: nabavkaId, klijent: klijent._id }).lean();
    if (!nabavka) return res.status(404).json({ message: 'Nabavka ne postoji.' });

    if (nabavka.status === 'otvorena') await zatvoriIstekleNabavke();
    nabavka = await NabavkaModel.findById(nabavkaId).lean();
    if (!nabavka || nabavka.status === 'otvorena') {
      return res.status(409).json({ message: 'Izveštaj je dostupan tek nakon završetka nabavke.' });
    }

    let stamparije = await StamparijaModel.find({ _id: { $in: nabavka.ponude.map((p) => p.stamparija) } })
      .select('naziv')
      .lean();
    let nazivi: Record<string, string> = {};
    stamparije.forEach((s) => (nazivi[s._id.toString()] = s.naziv));
    let pobednik = nabavka.pobednik ? (nazivi[nabavka.pobednik.toString()] ?? '') : '';

    let doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="izvestaj-nabavka-${nabavkaId}.pdf"`);
    doc.pipe(res);

    let redovanFont = path.join(FONTOVI, 'DejaVuSans.ttf');
    let boldFont = path.join(FONTOVI, 'DejaVuSans-Bold.ttf');
    if (fs.existsSync(redovanFont) && fs.existsSync(boldFont)) {
      doc.registerFont('regular', redovanFont);
      doc.registerFont('bold', boldFont);
    } else {
      doc.registerFont('regular', 'Helvetica');
      doc.registerFont('bold', 'Helvetica-Bold');
    }

    doc.font('bold').fontSize(18).text('Izveštaj o javnoj nabavci');
    doc.moveDown(0.3);
    doc.font('regular').fontSize(10).fillColor('#555555');
    doc.text(`ID nabavke: ${nabavka._id.toString()}`);
    doc.text(`Raspisana: ${new Date(nabavka.pokrenuta).toLocaleString('sr-RS')}`);
    doc.text(`Status: ${nabavka.status === 'zavrsena' ? 'završena (nabavka dodeljena)' : 'bez ponuda'}`);
    doc.fillColor('#000000');
    doc.moveDown();

    doc.font('bold').fontSize(12).text('Traženi proizvodi');
    doc.font('regular').fontSize(10);
    nabavka.stavke.forEach((s, i) => doc.text(`${i + 1}. ${s.naziv} — količina: ${s.kolicina}`));
    doc.moveDown();

    doc.font('bold').fontSize(12).text('Pristigle ponude (opadajuće po ispravnosti, rastuće po iznosu)');
    doc.moveDown(0.3);
    if (nabavka.ponude.length === 0) {
      doc.font('regular').fontSize(10).text('Nijedna štamparija nije poslala ponudu.');
    } else {
      for (let p of [...nabavka.ponude].sort((a, b) => a.iznos - b.iznos)) {
        let naziv = nazivi[p.stamparija.toString()] ?? '';
        let pobedila = !!nabavka.pobednik && p.stamparija.toString() === nabavka.pobednik.toString();
        doc
          .font(pobedila ? 'bold' : 'regular')
          .fontSize(10)
          .fillColor(pobedila ? '#046a38' : '#000000')
          .text(`${naziv}: ${iznos(p.iznos)} RSD  (${new Date(p.vreme).toLocaleString('sr-RS')})`);
      }
      doc.fillColor('#000000');
      if (nabavka.status === 'zavrsena' && pobednik) {
        doc.moveDown();
        doc.font('bold').fontSize(11).text(`Nabavku je dobila štamparija „${pobednik}“ sa najnižom ukupnom ponudom.`);
      }
    }

    doc.end();
  };
}
