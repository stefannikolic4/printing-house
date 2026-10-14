import { Component, inject } from '@angular/core';
import { KlijentServis } from '../../services/klijent-servis';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-client-product-prepare',
  imports: [FormsModule],
  templateUrl: './client-product-prepare.html',
  styleUrl: './client-product-prepare.css',
})
export class ClientProductPrepare {
  private klijentServis = inject(KlijentServis);
  private route = inject(ActivatedRoute);
  private ruter = inject(Router);

  proizvod: { id: string; naziv: string; slika: string; naStanju: number } | null = null;
  izabranaBoja = '';
  izabranaUsluga = '';
  tekst = '';
  slicicaPreview: string | null = null;
  slicicaGreska: string | null = null;
  kolicina = 1;
  upozorenje: string | null = null;
  greska: string | null = null;
  dodato = false;

  private uslugaId = '';
  private slicicaFajl: File | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const boja = this.route.snapshot.queryParamMap.get('boja');
    const usluga = this.route.snapshot.queryParamMap.get('usluga') ?? '';
    if (!id) return;

    this.klijentServis.getProizvod(id).subscribe({
      next: (p) => {
        const izabrana = p.usluge.find((u) => u.id === usluga);
        if (p.usluge.length > 0 && !izabrana) {
          this.ruter.navigate(['/klijent/proizvod', id]);
          return;
        }
        const zapamcena = localStorage.getItem(`proizvod-${id}-glavnaSlika`);
        this.proizvod = {
          id: p.id,
          naziv: p.naziv,
          slika: zapamcena && p.slike.includes(zapamcena) ? zapamcena : (p.slike[0] ?? ''),
          naStanju: p.naStanju,
        };
        this.izabranaBoja = boja && p.boje.includes(boja) ? boja : (p.boje[0] ?? 'Bela');
        this.uslugaId = izabrana ? izabrana.id : '';
        this.izabranaUsluga = izabrana ? izabrana.tip : '';
      },
      error: () => (this.proizvod = null),
    });
  }

  ngOnDestroy() {
    if (this.slicicaPreview) URL.revokeObjectURL(this.slicicaPreview);
  }

  onSlicicaOdabrana(event: Event) {
    this.slicicaGreska = null;
    const input = event.target as HTMLInputElement;
    const fajl = input.files?.[0];
    if (!fajl) {
      this.ponistiSlicicu();
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(fajl.type)) {
      this.slicicaGreska = 'Sličica mora biti u JPG, PNG ili GIF formatu.';
      this.ponistiSlicicu();
      return;
    }
    if (fajl.size > 5 * 1024 * 1024) {
      this.slicicaGreska = 'Sličica je prevelika (najviše 5 MB).';
      this.ponistiSlicicu();
      return;
    }
    if (this.slicicaPreview) URL.revokeObjectURL(this.slicicaPreview);
    this.slicicaPreview = URL.createObjectURL(fajl);
    this.slicicaFajl = fajl;
  }

  private ponistiSlicicu() {
    if (this.slicicaPreview) URL.revokeObjectURL(this.slicicaPreview);
    this.slicicaPreview = null;
    this.slicicaFajl = null;
    const polje = document.getElementById('slicica') as HTMLInputElement | null;
    if (polje) polje.value = '';
  }

  ponisti(forma: NgForm) {
    this.tekst = '';
    this.kolicina = 1;
    this.upozorenje = null;
    this.greska = null;
    this.dodato = false;
    this.slicicaGreska = null;
    this.ponistiSlicicu();
    forma.resetForm({ tekst: '', kolicina: 1 });
  }

  nazad() {
    if (this.proizvod) this.ruter.navigate(['/klijent/proizvod', this.proizvod.id]);
    else this.ruter.navigate(['/klijent/pretraga']);
  }

  dodajUKorpu(forma: NgForm) {
    this.upozorenje = null;
    this.greska = null;
    this.dodato = false;
    if (!this.proizvod) return;

    if (forma.invalid || !Number.isInteger(this.kolicina) || this.kolicina < 1) {
      forma.form.markAllAsTouched();
      return;
    }
    if (this.slicicaGreska) return;
    if (this.kolicina > this.proizvod.naStanju) {
      this.upozorenje = 'Nema dovoljno proizvoda trenutno na stanju';
      return;
    }

    this.klijentServis
      .dodajUKorpu(this.proizvod.id, this.izabranaBoja, this.uslugaId, this.tekst, this.kolicina, this.slicicaFajl)
      .subscribe({
        next: () => (this.dodato = true),
        error: (err) => {
          if (err.status === 409) this.upozorenje = err.error?.message ?? 'Nema dovoljno proizvoda trenutno na stanju';
          else this.greska = err.error?.message ?? 'Proizvod nije dodat u korpu. Pokušajte ponovo.';
        },
      });
  }
}
