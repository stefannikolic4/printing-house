import { Component, inject } from '@angular/core';
import { KlijentServis } from '../../services/klijent-servis';
import { Ocena} from '../../models/klijent';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe } from '@angular/common';
interface StavkaArhive {
  id: string;
  fakturaId: number;
  proizvodId: string | null;
  naziv: string;
  kolicina: number;
  stamparija: string;
  datum: Date;
  status: 'isporučeno' | 'primljeno';
  ocena: Ocena;
  komentar: string;
}
@Component({
  selector: 'app-client-archieve',
  imports: [FormsModule,DatePipe],
  templateUrl: './client-archieve.html',
  styleUrl: './client-archieve.css',
})
export class ClientArchieve {
   private klijentServis = inject(KlijentServis);

  proizvodi: StavkaArhive[] = [];
  greska: string | null = null;
  private sortKolona = 'datum';
  private sortSmer: 'rastuce' | 'opadajuce' = 'opadajuce';

  ocenjivan: { id: string; naziv: string } | null = null;
  ocena: Ocena = null;
  komentar = '';
  uspehOcene = false;

  ngOnInit() {
    this.ucitaj();
  }

  private ucitaj() {
    this.klijentServis.getArhiva().subscribe({
      next: (lista) => {
        this.proizvodi = lista.map((s) => ({ ...s, datum: new Date(s.datum) }));
        this.primeniSortiranje();
      },
      error: (err) => (this.greska = err.error?.message ?? 'Arhivu nije moguće učitati.'),
    });
  }

  ariaSort(kolona: string): 'ascending' | 'descending' | 'none' {
    if (this.sortKolona !== kolona) return 'none';
    return this.sortSmer === 'rastuce' ? 'ascending' : 'descending';
  }

  sortiraj(kolona: string) {
    if (this.sortKolona === kolona) {
      this.sortSmer = this.sortSmer === 'rastuce' ? 'opadajuce' : 'rastuce';
    } else {
      this.sortKolona = kolona;
      this.sortSmer = 'rastuce';
    }
    this.primeniSortiranje();
  }

  private primeniSortiranje() {
    const smer = this.sortSmer === 'rastuce' ? 1 : -1;
    const kolona = this.sortKolona;
    this.proizvodi = [...this.proizvodi].sort((a, b) => {
      switch (kolona) {
        case 'naziv':
          return smer * a.naziv.localeCompare(b.naziv, 'sr-Latn');
        case 'stamparija':
          return smer * a.stamparija.localeCompare(b.stamparija, 'sr-Latn');
        case 'kolicina':
          return smer * (a.kolicina - b.kolicina);
        default:
          return smer * (a.datum.getTime() - b.datum.getTime());
      }
    });
  }

  oznaciPrimljeno(p: StavkaArhive) {
    this.greska = null;
    this.klijentServis.oznaciPrimljeno(p.fakturaId).subscribe({
      next: () => this.ucitaj(),
      error: (err) => {
        this.greska = err.error?.message ?? 'Promena statusa nije uspela.';
        this.ucitaj();
      },
    });
  }

  otvoriOcenu(p: StavkaArhive) {
    this.greska = null;
    if (!p.proizvodId) {
      this.greska = 'Proizvod više ne postoji u ponudi, pa se ne može oceniti.';
      return;
    }
    this.ocenjivan = { id: p.proizvodId, naziv: p.naziv };
    this.ocena = p.ocena;
    this.komentar = p.komentar;
    this.uspehOcene = false;
  }

  postaviOcenu(ocena: 'svidja' | 'nesvidja') {
    this.ocena = ocena;
  }

  sacuvajOcenu() {
    if (!this.ocenjivan) return;
    this.uspehOcene = false;
    this.greska = null;
    if (!this.ocena && !this.komentar.trim()) {
      this.greska = 'Izaberite „Sviđa mi se“ / „Ne sviđa mi se“ ili unesite komentar.';
      return;
    }
    this.klijentServis.oceni(this.ocenjivan.id, this.ocena, this.komentar).subscribe({
      next: () => {
        this.uspehOcene = true;
        this.ucitaj();
      },
      error: (err) => (this.greska = err.error?.message ?? 'Ocena nije sačuvana. Pokušajte ponovo.'),
    });
  }

  zatvoriOcenu() {
    this.ocenjivan = null;
    this.uspehOcene = false;
  }
}
