export class UslugaStampe {
    idUsluge: string = '';
    tipStampe: string = '';
    dodatnaCenaPoKomadu: number = 0;
    maxSirinaMm: number = 0;
    maxVisinaMm: number = 0;
}
export class Proizvod {
    sifra: string = '';
    naziv: string = '';
    opis: string = '';
    kategorija: string = '';
    potkategorija: string = '';
    jedinicnaCena: number = 0;
    kolicinaNaLageru: number = 0;
    dostupneBoje: string[] = [];
    slikaUrl: string = '';
    dodatneSlike: string[] = [];
    uslugeStampe: UslugaStampe[] = [];
}
export class Stamparija {
    stamparijaId: string = '';
    nazivStamparije: string = '';
    proizvodi: Proizvod[] = [];
}
export class Top5Proizvod {
    id: string = '';
    naziv: string = '';
    stamparija: string = ''
    brojLajkova: number = 0;
}
export class PretragaProizvodaResponse {
    id: string = '';
    naziv: string = '';
    kategorija: string = '';
    stamparija: string = '';
}
export class ProizvodDetalji {
      naziv: string= '';
      stamparija: string= '';
      grad: string= '';
      brojLajkova: number= 0;
      brojDislajkova: number= 0;
      slike: string[]= [];
    }
export class KategorijaPotkategorije {
    kategorija: string = '';
    potkategorije: string[] = [];
}
export class StavkaLagera {
    id: string = '';
    sifra: string = '';
    naziv: string = '';
    kategorija: string = '';
    kolicina: number = 0;
}