import mongoose, { Schema, Types } from 'mongoose';

export const STATUSI_FAKTURE = ['naručeno', 'plaćeno', 'u štampi', 'isporučeno', 'primljeno'] as const;
export type StatusFakture = (typeof STATUSI_FAKTURE)[number];

export interface IStavkaFakture {
  proizvod: Types.ObjectId | null;
  naziv: string;
  kolicina: number;
  boja: string;
  tipStampe: string;
  tekst: string;
  slicica: string;
  cenaPoKomadu: number;
  ukupno: number;
}

export interface IFaktura {
  broj: number;
  klijent: Types.ObjectId;
  stamparija: Types.ObjectId;
  stavke: IStavkaFakture[];
  ukupno: number;
  status: StatusFakture;
  nabavka: Types.ObjectId | null;
  datum: Date;
}

let StavkaFakture = new Schema<IStavkaFakture>(
  {
    proizvod: { type: Schema.Types.ObjectId, ref: 'ProizvodModel', default: null },
    naziv: { type: String, required: true },
    kolicina: { type: Number, required: true, min: 1 },
    boja: { type: String, default: 'Bela' },
    tipStampe: { type: String, default: '' },
    tekst: { type: String, default: '' },
    slicica: { type: String, default: '' },
    cenaPoKomadu: { type: Number, default: 0 },
    ukupno: { type: Number, default: 0 },
  },
  { _id: false },
);

let Faktura = new Schema<IFaktura>(
  {
    broj: { type: Number, required: true, unique: true },
    klijent: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true, index: true },
    stamparija: { type: Schema.Types.ObjectId, ref: 'StamparijaModel', required: true },
    stavke: { type: [StavkaFakture], default: [] },
    ukupno: { type: Number, required: true, min: 0 },
    status: { type: String, enum: [...STATUSI_FAKTURE], default: 'naručeno' },
    nabavka: { type: Schema.Types.ObjectId, ref: 'NabavkaModel', default: null },
    datum: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model<IFaktura>('FakturaModel', Faktura, 'fakture');
