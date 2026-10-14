import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { StamparServis } from '../../services/stampar-servis';

@Component({
  selector: 'app-printer-stock',
  imports: [FormsModule],
  templateUrl: './printer-stock.html',
  styleUrl: './printer-stock.css',
})
export class PrinterStock {
    proizvodi: {
      id: string;  sifra: string;  naziv: string;  kategorija: string;
      kolicina: number;
      novaKolicina: number;
    }[] = [];
    uspeh: string | null = null;
    greska: string | null = null;

    private korisnickoIme = '';
    stamparServis = inject(StamparServis);

    ngOnInit() {
      this.korisnickoIme = localStorage.getItem('korisnickoIme') ?? '';
      this.stamparServis.ucitajLager(this.korisnickoIme).subscribe({
        next: (odgovor) => {
          this.proizvodi = odgovor.proizvodi.map(p => ({
            id: p.id,
            sifra: p.sifra,
            naziv: p.naziv,
            kategorija: p.kategorija,
            kolicina: p.kolicina,
            novaKolicina: p.kolicina,
          }));
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja lagera', err);
          this.greska = 'Proizvode nije moguće učitati.';
        }
      });
    }

    sacuvaj(proizvod: { id: string; kolicina: number; novaKolicina: number }, forma: NgForm) {
      this.uspeh = null;
      this.greska = null;
      if (forma.invalid) { return; }
      this.stamparServis.azurirajKolicinu(this.korisnickoIme, proizvod.id, proizvod.novaKolicina).subscribe({
        next: () => {
          proizvod.kolicina = proizvod.novaKolicina;
          this.uspeh = 'Količina je ažurirana.';
        },
        error: (err) => {
          console.error('Greska prilikom azuriranja kolicine', err);
          this.greska = 'Ažuriranje količine nije uspelo.';
        }
      });
    }
}
