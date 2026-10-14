import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let Ocena = new Schema({
    proizvod: { type: Schema.Types.ObjectId, ref: 'Proizvod', required: true, index: true },
    klijent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vrednost: { type: Number, required: true, min: 1, max: 5 },
    datum: { type: Date, default: Date.now },
});

export default mongoose.model("OcenaModel", Ocena, "ocene");
