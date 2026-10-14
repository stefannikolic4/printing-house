export class ZahtevRegistracije {
    id: string = '';
    korisnickoIme: string = '';
    ime: string = '';
    prezime: string = '';
    tip: 'fizicko' | 'pravno' | 'stamparija' = 'fizicko';
    email: string = '';
    telefon: string = '';
    slika: string = '';
    nazivInstitucije: string | null = null;
    adresaSedista: string | null = null;
    maticniBroj: string | null = null;
    pib: string | null = null;
}
export class KorisnikPregled {
    id: string = '';
    korisnickoIme: string = '';
    ime: string = '';
    prezime: string = '';
    tip: 'fizicko' | 'pravno' | 'stamparija' = 'fizicko';
    email: string = '';
    telefon: string = '';
    slika: string = '';
}
export class KategorijaAdmin {
    id: string = '';
    naziv: string = '';
    potkategorije: string[] = [];
}
