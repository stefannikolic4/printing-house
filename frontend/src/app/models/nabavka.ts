export class StavkaNabavke {
    naziv: string = '';
    kolicina: number = 0;
}
export class JavnaNabavka {
    id: string = '';
    objavljena: string = '';
    istice: string = '';
    stavke: StavkaNabavke[] = [];
    ponudaPoslata: boolean = false;
}
