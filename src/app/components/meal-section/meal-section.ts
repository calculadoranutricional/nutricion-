import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DISTRIBUCION_VDR_BASE, VDR_BASE } from '../../data/nutrients.data';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';

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
      <span class="percentage">{{ porcentajeVdrDisplay() }}%</span>
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
        <strong>{{ proteinaDisplay() }}g</strong>
        <span class="summary-label">
          <span class="color-key key-red" aria-hidden="true"></span>
          <span>Proteína</span>
        </span>
      </div>
      <div class="summary-item">
        <strong>{{ carbosDisplay() }}g</strong>
        <span class="summary-label">
          <span class="color-key key-yellow" aria-hidden="true"></span>
          <span>Carbos</span>
        </span>
      </div>
      <div class="summary-item">
        <strong>{{ grasasDisplay() }}g</strong>
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
    const baseEnergia = this.vdr()['Energía'] || 2000;
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

  readonly proteinaDisplay = computed(() => this.formatMacro(Number(this.totales()['Proteínas']) || 0));
  readonly carbosDisplay = computed(() =>
    this.formatMacro(Number(this.totales()['Carbohidratos']) || 0),
  );
  readonly grasasDisplay = computed(() =>
    this.formatMacro(Number(this.totales()['Grasas totales']) || 0),
  );

  readonly progressWidths = computed(() => {
    const kcal = this.kcalConsumidas();
    const protKcal = (Number(this.totales()['Proteínas']) || 0) * 4;
    const carbKcal = (Number(this.totales()['Carbohidratos']) || 0) * 4;
    const fatKcal = (Number(this.totales()['Grasas totales']) || 0) * 9;
    const macroSum = protKcal + carbKcal + fatKcal;

    if (kcal <= 0 && macroSum <= 0) {
      return { blue: 0, red: 0, yellow: 0, green: 0 };
    }

    const objetivo = Math.max(1, this.kcalObjetivo());
    const efectivo = kcal > 0 ? kcal : macroSum;
    const totalFill = Math.min(100, (efectivo / objetivo) * 100);
    const blue = totalFill * 0.25;
    const macroBudget = totalFill * 0.75;

    if (macroSum <= 0) {
      return {
        blue,
        red: macroBudget / 3,
        yellow: macroBudget / 3,
        green: macroBudget / 3,
      };
    }

    return {
      blue,
      red: (macroBudget * protKcal) / macroSum,
      yellow: (macroBudget * carbKcal) / macroSum,
      green: (macroBudget * fatKcal) / macroSum,
    };
  });

  private formatMacro(val: number): string {
    if (val === 0) return '0';
    if (val < 10) return val.toFixed(1);
    return String(Math.round(val));
  }

  abrirPagina(): void {
    this.ui.openMealPage(this.comida());
  }
}
