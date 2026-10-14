import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserType } from '../models/user';
import { Message } from '../models/msg';
import { Observable } from 'rxjs';

const API = 'http://localhost:4000';

@Injectable({
  providedIn: 'root',
})
export class User {
  private http = inject(HttpClient)

  login(u: string, p: string){
    const data = {
      username: u,
      password: p
    }
    return this.http.post<UserType>(
      `${API}/users/login`, data)
  }

  register(u: UserType, slika?: File | null){
    const formData = new FormData();
    Object.entries(u).forEach(([k, v]) => { if (k !== 'fajl') formData.append(k, String(v)); });
    if (slika) formData.append('slika', slika);

    return this.http.post<Message>(
      `${API}/users/register`, formData)
  }

  deleteUser(u: string){
    const data = {
      username: u
    }

    return this.http.post<Message>(
      `${API}/users/delete`, data)
  }
  adminLogin(u: string, p: string){
    const data = {
      username: u,
      password: p
    }
    return this.http.post<UserType>(
      `${API}/users/admin-login`, data)
  }
  forgotPassword(identifikator: string){
    const data = {
      identifikator: identifikator
    }
    return this.http.post<Message>(
      `${API}/users/forgot-password`, data)
  }
  resetPassword(token: string, novaLozinka: string){
    const data = {
      token: token,
      novaLozinka: novaLozinka
    }
    return this.http.post<Message>(
      `${API}/users/reset-password`, data)
  }
  getProfil(korisnickoIme: string): Observable<UserType> {
    return this.http.get<UserType>(`${API}/stampar/profil/${encodeURIComponent(korisnickoIme)}`);
  }

  azurirajProfil(podaci: UserType, novaSlika: File | null): Observable<UserType> {
    let forma = new FormData();
    forma.append('korisnickoIme', podaci.korisnickoIme);
    forma.append('ime', podaci.ime);
    forma.append('prezime', podaci.prezime);
    forma.append('telefon', podaci.telefon);
    forma.append('email', podaci.email);
    forma.append('nazivInstitucije', podaci.nazivInstitucije);
    forma.append('adresaSedista', podaci.adresaSedista);
    forma.append('maticniBroj', podaci.maticniBroj);
    forma.append('pib', podaci.pib);
    if (novaSlika) forma.append('slika', novaSlika);
    return this.http.post<UserType>(`${API}/stampar/profil/izmena`, forma);
  }

}
