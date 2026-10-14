import express from 'express'
import mongoose from 'mongoose';
import cors from 'cors'
import fileUpload from 'express-fileupload';
import path from 'path';

import userRouter from './routers/user.router';
import stamparijaRouter from './routers/stamparije.router';
import klijentRouter from './routers/klijent.router';
import stamparRouter from './routers/stampar.router';
import adminRouter from './routers/admin.router';
import { zatvoriIstekleNabavke } from './controllers/nabavke.controller';

const app = express()
app.use(cors({origin: ['http://localhost:4200', 'http://127.0.0.1:4200']}));
app.use(express.json({limit: '100kb'}))
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    limitHandler: (req: express.Request, res: express.Response) => {
      res.status(413).json({ message: 'Slika je prevelika (najviše 5 MB).' });
    },
  }),
);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use("/users", userRouter)
app.use("/stamparije", stamparijaRouter)
app.use("/klijent", klijentRouter)
app.use("/stampar", stamparRouter)
app.use("/admin", adminRouter)

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ message: 'Ruta ne postoji.' });
});

app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = (err as { status?: number }).status;
  if (status && status < 500) {
    return res.status(status).json({ message: 'Neispravan zahtev.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Došlo je do greške na serveru.' });
});

mongoose.connect("mongodb://127.0.0.1:27017/printing_house");

const connection = mongoose.connection;
connection.once("open", () => {
    console.log("Connected to MongoDB on port 27017");
})

app.listen(4000, ()=>console.log("Express running on port 4000!"))

setInterval(() => zatvoriIstekleNabavke().catch((err) => console.error('Zatvaranje nabavki nije uspelo:', err)), 15_000);
