import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { KategorijaPotkategorije, PretragaProizvodaResponse, Proizvod, ProizvodDetalji, Top5Proizvod } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class StamparijaServis {
    private http = inject(HttpClient)
    getBrojStamparije() {
        return this.http.get<number>('http://localhost:4000/stamparije/broj');
    }
    getTop5Proizvoda() {
        return this.http.get<{ Proizvodi: Top5Proizvod[] }>('http://localhost:4000/stamparije/top5');
    }
    ucitajKategorije() {
        return this.http.get<string[]>('http://localhost:4000/stamparije/kategorije');
    }
    pretraziProizvode(naziv: string, kategorija: string, sortSmer: 'rastuce' | 'opadajuce' | null) {
        const params: any = {};
        if (naziv) params.naziv = naziv;
        if (kategorija) params.kategorija = kategorija;
        if (sortSmer) params.sortSmer = sortSmer;
        return this.http.get<{ Proizvodi: PretragaProizvodaResponse[] }>('http://localhost:4000/stamparije/pretraga', { params });
    }
    ucitajProizvod(id: string) {
        return this.http.get<ProizvodDetalji>(`http://localhost:4000/stamparije/proizvod/${id}`);
    }
    ucitajKategorijePotkategorije() {
        return this.http.get<{ kategorija: string; potkategorije: string[] }[]>('http://localhost:4000/stampar/kategorije');
    }
}
