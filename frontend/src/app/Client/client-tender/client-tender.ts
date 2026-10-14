import { Component, inject } from '@angular/core';
import { KlijentServis } from '../../services/klijent-servis';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-client-tender',
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './client-tender.html',
  styleUrl: './client-tender.css',
})
export class ClientTender {
   private klijentServis = inject(KlijentServis);

  nabavke: {
    id: string;
    pokrenuta: Date;
    istice: Date;
    stavke: { naziv: string; kolicina: number }[];
    status: 'otvorena' | 'zavrsena' | 'bez-ponude';
    preostalo: string | null;
    pobednik: string | null;
    iznos: number | null;
  }[] = [];

  private tajmer?: ReturnType<typeof setInterval>;
  private ponovoUcitavam = false;
  greska: string | null = null;
  uspeh: string | null = null;

  preuzmiIzvestaj(nabavka: { id: string; status: string }) {
    this.greska = null;
    this.uspeh = null;
    this.klijentServis.preuzmiIzvestaj(nabavka.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `izvestaj-nabavka-${nabavka.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.uspeh = 'Izveštaj je preuzet.';
      },
      error: (err) => {
        console.error('Greska prilikom preuzimanja izvestaja', err);
        this.greska =
          err.status === 409
            ? 'Izveštaj je dostupan tek nakon završetka nabavke.'
            : 'Izveštaj nije moguće preuzeti. Pokušajte ponovo.';
      },
    });
  }

  ngOnInit() {
    this.ucitaj();
    this.tajmer = setInterval(() => this.osveziPreostalo(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.tajmer);
  }

  private ucitaj() {
    this.klijentServis.getNabavke().subscribe({
      next: (lista) => {
        this.nabavke = lista.map((n) => ({
          id: n.id,
          pokrenuta: new Date(n.pokrenuta),
          istice: new Date(n.istice),
          stavke: n.stavke,
          status: n.status,
          preostalo: null,
          pobednik: n.pobednik,
          iznos: n.iznos,
        }));
        this.ponovoUcitavam = false;
        this.osveziPreostalo();
      },
      error: (err) => {
        console.error('Greska pri ucitavanju nabavki', err);
        this.ponovoUcitavam = false;
      },
    });
  }

  private osveziPreostalo() {
    let isteklaOtvorena = false;
    for (const n of this.nabavke) {
      if (n.status !== 'otvorena') {
        n.preostalo = null;
        continue;
      }
      const ms = n.istice.getTime() - Date.now();
      if (ms <= 0) {
        n.preostalo = '00:00';
        isteklaOtvorena = true;
      } else {
        const sekunde = Math.ceil(ms / 1000);
        n.preostalo = `${String(Math.floor(sekunde / 60)).padStart(2, '0')}:${String(sekunde % 60).padStart(2, '0')}`;
      }
    }
    if (isteklaOtvorena && !this.ponovoUcitavam) {
      this.ponovoUcitavam = true;
      setTimeout(() => this.ucitaj(), 2000);
    }
  }

}
