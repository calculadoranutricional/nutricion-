import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DISTRIBUCION_VDR_BASE, VDR_BASE } from '../../data/nutrients.data';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';
import { DonutChart } from '../donut-chart/donut-chart';
import { NutrientTable } from '../nutrient-table/nutrient-table';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-total-page',
  imports: [DonutChart, NutrientTable],
  template: `
    <div id="total-page" class="full-page-overlay">
      <div class="barra">
        <button type="button" class="icon-button cerrar" aria-label="Cerrar" (click)="cerrar()">×</button>
        <h3>Resumen Total</h3>
      </div>

      <div class="full-page-body" id="total-body">
        @if (store.totalItemsActivo().length === 0) {
          <p style="text-align:center; font-size:0.85rem; color:var(--text-secondary); margin:0 0 0.75rem 0;">
            Agrega alimentos en Desayuno, Almuerzo, Merienda o Cena para ver el análisis diario completo.
          </p>
        }

        <div class="contenedor0">
          <button
            type="button"
            id="btn-grafico-total"
            (click)="toggleGrafico()"
          >
            {{ graficoVisible() ? 'Ocultar gráfico' : 'Mostrar gráfico' }}
          </button>
          <button
            type="button"
            id="btn-seccion-total"
            (click)="toggleSeccion()"
          >
            Gráfico-Tablas
          </button>
          <button
            type="button"
            id="btn-tabla-total"
            (click)="toggleTabla()"
          >
            {{ tablaLabel() }}
          </button>
        </div>

        <div id="seccion0-total" [class.hidden]="!graficoVisible()">
          <h4 id="titulo-grafico-total">Gráfico Nutricional</h4>
          <app-donut-chart
            chartKey="total"
            [totales]="totales()"
            [visible]="graficoVisible()"
          />
        </div>

        <div
          id="seccion1-total"
          class="contenedor0"
          [class.hidden]="!tablaVisible()"
        >
          <h4>Tabla Nutricional</h4>
          <div id="tabla-total">
            <app-nutrient-table
              [totales]="totales()"
              [vdr]="vdr()"
              [distribucionVdr]="distribucionVdr()"
              comida="total"
              [mostrarTodos]="false"
            />
          </div>
          <button type="button" class="btn-compartir" (click)="compartirResultados()">
            Compartir resultados
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TotalPage {
  readonly store = inject(NutritionStore);
  private readonly ui = inject(UiOverlay);

  readonly graficoVisible = signal<boolean>(true);
  readonly tablaVisible = signal<boolean>(true);
  private readonly tablaFueToggled = signal<boolean>(false);

  readonly totales = computed(() => {
    this.store.datosComidas();
    return this.store.calcularComida('total');
  });

  readonly vdr = computed(() => {
    return this.store.vdr() || VDR_BASE;
  });

  readonly distribucionVdr = computed(() => {
    return this.store.distribucionVDR() || DISTRIBUCION_VDR_BASE;
  });

  readonly tablaLabel = computed(() => {
    if (!this.tablaFueToggled() && !this.tablaVisible()) {
      return 'Mostrar tabla';
    }
    return this.tablaVisible() ? 'Ocultar tablas' : 'Mostrar tablas';
  });

  constructor() {
    effect(() => {
      const req = this.ui.totalFocusRequest();
      if (!req) return;
      this.tablaFueToggled.set(true);
      this.graficoVisible.set(true);
      this.tablaVisible.set(true);
    });
  }

  cerrar(): void {
    this.ui.closePage();
  }

  toggleGrafico(): void {
    this.graficoVisible.update((v) => !v);
  }

  toggleTabla(): void {
    this.tablaFueToggled.set(true);
    this.tablaVisible.update((v) => !v);
  }

  toggleSeccion(): void {
    this.tablaFueToggled.set(true);
    const ambasOcultas = !this.graficoVisible() && !this.tablaVisible();
    this.graficoVisible.set(ambasOcultas);
    this.tablaVisible.set(ambasOcultas);
  }

  compartirResultados(): void {
    this.store.compartirResultados('total');
  }
}
