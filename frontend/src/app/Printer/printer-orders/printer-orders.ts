import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StamparServis } from '../../services/stampar-servis';

@Component({
  selector: 'app-printer-orders',
  imports: [DecimalPipe],
  templateUrl: './printer-orders.html',
  styleUrl: './printer-orders.css',
})
export class PrinterOrders {
    narudzbine: {
      id: number;
      klijent: string;
      stavke: { naziv: string; kolicina: number; tipStampe: string }[];
      ukupno: number;
      status: 'naručeno' | 'plaćeno' | 'u štampi' | 'isporučeno' | 'primljeno';
    }[] = [];
    uspeh: string | null = null;
    greska: string | null = null;

    private korisnickoIme = '';
    stamparServis = inject(StamparServis);

    ngOnInit() {
      this.korisnickoIme = localStorage.getItem('korisnickoIme') ?? '';
      this.stamparServis.ucitajNarudzbine(this.korisnickoIme).subscribe({
        next: (odgovor) => {
          this.narudzbine = odgovor.narudzbine;
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja narudzbina', err);
          this.greska = 'Narudžbine nije moguće učitati.';
        }
      });
    }

    uStampu(narudzbina: { id: number; status: string }) {
      this.promeniStatus(narudzbina, 'u štampi', 'Narudžbina je prebačena u štampu.');
    }

    isporuceno(narudzbina: { id: number; status: string }) {
      this.promeniStatus(narudzbina, 'isporučeno', 'Narudžbina je označena kao isporučena.');
    }

    private promeniStatus(
      narudzbina: { id: number; status: string },
      noviStatus: 'u štampi' | 'isporučeno',
      porukaUspeha: string
    ) {
      this.uspeh = null;
      this.greska = null;
      this.stamparServis.promeniStatusNarudzbine(this.korisnickoIme, narudzbina.id, noviStatus).subscribe({
        next: () => {
          narudzbina.status = noviStatus;
          this.uspeh = porukaUspeha;
        },
        error: (err) => {
          console.error('Greska prilikom promene statusa', err);
          this.greska = 'Promena statusa nije uspela.';
        }
      });
    }
}
