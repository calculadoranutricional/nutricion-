import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { NUTRIENTES, VDR_BASE } from '../../data/nutrients.data';
import { EditableInput } from '../../directives/editable-input';
import { NutrienteInfo } from '../../models/nutrition.model';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';

interface VdrFila {
  tipo: 'subtitulo' | 'nutriente';
  subtitulo?: string;
  nutriente?: NutrienteInfo;
}

interface VdrSeccion {
  categoria: string;
  filas: VdrFila[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vdr-panel',
  imports: [EditableInput],
  template: `
    <div id="panel" [class.abierto]="ui.activePanel() === 'panel'">
      <div class="barra">
        <button type="button" class="icon-button cerrar" aria-label="Cerrar" (click)="cerrarVDR()">×</button>
        <h3>Personalizar VDR%</h3>
        <button
          type="button"
          class="icon-button btn-guardar-icono"
          aria-label="Guardar VDR%"
          title="Guardar VDR%"
          (click)="guardarVDR()"
        >
          <span class="material-symbols-outlined icon">save</span>
        </button>
      </div>
      <div id="tabla-vdr" #tablaVdr>
        @if (ui.activePanel() === 'panel') {
          @for (sec of secciones; track sec.categoria) {
            <section style="margin:0.5rem;">
              <table>
                <thead>
                  <tr>
                    <th>Nutriente</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>VDR%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="4" class="tabla-categoria">
                      {{ sec.categoria }}
                    </td>
                  </tr>
                  @for (fila of sec.filas; track $index) {
                    @if (fila.tipo === 'subtitulo') {
                      <tr>
                        <td colspan="4" class="tabla-subcategoria">
                          {{ fila.subtitulo }}
                        </td>
                      </tr>
                    } @else if (fila.nutriente; as n) {
                      <tr>
                        <td>{{ n.nombre }}</td>
                        <td (click)="enfocarCelda($event)">
                          <div
                            contenteditable="true"
                            appEditableInput
                            [soloEnteros]="true"
                            [maxDigitos]="4"
                            inputmode="decimal"
                            data-max-digitos="4"
                            [attr.data-nutriente]="n.nombre"
                            class="input-editor"
                            placeholder="0.00"
                          >{{ displayValor(n.nombre) }}</div>
                        </td>
                        <td>{{ n.unidad }}</td>
                        <td style="color:var(--green)">100%</td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class VdrPanel {
  readonly ui = inject(UiOverlay);
  private readonly store = inject(NutritionStore);

  private readonly tablaVdrRef = viewChild<ElementRef<HTMLDivElement>>('tablaVdr');

  readonly secciones: VdrSeccion[] = this.construirSecciones();

  readonly userVdr = computed(() => {
    return this.store.vdr() || VDR_BASE;
  });

  private construirSecciones(): VdrSeccion[] {
    const res: VdrSeccion[] = [];
    const extraer = (nodo: unknown): VdrFila[] => {
      const filas: VdrFila[] = [];
      if (Array.isArray(nodo)) {
        (nodo as NutrienteInfo[]).forEach((n) => {
          filas.push({ tipo: 'nutriente', nutriente: n });
        });
      } else if (nodo && typeof nodo === 'object') {
        for (const [subtitulo, subn] of Object.entries(nodo as Record<string, unknown>)) {
          filas.push({ tipo: 'subtitulo', subtitulo });
          filas.push(...extraer(subn));
        }
      }
      return filas;
    };

    for (const [categoria, contenido] of Object.entries(NUTRIENTES)) {
      if (categoria.toLowerCase().includes('fisicoquímicas')) continue;
      res.push({ categoria, filas: extraer(contenido) });
    }
    return res;
  }

  displayValor(nombre: string): string {
    const valor = this.userVdr()[nombre];
    return typeof valor === 'number' ? String(valor) : '';
  }

  enfocarCelda(event: MouseEvent): void {
    const td = event.currentTarget as HTMLElement;
    const editable = td.querySelector<HTMLElement>('[contenteditable="true"]');
    if (editable && event.target !== editable) {
      editable.focus();
    }
  }

  cerrarVDR(): void {
    this.ui.closePanel('panel');
  }

  guardarVDR(): void {
    setTimeout(() => {
      this.ui.mostrarConfirmacion(
        '¿Quieres guardar los VDR%?',
        () => {
          const cont = this.tablaVdrRef()?.nativeElement;
          const nuevoVdr: Record<string, number> = {};
          if (cont) {
            cont.querySelectorAll<HTMLElement>('[data-nutriente]').forEach((div) => {
              const nombre = div.dataset['nutriente'];
              const texto = (div.textContent || '').trim();
              const valor = parseFloat(texto);
              if (nombre && !isNaN(valor)) {
                nuevoVdr[nombre] = valor;
              }
            });
          }

          this.store.actualizarVDR(nuevoVdr);
          this.cerrarVDR();
          this.ui.syncScroll();
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
