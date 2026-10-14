import express from 'express';

import { KlijentController } from '../controllers/klijent.controller';
import { KorpaController } from '../controllers/korpa.controller';
import { NabavkeController } from '../controllers/nabavke.controller';

const klijentRouter = express.Router();

klijentRouter.route('/profil/:korisnickoIme').get((req, res) => new KlijentController().getProfil(req, res));
klijentRouter.route('/profil/izmena').post((req, res) => new KlijentController().izmeniProfil(req, res));

klijentRouter.route('/narudzbine/:korisnickoIme').get((req, res) => new KlijentController().getNarudzbine(req, res));
klijentRouter.route('/narudzbine/:korisnickoIme/:id/otkazi').post((req, res) => new KlijentController().otkaziNarudzbinu(req, res));

klijentRouter.route('/proizvod/:id').get((req, res) => new KlijentController().getProizvod(req, res));

klijentRouter.route('/korpa/:korisnickoIme').get((req, res) => new KorpaController().getKorpa(req, res));
klijentRouter.route('/korpa').post((req, res) => new KorpaController().dodajUKorpu(req, res));
klijentRouter.route('/korpa/potvrdi').post((req, res) => new KorpaController().potvrdiKorpu(req, res));
klijentRouter.route('/placanje').post((req, res) => new KorpaController().plati(req, res));

klijentRouter.route('/nabavke/:korisnickoIme').get((req, res) => new NabavkeController().getNabavke(req, res));
klijentRouter.route('/nabavke/izvestaj/:id').get((req, res) => new NabavkeController().getIzvestaj(req, res));

klijentRouter.route('/arhiva/:korisnickoIme').get((req, res) => new KlijentController().getArhiva(req, res));
klijentRouter.route('/arhiva/:korisnickoIme/:id/primljeno').post((req, res) => new KlijentController().oznaciPrimljeno(req, res));
klijentRouter.route('/ocena').post((req, res) => new KlijentController().oceni(req, res));

export default klijentRouter;
