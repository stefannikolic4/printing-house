import mongoose, { Schema, Types } from 'mongoose';

export interface IStavkaKorpe {
  _id?: Types.ObjectId;
  proizvod: Types.ObjectId;
  kolicina: number;
  boja: string;
  usluga: Types.ObjectId | null;
  tekst: string;
  slicica: string;
}

export interface IKorpa {
  klijent: Types.ObjectId;
  stavke: IStavkaKorpe[];
}

let StavkaKorpe = new Schema<IStavkaKorpe>({
  proizvod: { type: Schema.Types.ObjectId, ref: 'ProizvodModel', required: true },
  kolicina: { type: Number, required: true, min: 1 },
  boja: { type: String, default: 'Bela' },
  usluga: { type: Schema.Types.ObjectId, default: null },
  tekst: { type: String, default: '' },
  slicica: { type: String, default: '' },
});

let Korpa = new Schema<IKorpa>(
  {
    klijent: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true, unique: true },
    stavke: { type: [StavkaKorpe], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model<IKorpa>('KorpaModel', Korpa, 'korpe');
