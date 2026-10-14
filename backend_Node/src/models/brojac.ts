import mongoose, { Schema } from 'mongoose';

export interface IBrojac {
  _id: string;
  seq: number;
}

let Brojac = new Schema<IBrojac>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model<IBrojac>('BrojacModel', Brojac, 'brojaci');
