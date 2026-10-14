import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Proizvod, StavkaLagera } from '../models/product';
import { Message } from '../models/msg';
import { Narudzbina } from '../models/narudzbina';
import { JavnaNabavka } from '../models/nabavka';

const API = 'http://localhost:4000/stampar';

@Injectable({
  providedIn: 'root',
})
export class StamparServis {
     private http = inject(HttpClient)

    dodajProizvod(korisnickoIme: string, proizvod: Proizvod, glavnaSlika: File | null, dodatneSlike: File[]) {
        const formData = new FormData();
        formData.append('korisnickoIme', korisnickoIme);
        Object.entries(proizvod).forEach(([k, v]) => {
            if (k === 'slikaUrl' || k === 'dodatneSlike') return;
            formData.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
        });
        if (glavnaSlika) formData.append('slika', glavnaSlika);
        dodatneSlike.forEach((d) => formData.append('dodatneSlike', d));

        return this.http.post<Message>(`${API}/proizvod`, formData)
    }

    uvezi(korisnickoIme: string, proizvodi: Proizvod[], glavneSlike: (File | null)[], dodatneSlike: File[][]) {
        const formData = new FormData();
        formData.append('korisnickoIme', korisnickoIme);
        formData.append('proizvodi', JSON.stringify(proizvodi));
        proizvodi.forEach((p, i) => {
            const glavna = glavneSlike[i];
            if (glavna) formData.append(`slike_${p.sifra}`, glavna);
            (dodatneSlike[i] ?? []).forEach((d) => formData.append(`dodatne_${p.sifra}`, d));
        });

        return this.http.post<Message>(`${API}/uvoz`, formData)
    }

    ucitajLager(korisnickoIme: string) {
        return this.http.get<{ proizvodi: StavkaLagera[] }>(
            `${API}/lager/${encodeURIComponent(korisnickoIme)}`)
    }
    azurirajKolicinu(korisnickoIme: string, id: string, novaKolicina: number) {
        const data = { korisnickoIme, proizvodId: id, novaKolicina };
        return this.http.post<Message>(`${API}/lager`, data)
    }

    ucitajNarudzbine(korisnickoIme: string) {
        return this.http.get<{ narudzbine: Narudzbina[] }>(
            `${API}/narudzbine/${encodeURIComponent(korisnickoIme)}`)
    }
    promeniStatusNarudzbine(korisnickoIme: string, broj: number, noviStatus: string) {
        const data = { korisnickoIme, broj, noviStatus };
        return this.http.post<Message>(`${API}/narudzbine/status`, data)
    }

    ucitajNabavke(korisnickoIme: string) {
        return this.http.get<{ nabavke: JavnaNabavka[] }>(
            `${API}/nabavke/${encodeURIComponent(korisnickoIme)}`)
    }
    posaljiPonudu(korisnickoIme: string, nabavkaId: string, cene: number[]) {
        const data = { korisnickoIme, nabavkaId, cene };
        return this.http.post<Message>(`${API}/nabavke/ponuda`, data)
    }
}
