import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { COMIDAS, DISTRIBUCION_VDR_BASE, VDR_BASE } from '../../data/nutrients.data';
import { DrawerController } from '../../services/drawer-controller';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-right-sidebar',
  template: `
    <div class="sidebar-content">
      <div class="menu-section">
        <div class="menu-section-title">Valores Diarios (VDR%)</div>
        <button type="button" class="menu-item" (click)="abrirVdr()">
          <span class="material-symbols-outlined">tune</span>
          <span>Personalizar VDR%</span>
        </button>
        <button type="button" class="menu-item" (click)="abrirDistribucion()">
          <span class="material-symbols-outlined">pie_chart</span>
          <span>Distribución VDR%</span>
        </button>
      </div>

      <div class="menu-section right-summary-box">
        <div class="menu-section-title" style="padding-left:0; padding-right:0;">Metas activas</div>
        <div class="right-summary-row">
          <span>Energía diaria</span>
          <strong>{{ metaEnergia() }} kcal</strong>
        </div>
        @for (c of comidas; track c) {
          <div class="right-summary-row">
            <span>{{ c }}</span>
            <strong>{{ distribucion()[c] || 0 }}%</strong>
          </div>
        }
        <div class="right-summary-row" style="border-top:1px solid var(--border); margin-top:4px; padding-top:6px;">
          <span>Total</span>
          <strong>{{ totalDistribucion() }}%</strong>
        </div>
      </div>
    </div>
  `,
})
export class RightSidebar {
  private readonly ui = inject(UiOverlay);
  private readonly store = inject(NutritionStore);
  private readonly drawer = inject(DrawerController);

  readonly comidas = COMIDAS;

  readonly metaEnergia = computed(() => {
    return Math.round(this.store.vdr()['Energía'] || VDR_BASE['Energía'] || 0);
  });

  readonly distribucion = computed(() => {
    return this.store.distribucionVDR() || DISTRIBUCION_VDR_BASE;
  });

  readonly totalDistribucion = computed(() => {
    const dist = this.distribucion();
    return COMIDAS.reduce((acc, c) => acc + (Number(dist[c]) || 0), 0);
  });

  abrirVdr(): void {
    this.drawer.closeAll();
    this.ui.openPanel('panel');
  }

  abrirDistribucion(): void {
    this.drawer.closeAll();
    this.ui.openPanel('panel2');
  }
}
