import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {  Sesion } from '../../services/sesion';

@Component({
  selector: 'app-client',
  imports: [RouterLink, RouterLinkActive,RouterOutlet],
  templateUrl: './client.html',
  styleUrl: './client.css',
})
export class Client {
     private sesija = inject(Sesion);
  private ruter = inject(Router);

  jePravnoLice = this.sesija.jePravnoLice();

  odjava() {
    this.sesija.odjava();
    this.ruter.navigate(['/']);
  }

}
