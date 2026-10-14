import { Component, inject } from '@angular/core';
import { StamparijaServis } from '../../services/stamparija-servis';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-search',
  imports: [FormsModule,RouterLink],
  templateUrl: './client-search.html',
  styleUrl: './client-search.css',
})
export class ClientSearch {
  private stamparijaServis = inject(StamparijaServis);

  naziv = '';
  kategorija = '';
  kategorije: string[] = [];
  rezultati: { id: string; naziv: string; kategorija: string; stamparija: string }[] = [];
  sortSmer: 'rastuce' | 'opadajuce' | null = null;

  get ariaSort(): 'ascending' | 'descending' | 'none' {
    if (this.sortSmer === 'rastuce') return 'ascending';
    if (this.sortSmer === 'opadajuce') return 'descending';
    return 'none';
  }

  ngOnInit() {
    this.stamparijaServis.ucitajKategorije().subscribe({
      next: (kategorije) => (this.kategorije = kategorije),
      error: (err) => console.error('Greska pri ucitavanju kategorija', err),
    });
    this.pretrazi();
  }

  pretrazi() {
    this.stamparijaServis.pretraziProizvode(this.naziv, this.kategorija, this.sortSmer).subscribe({
      next: (odgovor) => (this.rezultati = odgovor.Proizvodi),
      error: (err) => {
        console.error('Greska pri pretrazi', err);
        this.rezultati = [];
      },
    });
  }

  promeniSortiranje() {
    this.sortSmer = this.sortSmer === 'rastuce' ? 'opadajuce' : 'rastuce';
    this.pretrazi();
  }

}
