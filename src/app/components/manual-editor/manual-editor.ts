import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { NUTRIENTES, NUTRIENTES_PLANOS } from '../../data/nutrients.data';
import { EditableInput } from '../../directives/editable-input';
import { NutrienteInfo } from '../../models/nutrition.model';
import { NutritionStore } from '../../services/nutrition-store';
import { UiOverlay } from '../../services/ui-overlay';
import { colorPorcentajeVDR, CONVERSIONES, convertir, tipoUnidad } from '../../utils/nutrition.utils';

interface FilaEditor {
  tipo: 'subtitulo' | 'nutriente';
  subtitulo?: string;
  nutriente?: NutrienteInfo;
  unidades?: string[];
  unidadActual?: string;
  porc?: string;
  color?: string;
}

interface TablaEditor {
  categoria: string;
  filas: FilaEditor[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-manual-editor',
  imports: [EditableInput],
  template: `
    <div #editorRoot>
      @for (tabla of tablas(); track tabla.categoria) {
        <table style="margin-bottom:.5rem;">
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
                {{ tabla.categoria }}
              </td>
            </tr>
            @for (fila of tabla.filas; track $index) {
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
                      inputmode="decimal"
                      appEditableInput
                      [permitirDecimales]="true"
                      [attr.data-nutriente]="n.nombre"
                      class="w-full"
                      placeholder="0.00"
                      (input)="onCeldaInput($event, n)"
                    ></div>
                  </td>
                  <td>
                    <select
                      class="select-editor"
                      tabindex="-1"
                      [attr.data-unidad]="n.nombre"
                      (change)="onUnidadChange($event, n)"
                    >
                      @for (u of fila.unidades || []; track u) {
                        <option
                          [value]="u"
                          [selected]="u === fila.unidadActual"
                          [attr.data-unidad-original]="n.unidad"
                        >
                          {{ u }}
                        </option>
                      }
                    </select>
                  </td>
                  <td [id]="'vdr-' + comida() + '-' + n.nombre" [style.color]="fila.color">
                    {{ fila.porc }}%
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class ManualEditor {
  private readonly store = inject(NutritionStore);
  private readonly ui = inject(UiOverlay);
  private readonly platformId = inject(PLATFORM_ID);

  readonly comida = input.required<string>();
  readonly totales = input.required<Record<string, number | null>>();
  readonly vdr = input.required<Record<string, number>>();
  readonly distribucionVdr = input.required<Record<string, number>>();

  private readonly editorRootRef = viewChild<ElementRef<HTMLDivElement>>('editorRoot');

  readonly tablas = computed<TablaEditor[]>(() => {
    const key = this.comida();
    const calculo = this.totales();
    const vdr = this.vdr();
    const dist = this.distribucionVdr();
    const comidaReal = this.comida();
    const manualMap = this.store.datosManuales()[key] || {};
    const unidadesMap = this.store.datosManualesUnidades()[key] || {};

    const construirFilas = (nodo: unknown): FilaEditor[] => {
      const filas: FilaEditor[] = [];

      if (Array.isArray(nodo)) {
        (nodo as NutrienteInfo[]).forEach((n) => {
          const valManual = manualMap[n.nombre] || 0;
          const uA = unidadesMap[n.nombre] || n.unidad;
          const total = convertir(valManual, uA, n.unidad) + ((calculo[n.nombre] as number) || 0);

          const base = vdr[n.nombre] || 0;
          const porc = base ? ((total / base) * 100).toFixed(1) : '0.0';
          const pNum = parseFloat(porc);

          const obj = dist[comidaReal] ?? 25;
          const col = colorPorcentajeVDR(pNum, obj, false);

          const tipoOrig = tipoUnidad(n.unidad);
          let unidades: string[] = [];
          if (tipoOrig) {
            unidades = Object.keys(CONVERSIONES[tipoOrig]);
            if ((tipoOrig === 'masa' || tipoOrig === 'volumen') && n.nombre === 'Agua') {
              const tipoExtra = tipoOrig === 'masa' ? 'volumen' : 'masa';
              unidades = [...new Set([...unidades, ...Object.keys(CONVERSIONES[tipoExtra])])];
            }
          }

          filas.push({
            tipo: 'nutriente',
            nutriente: n,
            unidades,
            unidadActual: uA,
            porc,
            color: col,
          });
        });
      } else if (nodo && typeof nodo === 'object') {
        for (const [sub, subn] of Object.entries(nodo as Record<string, unknown>)) {
          filas.push({ tipo: 'subtitulo', subtitulo: sub });
          filas.push(...construirFilas(subn));
        }
      }

      return filas;
    };

    const res: TablaEditor[] = [];
    for (const [cat, contn] of Object.entries(NUTRIENTES)) {
      res.push({ categoria: cat, filas: construirFilas(contn) });
    }
    return res;
  });

  private formatNumber(v: number): string {
    if (isNaN(v)) return '';
    return parseFloat(v.toFixed(2)).toString();
  }

  enfocarCelda(event: MouseEvent): void {
    const td = event.currentTarget as HTMLElement;
    const editable = td.querySelector<HTMLElement>('[contenteditable="true"]');
    if (editable && event.target !== editable) {
      editable.focus();
    }
  }

  onCeldaInput(e: Event, n: NutrienteInfo): void {
    const target = e.target as HTMLElement;
    let texto = target.textContent || '';
    texto = texto.replace(/[^0-9.,]/g, '').replace(',', '.');
    const partes = texto.split('.');
    if (partes.length > 2) texto = partes[0] + '.' + partes.slice(1).join('');

    const match = texto.match(/^(\d{0,7})(?:\.(\d{0,2}))?$/);
    if (!match) {
      const [enteros, decimales] = texto.split('.');
      const ent = (enteros || '').slice(0, 7);
      const dec = (decimales || '').slice(0, 2);
      texto = dec ? `${ent}.${dec}` : ent;
    }

    if (isPlatformBrowser(this.platformId)) {
      const selRange = window.getSelection();
      const pos =
        selRange && selRange.rangeCount > 0 ? selRange.getRangeAt(0).startOffset : texto.length;

      target.textContent = texto;

      if (selRange) {
        const newRange = document.createRange();
        newRange.setStart(target.firstChild || target, Math.min(pos, texto.length));
        newRange.collapse(true);
        selRange.removeAllRanges();
        selRange.addRange(newRange);
      }
    }

    const valorNuevo = parseFloat(texto) || 0;
    const totales = this.store.calcularComida(this.comida());
    const totalActual = (totales[n.nombre] as number) || 0;

    if (totalActual + valorNuevo > 9999999) {
      target.blur();
      setTimeout(() => {
        this.ui.mostrarToast(
          `No se puede agregar más "${n.nombre}", superaría el límite de 7 dígitos enteros.`,
          2500,
        );
      }, 200);
      target.textContent = '';
      this.store.setDatoManual(this.comida(), n.nombre, 0);
      return;
    }

    this.store.setDatoManual(this.comida(), n.nombre, valorNuevo);
  }

  onUnidadChange(e: Event, n: NutrienteInfo): void {
    const selectEl = e.target as HTMLSelectElement;
    const nuevaUnidad = selectEl.value;
    const key = this.comida();
    const unidadActual = this.store.datosManualesUnidades()[key]?.[n.nombre] || n.unidad;
    const valActual = this.store.datosManuales()[key]?.[n.nombre] || 0;
    const valorConvertido = convertir(valActual, unidadActual, nuevaUnidad);

    const totales = this.store.calcularComida(this.comida());
    const totalActual = (totales[n.nombre] as number) || 0;

    if (totalActual + valorConvertido > 9999999) {
      if (isPlatformBrowser(this.platformId) && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setTimeout(() => {
        this.ui.mostrarToast(
          `No se puede convertir "${n.nombre}", superaría el límite de 7 dígitos enteros.`,
          2500,
        );
      }, 200);
      selectEl.value = unidadActual;
      return;
    }

    const fila = selectEl.closest('tr');
    const cel = fila?.querySelector<HTMLElement>('[contenteditable]');
    if (cel) {
      cel.textContent = valorConvertido ? this.formatNumber(valorConvertido) : '';
    }

    this.store.setDatoManual(key, n.nombre, valorConvertido);
    this.store.setUnidadManual(key, n.nombre, nuevaUnidad);
  }

  resetear(): void {
    const key = this.comida();
    this.store.limpiarManual(key);
    const root = this.editorRootRef()?.nativeElement;
    if (!root) return;

    root.querySelectorAll<HTMLElement>('[contenteditable][data-nutriente]').forEach((cel) => {
      cel.textContent = '';
    });
    root.querySelectorAll<HTMLSelectElement>('select[data-unidad]').forEach((sel) => {
      const optOrig = sel.querySelector<HTMLOptionElement>('option[data-unidad-original]');
      const uOrig = optOrig?.dataset['unidadOriginal'];
      if (uOrig) sel.value = uOrig;
    });
  }

  aplicarManual(): boolean {
    const root = this.editorRootRef()?.nativeElement;
    if (!root) return false;

    const key = this.comida();
    const celdas = Array.from(
      root.querySelectorAll<HTMLElement>('[contenteditable][data-nutriente]'),
    );
    let huboCambios = false;

    for (const celda of celdas) {
      const nombre = celda.dataset['nutriente'];
      if (!nombre) continue;

      const valorCrudo = (celda.textContent || '').trim().replace(',', '.');
      const cantidadIngresada = parseFloat(valorCrudo);
      if (!isFinite(cantidadIngresada) || cantidadIngresada === 0) continue;

      const fila = celda.closest('tr');
      const sel = fila?.querySelector<HTMLSelectElement>(`select[data-unidad="${nombre}"]`);
      const unidadBase = NUTRIENTES_PLANOS.find((n) => n.nombre === nombre)?.unidad;
      const unidadIngresada =
        sel?.value || this.store.datosManualesUnidades()[key]?.[nombre] || unidadBase;

      if (!unidadIngresada || !unidadBase) continue;

      const cantidadConvertida = convertir(cantidadIngresada, unidadIngresada, unidadBase);
      const agregado = this.store.agregarItemManual(
        this.comida(),
        nombre,
        cantidadIngresada,
        unidadIngresada,
        cantidadConvertida,
      );

      if (!agregado) {
        celda.textContent = '';
        continue;
      }

      huboCambios = true;
      celda.textContent = '';
      this.store.setDatoManual(key, nombre, 0);

      if (sel) {
        const opcionOriginal = sel.querySelector<HTMLOptionElement>('option[data-unidad-original]');
        const unidadOriginal = opcionOriginal?.dataset['unidadOriginal'] || unidadBase;
        sel.value = unidadOriginal;
        this.store.setUnidadManual(key, nombre, unidadOriginal);
      }
    }

    return huboCambios;
  }
}
