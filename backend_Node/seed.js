/* ============================================================
   SEED SKRIPTA — puni bazu test podacima
   Pokretanje (iz backend foldera, uz pokrenut mongod):
     npm install        (ako već nije)
     node seed.js
   Sve lozinke naloga: Test1234!   (admin: Admin123!)
   ============================================================ */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO = 'mongodb://127.0.0.1:27017/printing_house'; // isto kao u server.ts

// ---- Minimalne šeme (ista polja kao modeli aplikacije) ----
const User = mongoose.model('User', new mongoose.Schema({
  korisnickoIme: String, lozinkaHash: String,
  ime: String, prezime: String, telefon: String, email: String,
  nazivInstitucije: String, adresaSedista: String, maticniBroj: String, pib: String,
  tip: String, // 'fizicko' | 'pravno' | 'stamparija' | 'administrator'
  status: { type: String, default: 'na_cekanju' }, // 'na_cekanju' | 'odobren' | 'odbijen'
  fajl: { type: String, default: 'default_profile_image.svg' },
  resetTokenHash: { type: String, default: null },
  resetTokenIstice: { type: Date, default: null },
}, { collection: 'users' }));

const Stamparija = mongoose.model('Stamparija', new mongoose.Schema({
  vlasnik: mongoose.Schema.Types.ObjectId,
  naziv: String, adresa: String, grad: String,
  lat: { type: Number, default: null }, lng: { type: Number, default: null },
  aktivna: { type: Boolean, default: false },
}, { collection: 'stamparije' }));

const Kategorija = mongoose.model('Kategorija', new mongoose.Schema({
  naziv: String, potkategorije: { type: [String], default: [] },
}, { collection: 'kategorije' }));

const uslugaStampe = new mongoose.Schema({
  tipStampe: String, dodatnaCenaPoKomadu: { type: Number, default: 0 },
  maxSirinaMm: { type: Number, default: 0 }, maxVisinaMm: { type: Number, default: 0 },
}, { _id: true });

const Proizvod = mongoose.model('Proizvod', new mongoose.Schema({
  stamparija: mongoose.Schema.Types.ObjectId,
  sifra: String, naziv: String, opis: { type: String, default: '' },
  kategorija: String, potkategorija: { type: String, default: '' },
  jedinicnaCena: Number, kolicinaNaLageru: { type: Number, default: 0 },
  dostupneBoje: { type: [String], default: [] },
  slikaUrl: { type: String, default: '' }, dodatneSlike: { type: [String], default: [] },
  uslugeStampe: { type: [uslugaStampe], default: [] },
  aktivan: { type: Boolean, default: true },
  lajkovi: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  dislajkovi: { type: [mongoose.Schema.Types.ObjectId], default: [] },
}, { collection: 'proizvodi' }));

const Faktura = mongoose.model('Faktura', new mongoose.Schema({
  broj: Number, klijent: mongoose.Schema.Types.ObjectId, stamparija: mongoose.Schema.Types.ObjectId,
  stavke: [{ proizvod: mongoose.Schema.Types.ObjectId, naziv: String, kolicina: Number,
             boja: { type: String, default: 'Bela' }, tipStampe: { type: String, default: '' },
             tekst: { type: String, default: '' }, slicica: { type: String, default: '' },
             cenaPoKomadu: { type: Number, default: 0 }, ukupno: { type: Number, default: 0 } }],
  ukupno: Number, status: String,
  nabavka: { type: mongoose.Schema.Types.ObjectId, default: null },
  datum: { type: Date, default: Date.now },
}, { collection: 'fakture' }));

