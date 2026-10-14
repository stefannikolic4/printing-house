import express from 'express';
import UserModel from '../models/user';
import StamparijaModel from '../models/stamparija';
import ProizvodModel from '../models/proizvod';
import KategorijaModel from '../models/kategorija';
import FakturaModel from '../models/faktura';
import OcenaModel from '../models/ocena';

const ID = /^[a-f\d]{24}$/i;
const PUBLIC_URL = 'http://localhost:4000';

const urlSlike = (fajl: string): string => {
  if (!fajl || fajl === 'default_profile_image.jpg') return `${PUBLIC_URL}/uploads/default_profile_image.svg`;
  if (/^(https?:|data:image)/i.test(fajl)) return fajl;
  return `${PUBLIC_URL}/uploads/${fajl}`;
};

export class AdminController {

  getZahtevi = (req: express.Request, res: express.Response) => {
    UserModel.find({ status: 'na_cekanju' })
      .select('-lozinkaHash -resetTokenHash -resetTokenIstice')
      .lean()
      .then((korisnici) => {
        res.json(korisnici.map((u) => ({
          id: u._id.toString(),
          korisnickoIme: u.korisnickoIme,
          ime: u.ime,
          prezime: u.prezime,
          tip: u.tip,
          email: u.email,
          telefon: u.telefon,
          slika: urlSlike(u.fajl),
          nazivInstitucije: u.tip === 'fizicko' ? null : u.nazivInstitucije,
          adresaSedista: u.tip === 'fizicko' ? null : u.adresaSedista,
          maticniBroj: u.tip === 'fizicko' ? null : u.maticniBroj,
          pib: u.tip === 'fizicko' ? null : u.pib,
        })));
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  prihvatiZahtev = (req: express.Request, res: express.Response) => {
    let idZahteva = String(req.body.idZahteva);
    if (!ID.test(idZahteva)) return res.status(404).json({ message: 'Zahtev ne postoji.' });

    UserModel.findOneAndUpdate({ _id: idZahteva, status: 'na_cekanju' }, { status: 'odobren' })
      .then((korisnik) => {
        if (!korisnik) {
          res.status(404).json({ message: 'Zahtev ne postoji ili je već obrađen.' });
          return;
        }
        if (korisnik.tip !== 'stamparija') {
          res.json({ message: 'Zahtev je odobren.' });
          return;
        }
        return StamparijaModel.updateOne({ vlasnik: korisnik._id }, { aktivna: true }).then(() => {
          res.json({ message: 'Zahtev je odobren.' });
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  odbaciZahtev = (req: express.Request, res: express.Response) => {
    let idZahteva = String(req.body.idZahteva);
    if (!ID.test(idZahteva)) return res.status(404).json({ message: 'Zahtev ne postoji.' });

    UserModel.findOneAndUpdate({ _id: idZahteva, status: 'na_cekanju' }, { status: 'odbijen' })
      .then((korisnik) => {
        if (!korisnik) return res.status(404).json({ message: 'Zahtev ne postoji ili je već obrađen.' });
        res.json({ message: 'Zahtev je odbačen.' });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getKorisnici = (req: express.Request, res: express.Response) => {
    let tip = req.query.tip;
    let filter: any = { status: 'odobren', tip: { $ne: 'administrator' } };
    if (typeof tip === 'string' && tip.trim()) {
      if (!['fizicko', 'pravno', 'stamparija'].includes(tip)) {
        return res.status(400).json({ message: 'Nepoznat tip korisnika.' });
      }
      filter.tip = tip;
    }

    UserModel.find(filter)
      .select('korisnickoIme ime prezime tip email telefon fajl')
      .lean()
      .then((korisnici) => {
        res.json(korisnici.map((u) => ({
          id: u._id.toString(),
          korisnickoIme: u.korisnickoIme,
          ime: u.ime,
          prezime: u.prezime,
          tip: u.tip,
          email: u.email,
          telefon: u.telefon,
          slika: urlSlike(u.fajl),
        })));
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getKategorije = (req: express.Request, res: express.Response) => {
    KategorijaModel.find()
      .sort({ naziv: 1 })
      .lean()
      .then((kategorije) => {
        res.json(kategorije.map((k) => ({ id: k._id.toString(), naziv: k.naziv, potkategorije: k.potkategorije })));
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  dodajKategoriju = (req: express.Request, res: express.Response) => {
    let naziv = String(req.body.naziv ?? '').trim();
    if (!naziv) return res.status(400).json({ message: 'Naziv kategorije je obavezan.' });

    KategorijaModel.findOne({ naziv: { $regex: `^${naziv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })
      .then((postojeca) => {
        if (postojeca) {
          res.status(409).json({ message: 'Kategorija sa tim nazivom već postoji.' });
          return;
        }
        return KategorijaModel.create({ naziv, potkategorije: [] }).then((kategorija) => {
          res.status(201).json({ id: kategorija._id.toString(), naziv: kategorija.naziv, potkategorije: kategorija.potkategorije });
        });
      })
      .catch((err) => {
        if (err.code === 11000) return res.status(409).json({ message: 'Kategorija sa tim nazivom već postoji.' });
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  dodajPotkategoriju = (req: express.Request, res: express.Response) => {
    let idKategorije = String(req.body.idKategorije);
    let naziv = String(req.body.naziv ?? '').trim();
    if (!ID.test(idKategorije)) return res.status(404).json({ message: 'Kategorija ne postoji.' });
    if (!naziv) return res.status(400).json({ message: 'Naziv potkategorije je obavezan.' });

    KategorijaModel.findById(idKategorije)
      .then((kategorija) => {
        if (!kategorija) {
          res.status(404).json({ message: 'Kategorija ne postoji.' });
          return;
        }
        if (kategorija.potkategorije.some((p) => p.toLowerCase() === naziv.toLowerCase())) {
          res.status(409).json({ message: 'Potkategorija sa tim nazivom već postoji.' });
          return;
        }
        kategorija.potkategorije.push(naziv);
        return kategorija.save().then(() => {
          res.json({ message: 'Potkategorija je dodata.' });
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getPrometStamparija = (req: express.Request, res: express.Response) => {
    let odDatuma = new Date();
    odDatuma.setMonth(odDatuma.getMonth() - 3);

    FakturaModel.aggregate([
      { $match: { datum: { $gte: odDatuma } } },
      { $group: { _id: '$stamparija', iznos: { $sum: '$ukupno' } } },
      { $sort: { iznos: -1 } },
    ])
      .then((redovi) => {
        return StamparijaModel.find({ _id: { $in: redovi.map((r) => r._id) } })
          .select('naziv')
          .lean()
          .then((stamparije) => {
            let nazivi: Record<string, string> = {};
            stamparije.forEach((s) => (nazivi[s._id.toString()] = s.naziv));
            res.json(redovi.map((r) => ({ naziv: nazivi[r._id.toString()] ?? '', iznos: r.iznos })));
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getUdeleProizvoda = (req: express.Request, res: express.Response) => {
    let odDatuma = new Date();
    odDatuma.setMonth(odDatuma.getMonth() - 1);

    FakturaModel.aggregate([
      { $match: { datum: { $gte: odDatuma } } },
      { $unwind: '$stavke' },
      { $group: { _id: '$stavke.naziv', kolicina: { $sum: '$stavke.kolicina' } } },
      { $sort: { kolicina: -1 } },
    ])
      .then((redovi) => {
        let ukupno = redovi.reduce((zbir, r) => zbir + r.kolicina, 0);
        res.json(redovi.map((r) => ({
          naziv: r._id,
          kolicina: r.kolicina,
          procenat: ukupno > 0 ? Math.round((r.kolicina / ukupno) * 1000) / 10 : 0,
        })));
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getOceneProizvoda = (req: express.Request, res: express.Response) => {
    OcenaModel.aggregate([
      {
        $group: {
          _id: { proizvod: '$proizvod', datum: { $dateToString: { format: '%Y-%m-%d', date: '$datum' } } },
          prosek: { $avg: '$vrednost' },
        },
      },
      { $sort: { '_id.datum': 1 } },
      { $group: { _id: '$_id.proizvod', tacke: { $push: { datum: '$_id.datum', ocena: '$prosek' } } } },
    ])
      .then((redovi) => {
        return ProizvodModel.find({ _id: { $in: redovi.map((r) => r._id) } })
          .select('naziv')
          .lean()
          .then((proizvodi) => {
            let nazivi: Record<string, string> = {};
            proizvodi.forEach((p) => (nazivi[p._id.toString()] = p.naziv));
            res.json(redovi.map((r) => ({
              id: r._id.toString(),
              naziv: nazivi[r._id.toString()] ?? '',
              tacke: r.tacke.map((t: any) => ({ datum: t.datum, ocena: Math.round(t.ocena * 100) / 100 })),
            })));
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };
}
