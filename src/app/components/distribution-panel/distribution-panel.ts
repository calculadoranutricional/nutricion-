import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { COMIDAS, DISTRIBUCION_VDR_BASE } from '../../data/nutrients.data';
import { EditableInput } from '../../directives/editable-input';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-distribution-panel',
  imports: [EditableInput],
  template: `
    <div id="panel2" [class.abierto]="ui.activePanel() === 'panel2'">
      <div class="barra">
        <button type="button" class="icon-button cerrar" aria-label="Cerrar" (click)="cerrar()">×</button>
        <h3>Distribución VDR%</h3>
        <button
          type="button"
          class="icon-button btn-guardar-icono"
          aria-label="Guardar distribución VDR%"
          title="Guardar distribución VDR%"
          (click)="guardar()"
        >
          <span class="material-symbols-outlined icon">save</span>
        </button>
      </div>
      <div id="tabla-distribucion-vdr">
        @if (ui.activePanel() === 'panel2') {
          <section style="margin:0.5rem;">
            <table>
              <thead>
                <tr>
                  <th>Comidas / Total</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>VDR%</th>
                </tr>
              </thead>
              <tbody>
                @for (c of filas; track c) {
                  <tr>
                    <td>{{ c }}</td>
                    <td>0.00</td>
                    <td>g</td>
                    <td style="color:var(--green);">
                      @if (c === 'Total') {
                        {{ valorDe(c) }}%
                      } @else {
                        <span
                          contenteditable="true"
                          appEditableInput
                          [soloEnteros]="true"
                          [maxDigitos]="2"
                          inputmode="decimal"
                          data-max-digitos="2"
                          [attr.data-comida]="c"
                          style="display:inline-block;"
                          (input)="onValorInput($event, c)"
                        >{{ valorDe(c) }}</span>%
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }
      </div>
    </div>
  `,
})
export class DistributionPanel {
  readonly ui = inject(UiOverlay);
  private readonly store = inject(NutritionStore);

  readonly filas = [...COMIDAS, 'Total'];

  readonly valores = computed<Record<string, number>>(() => {
    return this.store.distribucionTemp() || this.store.distribucionVDR() || DISTRIBUCION_VDR_BASE;
  });

  valorDe(comida: string): number {
    return this.valores()[comida] || 0;
  }

  onValorInput(event: Event, comida: string): void {
    const target = event.target as HTMLElement;
    let val = parseFloat(target.textContent || '');
    if (isNaN(val)) val = 0;
    this.store.setDistribucionTemp(comida, val);
  }

  cerrar(): void {
    this.store.descartarDistribucionTemp();
    this.ui.closePanel('panel2');
  }

  guardar(): void {
    setTimeout(() => {
      this.ui.mostrarConfirmacion(
        '¿Quieres guardar los VDR%?',
        () => {
          const distTemp = this.store.distribucionTemp();
          if (distTemp) {
            this.store.actualizarDistribucion(distTemp);
          } else {
            this.store.actualizarDistribucion(this.store.distribucionVDR());
          }

          this.ui.closePanel('panel2');
          this.ui.mostrarToast('VDR% guardados correctamente.');
          this.store.enfocarPrimerPeso();
        },
        () => {
          this.ui.mostrarToast('Operación cancelada');
        },
        { textoAceptar: 'Aceptar' },
      );
    }, 200);
  }
}
