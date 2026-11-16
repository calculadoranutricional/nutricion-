import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DrawerController } from '../../services/drawer-controller';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-left-sidebar',
  template: `
    <div class="sidebar-content">
      <div class="menu-section">
        <div class="menu-section-title">Comidas</div>
        <button type="button" class="menu-item" (click)="irAComida('Desayuno')">
          <span class="material-symbols-outlined">bakery_dining</span>
          <span>Desayuno</span>
        </button>
        <button type="button" class="menu-item" (click)="irAComida('Almuerzo')">
          <span class="material-symbols-outlined">restaurant</span>
          <span>Almuerzo</span>
        </button>
        <button type="button" class="menu-item" (click)="irAComida('Merienda')">
          <span class="material-symbols-outlined">coffee</span>
          <span>Merienda</span>
        </button>
        <button type="button" class="menu-item" (click)="irAComida('Cena')">
          <span class="material-symbols-outlined">dark_mode</span>
          <span>Cena</span>
        </button>
      </div>

      @if (store.mostrarResumenTotal()) {
        <div class="menu-section">
          <div class="menu-section-title">Análisis</div>
          <button type="button" class="menu-item" (click)="irATotal()">
            <span class="material-symbols-outlined">fact_check</span>
            <span>Resumen total</span>
          </button>
        </div>
      }

      <div class="menu-section">
        <div class="menu-section-title">Configuración</div>
        <button type="button" class="menu-item" (click)="abrirObjetivos()">
          <span class="material-symbols-outlined">flag</span>
          <span>Objetivos</span>
        </button>
        <button type="button" class="menu-item" (click)="abrirAjustes()">
          <span class="material-symbols-outlined">settings</span>
          <span>Ajustes</span>
        </button>
      </div>
    </div>
  `,
})
export class LeftSidebar {
  private readonly ui = inject(UiOverlay);
  private readonly drawer = inject(DrawerController);
  readonly store = inject(NutritionStore);

  irAComida(comida: string): void {
    this.drawer.closeAll();
    this.ui.openMealPage(comida);
  }

  irATotal(): void {
    this.drawer.closeAll();
    this.ui.requestTotalView('summary');
  }

  abrirObjetivos(): void {
    this.drawer.closeAll();
    this.ui.openPanel('panel');
  }

  abrirAjustes(): void {
    this.drawer.closeAll();
    this.ui.openPanel('settings');
  }
}
