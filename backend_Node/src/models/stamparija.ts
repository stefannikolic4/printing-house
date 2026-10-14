import mongoose from "mongoose";


const Schema = mongoose.Schema;

let Stamparija = new Schema({
    vlasnik : {type: Schema.Types.ObjectId, ref: 'UserModel', required: true, unique: true},
    naziv : {type: String, required: true, trim: true},
    adresa : {type: String, default: '', trim: true},
    grad : {type: String, default: '', trim: true},
    lat : {type: Number, default: null},
    lng : {type: Number, default: null},
    aktivna : {type: Boolean, default: false}
});

export default mongoose.model("StamparijaModel", Stamparija, "stamparije");
