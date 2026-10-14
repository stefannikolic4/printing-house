export class PrometStamparije {
    naziv: string = '';
    iznos: number = 0;
}
export class UdeoProizvoda {
    naziv: string = '';
    kolicina: number = 0;
    procenat: number = 0;
}
export class OcenaProizvodaTacka {
    datum: string = '';
    ocena: number = 0;
}
export class OcenaProizvoda {
    id: string = '';
    naziv: string = '';
    tacke: OcenaProizvodaTacka[] = [];
}
