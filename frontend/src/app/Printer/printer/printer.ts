import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Sesion } from '../../services/sesion';

@Component({
  selector: 'app-printer',
  imports: [RouterLink,RouterLinkActive,RouterOutlet],
  templateUrl: './printer.html',
  styleUrl: './printer.css',
})
export class Printer {
   ruter = inject(Router);
   sesija = inject(Sesion);
    odjava() {
      this.sesija.odjava();
      this.ruter.navigate(['/prijava']);
    }
}
