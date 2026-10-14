import express from 'express';

import UserModel from '../models/user';
import StamparijaModel from '../models/stamparija';
import { UPLOAD_DIR, proveriSliku, snimiSliku, obrisiSliku } from '../utils/slika';

const MAIN_PUBLIC_URL = 'http://localhost:4000';

const TELEFON = /^\+?[0-9 \/\-]{6,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MATICNI_BROJ = /^\d{8}$/;
const PIB = /^[1-9]\d{8}$/;
const MAX_SLIIKA = 1024 * 1024;

function fajl(polje: any): { data: Buffer } | null {
  if (!polje || Array.isArray(polje)) return null;
  return polje;
}

function urlSlike(fajl: string): string {
  if (!fajl || fajl === 'default_profile_image.jpg') return `${MAIN_PUBLIC_URL}/uploads/default_profile_image.svg`;
  if (/^(https?:|data:image)/i.test(fajl)) return fajl;
  return `${MAIN_PUBLIC_URL}/uploads/${fajl}`;
}

export class ProfilController {
  getProfil = async (req: express.Request, res: express.Response) => {
    let user = await UserModel.findOne({ korisnickoIme: String(req.params.korisnickoIme) }).lean();
    if (!user) return res.status(404).json({ message: 'Korisnik ne postoji.' });

    let { lozinkaHash, ...zaKlijenta } = user;
    res.json({ ...zaKlijenta, fajl: urlSlike(zaKlijenta.fajl) });
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
    let slika = fajl(req.files ? (req.files as any).slika : undefined);

    let pravnoLice = user.tip !== 'fizicko';
    let obavezna = [ime, prezime, telefon, email];
    if (pravnoLice) obavezna.push(nazivInstitucije, adresaSedista, maticniBroj, pib);
    if (obavezna.some((v) => typeof v !== 'string' || v.trim() === '')) {
      return res.status(400).json({ message: 'Popunite sva obavezna polja.' });
    }
    if (!TELEFON.test(telefon)) return res.status(400).json({ message: 'Unesite ispravan broj telefona.' });
    if (!EMAIL.test(email)) return res.status(400).json({ message: 'Unesite ispravnu e-mail adresu.' });
    if (pravnoLice && !MATICNI_BROJ.test(maticniBroj)) {
      return res.status(400).json({ message: 'Matični broj mora imati tačno 8 cifara.' });
    }
    if (pravnoLice && !PIB.test(pib)) {
      return res.status(400).json({ message: 'PIB mora imati 9 cifara i ne sme počinjati nulom.' });
    }

    let novaSlika: string | null = null;
    if (slika) {
      if (slika.data.length > MAX_SLIIKA) return res.status(400).json({ message: 'Slika je prevelika (najviše 1 MB).' });
      let provera = proveriSliku(slika.data);
      if ('greska' in provera) return res.status(400).json({ message: provera.greska });
      let sirina = provera.sirina;
      let visina = provera.visina;
      if (sirina < 100 || visina < 100 || sirina > 250 || visina > 250) {
        return res.status(400).json({
          message: `Slika mora biti između 100x100 i 250x250 piksela (poslata slika: ${sirina}x${visina}).`,
        });
      }
      novaSlika = await snimiSliku(slika.data, provera.ekstenzija);
    }

    let staraSlika = user.fajl;
    user.ime = ime;
    user.prezime = prezime;
    user.telefon = telefon;
    user.email = email;
    if (pravnoLice) {
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
      if (err && err.code === 11000) return res.status(409).json({ message: 'E-mail adresa je već registrovana.' });
      throw err;
    }
    if (novaSlika) await obrisiSliku(staraSlika);

    if (user.tip === 'stamparija') {
      await StamparijaModel.updateOne({ vlasnik: user._id }, { naziv: nazivInstitucije, adresa: adresaSedista });
    }

    let { lozinkaHash, ...zaKlijenta } = user.toObject();
    res.json({ ...zaKlijenta, fajl: urlSlike(zaKlijenta.fajl) });
  };
}
