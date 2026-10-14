import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AdminServis } from '../../services/admin-servis';

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
})
export class AdminCategories {
    kategorije: {
      id: string;
      naziv: string;
      potkategorije: string[];
      novaPotkategorija: string;
    }[] = [];
    novaKategorija = '';
    uspeh: string | null = null;
    greska: string | null = null;

    adminServis = inject(AdminServis);

    ngOnInit() {
      this.adminServis.ucitajKategorije().subscribe({
        next: (odgovor) => {
          this.kategorije = odgovor.map(k => ({
            id: k.id,
            naziv: k.naziv,
            potkategorije: k.potkategorije,
            novaPotkategorija: '',
          }));
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja kategorija', err);
          this.greska = 'Kategorije nije moguće učitati.';
        }
      });
    }

    dodajKategoriju(forma: NgForm) {
      this.uspeh = null;
      this.greska = null;
      if (forma.invalid) {
        forma.form.markAllAsTouched();
        return;
      }
      const naziv = this.novaKategorija.trim();
      if (this.kategorije.some(k => k.naziv.toLowerCase() === naziv.toLowerCase())) {
        this.greska = 'Kategorija sa tim nazivom već postoji.';
        return;
      }
      this.adminServis.dodajKategoriju(naziv).subscribe({
        next: (nova) => {
          this.kategorije.push({
            id: nova.id,
            naziv: nova.naziv,
            potkategorije: nova.potkategorije,
            novaPotkategorija: '',
          });
          forma.resetForm();
          this.uspeh = `Kategorija „${naziv}" je dodata.`;
        },
        error: (err) => {
          console.error('Greska prilikom dodavanja kategorije', err);
          this.greska = 'Dodavanje kategorije nije uspelo. Možda već postoji.';
        }
      });
    }

    dodajPotkategoriju(kategorija: { id: string; potkategorije: string[]; novaPotkategorija: string }, forma: NgForm) {
      this.uspeh = null;
      this.greska = null;
      if (forma.invalid) {
        forma.form.markAllAsTouched();
        return;
      }
      const naziv = kategorija.novaPotkategorija.trim();
      if (kategorija.potkategorije.some(p => p.toLowerCase() === naziv.toLowerCase())) {
        this.greska = 'Potkategorija sa tim nazivom već postoji.';
        return;
      }
      this.adminServis.dodajPotkategoriju(kategorija.id, naziv).subscribe({
        next: () => {
          kategorija.potkategorije.push(naziv);
          forma.resetForm();
          this.uspeh = `Potkategorija „${naziv}" je dodata.`;
        },
        error: (err) => {
          console.error('Greska prilikom dodavanja potkategorije', err);
          this.greska = 'Dodavanje potkategorije nije uspelo. Možda već postoji.';
        }
      });
    }
}
