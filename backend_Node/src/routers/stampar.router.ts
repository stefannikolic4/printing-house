import express from 'express';

import { StamparController } from '../controllers/stampar.controller';
import { ProfilController } from '../controllers/profil.controller';

const stamparRouter = express.Router();

stamparRouter.route('/kategorije').get((req, res) => new StamparController().getKategorije(req, res));

stamparRouter.route('/proizvod').post((req, res) => new StamparController().dodajProizvod(req, res));

stamparRouter.route('/uvoz').post((req, res) => new StamparController().uveziProizvode(req, res));

stamparRouter.route('/lager/:korisnickoIme').get((req, res) => new StamparController().getLager(req, res));
stamparRouter.route('/lager').post((req, res) => new StamparController().azurirajKolicinu(req, res));

stamparRouter.route('/narudzbine/:korisnickoIme').get((req, res) => new StamparController().getNarudzbine(req, res));
stamparRouter.route('/narudzbine/status').post((req, res) => new StamparController().promeniStatusNarudzbine(req, res));

stamparRouter.route('/nabavke/:korisnickoIme').get((req, res) => new StamparController().getNabavke(req, res));
stamparRouter.route('/nabavke/ponuda').post((req, res) => new StamparController().posaljiPonudu(req, res));

stamparRouter.route('/profil/:korisnickoIme').get((req, res) => new ProfilController().getProfil(req, res));
stamparRouter.route('/profil/izmena').post((req, res) => new ProfilController().izmeniProfil(req, res));

export default stamparRouter;
