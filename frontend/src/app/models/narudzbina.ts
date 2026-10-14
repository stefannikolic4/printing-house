export class StavkaNarudzbine {
    naziv: string = '';
    kolicina: number = 0;
    tipStampe: string = '';
}
export class Narudzbina {
    id: number = 0;
    klijent: string = '';
    stavke: StavkaNarudzbine[] = [];
    ukupno: number = 0;
    status: 'naručeno' | 'plaćeno' | 'u štampi' | 'isporučeno' | 'primljeno' = 'naručeno';
}
