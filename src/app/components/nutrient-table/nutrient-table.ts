import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NUTRIENTES } from '../../data/nutrients.data';
import { NutrienteInfo } from '../../models/nutrition.model';
import { colorPorcentajeVDR } from '../../utils/nutrition.utils';

interface FilaNutriente {
  tipo: 'subtitulo' | 'nutriente';
  subtitulo?: string;
  nombre?: string;
  valor?: string;
  unidad?: string;
  porcTxt?: string;
  color?: string;
  descripcion?: string;
}

interface TablaCategoria {
  categoria: string;
  filas: FilaNutriente[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-nutrient-table',
  template: `
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
            } @else {
              <tr>
                <td class="nombre-nutriente">
                  <button
                    type="button"
                    (click)="toggleDescripcion(fila.nombre!)"
                    style="all:unset;display:block;width:100%;text-align:left;cursor:pointer;line-height:inherit;"
                  >
                    {{ fila.nombre }}
                  </button>
                </td>
                <td>{{ fila.valor }}</td>
                <td>{{ fila.unidad }}</td>
                <td [style.color]="fila.color">{{ fila.porcTxt }}</td>
              </tr>
              <tr
                class="descripcion-nutriente"
                [class.hidden]="!descripcionesVisibles()[fila.nombre!]"
              >
                <td colspan="4" style="font-size:.8rem;color:var(--title-color);font-weight:500;background:var(--surface);">
                  {{ fila.descripcion || 'Sin descripción disponible.' }}
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    }
  `,
})
export class NutrientTable {
  readonly totales = input.required<Record<string, number | null>>();
  readonly vdr = input.required<Record<string, number>>();
  readonly distribucionVdr = input.required<Record<string, number>>();
  readonly comida = input.required<string>();
  readonly mostrarTodos = input<boolean>(false);

  readonly descripcionesVisibles = signal<Record<string, boolean>>({});

  readonly tablas = computed<TablaCategoria[]>(() => {
    const totales = this.totales();
    const vdr = this.vdr();
    const dist = this.distribucionVdr();
    const comida = this.comida();
    const esTotal = comida === 'total';
    const mostrarTodos = this.mostrarTodos();
    const resultado: TablaCategoria[] = [];

    const construirFilas = (nodo: unknown): FilaNutriente[] => {
      const filas: FilaNutriente[] = [];

      if (Array.isArray(nodo)) {
        (nodo as NutrienteInfo[]).forEach((n) => {
          const rawVal = totales[n.nombre];
          let val: string;
          if (rawVal == null || rawVal === 0) {
            val = '0.00';
          } else if (Number.isInteger(rawVal)) {
            val = String(rawVal);
          } else {
            val = rawVal.toFixed(2);
          }

          if (mostrarTodos || parseFloat(val) !== 0) {
            const base = vdr[n.nombre] || 0;
            let porcTxt = '-';
            let color = 'var(--text)';

            if (n.nombre !== 'pH (alimento)' && n.nombre !== 'pH estimado en estómago') {
              const porc = base ? ((parseFloat(val) / base) * 100).toFixed(1) : '0.0';
              const p = parseFloat(porc);
              porcTxt = porc + '%';

              if (esTotal) {
                color = colorPorcentajeVDR(p, 100, true);
              } else {
                const obj = dist[comida] ?? 25;
                color = colorPorcentajeVDR(p, obj, false);
              }
            }

            filas.push({
              tipo: 'nutriente',
              nombre: n.nombre,
              valor: val,
              unidad: n.unidad,
              porcTxt,
              color,
              descripcion: n.descripcion,
            });
          }
        });
      } else if (nodo && typeof nodo === 'object') {
        for (const [sub, subn] of Object.entries(nodo as Record<string, unknown>)) {
          const subFilas = construirFilas(subn);
          if (subFilas.length > 0) {
            filas.push({ tipo: 'subtitulo', subtitulo: sub });
            filas.push(...subFilas);
          }
        }
      }

      return filas;
    };

    for (const [cat, cont] of Object.entries(NUTRIENTES)) {
      if (esTotal && cat.toLowerCase().includes('fisicoquímicas')) continue;
      const filas = construirFilas(cont);
      if (filas.length > 0) {
        resultado.push({ categoria: cat, filas });
      }
    }

    return resultado;
  });

  toggleDescripcion(nombre: string): void {
    this.descripcionesVisibles.update((map) => ({
      ...map,
      [nombre]: !map[nombre],
    }));
  }
}
