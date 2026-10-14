import express from 'express';
import  StamparijaModel  from '../models/stamparija';
import  ProizvodModel from '../models/proizvod';

const NA_STANJU = { aktivan: true, kolicinaNaLageru: { $gt: 0 } };
const NIJE_DOSTUPAN = 'Proizvod ne postoji ili više nije dostupan.';

export class StamparijeController {
  
  getBroj = (req: express.Request, res: express.Response) => {
    StamparijaModel.countDocuments({ aktivna: true })
      .then((broj) => res.json(broj))
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getTop5 = (req: express.Request, res: express.Response) => {
    StamparijaModel.find({ aktivna: true })
      .select('naziv')
      .lean()
      .then((stamparije) => {
        let nazivi: Record<string, string> = {};
        stamparije.forEach((s) => (nazivi[s._id.toString()] = s.naziv));

        return ProizvodModel.aggregate([
          { $match: { ...NA_STANJU, stamparija: { $in: stamparije.map((s) => s._id) } } },
          { $addFields: { brojLajkova: { $size: '$lajkovi' } } },
          { $sort: { brojLajkova: -1, naziv: 1 } },
          { $limit: 5 },
        ]).then((proizvodi) => {
          res.json({
            Proizvodi: proizvodi.map((p) => ({
              id: p._id.toString(),
              naziv: p.naziv,
              stamparija: nazivi[p.stamparija.toString()] ?? '',
              brojLajkova: p.brojLajkova,
            })),
          });
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getKategorije = (req: express.Request, res: express.Response) => {
    StamparijaModel.find({ aktivna: true })
      .select('_id')
      .lean()
      .then((stamparije) =>
        ProizvodModel.distinct('kategorija', { ...NA_STANJU, stamparija: { $in: stamparije.map((s) => s._id) } }),
      )
      .then((kategorije) => {
        res.json(kategorije.filter(Boolean).sort((a, b) => a.localeCompare(b, 'sr-Latn')));
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  pretraga = (req: express.Request, res: express.Response) => {
   let naziv = req.query.naziv;
    let kategorija = req.query.kategorija;
    let sortSmer = req.query.sortSmer;

    if (sortSmer !== undefined && sortSmer !== 'rastuce' && sortSmer !== 'opadajuce') {
      return res.status(400).json({ message: 'sortSmer mora biti "rastuce" ili "opadajuce".' });
    }

    StamparijaModel.find({ aktivna: true })
      .select('naziv')
      .lean()
      .then((stamparije) => {
        let nazivi: Record<string, string> = {};
        stamparije.forEach((s) => (nazivi[s._id.toString()] = s.naziv));

        let filter: any = { ...NA_STANJU, stamparija: { $in: stamparije.map((s) => s._id) } };
        if (typeof naziv === 'string' && naziv.trim()) {
          filter.naziv = { $regex: naziv.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }
        if (typeof kategorija === 'string' && kategorija.trim()) {
          filter.kategorija = kategorija.trim();
        }

        return ProizvodModel.find(filter)
          .sort({ _id: 1 })
          .lean()
          .then((proizvodi) => {
            if (sortSmer) {
              let smer = sortSmer === 'rastuce' ? 1 : -1;
              proizvodi.sort((a, b) => smer * a.naziv.localeCompare(b.naziv, 'sr-Latn'));
            }
            res.json({
              Proizvodi: proizvodi.map((p) => ({
                id: p._id.toString(),
                naziv: p.naziv,
                kategorija: p.kategorija,
                stamparija: nazivi[p.stamparija.toString()] ?? '',
              })),
            });
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  getProizvod = (req: express.Request, res: express.Response) => {
    let id = String(req.params.id);
    if (!/^[a-f\d]{24}$/i.test(id)) return res.status(404).json({ message: NIJE_DOSTUPAN });

    ProizvodModel.findOne({ _id: id, aktivan: true })
      .lean()
      .then((p) => {
        if (!p) return res.status(404).json({ message: NIJE_DOSTUPAN });

        return StamparijaModel.findById(p.stamparija)
          .lean()
          .then((stamparija) => {
            if (!stamparija || !stamparija.aktivna) return res.status(404).json({ message: NIJE_DOSTUPAN });

            res.json({
              naziv: p.naziv,
              stamparija: stamparija.naziv,
              grad: stamparija.grad || '',
              brojLajkova: p.lajkovi.length,
              brojDislajkova: p.dislajkovi.length,
              slike: [p.slikaUrl, ...p.dodatneSlike.slice(0, 3)]
                .filter(Boolean)
                .map((u) => (/^https?:\/\//i.test(u) ? u : `${'http://localhost:4000'}/uploads/${u.replace(/^\/+/, '')}`)),
            });
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };
}
