import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import Chart from 'chart.js/auto';
import { VDR_BASE } from '../../data/nutrients.data';
import { calcularPorcentajesMacrosVDR } from '../../utils/nutrition.utils';

const CHART_LABELS = ['Energía', 'Proteínas', 'Grasas totales', 'Carbohidratos'];
const FALLBACK_COLORS_LIGHT = ['#4285f4', '#ea4335', '#34a853', '#fbbc04'];
const FALLBACK_COLORS_DARK = ['#8ab4f8', '#f28b82', '#81c995', '#fdd663'];
const CHART_COLOR_VARS = ['--blue', '--red', '--green', '--yellow'];

interface LegendItem {
  index: number;
  label: string;
  keyClass: string;
}

const TOP_CORNER_ITEMS: LegendItem[] = [
  { index: 0, label: 'Energía', keyClass: 'key-blue' },
  { index: 1, label: 'Proteínas', keyClass: 'key-red' },
];

const BOTTOM_CORNER_ITEMS: LegendItem[] = [
  { index: 3, label: 'Carbohidratos', keyClass: 'key-yellow' },
  { index: 2, label: 'Grasas totales', keyClass: 'key-green' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-donut-chart',
  template: `
    <div class="donut-chart-wrapper">
      <div class="donut-corners-row" role="group" aria-label="Identificadores superiores del gráfico">
        @for (item of topCorners; track item.index) {
          <button
            type="button"
            class="donut-legend-item"
            [class.is-hidden]="hiddenSlices()[item.index]"
            [attr.aria-pressed]="!hiddenSlices()[item.index]"
            (click)="toggleSlice(item.index)"
          >
            <span class="color-key" [class]="item.keyClass" aria-hidden="true"></span>
            <span class="donut-legend-label">{{ item.label }}</span>
          </button>
        }
      </div>
      <div #container class="donut-canvas-wrap">
        <canvas #canvasEl [id]="'grafico-' + chartKey()"></canvas>
      </div>
      <div class="donut-corners-row" role="group" aria-label="Identificadores inferiores del gráfico">
        @for (item of bottomCorners; track item.index) {
          <button
            type="button"
            class="donut-legend-item"
            [class.is-hidden]="hiddenSlices()[item.index]"
            [attr.aria-pressed]="!hiddenSlices()[item.index]"
            (click)="toggleSlice(item.index)"
          >
            <span class="color-key" [class]="item.keyClass" aria-hidden="true"></span>
            <span class="donut-legend-label">{{ item.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class DonutChart {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly chartKey = input.required<string>();
  readonly totales = input.required<Record<string, number | null>>();
  readonly vdr = input<Record<string, number>>(VDR_BASE);
  readonly visible = input<boolean>(true);

  private readonly containerRef = viewChild<ElementRef<HTMLDivElement>>('container');
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvasEl');

  private chart: Chart<'doughnut', number[], string> | null = null;
  private activeCanvas: HTMLCanvasElement | null = null;
  private ultimosTotales: Record<string, number | null> = {};
  private ultimoVdr: Record<string, number> = VDR_BASE;
  private contextListenerAttached = false;
  private contextLostTimer: ReturnType<typeof setTimeout> | null = null;
  private colorSchemeMedia: MediaQueryList | null = null;

  readonly topCorners = TOP_CORNER_ITEMS;
  readonly bottomCorners = BOTTOM_CORNER_ITEMS;
  readonly hiddenSlices = signal<Record<number, boolean>>({});

  private readonly onColorSchemeChange = () => {
    if (!this.chart) return;
    const dataset = this.chart.data.datasets[0];
    if (dataset) {
      dataset.backgroundColor = this.getChartColors();
      dataset.borderColor = this.getBorderColor();
    }
    this.chart.update('none');
  };

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof window.matchMedia === 'function') {
      this.colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
      this.colorSchemeMedia.addEventListener('change', this.onColorSchemeChange);
    }

    effect(() => {
      const isVisible = this.visible();
      const key = this.chartKey();
      const totales = this.totales();
      const vdr = this.vdr() || VDR_BASE;

      if (!isPlatformBrowser(this.platformId)) return;

      if (!isVisible) {
        this.destruirGrafico();
        return;
      }

      if (!this.activeCanvas) {
        this.activeCanvas = this.canvasRef()?.nativeElement ?? null;
      }

      if (this.activeCanvas && key) {
        this.renderGrafico(totales, vdr);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.colorSchemeMedia) {
        this.colorSchemeMedia.removeEventListener('change', this.onColorSchemeChange);
        this.colorSchemeMedia = null;
      }
      if (this.contextLostTimer !== null) {
        clearTimeout(this.contextLostTimer);
        this.contextLostTimer = null;
      }
      this.destruirGrafico();
    });
  }

  private getBorderColor(): string {
    if (isPlatformBrowser(this.platformId)) {
      const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim();
      if (cardBg) return cardBg;
    }
    return this.colorSchemeMedia?.matches ? '#2c2c2c' : '#ffffff';
  }

  private getChartColors(): string[] {
    const fallbacks = this.colorSchemeMedia?.matches ? FALLBACK_COLORS_DARK : FALLBACK_COLORS_LIGHT;
    if (!isPlatformBrowser(this.platformId)) return fallbacks;
    const styles = getComputedStyle(document.documentElement);
    return CHART_COLOR_VARS.map((v, i) => styles.getPropertyValue(v).trim() || fallbacks[i]);
  }

  private renderGrafico(
    totales: Record<string, number | null>,
    vdr: Record<string, number>,
  ): void {
    const canvas = this.activeCanvas;
    if (!canvas) return;

    if (!this.contextListenerAttached) {
      canvas.addEventListener('contextlost', (e) => {
        e.preventDefault();
        this.handleContextLost();
      });
      this.contextListenerAttached = true;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = calcularPorcentajesMacrosVDR(totales, vdr);
    const datos = [p.energia, p.proteinas, p.grasas, p.carbohidratos];
    const colors = this.getChartColors();
    const borderColor = this.getBorderColor();
    this.ultimosTotales = totales;
    this.ultimoVdr = vdr;

    if (!this.chart) {
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: CHART_LABELS,
          datasets: [
            {
              data: datos,
              backgroundColor: colors,
              borderColor,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          rotation: -90,
          animation: { duration: 0 },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (tooltipCtx) => {
                  const label = tooltipCtx.label || '';
                  const pctVdr = Number(tooltipCtx.parsed) || 0;
                  const raw = Number(this.ultimosTotales[label]) || 0;
                  const unit = label === 'Energía' ? 'kcal' : 'g';
                  const rawStr = Number.isInteger(raw) ? String(raw) : raw.toFixed(1);
                  return ` ${label}: ${pctVdr.toFixed(1)}% VDR (${rawStr} ${unit})`;
                },
              },
            },
          },
        },
      });
      this.sincronizarVisibilidad();
    } else {
      this.chart.data.datasets[0].data = datos;
      this.chart.data.datasets[0].backgroundColor = colors;
      this.chart.data.datasets[0].borderColor = borderColor;
      this.chart.options.animation = { duration: 400 };
      this.chart.update();
    }
  }

  toggleSlice(index: number): void {
    const nextHidden = !this.hiddenSlices()[index];
    this.hiddenSlices.update((prev) => ({
      ...prev,
      [index]: nextHidden,
    }));
    if (this.chart) {
      this.chart.toggleDataVisibility(index);
      this.chart.update();
    }
  }

  private sincronizarVisibilidad(): void {
    if (!this.chart) return;
    const ocultos = this.hiddenSlices();
    for (const [idxStr, isHidden] of Object.entries(ocultos)) {
      const idx = Number(idxStr);
      if (isHidden && this.chart.getDataVisibility(idx)) {
        this.chart.toggleDataVisibility(idx);
      }
    }
    this.chart.update('none');
  }

  private handleContextLost(): void {
    const container = this.containerRef()?.nativeElement;
    const viejoCanvas = this.activeCanvas;
    if (!container || !viejoCanvas) return;

    const nuevoCanvas = document.createElement('canvas');
    nuevoCanvas.id = viejoCanvas.id;
    nuevoCanvas.className = viejoCanvas.className;
    nuevoCanvas.style.cssText = viejoCanvas.style.cssText;
    container.replaceChild(nuevoCanvas, viejoCanvas);

    const totalesPrevios = { ...this.ultimosTotales };
    const vdrPrevio = { ...this.ultimoVdr };
    this.destruirGrafico();
    this.activeCanvas = nuevoCanvas;
    this.contextListenerAttached = false;

    this.contextLostTimer = setTimeout(() => {
      if (this.visible()) {
        this.renderGrafico(totalesPrevios, vdrPrevio);
      }
    }, 100);
  }

  private destruirGrafico(): void {
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch {
        // ignorar errores al destruir tras pérdida de contexto
      }
      this.chart = null;
    }
  }
}
