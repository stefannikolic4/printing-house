import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StamparijaServis } from '../services/stamparija-servis';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
   proizvod: {
      naziv: string;
      stamparija: string;
      grad: string;
      brojLajkova: number;
      brojDislajkova: number;
      slike: string[];
    } | null = null;
    glavnaSlika = '';
    route = inject(ActivatedRoute);
    proizvodServis = inject(StamparijaServis);
    ngOnInit() {
      const id = this.route.snapshot.paramMap.get('id') ?? '';
      if (!id) { return; }

      this.proizvodServis.ucitajProizvod(id).subscribe({
        next: (proizvod) => {
          this.proizvod = proizvod;
          this.glavnaSlika = proizvod.slike[0];
        }
      });
      const zapamcenaSlika=localStorage.getItem(`proizvod-${id}-glavnaSlika`);
      if (zapamcenaSlika) {
        this.glavnaSlika = zapamcenaSlika;
      }
    }
    izaberiSliku(slika: string) { 
      this.glavnaSlika = slika;
      if (this.proizvod) {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        localStorage.setItem(`proizvod-${id}-glavnaSlika`, slika);
      }
     }
}
