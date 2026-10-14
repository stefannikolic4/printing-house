import express from 'express';
import { StamparijeController } from '../controllers/stamparije.controller';

const stamparijeRouter = express.Router();

stamparijeRouter.route('/broj').get((req, res) => new StamparijeController().getBroj(req, res));
stamparijeRouter.route('/top5').get((req, res) => new StamparijeController().getTop5(req, res));
stamparijeRouter.route('/kategorije').get((req, res) => new StamparijeController().getKategorije(req, res));
stamparijeRouter.route('/pretraga').get((req, res) => new StamparijeController().pretraga(req, res));
stamparijeRouter.route('/proizvod/:id').get((req, res) => new StamparijeController().getProizvod(req, res));

export default stamparijeRouter;
