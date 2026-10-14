import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let stavkaNarudzbineSchema = new Schema({
    proizvod: { type: Schema.Types.ObjectId, ref: 'Proizvod', required: true },
    nazivProizvoda: { type: String, required: true },
    kolicina: { type: Number, required: true, min: 1 },
    tipStampe: { type: String, default: '' },
    cena: { type: Number, required: true, min: 0 },
}, { _id: false });

let Narudzbina = new Schema({
    klijent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stamparija: { type: Schema.Types.ObjectId, ref: 'Stamparija', required: true, index: true },
    stavke: { type: [stavkaNarudzbineSchema], default: [] },
    ukupno: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['naručeno', 'plaćeno', 'u štampi', 'isporučeno', 'primljeno'],
      default: 'naručeno',
    },
    datum: { type: Date, default: Date.now },
});

export default mongoose.model("NarudzbinaModel", Narudzbina, "narudzbine");
