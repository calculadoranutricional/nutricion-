import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { VDR_BASE } from '../../data/nutrients.data';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';
import {
  calcularProporcionesBarraVDR,
  colorPorcentajeVDR,
  formatMacroValor,
} from '../../utils/nutrition.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-total-section',
  host: {
    class: 'card multi full',
    id: 'card-total',
    role: 'button',
    tabindex: '0',
    '(click)': 'abrirPagina()',
    '(keydown.enter)': 'abrirPagina()',
    '(keydown.space)': '$event.preventDefault(); abrirPagina()',
  },
  template: `
    <div class="icon-row">
      <div class="card-icon">
        <span class="material-symbols-outlined google-gradient">fact_check</span>
      </div>
      <span class="percentage" [style.color]="porcentajeColor()">{{ porcentajeVdrDisplay() }}%</span>
    </div>
    <h2>Resumen total</h2>
    <div class="kcal-row">
      <span class="color-key key-blue" aria-hidden="true"></span>
      <span class="kcal-number">{{ kcalConsumidasDisplay() }}</span>
      <span class="kcal-target">/ {{ kcalObjetivoDisplay() }} kcal</span>
    </div>
    <div class="main-progress">
      <div class="prog-bar prog-blue" [style.width.%]="progressWidths().blue"></div>
      <div class="prog-bar prog-red" [style.width.%]="progressWidths().red"></div>
      <div class="prog-bar prog-yellow" [style.width.%]="progressWidths().yellow"></div>
      <div class="prog-bar prog-green" [style.width.%]="progressWidths().green"></div>
    </div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-value">
          <strong>{{ proteinaDisplay() }}</strong>
          <span class="macro-target">/ {{ proteinaObjetivoDisplay() }}g</span>
        </div>
        <span class="summary-label">
          <span class="color-key key-red" aria-hidden="true"></span>
          <span>Proteína</span>
        </span>
      </div>
      <div class="summary-item">
        <div class="summary-value">
          <strong>{{ carbosDisplay() }}</strong>
          <span class="macro-target">/ {{ carbosObjetivoDisplay() }}g</span>
        </div>
        <span class="summary-label">
          <span class="color-key key-yellow" aria-hidden="true"></span>
          <span>Carbos</span>
        </span>
      </div>
      <div class="summary-item">
        <div class="summary-value">
          <strong>{{ grasasDisplay() }}</strong>
          <span class="macro-target">/ {{ grasasObjetivoDisplay() }}g</span>
        </div>
        <span class="summary-label">
          <span class="color-key key-green" aria-hidden="true"></span>
          <span>Grasas</span>
        </span>
      </div>
    </div>
  `,
})
export class TotalSection {
  readonly store = inject(NutritionStore);
  private readonly ui = inject(UiOverlay);

  readonly totales = computed(() => {
    this.store.datosComidas();
    return this.store.calcularComida('total');
  });

  readonly vdr = computed(() => {
    return this.store.vdr() || VDR_BASE;
  });

  readonly kcalConsumidas = computed(() => {
    return Number(this.totales()['Energía']) || 0;
  });

  readonly kcalObjetivo = computed(() => {
    return Math.round(this.vdr()['Energía'] || 0);
  });

  readonly kcalConsumidasDisplay = computed(() => {
    return Math.round(this.kcalConsumidas()).toLocaleString('en-US');
  });

  readonly kcalObjetivoDisplay = computed(() => {
    return this.kcalObjetivo().toLocaleString('en-US');
  });

  readonly porcentajeVdrDisplay = computed(() => {
    const base = this.kcalObjetivo();
    if (!base) return '0.0';
    return ((this.kcalConsumidas() / base) * 100).toFixed(1);
  });

  readonly porcentajeVdr = computed(() => {
    return parseFloat(this.porcentajeVdrDisplay()) || 0;
  });

  readonly porcentajeColor = computed(() => {
    return colorPorcentajeVDR(this.porcentajeVdr(), 100, true);
  });

  readonly proteinaDisplay = computed(() =>
    formatMacroValor(Number(this.totales()['Proteínas']) || 0),
  );
  readonly carbosDisplay = computed(() =>
    formatMacroValor(Number(this.totales()['Carbohidratos']) || 0),
  );
  readonly grasasDisplay = computed(() =>
    formatMacroValor(Number(this.totales()['Grasas totales']) || 0),
  );

  readonly proteinaObjetivoDisplay = computed(() =>
    formatMacroValor(this.vdr()['Proteínas'] || 0),
  );
  readonly carbosObjetivoDisplay = computed(() =>
    formatMacroValor(this.vdr()['Carbohidratos'] || 0),
  );
  readonly grasasObjetivoDisplay = computed(() =>
    formatMacroValor(this.vdr()['Grasas totales'] || 0),
  );

  readonly progressWidths = computed(() => {
    return calcularProporcionesBarraVDR(this.totales(), this.vdr(), this.kcalObjetivo());
  });

  abrirPagina(): void {
    this.ui.openTotalPage();
  }
}
