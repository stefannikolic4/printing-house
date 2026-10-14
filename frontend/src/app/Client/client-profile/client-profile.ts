import { Component, inject } from '@angular/core';
import { KlijentServis } from '../../services/klijent-servis';
import { Sesion } from '../../services/sesion';
import { IzmenaProfila, Narudzbina } from '../../models/klijent';
import { UserType } from '../../models/user';
import { FormsModule, NgForm } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
const REDOSLED_STATUSA = ['naručeno', 'plaćeno', 'u štampi', 'isporučeno', 'primljeno'];
@Component({
  selector: 'app-client-profile',
  imports: [FormsModule,DecimalPipe],
  templateUrl: './client-profile.html',
  styleUrl: './client-profile.css',
})
export class ClientProfile {
  private klijentServis = inject(KlijentServis);
  private sesija = inject(Sesion);

  korisnickoIme = '';
  ime = '';
  prezime = '';
  telefon = '';
  email = '';
  jePravnoLice = false;
  nazivInstitucije = '';
  adresaSedista = '';
  maticniBroj = '';
  pib = '';
  profilnaSlika = '';
  slikaPreview: string | null = null;
  slikaGreska: string | null = null;
  uspeh = false;
  greska: string | null = null;
  private slikaFajl: File | null = null;

  narudzbine: Narudzbina[] = [];
  greskaNarudzbine: string | null = null;
  private sortKolona: string | null = null;
  private sortSmer: 'rastuce' | 'opadajuce' = 'rastuce';

  ngOnInit() {
    this.klijentServis.getProfil().subscribe({
      next: (korisnik) => this.popuni(korisnik),
      error: (err) => (this.greska = err.error?.message ?? 'Podatke nije moguće učitati.'),
    });
    this.ucitajNarudzbine();
  }

  ngOnDestroy() {
    if (this.slikaPreview) URL.revokeObjectURL(this.slikaPreview);
  }

  private popuni(k: UserType) {
    this.korisnickoIme = k.korisnickoIme;
    this.ime = k.ime;
    this.prezime = k.prezime;
    this.telefon = k.telefon;
    this.email = k.email;
    this.jePravnoLice = k.tip === 'pravno';
    this.nazivInstitucije = k.nazivInstitucije;
    this.adresaSedista = k.adresaSedista;
    this.maticniBroj = k.maticniBroj;
    this.pib = k.pib;
    this.profilnaSlika = this.klijentServis.slikaUrl(k.fajl);
  }

  onSlikaOdabrana(event: Event) {
    this.slikaGreska = null;
    const input = event.target as HTMLInputElement;
    const fajl = input.files?.[0];
    if (!fajl) {
      this.ponistiSliku();
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(fajl.type)) {
      this.slikaGreska = 'Slika mora biti u JPG, PNG ili GIF formatu.';
      this.ponistiSliku();
      return;
    }
    if (fajl.size > 1024 * 1024) {
      this.slikaGreska = 'Slika je prevelika (najviše 1 MB).';
      this.ponistiSliku();
      return;
    }

    const url = URL.createObjectURL(fajl);
    const img = new Image();
    img.onload = () => {
      const sirina = img.naturalWidth;
      const visina = img.naturalHeight;
      if (sirina < 100 || visina < 100 || sirina > 250 || visina > 250) {
        URL.revokeObjectURL(url);
        this.slikaGreska = `Slika mora biti između 100x100 i 250x250 piksela (izabrana slika: ${sirina}x${visina}).`;
        this.ponistiSliku();
        return;
      }
      if (this.slikaPreview) URL.revokeObjectURL(this.slikaPreview);
      this.slikaPreview = url;
      this.slikaFajl = fajl;
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      this.slikaGreska = 'Fajl nije moguće očitati kao sliku.';
      this.ponistiSliku();
    };
    img.src = url;
  }

  private ponistiSliku() {
    if (this.slikaPreview) URL.revokeObjectURL(this.slikaPreview);
    this.slikaPreview = null;
    this.slikaFajl = null;
    const polje = document.getElementById('slika') as HTMLInputElement | null;
    if (polje) polje.value = '';
  }

  sacuvaj(forma: NgForm) {
    this.uspeh = false;
    this.greska = null;
    if (forma.invalid || this.slikaGreska) {
      forma.form.markAllAsTouched();
      return;
    }

    const podaci: IzmenaProfila = { ime: this.ime, prezime: this.prezime, telefon: this.telefon, email: this.email };
    if (this.jePravnoLice) {
      podaci.nazivInstitucije = this.nazivInstitucije;
      podaci.adresaSedista = this.adresaSedista;
      podaci.maticniBroj = this.maticniBroj;
      podaci.pib = this.pib;
    }

    this.klijentServis.izmeniProfil(podaci, this.slikaFajl).subscribe({
      next: (korisnik) => {
        this.popuni(korisnik);
        this.sesija.osvezi(korisnik);
        this.ponistiSliku();
        this.uspeh = true;
      },
      error: (err) => (this.greska = err.error?.message ?? 'Čuvanje nije uspelo. Pokušajte ponovo.'),
    });
  }

  private ucitajNarudzbine() {
    this.klijentServis.getNarudzbine().subscribe({
      next: (lista) => {
        this.narudzbine = lista;
        this.sortKolona = null;
      },
      error: (err) => (this.greskaNarudzbine = err.error?.message ?? 'Narudžbine nije moguće učitati.'),
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
    const smer = this.sortSmer === 'rastuce' ? 1 : -1;
    this.narudzbine = [...this.narudzbine].sort((a, b) => smer * this.uporedi(a, b, kolona));
  }

  private uporedi(a: Narudzbina, b: Narudzbina, kolona: string): number {
    switch (kolona) {
      case 'id':
        return a.id - b.id;
      case 'ukupno':
        return a.ukupno - b.ukupno;
      case 'status':
        return REDOSLED_STATUSA.indexOf(a.status) - REDOSLED_STATUSA.indexOf(b.status);
      case 'stamparija':
        return a.stamparija.localeCompare(b.stamparija, 'sr-Latn');
      case 'grad':
        return a.grad.localeCompare(b.grad, 'sr-Latn');
      default:
        return 0;
    }
  }

  otkazi(n: Narudzbina) {
    if (!confirm(`Da li ste sigurni da želite da otkažete narudžbinu ${n.id}?`)) return;
    this.greskaNarudzbine = null;
    this.klijentServis.otkaziNarudzbinu(n.id).subscribe({
      next: () => (this.narudzbine = this.narudzbine.filter((x) => x.id !== n.id)),
      error: (err) => {
        this.greskaNarudzbine = err.error?.message ?? 'Otkazivanje nije uspelo.';
        this.ucitajNarudzbine();
      },
    });
  }
}
