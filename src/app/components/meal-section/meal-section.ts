import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DISTRIBUCION_VDR_BASE, VDR_BASE } from '../../data/nutrients.data';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';
import {
  calcularProporcionesBarraVDR,
  colorPorcentajeVDR,
  formatMacroValor,
} from '../../utils/nutrition.utils';

const MEAL_META: Record<string, { colorClass: string; icon: string }> = {
  Desayuno: { colorClass: 'blue', icon: 'bakery_dining' },
  Almuerzo: { colorClass: 'red', icon: 'restaurant' },
  Merienda: { colorClass: 'yellow', icon: 'coffee' },
  Cena: { colorClass: 'green', icon: 'dark_mode' },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-meal-section',
  host: {
    '[class]': 'cardClass()',
    '[id]': "'card-' + comida()",
    role: 'button',
    tabindex: '0',
    '(click)': 'abrirPagina()',
    '(keydown.enter)': 'abrirPagina()',
    '(keydown.space)': '$event.preventDefault(); abrirPagina()',
  },
  template: `
    <div class="icon-row">
      <div class="card-icon">
        <span class="material-symbols-outlined">{{ iconoComida() }}</span>
      </div>
      <span class="percentage" [style.color]="porcentajeColor()">{{ porcentajeVdrDisplay() }}%</span>
    </div>
    <h2>{{ comida() }}</h2>
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
export class MealSection {
  private readonly store = inject(NutritionStore);
  private readonly ui = inject(UiOverlay);

  readonly comida = input.required<string>();

  readonly cardClass = computed(() => {
    const meta = MEAL_META[this.comida()] || { colorClass: 'blue', icon: 'restaurant' };
    return `card ${meta.colorClass}`;
  });

  readonly iconoComida = computed(() => {
    return (MEAL_META[this.comida()] || { icon: 'restaurant' }).icon;
  });

  readonly items = computed(() => {
    return this.store.datosComidas()[this.comida()] || [];
  });

  readonly totales = computed(() => {
    this.items();
    return this.store.calcularComida(this.comida());
  });

  readonly vdr = computed(() => {
    return this.store.vdr() || VDR_BASE;
  });

  readonly distribucionVdr = computed(() => {
    return this.store.distribucionVDR() || DISTRIBUCION_VDR_BASE;
  });

  readonly kcalConsumidas = computed(() => {
    return Number(this.totales()['Energía']) || 0;
  });

  readonly kcalObjetivo = computed(() => {
    const baseEnergia = this.vdr()['Energía'] || 0;
    const pct = this.distribucionVdr()[this.comida()] ?? 25;
    return Math.round((baseEnergia * pct) / 100);
  });

  readonly kcalConsumidasDisplay = computed(() => {
    return Math.round(this.kcalConsumidas()).toLocaleString('en-US');
  });

  readonly kcalObjetivoDisplay = computed(() => {
    return this.kcalObjetivo().toLocaleString('en-US');
  });

  readonly porcentajeVdrDisplay = computed(() => {
    const base = this.vdr()['Energía'] || 0;
    if (!base) return '0.0';
    return ((this.kcalConsumidas() / base) * 100).toFixed(1);
  });

  readonly porcentajeVdr = computed(() => {
    return parseFloat(this.porcentajeVdrDisplay()) || 0;
  });

  readonly porcentajeColor = computed(() => {
    const obj = this.distribucionVdr()[this.comida()] ?? 25;
    return colorPorcentajeVDR(this.porcentajeVdr(), obj, false);
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

  readonly proteinaObjetivoDisplay = computed(() => {
    const base = this.vdr()['Proteínas'] || 0;
    const pct = this.distribucionVdr()[this.comida()] ?? 25;
    return formatMacroValor((base * pct) / 100);
  });

  readonly carbosObjetivoDisplay = computed(() => {
    const base = this.vdr()['Carbohidratos'] || 0;
    const pct = this.distribucionVdr()[this.comida()] ?? 25;
    return formatMacroValor((base * pct) / 100);
  });

  readonly grasasObjetivoDisplay = computed(() => {
    const base = this.vdr()['Grasas totales'] || 0;
    const pct = this.distribucionVdr()[this.comida()] ?? 25;
    return formatMacroValor((base * pct) / 100);
  });

  readonly progressWidths = computed(() => {
    return calcularProporcionesBarraVDR(this.totales(), this.vdr(), this.kcalObjetivo());
  });

  abrirPagina(): void {
    this.ui.openMealPage(this.comida());
  }
}
