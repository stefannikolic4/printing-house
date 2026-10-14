import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let Kategorija = new Schema({
  naziv: { type: String, required: true, trim: true, unique: true },
  potkategorije: { type: [String], default: [] },
});

export default mongoose.model('KategorijaModel', Kategorija, 'kategorije');
