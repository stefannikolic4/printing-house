import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserType } from '../models/user';
import { User } from '../services/user';

@Component({
  selector: 'app-register',
  imports: [FormsModule,RouterLink ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
    tip: 'fizicko' | 'pravno' | 'stamparija' = 'fizicko';
    korisnickoIme = '';  lozinka = '';  potvrdaLozinke = '';
    ime = '';  prezime = '';  telefon = '';  email = '';
    nazivInstitucije = '';  adresaSedista = '';  maticniBroj = '';  pib = '';
    slikaPreview: string | null = null;
    slikaGreska: string | null = null;
    greska: string | null = null;
    uspeh = false;
    userService = inject(User);
    ngOnDestroy() {
    if (this.slikaPreview) {
    URL.revokeObjectURL(this.slikaPreview);
   }
  }
    slikaFajl: File | null = null;
    onSlikaOdabrana(event: Event) {
      const input = event.target as HTMLInputElement;
      let fajl;
      if (input.files != null && input.files[0] != null) {
        fajl = input.files[0];
      } else {
          fajl = null;
      }
    this.slikaGreska=null;
    if (this.slikaPreview) {
    URL.revokeObjectURL(this.slikaPreview);
    }
    this.slikaPreview=null;
    if (!fajl) {
      this.slikaGreska = "Niste odabrali sliku.";
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
      let width = 0;
      let height = 0;
      img.onload = () => {
      URL.revokeObjectURL(url);
      width = img.naturalWidth;
      height = img.naturalHeight;
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
    registruj(forma: NgForm) {
      this.greska=null;
      if (forma.invalid ) {
        forma.form.markAllAsTouched();
      return;
    }
    this.uspeh=false;
    if (this.lozinka !== this.potvrdaLozinke) {
      this.greska = 'Lozinka i potvrda lozinke se ne poklapaju.';
      return;
    }
   
   
    let userType: UserType = {
      tip: this.tip,
      korisnickoIme: this.korisnickoIme,
      lozinka: this.lozinka,
      ime: this.ime,
      prezime: this.prezime,
      telefon: this.telefon,
      email: this.email,
      nazivInstitucije: this.nazivInstitucije,
      adresaSedista: this.adresaSedista,
      maticniBroj: this.maticniBroj,
      pib: this.pib,
      fajl: 'default_profile_image.svg'
    };
   
    try {
      this.userService.register(userType, this.slikaFajl).subscribe({
        next: (response) => {
          console.log('Uspesna registracija', response);
          this.uspeh = true;
        },
        error: (err) => {
          console.error('Greska prilikom registracije', err);
          this.greska = 'Registracija nije uspela. Proverite podatke i pokušajte ponovo.';
        }
      });
    } catch (err: unknown) {
      this.greska='Registracija nije uspela. Pokušajte ponovo.';
    } 
     } 
}
