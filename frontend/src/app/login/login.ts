import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../services/user';
import { Sesion } from '../services/sesion';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule,RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
    korisnickoIme = '';
    lozinka = '';
    greska: string | null = null;
    userService = inject(User);
    sesija = inject(Sesion);
    ruter = inject(Router);
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
