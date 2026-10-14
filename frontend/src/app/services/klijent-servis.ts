import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserType } from '../models/user';
import { ArhivaStavka, IzmenaProfila, Kartica, KlijentProizvod, KorpaOdgovor, Nabavka, Narudzbina, Ocena, PotvrdaOdgovor } from '../models/klijent';
import { Message } from '../models/msg';
import { Sesion } from './sesion';

const API = 'http://localhost:4000/klijent';

@Injectable({
  providedIn: 'root',
})
export class KlijentServis {
  private http = inject(HttpClient);
  private sesija = inject(Sesion);

  private korisnickoIme(): string {
    return this.sesija.korisnik()?.korisnickoIme ?? '';
  }

  slikaUrl(fajl: string): string {
    if (!fajl || fajl === 'default_profile_image.jpg') return 'http://localhost:4000/uploads/default_profile_image.svg';
    if (/^(https?:|data:image)/i.test(fajl)) return fajl;
    return `http://localhost:4000/uploads/${fajl}`;
  }

  getProfil() {
    return this.http.get<UserType>(`${API}/profil/${encodeURIComponent(this.korisnickoIme())}`);
  }

  izmeniProfil(podaci: IzmenaProfila, slika: File | null) {
    const formData = new FormData();
    formData.append('korisnickoIme', this.korisnickoIme());
    Object.entries(podaci).forEach(([k, v]) => formData.append(k, String(v ?? '')));
    if (slika) formData.append('slika', slika);
    return this.http.post<UserType>(`${API}/profil/izmena`, formData);
  }

  getNarudzbine() {
    return this.http.get<Narudzbina[]>(`${API}/narudzbine/${encodeURIComponent(this.korisnickoIme())}`);
  }

  otkaziNarudzbinu(id: number) {
    return this.http.post<Message>(`${API}/narudzbine/${encodeURIComponent(this.korisnickoIme())}/${id}/otkazi`, {});
  }

  getProizvod(id: string) {
    return this.http.get<KlijentProizvod>(`${API}/proizvod/${id}`, {
      params: { korisnickoIme: this.korisnickoIme() },
    });
  }

  dodajUKorpu(proizvodId: string, boja: string, usluga: string, tekst: string, kolicina: number, slicica: File | null) {
    const formData = new FormData();
    formData.append('korisnickoIme', this.korisnickoIme());
    formData.append('proizvodId', proizvodId);
    formData.append('boja', boja);
    formData.append('usluga', usluga);
    formData.append('tekst', tekst);
    formData.append('kolicina', String(kolicina));
    if (slicica) formData.append('slicica', slicica);
    return this.http.post<Message>(`${API}/korpa`, formData);
  }

  getKorpa() {
    return this.http.get<KorpaOdgovor>(`${API}/korpa/${encodeURIComponent(this.korisnickoIme())}`);
  }

  potvrdiKorpu() {
    return this.http.post<PotvrdaOdgovor>(`${API}/korpa/potvrdi`, { korisnickoIme: this.korisnickoIme() });
  }

  plati(fakture: number[], kartica: Kartica) {
    return this.http.post<Message>(`${API}/placanje`, { korisnickoIme: this.korisnickoIme(), fakture, kartica });
  }

  getNabavke() {
    return this.http.get<Nabavka[]>(`${API}/nabavke/${encodeURIComponent(this.korisnickoIme())}`);
  }

  preuzmiIzvestaj(nabavkaId: string) {
    return this.http.get(`${API}/nabavke/izvestaj/${nabavkaId}`, {
      params: { korisnickoIme: this.korisnickoIme() },
      responseType: 'blob',
    });
  }

  getArhiva() {
    return this.http.get<ArhivaStavka[]>(`${API}/arhiva/${encodeURIComponent(this.korisnickoIme())}`);
  }

  oznaciPrimljeno(fakturaId: number) {
    return this.http.post<Message>(`${API}/arhiva/${encodeURIComponent(this.korisnickoIme())}/${fakturaId}/primljeno`, {});
  }

  oceni(proizvodId: string, ocena: Ocena, komentar: string) {
    return this.http.post<Message>(`${API}/ocena`, {
      korisnickoIme: this.korisnickoIme(),
      proizvodId,
      ocena,
      komentar,
    });
  }

}
