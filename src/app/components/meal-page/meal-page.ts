import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { ALIMENTOS } from '../../data/foods.data';
import { CATEGORIAS, DISTRIBUCION_VDR_BASE, VDR_BASE } from '../../data/nutrients.data';
import { EditableInput } from '../../directives/editable-input';
import { Alimento } from '../../models/nutrition.model';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';
import { DonutChart } from '../donut-chart/donut-chart';
import { ManualEditor } from '../manual-editor/manual-editor';
import { NutrientTable } from '../nutrient-table/nutrient-table';

interface ItemDisplay {
  nombre: string;
  cantidad: string | number;
  unidad: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-meal-page',
  imports: [EditableInput, DonutChart, NutrientTable, ManualEditor],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div id="meal-page" class="full-page-overlay">
      <div class="barra">
        <button type="button" class="icon-button cerrar" aria-label="Cerrar" (click)="cerrar()">×</button>
        <h3>{{ comida() }}</h3>
      </div>

      <div class="full-page-body" [id]="'comida-' + comida()">
        <div class="contenedor-select">
          <select
            [id]="'cat-' + comida()"
            class="select-categorias"
            aria-label="Categoría de alimento"
            (change)="onCategoriaChange($event)"
          >
            <option value="">Todas las categorías</option>
            @for (c of categorias; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>

        <div class="fila-comida">
          <div class="contenedor-buscador">
            <div
              #buscarEl
              [id]="'buscar-' + comida()"
              contenteditable="true"
              appEditableInput
              [esBuscador]="true"
              [maxDigitos]="20"
              class="input-buscador"
              data-max-digitos="20"
              placeholder="Buscar alimento"
              (input)="onBuscarInput()"
            ></div>
            <ul #sugerenciasEl [id]="'sugerencias-' + comida()" class="sugerencias-lista">
              @for (a of sugerencias(); track a.nombre) {
                <li>
                  <button type="button" (click)="onSugerenciaClick(a, $event)">
                    {{ a.nombre }}
                  </button>
                </li>
              }
            </ul>
          </div>
          <div class="contenedor-peso">
            <span class="etiqueta-peso">g</span>
            <div
              #pesoEl
              [id]="'peso-' + comida()"
              contenteditable="true"
              appEditableInput
              [soloEnteros]="true"
              inputmode="decimal"
              class="input-peso"
              placeholder="Peso"
            ></div>
          </div>
        </div>

        <div [id]="'lista-' + comida()">
          @if (itemsDisplay().length > 0) {
            <div
              class="sin-scrollbar"
              [style.maxHeight]="itemsDisplay().length > 5 ? '180px' : null"
              [style.overflowY]="itemsDisplay().length > 5 ? 'auto' : null"
            >
              <table>
                <thead>
                  <tr>
                    <th>Alimento / Nutriente</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of itemsDisplay(); track $index) {
                    <tr>
                      <td>{{ item.nombre }}</td>
                      <td>{{ item.cantidad }}</td>
                      <td>{{ item.unidad }}</td>
                      <td>
                        <button
                          type="button"
                          class="btn-eliminar btn-eliminar-item"
                          aria-label="Eliminar"
                          (click)="eliminarItem($index)"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <div class="contenedor0" [class.hidden]="items().length === 0">
          <div class="contenedor">
            <button type="button" [id]="'btn-grafico-' + comida()" (click)="toggleGrafico()">
              {{ graficoVisible() ? 'Ocultar gráfico' : 'Mostrar gráfico' }}
            </button>
            <button type="button" [id]="'btn-seccion-' + comida()" (click)="toggleSeccion()">
              Gráfico-Tablas
            </button>
            <button type="button" [id]="'btn-tabla-' + comida()" (click)="toggleTabla()">
              {{ tablaVisible() ? 'Ocultar tablas' : 'Mostrar tablas' }}
            </button>
          </div>

          <div [id]="'seccion0-' + comida()" [class.hidden]="!graficoVisible()">
            <h4 [id]="'titulo-grafico-' + comida()">Gráfico Nutricional</h4>
            <app-donut-chart
              [chartKey]="comida()"
              [totales]="totales()"
              [visible]="items().length > 0 && graficoVisible()"
            />
          </div>

          <div [id]="'seccion1-' + comida()" [class.hidden]="!tablaVisible()">
            <button type="button" [id]="'btn-nutrientes-' + comida()" (click)="toggleNutrientes()">
              {{
                mostrarTodos()
                  ? 'Ocultar vacíos'
                  : 'Mostrar todos'
              }}
            </button>
            <button type="button" [id]="'btn-aplicar-' + comida()" (click)="toggleAlternar()">
              {{ modoManual() ? 'Aplicar nutrientes' : 'Agregar nutrientes' }}
            </button>
            <h4 [id]="'titulo-tabla-' + comida()" [class.hidden]="modoManual()">Tabla Nutricional</h4>
            <div [id]="'tabla-' + comida()" [class.hidden]="modoManual()">
              <app-nutrient-table
                [totales]="totales()"
                [vdr]="vdr()"
                [distribucionVdr]="distribucionVdr()"
                [comida]="comida()"
                [mostrarTodos]="mostrarTodos()"
              />
            </div>
            <h4 [id]="'titulo-editor-' + comida()" [class.hidden]="!modoManual()">Editor Manual</h4>
            <div [id]="'editor-' + comida()" [class.hidden]="!modoManual()">
              <app-manual-editor
                #manualEditor
                [comida]="comida()"
                [totales]="totales()"
                [vdr]="vdr()"
                [distribucionVdr]="distribucionVdr()"
              />
            </div>
            <button type="button" class="btn-compartir" (click)="compartirResultados()">
              Compartir resultados
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MealPage {
  private readonly store = inject(NutritionStore);
  private readonly ui = inject(UiOverlay);
  private readonly platformId = inject(PLATFORM_ID);

  readonly comida = input.required<string>();

  private readonly buscarRef = viewChild<ElementRef<HTMLDivElement>>('buscarEl');
  private readonly sugerenciasRef = viewChild<ElementRef<HTMLUListElement>>('sugerenciasEl');
  private readonly pesoRef = viewChild<ElementRef<HTMLDivElement>>('pesoEl');
  private readonly manualEditorRef = viewChild<ManualEditor>('manualEditor');

  readonly categorias = CATEGORIAS;
  readonly categoriaSeleccionada = signal<string>('');
  readonly sugerencias = signal<Alimento[]>([]);

  readonly graficoVisible = signal<boolean>(true);
  readonly tablaVisible = signal<boolean>(true);
  readonly modoManual = signal<boolean>(false);

  readonly items = computed(() => {
    return this.store.datosComidas()[this.comida()] || [];
  });

  readonly itemsDisplay = computed<ItemDisplay[]>(() => {
    return this.items().map(({ alimento, peso }) => {
      if (alimento?.esManual && alimento.displayManual) {
        const partes = alimento.displayManual.trim().split(' ');
        const unidad = partes.pop() || '';
        const cantidad = partes.pop() || '';
        const nombre = partes.join(' ');
        return { nombre, cantidad, unidad };
      }
      return {
        nombre: alimento.nombre,
        cantidad: peso,
        unidad: alimento.unidad || 'g',
      };
    });
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

  readonly mostrarTodos = computed(() => {
    return !!this.store.mostrarTodosLosNutrientes()[this.comida()];
  });

  cerrar(): void {
    this.ui.closePage();
  }

  onCategoriaChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.categoriaSeleccionada.set(val);
    if (this.sugerencias().length > 0 || (this.buscarRef()?.nativeElement.textContent || '').trim()) {
      this.onBuscarInput();
    }
  }

  onBuscarInput(): void {
    const buscar = this.buscarRef()?.nativeElement;
    if (!buscar) return;
    const val = (buscar.textContent || '').toLowerCase();
    const cat = this.categoriaSeleccionada();
    this.sugerencias.set(
      ALIMENTOS.filter((a) => a.nombre.toLowerCase().includes(val) && (!cat || a.categoria === cat)),
    );
  }

  onSugerenciaClick(alimento: Alimento, event: MouseEvent): void {
    event.stopPropagation();
    setTimeout(() => this.seleccionarAlimento(alimento), 0);
  }

  onDocumentClick(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = e.target as Node | null;
    const buscar = this.buscarRef()?.nativeElement;
    const sugerencias = this.sugerenciasRef()?.nativeElement;
    const peso = this.pesoRef()?.nativeElement;
    if (!buscar || !sugerencias || !peso || !target) return;

    const clickedInside =
      buscar.contains(target) || sugerencias.contains(target) || peso.contains(target);
    if (!clickedInside) {
      buscar.textContent = '';
      this.sugerencias.set([]);
      peso.textContent = '';
    }
  }

  private seleccionarAlimento(alimento: Alimento): void {
    const buscar = this.buscarRef()?.nativeElement;
    const pesoEl = this.pesoRef()?.nativeElement;
    if (!buscar || !pesoEl) return;

    const peso = parseFloat(pesoEl.textContent || '');
    const res = this.store.agregarAlimento(this.comida(), alimento, peso);

    if (!res.ok) {
      if (res.focusPeso) {
        setTimeout(() => pesoEl.focus(), 1000);
      }
      return;
    }

    buscar.textContent = '';
    pesoEl.textContent = '';
    this.sugerencias.set([]);
  }

  eliminarItem(index: number): void {
    this.store.eliminarItem(this.comida(), index);
  }

  toggleGrafico(): void {
    this.graficoVisible.update((v) => !v);
  }

  toggleTabla(): void {
    this.tablaVisible.update((v) => !v);
  }

  toggleSeccion(): void {
    const ambasOcultas = !this.graficoVisible() && !this.tablaVisible();
    this.graficoVisible.set(ambasOcultas);
    this.tablaVisible.set(ambasOcultas);
  }

  toggleNutrientes(): void {
    this.store.toggleMostrarTodosNutrientes(this.comida());
  }

  toggleAlternar(): void {
    if (this.modoManual()) {
      this.manualEditorRef()?.aplicarManual();
      this.modoManual.set(false);
    } else {
      this.manualEditorRef()?.resetear();
      this.modoManual.set(true);
    }
  }

  compartirResultados(): void {
    this.store.compartirResultados(this.comida());
  }
}
