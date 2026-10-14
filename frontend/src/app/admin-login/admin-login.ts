import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../services/user';
import { Sesion } from '../services/sesion';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLogin {
   korisnickoIme = '';
    lozinka = '';
    prikaziLozinku = false;
    greska: string | null = null;
    userService = inject(User);
    sesija = inject(Sesion);
    ruter = inject(Router);
    prijavaAdmin(forma: NgForm) { 
      this.greska=null;
      if (forma.invalid) { return; }
       this.userService.adminLogin(this.korisnickoIme, this.lozinka).subscribe({
        next: (user) => {
          console.log('Uspesna prijava', user);
          this.greska = null;
          this.sesija.sacuvaj(user);
          this.ruter.navigate(['/admin/zahtevi']);
        },
        error: (err) => {
          console.error('Greska prilikom prijave', err);
          this.greska = 'Neuspesna prijava. Proverite korisnicko ime i lozinku.';
        }
      });
     }
}
