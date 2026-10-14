import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../../services/user';
import { UserType } from '../../models/user';

@Component({
  selector: 'app-printer-profile',
  imports: [FormsModule],
  templateUrl: './printer-profile.html',
  styleUrl: './printer-profile.css',
})
export class PrinterProfile {
    korisnickoIme = '';
    ime = '';  prezime = '';  telefon = '';  email = '';
    nazivInstitucije = '';  adresaSedista = '';  maticniBroj = '';  pib = '';
    profilnaSlika = '';
    slikaPreview: string | null = null;
    slikaGreska: string | null = null;
    uspeh = false;
    greska: string | null = null;

    private slikaFajl: File | null = null;
    userService = inject(User);

    ngOnInit() {
      this.korisnickoIme = localStorage.getItem('korisnickoIme') ?? '';
      if (!this.korisnickoIme) { return; }
      this.userService.getProfil(this.korisnickoIme).subscribe({
        next: (podaci) => {
          this.ime = podaci.ime;
          this.prezime = podaci.prezime;
          this.telefon = podaci.telefon;
          this.email = podaci.email;
          this.nazivInstitucije = podaci.nazivInstitucije;
          this.adresaSedista = podaci.adresaSedista;
          this.maticniBroj = podaci.maticniBroj;
          this.pib = podaci.pib;
          this.profilnaSlika = podaci.fajl;
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja profila', err);
          this.greska = 'Podatke o profilu nije moguće učitati.';
        }
      });
    }

    ngOnDestroy() {
      if (this.slikaPreview) {
        URL.revokeObjectURL(this.slikaPreview);
      }
    }

    onSlikaOdabrana(event: Event) {
      const input = event.target as HTMLInputElement;
      let fajl;
      if (input.files != null && input.files[0] != null) {
        fajl = input.files[0];
      } else {
        fajl = null;
      }
      this.slikaGreska = null;
      if (this.slikaPreview) {
        URL.revokeObjectURL(this.slikaPreview);
      }
      this.slikaPreview = null;
      if (!fajl) {
        this.slikaGreska = 'Niste odabrali sliku.';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(fajl.type)) {
        this.slikaGreska = 'Slika mora biti u JPG, PNG ili GIF formatu.';
        input.value = '';
        return;
      }
      try {
        const url = URL.createObjectURL(fajl);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          if (width < 100 || height < 100 || width > 250 || height > 250) {
            this.slikaGreska = `Slika mora biti između 100x100 i 250x250 piksela (poslata slika: ${width}x${height}).`;
            input.value = '';
            return;
          }
          this.slikaPreview = URL.createObjectURL(fajl);
          this.slikaFajl = fajl;
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          this.slikaGreska = 'Fajl nije moguće očitati kao sliku.';
        };
        img.src = url;
      } catch {
        this.slikaGreska = 'Fajl nije moguće očitati kao sliku.';
        input.value = '';
      }
    }

    sacuvaj(forma: NgForm) {
      this.uspeh = false;
      this.greska = null;
      if (forma.invalid) {
        forma.form.markAllAsTouched();
        return;
      }
      const podaci: UserType = {
        korisnickoIme: this.korisnickoIme,
        lozinka: '',
        ime: this.ime,
        prezime: this.prezime,
        telefon: this.telefon,
        email: this.email,
        nazivInstitucije: this.nazivInstitucije,
        adresaSedista: this.adresaSedista,
        maticniBroj: this.maticniBroj,
        pib: this.pib,
        tip: 'stamparija',
        fajl: this.profilnaSlika,
      };
      this.userService.azurirajProfil(podaci, this.slikaFajl).subscribe({
        next: (odgovor) => {
          this.uspeh = true;
          this.profilnaSlika = odgovor.fajl;
          if (this.slikaPreview) { URL.revokeObjectURL(this.slikaPreview); }
          this.slikaPreview = null;
          this.slikaFajl = null;
        },
        error: (err) => {
          console.error('Greska prilikom cuvanja profila', err);
          this.greska = 'Čuvanje izmena nije uspelo. Pokušajte ponovo.';
        }
      });
    }
}
