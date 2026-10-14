import { Injectable } from '@angular/core';
import { UserType } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class Sesion {
  private readonly KORISNIK = 'korisnik';
  private readonly TOKEN = 'token';

  sacuvaj(korisnik: UserType) {
    localStorage.setItem(this.TOKEN, 'sesija');
    localStorage.setItem(this.KORISNIK, JSON.stringify(korisnik));
    localStorage.setItem('korisnickoIme', korisnik.korisnickoIme ?? '');
    localStorage.setItem('tip', korisnik.tip ?? '');
  }

  osvezi(korisnik: UserType) {
    localStorage.setItem(this.KORISNIK, JSON.stringify(korisnik));
  }

  korisnik(): UserType | null {
    const sacuvan = localStorage.getItem(this.KORISNIK);
    if (!sacuvan) return null;
    try {
      return JSON.parse(sacuvan) as UserType;
    } catch {
      return null;
    }
  }

  token(): string | null {
    return localStorage.getItem(this.TOKEN);
  }

  jeKlijent(): boolean {
    const k = this.korisnik();
    return !!this.token() && !!k && (k.tip === 'fizicko' || k.tip === 'pravno');
  }

  jePravnoLice(): boolean {
    return this.jeKlijent() && this.korisnik()?.tip === 'pravno';
  }

  jeAdmin(): boolean {
    const k = this.korisnik();
    return !!this.token() && !!k && k.tip === 'administrator';
  }

  odjava() {
    localStorage.removeItem(this.TOKEN);
    localStorage.removeItem(this.KORISNIK);
    localStorage.removeItem('korisnickoIme');
    localStorage.removeItem('tip');
  }
}
