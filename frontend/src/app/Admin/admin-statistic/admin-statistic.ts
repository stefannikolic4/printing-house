import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AdminServis } from '../../services/admin-servis';
import { OcenaProizvoda } from '../../models/statistika';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-statistic',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './admin-statistic.html',
  styleUrl: './admin-statistic.css',
})
export class AdminStatistic {
    promet: { naziv: string; iznos: number }[] = [];
    udeli: { naziv: string; kolicina: number; procenat: number }[] = [];
    proizvodiOcene: { id: string; naziv: string; prikazan: boolean }[] = [];
    greska: string | null = null;

    private barGrafikonRef = viewChild<ElementRef<HTMLCanvasElement>>('barGrafikon');
    private pitaGrafikonRef = viewChild<ElementRef<HTMLCanvasElement>>('pitaGrafikon');
    private linijskiGrafikonRef = viewChild<ElementRef<HTMLCanvasElement>>('linijskiGrafikon');

    private barGrafikon: Chart | null = null;
    private pitaGrafikon: Chart | null = null;
    private linijskiGrafikon: Chart | null = null;
    private oceneProizvoda: OcenaProizvoda[] = [];

    adminServis = inject(AdminServis);

    ngOnInit() {
      this.adminServis.ucitajPrometStamparija().subscribe({
        next: (odgovor) => {
          this.promet = odgovor;
          this.nacrtajBar();
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja prometa', err);
          this.greska = 'Statistiku prometa štamparija nije moguće učitati.';
        }
      });

      this.adminServis.ucitajUdeleProizvoda().subscribe({
        next: (odgovor) => {
          this.udeli = odgovor;
          this.nacrtajPitu();
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja udela proizvoda', err);
          this.greska = 'Statistiku naručivanja proizvoda nije moguće učitati.';
        }
      });

      this.adminServis.ucitajOceneProizvoda().subscribe({
        next: (odgovor) => {
          this.oceneProizvoda = odgovor;
          this.proizvodiOcene = odgovor.map(p => ({ id: p.id, naziv: p.naziv, prikazan: true }));
          this.nacrtajLinijski();
        },
        error: (err) => {
          console.error('Greska prilikom ucitavanja ocena proizvoda', err);
          this.greska = 'Statistiku ocena proizvoda nije moguće učitati.';
        }
      });
    }

    ngOnDestroy() {
      this.barGrafikon?.destroy();
      this.pitaGrafikon?.destroy();
      this.linijskiGrafikon?.destroy();
    }

    osveziLinijski() {
      this.nacrtajLinijski();
    }

    private nacrtajBar() {
      const platno = this.barGrafikonRef()?.nativeElement;
      if (!platno || this.promet.length === 0) { return; }
      this.barGrafikon?.destroy();
      this.barGrafikon = new Chart(platno, {
        type: 'bar',
        data: {
          labels: this.promet.map(s => s.naziv),
          datasets: [{ label: 'Promet (RSD)', data: this.promet.map(s => s.iznos) }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }

    private nacrtajPitu() {
      const platno = this.pitaGrafikonRef()?.nativeElement;
      if (!platno || this.udeli.length === 0) { return; }
      this.pitaGrafikon?.destroy();
      this.pitaGrafikon = new Chart(platno, {
        type: 'pie',
        data: {
          labels: this.udeli.map(u => u.naziv),
          datasets: [{ data: this.udeli.map(u => u.kolicina) }],
        },
        options: { responsive: true },
      });
    }

    private nacrtajLinijski() {
      const platno = this.linijskiGrafikonRef()?.nativeElement;
      if (!platno) { return; }

      const prikazani = this.oceneProizvoda.filter(p =>
        this.proizvodiOcene.find(x => x.id === p.id)?.prikazan
      );
      const datumi = Array.from(new Set(prikazani.flatMap(p => p.tacke.map(t => t.datum)))).sort();

      this.linijskiGrafikon?.destroy();
      this.linijskiGrafikon = new Chart(platno, {
        type: 'line',
        data: {
          labels: datumi,
          datasets: prikazani.map(p => ({
            label: p.naziv,
            data: datumi.map(d => p.tacke.find(t => t.datum === d)?.ocena ?? null),
            spanGaps: true,
          })),
        },
        options: {
          responsive: true,
          scales: { y: { min: 0, max: 5 } },
        },
      });
    }
}
