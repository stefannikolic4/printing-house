import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { User } from '../services/user';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
    novaLozinka = '';
    potvrdaLozinke = '';
    tokenIstekao = false;
    uspeh = false;
    greska: string | null = null;
    route = inject(ActivatedRoute);
    userService = inject(User);
    private token = this.route.snapshot.paramMap.get('token') ?? '';
    postavi(forma: NgForm) { 
      this.greska = null;
      this.uspeh = false;
      if (forma.invalid) {return;}
      if (this.novaLozinka !== this.potvrdaLozinke) {
        this.greska = 'Lozinke se ne poklapaju. Molimo unesite istu lozinku u oba polja.';
        return;
      }
      this.userService.resetPassword(this.token, this.novaLozinka).subscribe({
        next: (response) => {
          console.log('Uspesno resetovana lozinka', response);
          this.uspeh = true;
        },
        error: (err) => {
          console.error('Greska prilikom resetovanja lozinke', err);
          if (err.status === 400 && err.error.message === 'Token je istekao') {
            this.tokenIstekao = true;
            this.greska = 'Link za reset lozinke je istekao. Molimo zatražite novi link.';
          } else {
            this.greska = 'Došlo je do greške. Pokušajte ponovo.';
          }
        }
      });
     }       
 
}
