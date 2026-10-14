import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Sesion } from '../../services/sesion';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
    ruter = inject(Router);
    sesija = inject(Sesion);
    odjava() {
      this.sesija.odjava();
      this.ruter.navigate(['/']);
    }
}
