import mongoose from "mongoose";


const Schema = mongoose.Schema;

let User = new Schema({
    korisnickoIme : { type: String, unique: true },
    lozinkaHash : String,
    ime : String,  prezime : String,  telefon : String,  email : { type: String, unique: true },
    nazivInstitucije : String,  adresaSedista : String,  maticniBroj : String,  pib : String,
    tip : String,
    status: {type: String, default: 'na_cekanju'},
    fajl: {type: String, default: 'default_profile_image.svg'},
    resetTokenHash: {type: String, default: null},
    resetTokenIstice: {type: Date, default: null}
});

export default mongoose.model("UserModel", User, "users");