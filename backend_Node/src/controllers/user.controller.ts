import express from 'express'
import bcrypt from 'bcrypt';
import UserModel from '../models/user';
import crypto from 'crypto';
import { imageSize } from 'image-size';
import fs from 'fs';
import path from 'path';
import StamparijaModel from '../models/stamparija';
const LOZINKA = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].{7,11}$/;
const LOZINKA_PORUKA = 'Lozinka mora imati 8–12 karaktera, početi slovom i sadržati bar jedno veliko slovo, jedan broj i jedan specijalni karakter.';
const TELEFON = /^\+?[0-9 \/\-]{6,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MATICNI_BROJ = /^\d{8}$/;
const PIB = /^[1-9]\d{8}$/;
const MIME: Record<string, string> = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif' };
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

async function snimiSliku(data: Buffer, ekstenzija: string): Promise<string> {
  let ime = crypto.randomUUID() + '.' + ekstenzija;
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.promises.writeFile(path.join(UPLOAD_DIR, ime), data);
  return ime;
}
export class UserController{
    login =  (req: express.Request, res: express.Response) => {
        let username = String(req.body.username).trim();
        let password = req.body.password;

        UserModel.findOne({ korisnickoIme: username, tip: { $ne: 'administrator' } })
      .lean()
      .then((user) => {
        if (!user || typeof password !== 'string') {
          return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' });
        }
        if (!user.lozinkaHash) {
          return res.status(500).json({ message: 'Korisnik nema postavljenu lozinku.' });
        }
        return bcrypt.compare(password, user.lozinkaHash).then((ispravna) => {
          if (!ispravna) return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' });
          if (user.status === 'na_cekanju') {
            return res.status(403).json({ message: 'Vaš zahtev za registraciju još nije odobren.' });
          }
          if (user.status === 'odbijen') {
            return res.status(403).json({ message: 'Vaš zahtev za registraciju je odbijen.' });
          }
          let { lozinkaHash, resetTokenHash, resetTokenIstice, ...zaKlijenta } = user;
          res.json(zaKlijenta);
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });       });
    }

    register = async (req: express.Request, res: express.Response) =>{
  let tip = req.body.tip;
    let korisnickoIme = req.body.korisnickoIme;
    let lozinka = req.body.lozinka;
    let ime = req.body.ime;
    let prezime = req.body.prezime;
    let telefon = req.body.telefon;
    let email = req.body.email;
    let nazivInstitucije = req.body.nazivInstitucije;
    let adresaSedista = req.body.adresaSedista;
    let maticniBroj = req.body.maticniBroj;
    let pib = req.body.pib;
    let slika = req.files ? (req.files as any).slika : undefined;

    if (!['fizicko', 'pravno', 'stamparija'].includes(tip)) {
      return res.status(400).json({ message: 'Nepoznat tip korisnika.' });
    }
    let obavezna = [korisnickoIme, lozinka, ime, prezime, telefon, email];
    if (tip !== 'fizicko') obavezna.push(nazivInstitucije, adresaSedista, maticniBroj, pib);
    if (obavezna.some((v) => typeof v !== 'string' || v.trim() === '')) {
      return res.status(400).json({ message: 'Popunite sva obavezna polja.' });
    }
    if (!LOZINKA.test(lozinka)) return res.status(400).json({ message: LOZINKA_PORUKA });
    if (!TELEFON.test(telefon)) return res.status(400).json({ message: 'Unesite ispravan broj telefona.' });
    if (!EMAIL.test(email)) return res.status(400).json({ message: 'Unesite ispravnu e-mail adresu.' });
    if (tip !== 'fizicko' && !MATICNI_BROJ.test(maticniBroj)) {
      return res.status(400).json({ message: 'Matični broj mora imati tačno 8 cifara.' });
    }
    if (tip !== 'fizicko' && !PIB.test(pib)) {
      return res.status(400).json({ message: 'PIB mora imati 9 cifara i ne sme počinjati nulom.' });
    }
    if (tip === 'fizicko') nazivInstitucije = adresaSedista = maticniBroj = pib = '';

    let fajl = 'default_profile_image.svg';
    if (slika && !Array.isArray(slika)) {
      let dim: ReturnType<typeof imageSize>;
      try {
        dim = imageSize(slika.data);
      } catch {
        return res.status(400).json({ message: 'Fajl nije moguće očitati kao sliku.' });
      }
      let mime = MIME[String(dim.type)];
      if (!mime) return res.status(400).json({ message: 'Slika mora biti u JPG, PNG ili GIF formatu.' });
      let sirina = dim.width ?? 0;
      let visina = dim.height ?? 0;
      if (sirina < 100 || visina < 100 || sirina > 250 || visina > 250) {
        return res.status(400).json({
          message: `Slika mora biti između 100x100 i 250x250 piksela (poslata slika: ${sirina}x${visina}).`,
        });
      }
      fajl = await snimiSliku(slika.data, mime);
    }

    bcrypt
      .hash(lozinka, 10)
      .then((hash) =>
        UserModel.create({
          tip, korisnickoIme, lozinkaHash: hash, ime, prezime, telefon, email,
          nazivInstitucije, adresaSedista, maticniBroj, pib,
          status: 'na_cekanju', fajl,
        }),
      )
      .then((user) => {
        if (tip !== 'stamparija') return;
        return StamparijaModel.create({ vlasnik: user._id, naziv: nazivInstitucije, adresa: adresaSedista }).catch((err) =>
          UserModel.deleteOne({ _id: user._id }).then(() => {
            throw err;
          }),
        );
      })
      .then(() => {
        res.status(201).json({
          message: 'Zahtev za registraciju je poslat. Nalog postaje aktivan kada ga administrator odobri.',
        });
      })
      .catch((err) => {
        if (err.code === 11000) {
          let polje = Object.keys(err.keyPattern ?? {})[0];
          return res.status(409).json({
            message: polje === 'email' ? 'E-mail adresa je već registrovana.' : 'Korisničko ime je već zauzeto.',
          });
        }
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });

    }

    deleteAccount = (req: express.Request, res: express.Response) =>{
        console.log("back delete user");
        let username = String(req.body.username ?? '');

        UserModel.deleteOne({ korisnickoIme: username }).then((rezultat) => {
            if (rezultat.deletedCount === 0) {
                return res.status(404).json({ message: 'Korisnik ne postoji.' });
            }
            res.json({ message: 'Korisnik je obrisan.' });
        }).catch((err) => {
            console.error('Brisanje korisnika nije uspelo:', err);
            res.status(500).json({ message: 'Došlo je do greške na serveru.' });
        })
    }
    adminLogin = (req: express.Request, res: express.Response) => {
    let username = String(req.body.username).trim();
    let password = req.body.password;

    UserModel.findOne({ korisnickoIme: username, tip: 'administrator' })
      .lean()
      .then((user) => {
        if (!user || typeof password !== 'string') {
          return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' });
        }
        if (!user.lozinkaHash) {
          return res.status(500).json({ message: 'Korisnik nema postavljenu lozinku.' });
        }
        return bcrypt.compare(password, user.lozinkaHash).then((ispravna) => {
          if (!ispravna) return res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' });
          let { lozinkaHash, resetTokenHash, resetTokenIstice, ...zaKlijenta } = user;
          res.json(zaKlijenta);
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };

  forgotPassword = (req: express.Request, res: express.Response) => {
    let identifikator = String(req.body.identifikator).trim();
    let token = crypto.randomBytes(32).toString('hex');

    UserModel.findOneAndUpdate(
      { $or: [{ korisnickoIme: identifikator }, { email: identifikator.toLowerCase() }], tip: { $ne: 'administrator' } },
      {
        resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        resetTokenIstice: new Date(Date.now() +  5 * 60 * 1000),
      },
    )
      .then((user) => {
        if (!user) return res.status(404).json({ message: 'Nalog sa unetim podacima ne postoji.' });
        res.json({ message: `/resetuj-lozinku/${token}` });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };
  resetPassword = (req: express.Request, res: express.Response) => {
    let token = String(req.body.token);
    let novaLozinka = req.body.novaLozinka;

    UserModel.findOne({ resetTokenHash: crypto.createHash('sha256').update(token).digest('hex') })
      .then((user) => {
        if (!user) { res.status(400).json({ message: 'Token nije ispravan.' });
        return;
      }
        if (!user.resetTokenIstice || user.resetTokenIstice < new Date()) {
           res.status(400).json({ message: 'Token je istekao' });
           return;
        }
        if (typeof novaLozinka !== 'string' || !LOZINKA.test(novaLozinka)) {
           res.status(400).json({ message: LOZINKA_PORUKA });
           return;
        }
        return bcrypt
          .hash(novaLozinka, 10)
          .then((hash) =>
            UserModel.updateOne({ _id: user._id }, { lozinkaHash: hash, resetTokenHash: null, resetTokenIstice: null }),
          )
          .then(() => {
            res.json({ message: 'Lozinka je uspešno promenjena.' });
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Došlo je do greške na serveru.' });
      });
  };


}