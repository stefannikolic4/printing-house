import mongoose, { Schema, Types } from 'mongoose';

export interface IKomentar {
  proizvod: Types.ObjectId;
  klijent: Types.ObjectId;
  korisnickoIme: string;
  tekst: string;
  datum: Date;
}

let Komentar = new Schema<IKomentar>({
  proizvod: { type: Schema.Types.ObjectId, ref: 'ProizvodModel', required: true },
  klijent: { type: Schema.Types.ObjectId, ref: 'UserModel', required: true },
  korisnickoIme: { type: String, required: true },
  tekst: { type: String, required: true, maxlength: 500 },
  datum: { type: Date, default: Date.now },
});

Komentar.index({ proizvod: 1, klijent: 1 }, { unique: true });
Komentar.index({ proizvod: 1, datum: -1 });

export default mongoose.model<IKomentar>('KomentarModel', Komentar, 'komentari');
