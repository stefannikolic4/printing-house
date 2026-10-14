import { Component, inject } from '@angular/core';
import { AdminServis } from '../../services/admin-servis';

@Component({
  selector: 'app-admin-requests',
  imports: [],
  templateUrl: './admin-requests.html',
  styleUrl: './admin-requests.css',
})
export class AdminRequests {
    zahtevi: {
      id: string;
      korisnickoIme: string;  ime: string;  prezime: string;
      tip: 'fizicko' | 'pravno' | 'stamparija';
      email: string;  telefon: string;
      slika: string;
      nazivInstitucije: string | null;  adresaSedista: string | null;
      maticniBroj: string | null;  pib: string | null;
    }[] = [];
    uspeh: string | null = null;
    greska: string | null = null;

    private adminKorisnickoIme = '';
    adminServis = inject(AdminServis);

    ngOnInit() {
      this.adminKorisnickoIme = localStorage.getItem('korisnickoIme') ?? '';
      this.adminServis.ucitajZahteve().subscribe({
        next: (odgovor) => {
          this.zahtevi = odgovor;
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja zahteva', err);
          this.greska = 'Zahteve za registraciju nije moguće učitati.';
        }
      });
    }

    prihvati(zahtev: { id: string; korisnickoIme: string }) {
      this.uspeh = null;
      this.greska = null;
      this.adminServis.prihvatiZahtev(this.adminKorisnickoIme, zahtev.id).subscribe({
        next: () => {
          this.zahtevi = this.zahtevi.filter(z => z.id !== zahtev.id);
          this.uspeh = `Nalog „${zahtev.korisnickoIme}" je odobren.`;
        },
        error: (err) => {
          console.error('Greska prilikom prihvatanja zahteva', err);
          this.greska = 'Prihvatanje zahteva nije uspelo.';
        }
      });
    }

    odbaci(zahtev: { id: string; korisnickoIme: string }) {
      this.uspeh = null;
      this.greska = null;
      this.adminServis.odbaciZahtev(this.adminKorisnickoIme, zahtev.id).subscribe({
        next: () => {
          this.zahtevi = this.zahtevi.filter(z => z.id !== zahtev.id);
          this.uspeh = `Zahtev korisnika „${zahtev.korisnickoIme}" je odbačen.`;
        },
        error: (err) => {
          console.error('Greska prilikom odbacivanja zahteva', err);
          this.greska = 'Odbacivanje zahteva nije uspelo.';
        }
      });
    }
}
