import { Component, inject } from '@angular/core';
import { KlijentServis } from '../../services/klijent-servis';
import { Sesion } from '../../services/sesion';
import { KorpaGrupa } from '../../models/klijent';
import { FormsModule, NgForm } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-client-cart',
  imports: [FormsModule,DecimalPipe],
  templateUrl: './client-cart.html',
  styleUrl: './client-cart.css',
})
export class ClientCart {
private klijentServis = inject(KlijentServis);
  private sesija = inject(Sesion);

  grupe: KorpaGrupa[] = [];
  ukupno = 0;
  jePravnoLice = this.sesija.jePravnoLice();
  uspeh: string | null = null;
  greska: string | null = null;

  placanjeOtvoreno = false;
  tipKartice = '';
  brojKartice = '';
  cvc = '';
  istek = '';
  placanjeGreska: string | null = null;

  private fakture: number[] = [];
  private zauzeto = false;

  ngOnInit() {
    this.ucitaj();
  }

  private ucitaj() {
    this.klijentServis.getKorpa().subscribe({
      next: (korpa) => {
        this.grupe = korpa.grupe;
        this.ukupno = korpa.ukupno;
      },
      error: (err) => (this.greska = err.error?.message ?? 'Korpu nije moguće učitati.'),
    });
  }

  private isprazniPrikaz() {
    this.grupe = [];
    this.ukupno = 0;
  }

  private ocistiKarticu() {
    this.tipKartice = '';
    this.brojKartice = '';
    this.cvc = '';
    this.istek = '';
    this.placanjeGreska = null;
  }

  potvrdi() {
    if (this.zauzeto || this.placanjeOtvoreno) return;
    this.uspeh = null;
    this.greska = null;
    this.zauzeto = true;

    this.klijentServis.potvrdiKorpu().subscribe({
      next: (odgovor) => {
        this.zauzeto = false;
        this.uspeh = odgovor.message;
        if (this.jePravnoLice) {
          this.isprazniPrikaz();
          return;
        }
        this.fakture = odgovor.fakture.map((f) => f.id);
        this.ocistiKarticu();
        this.placanjeOtvoreno = true;
      },
      error: (err) => {
        this.zauzeto = false;
        this.greska = err.error?.message ?? 'Potvrda narudžbine nije uspela. Pokušajte ponovo.';
        this.ucitaj();
      },
    });
  }

  plati(forma: NgForm) {
    this.placanjeGreska = null;
    if (forma.invalid) {
      forma.form.markAllAsTouched();
      return;
    }
    if (this.zauzeto) return;
    this.zauzeto = true;

    this.klijentServis
      .plati(this.fakture, { tip: this.tipKartice, broj: this.brojKartice, cvc: this.cvc, istek: this.istek })
      .subscribe({
        next: (odgovor) => {
          this.zauzeto = false;
          this.placanjeOtvoreno = false;
          this.uspeh = odgovor.message;
          this.fakture = [];
          this.ocistiKarticu();
          this.isprazniPrikaz();
        },
        error: (err) => {
          this.zauzeto = false;
          this.placanjeGreska = err.error?.message ?? 'Plaćanje nije uspelo. Pokušajte ponovo.';
        },
      });
  }

  zatvoriPlacanje() {
    this.placanjeOtvoreno = false;
    this.ocistiKarticu();
    this.fakture = [];
    this.isprazniPrikaz();
    this.uspeh = 'Plaćanje je otkazano. Narudžbine su u statusu „naručeno“ i možete ih pogledati ili otkazati u profilu.';
  }
}
