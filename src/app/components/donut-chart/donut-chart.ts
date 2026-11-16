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
  viewChild,
} from '@angular/core';
import Chart from 'chart.js/auto';

const CHART_LABELS = ['Energía', 'Proteínas', 'Carbohidratos', 'Grasas totales'];
const CHART_COLORS = ['#00BCD4', '#4CAF50', '#FFEB3B', '#F44336'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-donut-chart',
  template: `<div #container style="width:100%;"><canvas #canvasEl [id]="'grafico-' + chartKey()"></canvas></div>`,
})
export class DonutChart {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly chartKey = input.required<string>();
  readonly totales = input.required<Record<string, number | null>>();
  readonly visible = input<boolean>(true);

  private readonly containerRef = viewChild<ElementRef<HTMLDivElement>>('container');
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvasEl');

  private chart: Chart<'doughnut', number[], string> | null = null;
  private activeCanvas: HTMLCanvasElement | null = null;
  private ultimosTotales: Record<string, number | null> = {};
  private contextListenerAttached = false;
  private contextLostTimer: ReturnType<typeof setTimeout> | null = null;
  private colorSchemeMedia: MediaQueryList | null = null;

  private readonly onColorSchemeChange = () => {
    if (!this.chart) return;
    const legend = this.chart.options.plugins?.legend;
    if (legend?.labels) {
      legend.labels.color = this.getLegendColor();
      this.chart.update('none');
    }
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

      if (!isPlatformBrowser(this.platformId)) return;

      if (!isVisible) {
        this.destruirGrafico();
        return;
      }

      if (!this.activeCanvas) {
        this.activeCanvas = this.canvasRef()?.nativeElement ?? null;
      }

      if (this.activeCanvas && key) {
        this.renderGrafico(totales);
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

  private getLegendColor(): string {
    return this.colorSchemeMedia?.matches ? '#d4d4d4' : '#3c4043';
  }

  private renderGrafico(totales: Record<string, number | null>): void {
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

    const datos = CHART_LABELS.map((l) => Number(totales[l]) || 0);
    this.ultimosTotales = totales;

    if (!this.chart) {
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: CHART_LABELS,
          datasets: [
            {
              data: datos,
              backgroundColor: CHART_COLORS,
            },
          ],
        },
        options: {
          responsive: true,
          animation: { duration: 0 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: this.getLegendColor() },
            },
          },
        },
      });
    } else {
      this.chart.data.datasets[0].data = datos;
      if (this.chart.options.plugins?.legend?.labels) {
        this.chart.options.plugins.legend.labels.color = this.getLegendColor();
      }
      this.chart.options.animation = { duration: 400 };
      this.chart.update();
    }
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
    this.destruirGrafico();
    this.activeCanvas = nuevoCanvas;
    this.contextListenerAttached = false;

    this.contextLostTimer = setTimeout(() => {
      if (this.visible()) {
        this.renderGrafico(totalesPrevios);
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
