import mongoose from "mongoose";


const Schema = mongoose.Schema;
let uslugaStampeSchema = new Schema({
    tipStampe: { type: String, required: true, trim: true },
    dodatnaCenaPoKomadu: { type: Number, min: 0, default: 0 },
    maxSirinaMm: { type: Number, min: 0, default: 0 },
    maxVisinaMm: { type: Number, min: 0, default: 0 },
});
let Proizvod = new Schema({
    stamparija: { type: Schema.Types.ObjectId, ref: 'Stamparija', required: true, index: true },
    sifra: { type: String, required: true, trim: true },
    naziv: { type: String, required: true, trim: true },
    opis: { type: String, default: '' },
    kategorija: { type: String, required: true, trim: true },
    potkategorija: { type: String, default: '', trim: true },
    jedinicnaCena: { type: Number, required: true, min: 0 },
    kolicinaNaLageru: { type: Number, min: 0, default: 0 },
    dostupneBoje: { type: [String], default: [] },
    slikaUrl: { type: String, default: '' },
    dodatneSlike: {
      type: [String],
      default: [],
      validate: { validator: (v: string[]) => v.length <= 3, message: 'Najviše 3 dodatne slike.' },
    },
    uslugeStampe: { type: [uslugaStampeSchema], default: [] },
    aktivan: { type: Boolean, default: true },
    lajkovi: { type: [Schema.Types.ObjectId], default: [] },
    dislajkovi: { type: [Schema.Types.ObjectId], default: [] }
});

export default mongoose.model("ProizvodModel", Proizvod, "proizvodi");