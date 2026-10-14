import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../services/user';
import { Sesion } from '../services/sesion';
import { StamparijaServis } from '../services/stamparija-servis';

@Component({
  selector: 'app-home',
  imports: [FormsModule,RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
    userService = inject(User);
    sesija = inject(Sesion);
    stamparijaServis = inject(StamparijaServis);
    ruter = inject(Router);
     brojStamparija = 0;
    top5: { id: string; naziv: string; stamparija: string; brojLajkova: number }[] = [];
    ngOnInit() {
      this.stamparijaServis.getBrojStamparije().subscribe({
        next: (broj) => {
          this.brojStamparija = broj;
        }
      });
      this.stamparijaServis.getTop5Proizvoda().subscribe({
        next: (response) => {
          this.top5 = response.Proizvodi.map(p => ({
            id: p.id,
            naziv: p.naziv,
            stamparija: p.stamparija,
            brojLajkova: p.brojLajkova
          }));
        }
      });
      this.stamparijaServis.ucitajKategorije().subscribe({
        next: (kategorije) => {
          this.kategorije = kategorije;
        }
      });
    }
    naziv = '';
    kategorija = '';
    kategorije: string[] = [];
    rezultati: { id: string; naziv: string; kategorija: string; stamparija: string }[] = [];
    sortSmer: 'rastuce' | 'opadajuce' | null = null;
    get ariaSort(): 'ascending' | 'descending' | 'none' { 
      return this.sortSmer === 'rastuce' ? 'ascending' : this.sortSmer === 'opadajuce' ? 'descending' : 'none'; }
    pretrazi() { 
      this.stamparijaServis.pretraziProizvode(this.naziv, this.kategorija, this.sortSmer).subscribe({
        next: (response) => {
          this.rezultati = response.Proizvodi.map(p => ({
            id: p.id,
            naziv: p.naziv,
            kategorija: p.kategorija,
            stamparija: p.stamparija
          }));
        }
      });
    }
    promeniSortiranje() { 
      if(this.sortSmer === null) this.sortSmer = 'rastuce';
        this.sortSmer=this.sortSmer === 'rastuce' ? 'opadajuce' : 'rastuce';
        this.pretrazi();
     }        
 
    korisnickoIme = '';
    lozinka = '';
    greska: string | null = null;
    prijava(forma: NgForm) { 
       this.greska=null;
      if (forma.invalid) { return; }
      this.userService.login(this.korisnickoIme, this.lozinka).subscribe({
        next: (user) => {
          console.log('Uspesna prijava', user);
          this.greska = null;
          this.sesija.sacuvaj(user);
          if (user.tip === 'stamparija') this.ruter.navigate(['/stampar/profil']);
          else this.ruter.navigate(['/klijent/profil']);
        },
        error: (err) => {
          console.error('Greska prilikom prijave', err);
          this.greska = 'Neuspesna prijava. Proverite korisnicko ime i lozinku.';
        }
     });
    }
}
