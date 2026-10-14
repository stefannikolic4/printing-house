export type StatusNarudzbine = 'naručeno' | 'plaćeno' | 'u štampi' | 'isporučeno' | 'primljeno';

export interface NarudzbinaStavka {
  naziv: string;
  kolicina: number;
}

export interface Narudzbina {
  id: number;
  stamparija: string;
  grad: string;
  stavke: NarudzbinaStavka[];
  ukupno: number;
  status: StatusNarudzbine;
}

export interface UslugaStampe {
  id: string;
  tip: string;
  maxSirina: number;
  maxVisina: number;
  dodatnaCena: number;
}

export interface Komentar {
  id: string;
  korisnickoIme: string;
  datum: string;
  tekst: string;
  moj: boolean;
}

export interface KlijentProizvod {
  id: string;
  naziv: string;
  opis: string;
  cena: number;
  stamparija: string;
  grad: string;
  adresa: string;
  lat: number | null;
  lng: number | null;
  brojLajkova: number;
  brojDislajkova: number;
  naStanju: number;
  slike: string[];
  boje: string[];
  usluge: UslugaStampe[];
  komentari: Komentar[];
}

export interface KorpaStavka {
  naziv: string;
  kolicina: number;
  tipStampe: string;
  ukupno: number;
}

export interface KorpaGrupa {
  stamparijaId: string;
  stamparija: string;
  grad: string;
  ukupno: number;
  stavke: KorpaStavka[];
}

export interface KorpaOdgovor {
  grupe: KorpaGrupa[];
  ukupno: number;
}

export interface PotvrdaOdgovor {
  message: string;
  fakture: { id: number; ukupno: number }[];
  ukupno: number;
}

export interface Kartica {
  tip: string;
  broj: string;
  cvc: string;
  istek: string;
}

export interface Nabavka {
  id: string;
  pokrenuta: string;
  istice: string;
  stavke: NarudzbinaStavka[];
  status: 'otvorena' | 'zavrsena' | 'bez-ponude';
  pobednik: string | null;
  iznos: number | null;
}

export type Ocena = 'svidja' | 'nesvidja' | null;

export interface ArhivaStavka {
  id: string;
  fakturaId: number;
  proizvodId: string | null;
  naziv: string;
  kolicina: number;
  stamparija: string;
  datum: string;
  status: 'isporučeno' | 'primljeno';
  ocena: Ocena;
  komentar: string;
}

export interface IzmenaProfila {
  ime: string;
  prezime: string;
  telefon: string;
  email: string;
  nazivInstitucije?: string;
  adresaSedista?: string;
  maticniBroj?: string;
  pib?: string;
}
