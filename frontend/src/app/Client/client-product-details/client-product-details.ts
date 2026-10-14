import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { KlijentServis } from '../../services/klijent-servis';
import { ActivatedRoute, Router } from '@angular/router';
import { KlijentProizvod } from '../../models/klijent';
import * as L from 'leaflet';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
@Component({
  selector: 'app-client-product-details',
  imports: [DatePipe, FormsModule,DecimalPipe],
  templateUrl: './client-product-details.html',
  styleUrl: './client-product-details.css',
})
export class ClientProductDetails {
  private klijentServis = inject(KlijentServis);
  private route = inject(ActivatedRoute);
  private ruter = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  proizvod: KlijentProizvod | null = null;
  glavnaSlika = '';
  izabranaBoja = 'Bela';
  izabranaUsluga: string | null = null;
  komentari: { id: string; korisnickoIme: string; datum: Date; tekst: string; moj: boolean }[] = [];
  greska: string | null = null;

  private mapa?: L.Map;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;

    this.klijentServis.getProizvod(id).subscribe({
      next: (p) => {
        this.proizvod = p;
        this.komentari = p.komentari.map((k) => ({ ...k, datum: new Date(k.datum) }));
        this.izabranaBoja = p.boje[0] ?? 'Bela';

        const zapamcena = localStorage.getItem(`proizvod-${id}-glavnaSlika`);
        this.glavnaSlika = zapamcena && p.slike.includes(zapamcena) ? zapamcena : (p.slike[0] ?? '');

        this.cdr.detectChanges();
        this.prikaziMapu(p);
      },
      error: () => (this.proizvod = null),
    });
  }

  ngOnDestroy() {
    this.mapa?.remove();
  }

  izaberiSliku(slika: string) {
    this.glavnaSlika = slika;
    if (this.proizvod) localStorage.setItem(`proizvod-${this.proizvod.id}-glavnaSlika`, slika);
  }

  private prikaziMapu(p: KlijentProizvod) {
    const element = document.getElementById('mapa');
    if (!element) return;
    this.mapa?.remove();
    if (element.offsetHeight === 0) element.style.height = '320px';

    const mapa = L.map(element).setView([44.0, 21.0], 6);
    this.mapa = mapa;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(mapa);

    const postavi = (lat: number, lng: number) => {
      const popup = document.createElement('div');
      popup.textContent = [p.stamparija, p.adresa].filter(Boolean).join(', ');
      mapa.setView([lat, lng], 15);
      L.circleMarker([lat, lng], { radius: 10 }).addTo(mapa).bindPopup(popup).openPopup();
    };

    if (p.lat !== null && p.lng !== null) {
      postavi(p.lat, p.lng);
      return;
    }
    const upit = [p.adresa, p.grad, 'Srbija'].filter(Boolean).join(', ');
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(upit)}`)
      .then((odgovor) => odgovor.json())
      .then((rezultati: { lat: string; lon: string }[]) => {
        if (this.mapa === mapa && rezultati.length > 0) postavi(Number(rezultati[0].lat), Number(rezultati[0].lon));
      })
      .catch(() => {});
  }

  dalje() {
    this.greska = null;
    if (!this.proizvod) return;
    if (this.proizvod.usluge.length > 0 && !this.izabranaUsluga) {
      this.greska = 'Izaberite vrstu štampe.';
      return;
    }
    const queryParams: Record<string, string> = { boja: this.izabranaBoja };
    if (this.izabranaUsluga) queryParams['usluga'] = this.izabranaUsluga;
    this.ruter.navigate(['/klijent/proizvod', this.proizvod.id, 'priprema'], { queryParams });
  }

}
