import mongoose, { Schema, Types } from 'mongoose';

export type StatusNabavke = 'otvorena' | 'zavrsena' | 'bez-ponude';

export interface IStavkaNabavke {
  naziv: string;
  kolicina: number;
  boja: string;
  tipStampe: string;
  tekst: string;
  slicica: string;
}

export interface IPonuda {
  stamparija: Types.ObjectId;
  iznos: number;
  vreme: Date;
}

export interface INabavka {
  klijent: Types.ObjectId;
  stavke: IStavkaNabavke[];
  pokrenuta: Date;
  istice: Date;
  status: StatusNabavke;
  ponude: IPonuda[];
  pobednik: Types.ObjectId | null;
  iznos: number | null;
  faktura: Types.ObjectId | null;
}

let StavkaNabavke = new Schema<IStavkaNabavke>(
  {
    naziv: { type: String, required: true },
    kolicina: { type: Number, required: true, min: 1 },
    boja: { type: String, default: 'Bela' },
    tipStampe: { type: String, default: '' },
    tekst: { type: String, default: '' },
    slicica: { type: String, default: '' },
  },
  { _id: false },
);

let Ponuda = new Schema<IPonuda>(
  {
    stamparija: { type: Schema.Types.ObjectId, ref: 'StamparijaModel', required: true },
    iznos: { type: Number, required: true, min: 0 },
    vreme: { type: Date, default: Date.now },
  },
  { _id: false },
);

let Nabavka = new Schema<INabavka>(
  {
    klijent: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true, index: true },
    stavke: { type: [StavkaNabavke], default: [] },
    pokrenuta: { type: Date, default: Date.now },
    istice: { type: Date, required: true, index: true },
    status: { type: String, enum: ['otvorena', 'zavrsena', 'bez-ponude'], default: 'otvorena' },
    ponude: { type: [Ponuda], default: [] },
    pobednik: { type: Schema.Types.ObjectId, ref: 'StamparijaModel', default: null },
    iznos: { type: Number, default: null },
    faktura: { type: Schema.Types.ObjectId, ref: 'FakturaModel', default: null },
  },
  { timestamps: true },
);

export default mongoose.model<INabavka>('NabavkaModel', Nabavka, 'nabavke');
