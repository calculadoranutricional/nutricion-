import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DrawerController } from '../../services/drawer-controller';
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

      <div class="menu-section">
        <div class="menu-section-title">Análisis</div>
        <button type="button" class="menu-item" (click)="irATotal('summary')">
          <span class="material-symbols-outlined">analytics</span>
          <span>Resumen diario</span>
        </button>
        <button type="button" class="menu-item" (click)="irATotal('stats')">
          <span class="material-symbols-outlined">monitoring</span>
          <span>Estadísticas</span>
        </button>
        <button type="button" class="menu-item" (click)="irATotal('progress')">
          <span class="material-symbols-outlined">trending_up</span>
          <span>Progreso</span>
        </button>
      </div>

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

  irAComida(comida: string): void {
    this.drawer.closeAll();
    this.ui.openMealPage(comida);
  }

  irATotal(mode: 'summary' | 'stats' | 'progress'): void {
    this.drawer.closeAll();
    this.ui.requestTotalView(mode);
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
