import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Message } from '../models/msg';
import { ZahtevRegistracije, KorisnikPregled, KategorijaAdmin } from '../models/admin';
import { PrometStamparije, UdeoProizvoda, OcenaProizvoda } from '../models/statistika';

@Injectable({
  providedIn: 'root',
})
export class AdminServis {
    private http = inject(HttpClient)

    ucitajZahteve() {
        return this.http.get<ZahtevRegistracije[]>('http://localhost:4000/admin/zahtevi');
    }
    prihvatiZahtev(adminKorisnickoIme: string, idZahteva: string) {
        const data = { idZahteva };
        return this.http.post<Message>('http://localhost:4000/admin/zahtevi/prihvati', data);
    }
    odbaciZahtev(adminKorisnickoIme: string, idZahteva: string) {
        const data = { idZahteva };
        return this.http.post<Message>('http://localhost:4000/admin/zahtevi/odbaci', data);
    }

    ucitajKorisnike(filterTip: string) {
        const params: any = {};
        if (filterTip) params.tip = filterTip;
        return this.http.get<KorisnikPregled[]>('http://localhost:4000/admin/korisnici', { params });
    }

    ucitajKategorije() {
        return this.http.get<KategorijaAdmin[]>('http://localhost:4000/admin/kategorije');
    }
    dodajKategoriju(naziv: string) {
        const data = { naziv };
        return this.http.post<KategorijaAdmin>('http://localhost:4000/admin/kategorije', data);
    }
    dodajPotkategoriju(idKategorije: string, naziv: string) {
        const data = { idKategorije, naziv };
        return this.http.post<Message>('http://localhost:4000/admin/kategorije/potkategorije', data);
    }

    ucitajPrometStamparija() {
        return this.http.get<PrometStamparije[]>('http://localhost:4000/admin/statistika/promet');
    }
    ucitajUdeleProizvoda() {
        return this.http.get<UdeoProizvoda[]>('http://localhost:4000/admin/statistika/udeli');
    }
    ucitajOceneProizvoda() {
        return this.http.get<OcenaProizvoda[]>('http://localhost:4000/admin/statistika/ocene');
    }
}