const Nabavka = mongoose.model('Nabavka', new mongoose.Schema({
  klijent: mongoose.Schema.Types.ObjectId,
  stavke: [{ naziv: String, kolicina: Number, boja: { type: String, default: 'Bela' },
             tipStampe: { type: String, default: '' }, tekst: { type: String, default: '' },
             slicica: { type: String, default: '' } }],
  pokrenuta: Date, istice: Date,
  status: { type: String, default: 'otvorena' }, // 'otvorena' | 'zavrsena' | 'bez-ponude'
  ponude: [{ stamparija: mongoose.Schema.Types.ObjectId, iznos: Number, vreme: Date }],
  pobednik: { type: mongoose.Schema.Types.ObjectId, default: null },
  iznos: { type: Number, default: null },
  faktura: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { collection: 'nabavke' }));

const Ocena = mongoose.model('Ocena', new mongoose.Schema({
  proizvod: mongoose.Schema.Types.ObjectId, klijent: mongoose.Schema.Types.ObjectId,
  vrednost: Number, datum: { type: Date, default: Date.now },
}, { collection: 'ocene' }));

const Komentar = mongoose.model('Komentar', new mongoose.Schema({
  proizvod: mongoose.Schema.Types.ObjectId, klijent: mongoose.Schema.Types.ObjectId,
  korisnickoIme: String, tekst: String, datum: { type: Date, default: Date.now },
}, { collection: 'komentari' }));

const Brojac = mongoose.model('Brojac', new mongoose.Schema({
  _id: String, seq: { type: Number, default: 0 },
}, { collection: 'brojaci' }));

// Pomoćna: datum pre N dana
const pre = (dana) => new Date(Date.now() - dana * 24 * 60 * 60 * 1000);

async function main() {
  await mongoose.connect(MONGO);
  console.log('Povezano na', MONGO);

  await mongoose.connection.dropDatabase();
  console.log('Stari podaci obrisani.');

  const lozinka = await bcrypt.hash('Test1234!', 10);
  const adminLozinka = await bcrypt.hash('Admin123!', 10);

  // ---------- KORISNICI ----------
  let [admin, marko, jovana, firma1, printproUser, kolorUser, petar] = await Promise.all([
    User.create({ korisnickoIme: 'admin', lozinkaHash: adminLozinka, ime: 'Administrator', prezime: 'Sistema',
      telefon: '+381600000000', email: 'admin@printinghouse.local', nazivInstitucije: '', adresaSedista: '',
      maticniBroj: '', pib: '', tip: 'administrator', status: 'odobren' }),
    User.create({ korisnickoIme: 'marko', lozinkaHash: lozinka, ime: 'Marko', prezime: 'Marković',
      telefon: '+381641234567', email: 'marko@example.com', nazivInstitucije: '', adresaSedista: '',
      maticniBroj: '', pib: '', tip: 'fizicko', status: 'odobren' }),
    User.create({ korisnickoIme: 'jovana', lozinkaHash: lozinka, ime: 'Jovana', prezime: 'Jovanović',
      telefon: '+381655554444', email: 'jovana@example.com', nazivInstitucije: '', adresaSedista: '',
      maticniBroj: '', pib: '', tip: 'fizicko', status: 'odobren' }),
    User.create({ korisnickoIme: 'techshop', lozinkaHash: lozinka, ime: 'Nikola', prezime: 'Nikolić',
      telefon: '+381621119999', email: 'info@techshop.rs', nazivInstitucije: 'TechShop d.o.o.',
      adresaSedista: 'Bulevar Oslobođenja 100', maticniBroj: '12345678', pib: '100123456',
      tip: 'pravno', status: 'odobren' }),
    User.create({ korisnickoIme: 'printpro', lozinkaHash: lozinka, ime: 'Petar', prezime: 'Petrović',
      telefon: '+38163123123', email: 'info@printpro.rs', nazivInstitucije: 'PrintPro',
      adresaSedista: 'Kneza Miloša 12', maticniBroj: '20123456', pib: '100234567',
      tip: 'stamparija', status: 'odobren' }),
    User.create({ korisnickoIme: 'kolor', lozinkaHash: lozinka, ime: 'Katarina', prezime: 'Kolar',
      telefon: '+38164334455', email: 'info@kolorpres.rs', nazivInstitucije: 'Kolor Pres',
      adresaSedista: 'Zmaj Jovina 5', maticniBroj: '20345678', pib: '100345678',
      tip: 'stamparija', status: 'odobren' }),
    User.create({ korisnickoIme: 'petar', lozinkaHash: lozinka, ime: 'Petar', prezime: 'Perić',
      telefon: '+38166777888', email: 'petar@example.com', nazivInstitucije: '', adresaSedista: '',
      maticniBroj: '', pib: '', tip: 'fizicko', status: 'na_cekanju' }), // zahtev za admina da odobri
  ]);

  // Indeksi koje aplikacija očekuje (detekcija duplih korisničkih imena/mejlova preko greške 11000)
  let users = mongoose.connection.collection('users');
  await users.createIndex({ korisnickoIme: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });
  await mongoose.connection.collection('fakture').createIndex({ broj: 1 }, { unique: true });
  await mongoose.connection.collection('komentari').createIndex({ proizvod: 1, klijent: 1 }, { unique: true });

  // ---------- ŠTAMPARIJE ----------
  let printPro = await Stamparija.create({ vlasnik: printproUser._id, naziv: 'PrintPro',
    adresa: 'Kneza Miloša 12', grad: 'Beograd', lat: 44.8125, lng: 20.4612, aktivna: true });
  let kolorPres = await Stamparija.create({ vlasnik: kolorUser._id, naziv: 'Kolor Pres',
    adresa: 'Zmaj Jovina 5', grad: 'Novi Sad', lat: 45.2574, lng: 19.8434, aktivna: true });

  // ---------- KATEGORIJE ----------
  await Kategorija.create([
    { naziv: 'Vizit kartice', potkategorije: ['Standardne', 'Premijum'] },
    { naziv: 'Flajeri', potkategorije: ['A5', 'A6'] },
    { naziv: 'Brošure', potkategorije: ['Presavijene', 'Uvezane'] },
    { naziv: 'Kalendar', potkategorije: ['Zidni', 'Stolni'] },
    { naziv: 'Plakati', potkategorije: ['A2', 'A3', 'A4'] },
    { naziv: 'Nalepnice', potkategorije: ['Papirne', 'Vinil'] },
  ]);

  // ---------- PROIZVODI ----------
  let vizitPP = await Proizvod.create({
    stamparija: printPro._id, sifra: 'PP-VK-01', naziv: 'Vizit kartice', opis: 'Standardne vizit kartice, 300g papir, jednostrana štampa.',
    kategorija: 'Vizit kartice', potkategorija: 'Standardne', jedinicnaCena: 5, kolicinaNaLageru: 2000,
    dostupneBoje: ['Bela', 'Krem', 'Crna'],
    uslugeStampe: [{ tipStampe: 'Digitalna', dodatnaCenaPoKomadu: 5, maxSirinaMm: 330, maxVisinaMm: 480 }],
    lajkovi: [marko._id, jovana._id],
  });
  let flajeriPP = await Proizvod.create({
    stamparija: printPro._id, sifra: 'PP-FL-01', naziv: 'Flajeri A5', opis: 'Flajeri formata A5, 130g sjajni papir.',
    kategorija: 'Flajeri', potkategorija: 'A5', jedinicnaCena: 15, kolicinaNaLageru: 5000,
    dostupneBoje: ['Bela'],
    uslugeStampe: [{ tipStampe: 'Digitalna', dodatnaCenaPoKomadu: 3, maxSirinaMm: 330, maxVisinaMm: 480 }],
  });
  let brosurePP = await Proizvod.create({
    stamparija: printPro._id, sifra: 'PP-BR-01', naziv: 'Brošura A4 presavijena', opis: 'Brošura A4 savijena na trećine, 170g.',
    kategorija: 'Brošure', potkategorija: 'Presavijene', jedinicnaCena: 40, kolicinaNaLageru: 800,
    dostupneBoje: ['Bela', 'Krem'],
    uslugeStampe: [{ tipStampe: 'Ofsetna', dodatnaCenaPoKomadu: 10, maxSirinaMm: 700, maxVisinaMm: 1000 }],
  });
  let kalendarPP = await Proizvod.create({
    stamparija: printPro._id, sifra: 'PP-KA-01', naziv: 'Kalendar zidni', opis: 'Zidni kalendar sa spiralom, 12 listova.',
    kategorija: 'Kalendar', potkategorija: 'Zidni', jedinicnaCena: 350, kolicinaNaLageru: 300,
    dostupneBoje: ['Bela'], uslugeStampe: [],
  });
  let nalepnicePP = await Proizvod.create({
    stamparija: printPro._id, sifra: 'PP-NA-01', naziv: 'Nalepnice vinil', opis: 'Vinil nalepnice otporne na vodu, po komadu.',
    kategorija: 'Nalepnice', potkategorija: 'Vinil', jedinicnaCena: 8, kolicinaNaLageru: 10000,
    dostupneBoje: ['Bela', 'Providna'], uslugeStampe: [],
  });
  let plakatiKP = await Proizvod.create({
    stamparija: kolorPres._id, sifra: 'KP-PL-01', naziv: 'Plakati A3', opis: 'Plakati formata A3, 150g sjajni papir.',
    kategorija: 'Plakati', potkategorija: 'A3', jedinicnaCena: 80, kolicinaNaLageru: 1500,
    dostupneBoje: ['Bela', 'Žuta'],
    uslugeStampe: [{ tipStampe: 'Velika formatna', dodatnaCenaPoKomadu: 20, maxSirinaMm: 420, maxVisinaMm: 594 }],
  });
  let vizitKP = await Proizvod.create({
    stamparija: kolorPres._id, sifra: 'KP-VK-01', naziv: 'Vizit kartice', opis: 'Vizit kartice sa lakiranjem, 350g.',
    kategorija: 'Vizit kartice', potkategorija: 'Standardne', jedinicnaCena: 6, kolicinaNaLageru: 3000,
    dostupneBoje: ['Bela', 'Crna'], uslugeStampe: [],
    dislajkovi: [jovana._id],
  });
  let flajeriKP = await Proizvod.create({
    stamparija: kolorPres._id, sifra: 'KP-FL-01', naziv: 'Flajeri A6', opis: 'Flajeri formata A6, 115g.',
    kategorija: 'Flajeri', potkategorija: 'A6', jedinicnaCena: 8, kolicinaNaLageru: 8000,
    dostupneBoje: ['Bela'], uslugeStampe: [],
  });
  let kalendarKP = await Proizvod.create({
    stamparija: kolorPres._id, sifra: 'KP-KA-01', naziv: 'Kalendar stolni', opis: 'Stolni kalendar sa podlogom.',
    kategorija: 'Kalendar', potkategorija: 'Stolni', jedinicnaCena: 250, kolicinaNaLageru: 400,
    dostupneBoje: ['Bela'], uslugeStampe: [],
  });

  // ---------- FAKTURE (za arhivu, statistiku prometa i udelа) ----------
  let [f1001, f1002, f1003, f1004] = await Promise.all([
    // marko: primljena narudžbina sa ocenom i komentarom (arhiva)
    Faktura.create({
      broj: 1001, klijent: marko._id, stamparija: printPro._id, status: 'primljeno', datum: pre(60),
      stavke: [
        { proizvod: vizitPP._id, naziv: 'Vizit kartice', kolicina: 200, boja: 'Bela', tipStampe: 'Digitalna',
          tekst: '', slicica: '', cenaPoKomadu: 10, ukupno: 2000 },
        { proizvod: flajeriPP._id, naziv: 'Flajeri A5', kolicina: 100, boja: 'Bela', tipStampe: '',
          tekst: '', slicica: '', cenaPoKomadu: 15, ukupno: 1500 },
      ],
      ukupno: 3500,
    }),
    // marko: isporučena (može da se označi kao primljena u arhivi)
    Faktura.create({
      broj: 1002, klijent: marko._id, stamparija: kolorPres._id, status: 'isporučeno', datum: pre(10),
      stavke: [
        { proizvod: plakatiKP._id, naziv: 'Plakati A3', kolicina: 50, boja: 'Bela', tipStampe: '',
          tekst: '', slicica: '', cenaPoKomadu: 80, ukupno: 4000 },
      ],
      ukupno: 4000,
    }),
    // marko: u štampi (vidi se u profilu)
    Faktura.create({
      broj: 1003, klijent: marko._id, stamparija: printPro._id, status: 'u štampi', datum: pre(5),
      stavke: [
        { proizvod: kalendarPP._id, naziv: 'Kalendar zidni', kolicina: 10, boja: 'Bela', tipStampe: '',
          tekst: '', slicica: '', cenaPoKomadu: 350, ukupno: 3500 },
      ],
      ukupno: 3500,
    }),
    // jovana: primljena (arhiva sa dislajk ocenom)
    Faktura.create({
      broj: 1004, klijent: jovana._id, stamparija: kolorPres._id, status: 'primljeno', datum: pre(20),
      stavke: [
        { proizvod: vizitKP._id, naziv: 'Vizit kartice', kolicina: 300, boja: 'Bela', tipStampe: '',
          tekst: '', slicica: '', cenaPoKomadu: 6, ukupno: 1800 },
      ],
      ukupno: 1800,
    }),
  ]);

  // ---------- JAVNE NABAVKE (techshop = pravno lice) ----------
  // 1) otvorena — štamparije još mogu da šalju ponude
  await Nabavka.create({
    klijent: firma1._id,
    stavke: [
      { naziv: 'Vizit kartice', kolicina: 500, boja: 'Bela', tipStampe: '', tekst: '', slicica: '' },
      { naziv: 'Flajeri A5', kolicina: 1000, boja: 'Bela', tipStampe: '', tekst: '', slicica: '' },
    ],
    pokrenuta: new Date(Date.now() - 2 * 60 * 1000),
    istice: new Date(Date.now() + 10 * 60 * 1000), // važi još 10 minuta
    status: 'otvorena', ponude: [], pobednik: null, iznos: null, faktura: null,
  });

  // 2) završena — pobedila PrintPro sa nižom ponudom, faktura u statusu "u štampi"
  let zavrsena = await Nabavka.create({
    klijent: firma1._id,
    stavke: [{ naziv: 'Plakati A3', kolicina: 200, boja: 'Bela', tipStampe: '', tekst: '', slicica: '' }],
    pokrenuta: pre(7), istice: new Date(pre(7).getTime() + 10 * 60 * 1000),
    status: 'zavrsena',
    ponude: [
      { stamparija: printPro._id, iznos: 12000, vreme: pre(7) },
      { stamparija: kolorPres._id, iznos: 15000, vreme: pre(7) },
    ],
    pobednik: printPro._id, iznos: 12000, faktura: null,
  });
  let f1005 = await Faktura.create({
    broj: 1005, klijent: firma1._id, stamparija: printPro._id, status: 'u štampi', datum: pre(7),
    nabavka: zavrsena._id,
    stavke: [{ proizvod: plakatiKP._id, naziv: 'Plakati A3', kolicina: 200, boja: 'Bela', tipStampe: '',
      tekst: '', slicica: '', cenaPoKomadu: 0, ukupno: 0 }],
    ukupno: 12000,
  });
  await Nabavka.updateOne({ _id: zavrsena._id }, { faktura: f1005._id });

  // ---------- OCENE I KOMENTARI (za linijski grafikon statistike) ----------
  await Ocena.create([
    { proizvod: vizitPP._id, klijent: marko._id, vrednost: 5, datum: pre(59) },
    { proizvod: vizitPP._id, klijent: jovana._id, vrednost: 5, datum: pre(30) },
    { proizvod: vizitPP._id, klijent: firma1._id, vrednost: 4, datum: pre(3) }, // menjanje ocene kroz vreme
    { proizvod: plakatiKP._id, klijent: marko._id, vrednost: 5, datum: pre(9) },
    { proizvod: vizitKP._id, klijent: jovana._id, vrednost: 1, datum: pre(19) },
  ]);
  await Komentar.create([
    { proizvod: vizitPP._id, klijent: marko._id, korisnickoIme: 'marko',
      tekst: 'Odličan kvalitet štampe, preporučujem!', datum: pre(59) },
    { proizvod: vizitKP._id, klijent: jovana._id, korisnickoIme: 'jovana',
      tekst: 'Boje na gotovom proizvodu nisu kao na pregledu.', datum: pre(19) },
  ]);

  // ---------- BROJAČ FAKTURA (sledeća faktura: 1006) ----------
  await Brojac.create({ _id: 'faktura', seq: 5 });

  await mongoose.disconnect();
  console.log('\n✅ Baza je uspešno napunjena test podacima!\n');
  console.log('Nalozi za prijavu (osim admina, sva lozinka: Test1234!):');
  console.log('  ┌──────────────┬────────────┬──────────────────────────────────────┐');
  console.log('  │ Korisničko   │ Lozinka    │ Uloga                                │');
  console.log('  ├──────────────┼────────────┼──────────────────────────────────────┤');
  console.log('  │ admin        │ Admin123!  │ Administrator  →  http://localhost:4200/admin');
  console.log('  │ marko        │ Test1234!  │ Klijent (fizičko lice)               │');
  console.log('  │ jovana       │ Test1234!  │ Klijent (fizičko lice)               │');
  console.log('  │ techshop     │ Test1234!  │ Klijent (pravno lice — javne nabavke)│');
  console.log('  │ printpro     │ Test1234!  │ Štamparija PrintPro (Beograd)        │');
  console.log('  │ kolor        │ Test1234!  │ Štamparija Kolor Pres (Novi Sad)     │');
  console.log('  │ petar        │ Test1234!  │ Registracija na čekanju (admin test) │');
  console.log('  └──────────────┴────────────┴──────────────────────────────────────┘');
  console.log('\nPodaci: 9 proizvoda, 6 kategorija, 5 faktura (1001–1005),');
  console.log('1 otvorena + 1 završena javna nabavka, ocene i komentari.\n');
}

main().catch((err) => {
  console.error('Seed nije uspeo:', err);
  process.exit(1);
});
