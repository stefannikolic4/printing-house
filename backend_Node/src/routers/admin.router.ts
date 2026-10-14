import express from 'express';
import { AdminController } from '../controllers/admin.controller';

const adminRouter = express.Router();

adminRouter.route('/zahtevi').get((req, res) => new AdminController().getZahtevi(req, res));
adminRouter.route('/zahtevi/prihvati').post((req, res) => new AdminController().prihvatiZahtev(req, res));
adminRouter.route('/zahtevi/odbaci').post((req, res) => new AdminController().odbaciZahtev(req, res));

adminRouter.route('/korisnici').get((req, res) => new AdminController().getKorisnici(req, res));

adminRouter.route('/kategorije').get((req, res) => new AdminController().getKategorije(req, res));
adminRouter.route('/kategorije').post((req, res) => new AdminController().dodajKategoriju(req, res));
adminRouter.route('/kategorije/potkategorije').post((req, res) => new AdminController().dodajPotkategoriju(req, res));

adminRouter.route('/statistika/promet').get((req, res) => new AdminController().getPrometStamparija(req, res));
adminRouter.route('/statistika/udeli').get((req, res) => new AdminController().getUdeleProizvoda(req, res));
adminRouter.route('/statistika/ocene').get((req, res) => new AdminController().getOceneProizvoda(req, res));

export default adminRouter;
