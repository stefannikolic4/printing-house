import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User } from '../services/user';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
   identifikator = '';
    greska: string | null = null;
    resetLink: string | null = null;
    userService = inject(User);
    posalji(forma: NgForm) {
      if (forma.invalid) {return;}
      this.greska=null;
      this.userService.forgotPassword(this.identifikator).subscribe({
        next: (response) => {
          console.log('Uspesno poslat link za reset lozinke', response);
          this.resetLink = response.message; 
        },
        error: (err) => {
          console.error('Greska prilikom slanja linka', err);
          this.greska = 'Došlo je do greške. Pokušajte ponovo.';
        }
      });
     }
}
