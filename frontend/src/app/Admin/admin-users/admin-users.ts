import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AdminServis } from '../../services/admin-servis';
import { User } from '../../services/user';
import { KorisnikPregled } from '../../models/admin';
import { UserType } from '../../models/user';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers {
    korisnici: KorisnikPregled[] = [];
    filterTip = '';
    uspeh: string | null = null;
    greska: string | null = null;

    izmena: {
      id: string;  korisnickoIme: string;  tip: 'fizicko' | 'pravno' | 'stamparija';
      ime: string;  prezime: string;  telefon: string;  email: string;
      nazivInstitucije: string;  adresaSedista: string;  maticniBroj: string;  pib: string;
    } | null = null;

    zaBrisanje: { id: string; korisnickoIme: string } | null = null;

    private trenutnaSlika = '';
    adminServis = inject(AdminServis);
    userService = inject(User);

    ngOnInit() {
      this.filtriraj();
    }

    filtriraj() {
      this.adminServis.ucitajKorisnike(this.filterTip).subscribe({
        next: (odgovor) => {
          this.korisnici = odgovor;
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja korisnika', err);
          this.greska = 'Korisnike nije moguće učitati.';
        }
      });
    }

    izmeni(korisnik: KorisnikPregled) {
      this.uspeh = null;
      this.greska = null;
      this.userService.getProfil(korisnik.korisnickoIme).subscribe({
        next: (podaci) => {
          this.trenutnaSlika = podaci.fajl;
          this.izmena = {
            id: korisnik.id,
            korisnickoIme: podaci.korisnickoIme,
            tip: korisnik.tip,
            ime: podaci.ime,
            prezime: podaci.prezime,
            telefon: podaci.telefon,
            email: podaci.email,
            nazivInstitucije: podaci.nazivInstitucije,
            adresaSedista: podaci.adresaSedista,
            maticniBroj: podaci.maticniBroj,
            pib: podaci.pib,
          };
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja naloga', err);
          this.greska = 'Podatke o nalogu nije moguće učitati.';
        }
      });
    }

    sacuvaj(forma: NgForm) {
      if (!this.izmena) { return; }
      this.uspeh = null;
      this.greska = null;
      if (forma.invalid) {
        forma.form.markAllAsTouched();
        return;
      }
      const izmenjen = this.izmena;
      const podaci: UserType = {
        korisnickoIme: izmenjen.korisnickoIme,
        lozinka: '',
        ime: izmenjen.ime,
        prezime: izmenjen.prezime,
        telefon: izmenjen.telefon,
        email: izmenjen.email,
        nazivInstitucije: izmenjen.nazivInstitucije,
        adresaSedista: izmenjen.adresaSedista,
        maticniBroj: izmenjen.maticniBroj,
        pib: izmenjen.pib,
        tip: izmenjen.tip,
        fajl: this.trenutnaSlika,
      };
      this.userService.azurirajProfil(podaci, null).subscribe({
        next: () => {
          this.uspeh = `Nalog „${izmenjen.korisnickoIme}" je izmenjen.`;
          const stavka = this.korisnici.find(k => k.id === izmenjen.id);
          if (stavka) {
            stavka.ime = izmenjen.ime;
            stavka.prezime = izmenjen.prezime;
            stavka.telefon = izmenjen.telefon;
            stavka.email = izmenjen.email;
          }
          this.izmena = null;
        },
        error: (err) => {
          console.error('Greska prilikom cuvanja izmena', err);
          this.greska = 'Čuvanje izmena nije uspelo.';
        }
      });
    }

    zatvoriIzmenu() {
      this.izmena = null;
    }

    pokreniBrisanje(korisnik: { id: string; korisnickoIme: string }) {
      this.zaBrisanje = { id: korisnik.id, korisnickoIme: korisnik.korisnickoIme };
    }

    potvrdiBrisanje() {
      if (!this.zaBrisanje) { return; }
      const korisnickoIme = this.zaBrisanje.korisnickoIme;
      this.userService.deleteUser(korisnickoIme).subscribe({
        next: () => {
          this.korisnici = this.korisnici.filter(k => k.korisnickoIme !== korisnickoIme);
          this.uspeh = `Nalog „${korisnickoIme}" je obrisan.`;
          this.zaBrisanje = null;
        },
        error: (err) => {
          console.error('Greska prilikom brisanja naloga', err);
          this.greska = 'Brisanje naloga nije uspelo.';
          this.zaBrisanje = null;
        }
      });
    }

    otkaziBrisanje() {
      this.zaBrisanje = null;
    }
}
