import express from 'express';

import StamparijaModel from '../models/stamparija';
import ProizvodModel from '../models/proizvod';
import UserModel from '../models/user';
import KategorijaModel from '../models/kategorija';
import FakturaModel from '../models/faktura';
import NabavkaModel from '../models/nabavka';
import { proveriSliku, snimiSliku, obrisiSliku } from '../utils/slika';

const ID = /^[a-f\d]{24}$/i;
const MAX_DODATNIH_SLIIKA = 3;

interface UslugaUnos {
  tipStampe: string;
  dodatnaCenaPoKomadu: number;
  maxSirinaMm: number;
  maxVisinaMm: number;
}

async function stamparijaVlasnika(korisnickoIme: string) {
  if (!korisnickoIme) return null;
  let user = await UserModel.findOne({ korisnickoIme, tip: 'stamparija' }).lean();
  if (!user) return null;
  let stamparija = await StamparijaModel.findOne({ vlasnik: user._id }).lean();
  if (!stamparija || !stamparija.aktivna) return null;
  return stamparija;
}

function fajlPolje(polje: any): { data: Buffer }[] | null {
  if (!polje) return null;
  return Array.isArray(polje) ? polje : [polje];
}

function jsonNiz(vrednost: any): any[] | null {
  if (typeof vrednost !== 'string' || !vrednost.trim()) return null;
  try {
    let parsed = JSON.parse(vrednost);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const zaokruzi = (n: number): number => Math.round(n * 100) / 100;

export class StamparController {
  getKategorije = async (req: express.Request, res: express.Response) => {
    let kategorije = await KategorijaModel.find().sort({ naziv: 1 }).lean();
    res.json(kategorije.map((k) => ({ kategorija: k.naziv, potkategorije: k.potkategorije })));
  };

  dodajProizvod = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let stamparija = await stamparijaVlasnika(String(req.body.korisnickoIme ?? ''));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let sifra = String(req.body.sifra ?? '').trim();
    let naziv = String(req.body.naziv ?? '').trim();
    let opis = String(req.body.opis ?? '').trim();
    let kategorija = String(req.body.kategorija ?? '').trim();
    let potkategorija = String(req.body.potkategorija ?? '').trim();
    let jedinicnaCena = Number(req.body.jedinicnaCena);
    let kolicina = Number(req.body.kolicinaNaLageru);

    if (!sifra || !naziv || !kategorija) {
      return res.status(400).json({ message: 'Šifra, naziv i kategorija su obavezni.' });
    }
    if (!Number.isFinite(jedinicnaCena) || jedinicnaCena < 0) {
      return res.status(400).json({ message: 'Jedinična cena mora biti broj, 0 ili veći.' });
    }
    if (!Number.isInteger(kolicina) || kolicina < 0) {
      return res.status(400).json({ message: 'Količina na lageru mora biti ceo broj, 0 ili veći.' });
    }
    let kat = await KategorijaModel.findOne({ naziv: kategorija }).lean();
    if (!kat) return res.status(400).json({ message: 'Kategorija nije iz predefinisane liste.' });
    if (potkategorija && !kat.potkategorije.includes(potkategorija)) {
      return res.status(400).json({ message: 'Potkategorija nije iz predefinisane liste.' });
    }

    let boje = jsonNiz(req.body.dostupneBoje);
    if (req.body.dostupneBoje && boje === null) {
      return res.status(400).json({ message: 'dostupneBoje mora biti JSON niz stringova.' });
    }
    let nizBoje = (boje ?? []).map((b) => String(b).trim()).filter(Boolean).slice(0, 20);

    let usluge = jsonNiz(req.body.uslugeStampe);
    if (req.body.uslugeStampe && usluge === null) {
      return res.status(400).json({ message: 'uslugeStampe mora biti JSON niz.' });
    }
    let nizUsluge: UslugaUnos[] = [];
    for (let u of usluge ?? []) {
      let tip = String(u?.tipStampe ?? '').trim();
      let cena = Number(u?.dodatnaCenaPoKomadu ?? 0);
      let sirina = Number(u?.maxSirinaMm ?? 0);
      let visina = Number(u?.maxVisinaMm ?? 0);
      if (!tip) return res.status(400).json({ message: 'Svaka usluga štampe mora imati vrstu štampe.' });
      if (![cena, sirina, visina].every((n) => Number.isFinite(n) && n >= 0)) {
        return res.status(400).json({ message: 'Cena i dimenzije usluge moraju biti brojevi, 0 ili veći.' });
      }
      nizUsluge.push({ tipStampe: tip, dodatnaCenaPoKomadu: cena, maxSirinaMm: sirina, maxVisinaMm: visina });
    }
    if (nizUsluge.length > 20) nizUsluge = nizUsluge.slice(0, 20);

    let slika = fajlPolje(req.files ? (req.files as any).slika : undefined);
    let dodatne = fajlPolje(req.files ? (req.files as any).dodatneSlike : undefined);
    if (dodatne && dodatne.length > MAX_DODATNIH_SLIIKA) {
      return res.status(400).json({ message: 'Najviše 3 dodatne slike.' });
    }

    let sacuvaneSlike: string[] = [];
    try {
      if (slika) {
        let provera = proveriSliku(slika[0].data);
        if ('greska' in provera) return res.status(400).json({ message: provera.greska });
        sacuvaneSlike.push(await snimiSliku(slika[0].data, provera.ekstenzija, 'proizvodi'));
      }
      if (dodatne) {
        for (let f of dodatne) {
          let provera = proveriSliku(f.data);
          if ('greska' in provera) return res.status(400).json({ message: provera.greska });
          sacuvaneSlike.push(await snimiSliku(f.data, provera.ekstenzija, 'proizvodi'));
        }
      }

      let proizvod = await ProizvodModel.create({
        stamparija: stamparija._id,
        sifra,
        naziv,
        opis,
        kategorija,
        potkategorija,
        jedinicnaCena,
        kolicinaNaLageru: kolicina,
        dostupneBoje: nizBoje,
        slikaUrl: sacuvaneSlike[0] ?? '',
        dodatneSlike: sacuvaneSlike.slice(1, 1 + MAX_DODATNIH_SLIIKA),
        uslugeStampe: nizUsluge,
      });
      return res.status(201).json({ message: 'Proizvod je dodat.', id: proizvod._id.toString() });
    } catch (err: any) {
      for (let s of sacuvaneSlike) await obrisiSliku(s);
      if (err && err.code === 11000) {
        return res.status(409).json({ message: 'Proizvod sa ovom šifrom već postoji u vašoj štampariji.' });
      }
      throw err;
    }
  };

  uveziProizvode = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let stamparija = await stamparijaVlasnika(String(req.body.korisnickoIme ?? ''));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let lista = jsonNiz(req.body.proizvodi);
    if (lista === null) return res.status(400).json({ message: 'proizvodi mora biti JSON niz.' });
    if (lista.length === 0) return res.status(400).json({ message: 'Fajl ne sadrži nijedan proizvod.' });
    if (lista.length > 500) return res.status(400).json({ message: 'Najviše 500 proizvoda po uvozu.' });

    let kategorije = await KategorijaModel.find().lean();
    let poNazivu = new Map(kategorije.map((k) => [k.naziv, k.potkategorije]));

    let fajlovi = (req.files ?? {}) as Record<string, any>;
    let dodato = 0;
    let preskoceno: string[] = [];

    for (let p of lista) {
      let sifra = String(p?.sifra ?? '').trim();
      let naziv = String(p?.naziv ?? '').trim();
      let kategorija = String(p?.kategorija ?? '').trim();
      let potkategorija = String(p?.potkategorija ?? '').trim();
      let jedinicnaCena = Number(p?.jedinicnaCena);
      let kolicina = Number(p?.kolicinaNaLageru);
      if (!sifra || !naziv || !kategorija || !Number.isFinite(jedinicnaCena) || jedinicnaCena < 0) {
        preskoceno.push(sifra || '(bez šifre)');
        continue;
      }
      if (!Number.isInteger(kolicina) || kolicina < 0) kolicina = 0;
      let potkategorije = poNazivu.get(kategorija);
      if (!potkategorije) {
        preskoceno.push(sifra);
        continue;
      }
      if (potkategorija && !potkategorije.includes(potkategorija)) potkategorija = '';

      let usluge: UslugaUnos[] = [];
      if (Array.isArray(p?.uslugeStampe)) {
        for (let u of p.uslugeStampe) {
          let tip = String(u?.tipStampe ?? '').trim();
          if (!tip) continue;
          usluge.push({
            tipStampe: tip,
            dodatnaCenaPoKomadu: Math.max(0, Number(u?.dodatnaCenaPoKomadu) || 0),
            maxSirinaMm: Math.max(0, Number(u?.maxSirinaMm) || 0),
            maxVisinaMm: Math.max(0, Number(u?.maxVisinaMm) || 0),
          });
        }
      }

      let glavna = fajlPolje(fajlovi[`slike_${sifra}`]);
      let dodatne = fajlPolje(fajlovi[`dodatne_${sifra}`]);
      if (dodatne && dodatne.length > MAX_DODATNIH_SLIIKA) dodatne = dodatne.slice(0, MAX_DODATNIH_SLIIKA);

      let slike: string[] = [];
      if (glavna) {
        let provera = proveriSliku(glavna[0].data);
        if (!('greska' in provera)) slike.push(await snimiSliku(glavna[0].data, provera.ekstenzija, 'proizvodi'));
      }
      if (dodatne) {
        for (let f of dodatne) {
          let provera = proveriSliku(f.data);
          if (!('greska' in provera)) slike.push(await snimiSliku(f.data, provera.ekstenzija, 'proizvodi'));
        }
      }

      await ProizvodModel.updateOne(
        { stamparija: stamparija._id, sifra },
        {
          $set: {
            naziv,
            opis: String(p?.opis ?? ''),
            kategorija,
            potkategorija,
            jedinicnaCena,
            kolicinaNaLageru: kolicina,
            dostupneBoje: Array.isArray(p?.dostupneBoje) ? p.dostupneBoje.map(String).filter(Boolean).slice(0, 20) : [],
            slikaUrl: slike[0] ?? '',
            dodatneSlike: slike.slice(1, 1 + MAX_DODATNIH_SLIIKA),
            uslugeStampe: usluge,
            aktivan: true,
          },
        },
        { upsert: true },
      );
      dodato++;
    }

    let poruka = `Uvezeno proizvoda: ${dodato}.`;
    if (preskoceno.length > 0) {
      poruka += ` Preskočeno (nepoznata kategorija ili neispravni podaci): ${preskoceno.join(', ')}.`;
    }
    res.status(201).json({ message: poruka });
  };

  getLager = async (req: express.Request, res: express.Response) => {
    let stamparija = await stamparijaVlasnika(String(req.params.korisnickoIme));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let proizvodi = await ProizvodModel.find({ stamparija: stamparija._id }).sort({ sifra: 1 }).lean();
    res.json({
      proizvodi: proizvodi.map((p) => ({
        id: p._id.toString(),
        sifra: p.sifra,
        naziv: p.naziv,
        kategorija: p.kategorija,
        kolicina: p.kolicinaNaLageru,
      })),
    });
  };

  azurirajKolicinu = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let stamparija = await stamparijaVlasnika(String(req.body.korisnickoIme ?? ''));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let proizvodId = String(req.body.proizvodId ?? '');
    let novaKolicina = Number(req.body.novaKolicina);
    if (!ID.test(proizvodId)) return res.status(404).json({ message: 'Proizvod ne postoji.' });
    if (!Number.isInteger(novaKolicina) || novaKolicina < 0) {
      return res.status(400).json({ message: 'Količina mora biti ceo broj, 0 ili veći.' });
    }

    let proizvod = await ProizvodModel.findOneAndUpdate(
      { _id: proizvodId, stamparija: stamparija._id },
      { kolicinaNaLageru: novaKolicina },
    );
    if (!proizvod) return res.status(404).json({ message: 'Proizvod ne postoji.' });
    res.json({ message: 'Količina je ažurirana.' });
  };

  getNarudzbine = async (req: express.Request, res: express.Response) => {
    let stamparija = await stamparijaVlasnika(String(req.params.korisnickoIme));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let fakture = await FakturaModel.find({ stamparija: stamparija._id }).sort({ broj: -1 }).lean();
    let korisnici = await UserModel.find({ _id: { $in: fakture.map((f) => f.klijent) } })
      .select('korisnickoIme')
      .lean();
    let korisniciMapa = new Map(korisnici.map((k) => [k._id.toString(), k.korisnickoIme]));

    res.json({
      narudzbine: fakture.map((f) => ({
        id: f.broj,
        klijent: korisniciMapa.get(f.klijent.toString()) ?? '',
        stavke: f.stavke.map((s) => ({ naziv: s.naziv, kolicina: s.kolicina, tipStampe: s.tipStampe })),
        ukupno: f.ukupno,
        status: f.status,
      })),
    });
  };

  promeniStatusNarudzbine = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let stamparija = await stamparijaVlasnika(String(req.body.korisnickoIme ?? ''));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let broj = Number(req.body.broj);
    let noviStatus = req.body.noviStatus;
    if (!Number.isInteger(broj)) return res.status(404).json({ message: 'Narudžbina ne postoji.' });
    if (noviStatus !== 'u štampi' && noviStatus !== 'isporučeno') {
      return res.status(400).json({ message: 'Novi status mora biti "u štampi" ili "isporučeno".' });
    }

    let izStatusa = noviStatus === 'u štampi' ? ['naručeno', 'plaćeno'] : ['u štampi'];
    let faktura = await FakturaModel.findOneAndUpdate(
      { broj, stamparija: stamparija._id, status: { $in: izStatusa } },
      { status: noviStatus },
    );
    if (!faktura) {
      let postoji = await FakturaModel.exists({ broj, stamparija: stamparija._id });
      if (postoji) return res.status(409).json({ message: 'Narudžbina nije u statusu iz kog se može menjati.' });
      return res.status(404).json({ message: 'Narudžbina ne postoji.' });
    }
    res.json({ message: 'Status je promenjen.' });
  };

  getNabavke = async (req: express.Request, res: express.Response) => {
    let stamparija = await stamparijaVlasnika(String(req.params.korisnickoIme));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let nabavke = await NabavkaModel.find({ status: 'otvorena', istice: { $gt: new Date() } })
      .sort({ pokrenuta: -1 })
      .lean();

    res.json({
      nabavke: nabavke.map((n) => ({
        id: n._id.toString(),
        objavljena: n.pokrenuta,
        istice: n.istice,
        stavke: n.stavke.map((s) => ({ naziv: s.naziv, kolicina: s.kolicina })),
        ponudaPoslata: n.ponude.some((p) => p.stamparija.toString() === stamparija!._id.toString()),
      })),
    });
  };

  posaljiPonudu = async (req: express.Request, res: express.Response) => {
    if (!req.body) return res.status(400).json({ message: 'Nedostaju podaci.' });
    let stamparija = await stamparijaVlasnika(String(req.body.korisnickoIme ?? ''));
    if (!stamparija) return res.status(403).json({ message: 'Pristup dozvoljen samo odobrenim štamparijama.' });

    let nabavkaId = String(req.body.nabavkaId ?? '');
    let cene = req.body.cene;
    if (!ID.test(nabavkaId)) return res.status(404).json({ message: 'Javna nabavka ne postoji.' });
    if (!Array.isArray(cene) || cene.length === 0 || !cene.every((c: any) => Number.isFinite(Number(c)) && Number(c) >= 0)) {
      return res.status(400).json({ message: 'Cene moraju biti niz brojeva, 0 ili veći.' });
    }

    let nabavka = await NabavkaModel.findOne({ _id: nabavkaId, status: 'otvorena', istice: { $gt: new Date() } });
    if (!nabavka) return res.status(409).json({ message: 'Nabavka je zatvorena ili ne postoji.' });
    if (cene.length !== nabavka.stavke.length) {
      return res.status(400).json({ message: 'Po jedna cena za svaki traženi proizvod.' });
    }
    if (nabavka.ponude.some((p) => p.stamparija.toString() === stamparija!._id.toString())) {
      return res.status(409).json({ message: 'Već ste poslali ponudu za ovu javnu nabavku.' });
    }

    let iznos = zaokruzi(cene.reduce((zbir: number, c: any, i: number) => zbir + Number(c) * nabavka!.stavke[i].kolicina, 0));
    nabavka.ponude.push({ stamparija: stamparija._id, iznos, vreme: new Date() });
    await nabavka.save();
    res.status(201).json({ message: 'Ponuda je uspešno poslata.', ukupno: iznos });
  };
}
