import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-modal',
  template: `
    @if (ui.activePanel() === 'settings') {
      <div
        id="settings"
        style="position:fixed; inset:0; background:var(--bg); color:var(--text); z-index:1600; overflow:auto;"
      >
        <div class="barra">
          <button type="button" class="icon-button cerrar" aria-label="Cerrar" (click)="cerrar()">×</button>
          <h3>Ajustes</h3>
        </div>

        <div style="max-width:560px; margin:1.25rem auto; padding:0 16px; display:flex; flex-direction:column; gap:12px;">
          <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px;">
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
              Valores Diarios (VDR%)
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
              <button type="button" class="menu-item" (click)="abrirVdr()">
                <span class="material-symbols-outlined">tune</span>
                <span>Personalizar VDR%</span>
              </button>
              <button type="button" class="menu-item" (click)="abrirDistribucion()">
                <span class="material-symbols-outlined">pie_chart</span>
                <span>Distribución VDR% por comida</span>
              </button>
            </div>
          </div>

          <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px;">
            <div style="font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
              Acciones de datos
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
              <button type="button" class="menu-item" (click)="confirmarRestaurarMetas()">
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Restaurar metas VDR% por defecto</span>
              </button>
              <button type="button" class="menu-item" style="color:var(--red);" (click)="confirmarVaciarComidas()">
                <span class="material-symbols-outlined" style="color:var(--red);">delete_sweep</span>
                <span>Vaciar todas las comidas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SettingsModal {
  readonly ui = inject(UiOverlay);
  readonly store = inject(NutritionStore);

  cerrar(): void {
    this.ui.closePanel('settings');
  }

  abrirVdr(): void {
    this.ui.openPanel('panel');
  }

  abrirDistribucion(): void {
    this.ui.openPanel('panel2');
  }

  confirmarRestaurarMetas(): void {
    this.ui.mostrarConfirmacion(
      '¿Restaurar los VDR% y la distribución por defecto?',
      () => {
        this.store.restaurarMetas();
      },
      undefined,
      { textoAceptar: 'Restaurar' },
    );
  }

  confirmarVaciarComidas(): void {
    this.ui.mostrarConfirmacion(
      '¿Vaciar todos los alimentos cargados en las 4 comidas?',
      () => {
        this.store.vaciarComidas();
      },
      undefined,
      { textoAceptar: 'Vaciar', colorTexto: 'var(--red)' },
    );
  }
}
