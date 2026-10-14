import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { StamparServis } from '../../services/stampar-servis';

@Component({
  selector: 'app-printer-tender',
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './printer-tender.html',
  styleUrl: './printer-tender.css',
})
export class PrinterTender {
    nabavke: {
      id: string;
      objavljena: Date;
      istice: Date;
      preostalo: string | null;
      stavke: { naziv: string; kolicina: number }[];
      cene: (number | null)[];
      ponudaPoslata: boolean;
    }[] = [];
    uspeh: string | null = null;
    greska: string | null = null;

    private korisnickoIme = '';
    private tajmer: ReturnType<typeof setInterval> | null = null;
    stamparServis = inject(StamparServis);

    ngOnInit() {
      this.korisnickoIme = localStorage.getItem('korisnickoIme') ?? '';
      this.ucitaj();
      this.tajmer = setInterval(() => this.azurirajPreostaloVreme(), 1000);
    }

    ngOnDestroy() {
      if (this.tajmer) { clearInterval(this.tajmer); }
    }

    private ucitaj() {
      this.stamparServis.ucitajNabavke(this.korisnickoIme).subscribe({
        next: (odgovor) => {
          this.nabavke = odgovor.nabavke.map(n => ({
            id: n.id,
            objavljena: new Date(n.objavljena),
            istice: new Date(n.istice),
            preostalo: null,
            stavke: n.stavke,
            cene: n.stavke.map(() => null),
            ponudaPoslata: n.ponudaPoslata,
          }));
          this.azurirajPreostaloVreme();
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja nabavki', err);
          this.greska = 'Javne nabavke nije moguće učitati.';
        }
      });
    }

    private azurirajPreostaloVreme() {
      for (const n of this.nabavke) {
        const preostaloSek = Math.max(0, Math.ceil((n.istice.getTime() - Date.now()) / 1000));
        const minuti = Math.floor(preostaloSek / 60);
        const sekunde = preostaloSek % 60;
        n.preostalo = `${String(minuti).padStart(2, '0')}:${String(sekunde).padStart(2, '0')}`;
      }
    }

    ukupnaPonuda(nabavka: { stavke: { kolicina: number }[]; cene: (number | null)[] }): number {
      return nabavka.stavke.reduce((zbir, s, i) => zbir + (nabavka.cene[i] ?? 0) * s.kolicina, 0);
    }

    posaljiPonudu(nabavka: { id: string; cene: (number | null)[]; ponudaPoslata: boolean }, forma: NgForm) {
      this.uspeh = null;
      this.greska = null;
      if (forma.invalid) {
        forma.form.markAllAsTouched();
        return;
      }
      const cene = nabavka.cene.map(c => c ?? 0);
      this.stamparServis.posaljiPonudu(this.korisnickoIme, nabavka.id, cene).subscribe({
        next: () => {
          nabavka.ponudaPoslata = true;
          this.uspeh = 'Ponuda je uspešno poslata.';
        },
        error: (err) => {
          console.error('Greska prilikom slanja ponude', err);
          this.greska = 'Slanje ponude nije uspelo. Pokušajte ponovo.';
        }
      });
    }
}
