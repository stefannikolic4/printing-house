import { Component, inject } from '@angular/core';
import { Proizvod, Stamparija } from '../../models/product';
import { StamparServis } from '../../services/stampar-servis';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-printer-import',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './printer-import.html',
  styleUrl: './printer-import.css',
})
export class PrinterImport {
  korak: 1 | 2 = 1;
    greskaFajla: string | null = null;
    nazivStamparije = '';
    proizvodi: {
      sifra: string;  naziv: string;  kategorija: string;  potkategorija: string;
      cena: number;  kolicina: number;
      glavnaPreview: string | null;
      dodatnePreview: string[];
      greska: string | null;
    }[] = [];
    uspeh = false;
    greska: string | null = null;

    private sirovi: Proizvod[] = [];
    private glavneSlikeFajl: (File | null)[] = [];
    private dodatneSlikeFajl: File[][] = [];

    stamparServis = inject(StamparServis);

    onFajlOdabran(event: Event) {
      const input = event.target as HTMLInputElement;
      const fajl = input.files?.[0] ?? null;
      this.greskaFajla = null;
      if (!fajl) { return; }
      if (fajl.type && fajl.type !== 'application/json' && !fajl.name.toLowerCase().endsWith('.json')) {
        this.greskaFajla = 'Fajl mora biti u JSON formatu.';
        input.value = '';
        return;
      }

      const citac = new FileReader();
      citac.onload = () => {
        try {
          const sadrzaj = JSON.parse(String(citac.result)) as Stamparija;
          if (!sadrzaj.proizvodi || sadrzaj.proizvodi.length === 0) {
            this.greskaFajla = 'Fajl ne sadrži nijedan proizvod.';
            return;
          }
          this.nazivStamparije = sadrzaj.nazivStamparije;
          this.sirovi = sadrzaj.proizvodi;
          this.proizvodi = sadrzaj.proizvodi.map(p => ({
            sifra: p.sifra,
            naziv: p.naziv,
            kategorija: p.kategorija,
            potkategorija: p.potkategorija,
            cena: p.jedinicnaCena,
            kolicina: p.kolicinaNaLageru,
            glavnaPreview: null,
            dodatnePreview: [],
            greska: null,
          }));
          this.glavneSlikeFajl = this.sirovi.map(() => null);
          this.dodatneSlikeFajl = this.sirovi.map(() => []);
          this.korak = 2;
        } catch {
          this.greskaFajla = 'Fajl nije moguće očitati kao ispravan JSON.';
        }
      };
      citac.onerror = () => {
        this.greskaFajla = 'Fajl nije moguće pročitati.';
      };
      citac.readAsText(fajl);
    }

    private indeksProizvoda(sifra: string): number {
      return this.proizvodi.findIndex(p => p.sifra === sifra);
    }

    onGlavnaSlika(event: Event, proizvod: { sifra: string }) {
      const input = event.target as HTMLInputElement;
      const fajl = input.files?.[0] ?? null;
      const i = this.indeksProizvoda(proizvod.sifra);
      if (i === -1) { return; }
      this.proizvodi[i].greska = null;
      if (!fajl) { return; }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(fajl.type)) {
        this.proizvodi[i].greska = 'Slika mora biti u JPG, PNG ili GIF formatu.';
        input.value = '';
        return;
      }
      this.glavneSlikeFajl[i] = fajl;
      this.proizvodi[i].glavnaPreview = URL.createObjectURL(fajl);
    }

    onDodatneSlike(event: Event, proizvod: { sifra: string }) {
      const input = event.target as HTMLInputElement;
      const fajlovi = input.files ? Array.from(input.files) : [];
      const i = this.indeksProizvoda(proizvod.sifra);
      if (i === -1) { return; }
      this.proizvodi[i].greska = null;
      if (fajlovi.length > 3) {
        this.proizvodi[i].greska = 'Najviše 3 dodatne slike.';
        input.value = '';
        return;
      }
      for (const fajl of fajlovi) {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(fajl.type)) {
          this.proizvodi[i].greska = 'Slika mora biti u JPG, PNG ili GIF formatu.';
          input.value = '';
          return;
        }
      }
      this.dodatneSlikeFajl[i] = fajlovi;
      this.proizvodi[i].dodatnePreview = fajlovi.map(f => URL.createObjectURL(f));
    }

    nazad() {
      this.korak = 1;
    }

    sacuvaj() {
      this.uspeh = false;
      this.greska = null;
      const korisnickoIme = localStorage.getItem('korisnickoIme') ?? '';
      this.stamparServis.uvezi(korisnickoIme, this.sirovi, this.glavneSlikeFajl, this.dodatneSlikeFajl).subscribe({
        next: () => {
          this.uspeh = true;
          this.korak = 1;
          this.proizvodi = [];
          this.sirovi = [];
          this.glavneSlikeFajl = [];
          this.dodatneSlikeFajl = [];
        },
        error: (err) => {
          console.error('Greska prilikom uvoza proizvoda', err);
          this.greska = 'Uvoz proizvoda nije uspeo. Pokušajte ponovo.';
        }
      });
    }
}
