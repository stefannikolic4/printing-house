import { Component, inject } from '@angular/core';
import { StamparijaServis } from '../../services/stamparija-servis';
import { StamparServis } from '../../services/stampar-servis';
import { FormsModule, NgForm } from '@angular/forms';
import { Proizvod } from '../../models/product';

@Component({
  selector: 'app-printer-add-product',
  imports: [FormsModule],
  templateUrl: './printer-add-product.html',
  styleUrl: './printer-add-product.css',
})
export class PrinterAddProduct {
   sifra = '';  naziv = '';  opis = '';
    kategorija = '';
    potkategorija = '';
    kategorije: string[] = [];
    potkategorije: string[] = [];
    cena: number | null = null;
    kolicina: number | null = null;
    boje = '';
    glavnaPreview: string | null = null;
    dodatnePreview: string[] = [];
    slikeGreska: string | null = null;
    usluge: { tip: string; dodatnaCena: number | null; maxSirina: number | null; maxVisina: number | null }[] = [];
    uspeh = false;
    greska: string | null = null;

    private mapaKategorija: { kategorija: string; potkategorije: string[] }[] = [];
    private glavnaSlikaFajl: File | null = null;
    private dodatneSlikeFajlovi: File[] = [];

    stamparijaServis = inject(StamparijaServis);
    stamparServis = inject(StamparServis);

    ngOnInit() {
      this.stamparijaServis.ucitajKategorijePotkategorije().subscribe({
        next: (mapa) => {
          this.mapaKategorija = mapa;
          this.kategorije = mapa.map(k => k.kategorija);
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja kategorija', err);
        }
      });
    }

    promeniKategoriju() {
      const izabrana = this.mapaKategorija.find(k => k.kategorija === this.kategorija);
      this.potkategorije = izabrana ? izabrana.potkategorije : [];
      this.potkategorija = '';
    }

    onGlavnaSlika(event: Event) {
      const input = event.target as HTMLInputElement;
      const fajl = input.files?.[0] ?? null;
      this.slikeGreska = null;
      if (this.glavnaPreview) { URL.revokeObjectURL(this.glavnaPreview); }
      this.glavnaPreview = null;
      this.glavnaSlikaFajl = null;
      if (!fajl) { return; }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(fajl.type)) {
        this.slikeGreska = 'Slika mora biti u JPG, PNG ili GIF formatu.';
        input.value = '';
        return;
      }
      this.glavnaSlikaFajl = fajl;
      this.glavnaPreview = URL.createObjectURL(fajl);
    }

    onDodatneSlike(event: Event) {
      const input = event.target as HTMLInputElement;
      const fajlovi = input.files ? Array.from(input.files) : [];
      this.slikeGreska = null;
      this.dodatnePreview.forEach(d => URL.revokeObjectURL(d));
      this.dodatnePreview = [];
      this.dodatneSlikeFajlovi = [];
      if (fajlovi.length > 3) {
        this.slikeGreska = 'Najviše 3 dodatne slike.';
        input.value = '';
        return;
      }
      for (const fajl of fajlovi) {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(fajl.type)) {
          this.slikeGreska = 'Slika mora biti u JPG, PNG ili GIF formatu.';
          input.value = '';
          return;
        }
      }
      this.dodatneSlikeFajlovi = fajlovi;
      this.dodatnePreview = fajlovi.map(f => URL.createObjectURL(f));
    }

    dodajUslugu() {
      this.usluge.push({ tip: '', dodatnaCena: null, maxSirina: null, maxVisina: null });
    }

    ukloniUslugu(indeks: number) {
      this.usluge.splice(indeks, 1);
    }

    dodaj(forma: NgForm) {
      this.uspeh = false;
      this.greska = null;
      if (forma.invalid) {
        forma.form.markAllAsTouched();
        return;
      }
      const korisnickoIme = localStorage.getItem('korisnickoIme') ?? '';
      const proizvod: Proizvod = {
        sifra: this.sifra,
        naziv: this.naziv,
        opis: this.opis,
        kategorija: this.kategorija,
        potkategorija: this.potkategorija,
        jedinicnaCena: this.cena ?? 0,
        kolicinaNaLageru: this.kolicina ?? 0,
        dostupneBoje: this.boje ? this.boje.split(',').map(b => b.trim()).filter(b => b) : [],
        slikaUrl: '',
        dodatneSlike: [],
        uslugeStampe: this.usluge.map(u => ({
          idUsluge: '',
          tipStampe: u.tip,
          dodatnaCenaPoKomadu: u.dodatnaCena ?? 0,
          maxSirinaMm: u.maxSirina ?? 0,
          maxVisinaMm: u.maxVisina ?? 0,
        })),
      };
      this.stamparServis.dodajProizvod(korisnickoIme, proizvod, this.glavnaSlikaFajl, this.dodatneSlikeFajlovi).subscribe({
        next: () => {
          this.uspeh = true;
          forma.resetForm();
          this.potkategorije = [];
          this.usluge = [];
          if (this.glavnaPreview) { URL.revokeObjectURL(this.glavnaPreview); }
          this.dodatnePreview.forEach(d => URL.revokeObjectURL(d));
          this.glavnaPreview = null;
          this.dodatnePreview = [];
          this.glavnaSlikaFajl = null;
          this.dodatneSlikeFajlovi = [];
        },
        error: (err) => {
          console.error('Greska prilikom dodavanja proizvoda', err);
          this.greska = 'Dodavanje proizvoda nije uspelo. Proverite podatke i pokušajte ponovo.';
        }
      });
    }
}
