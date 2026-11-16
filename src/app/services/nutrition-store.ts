import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  COMIDAS,
  DISTRIBUCION_VDR_BASE,
  NUTRIENTES_PLANOS,
  VDR_BASE,
} from '../data/nutrients.data';
import { Alimento, ComidaItem } from '../models/nutrition.model';
import { calcularTotalesComida } from '../utils/nutrition.utils';
import { UiOverlay } from './ui-overlay';

const STORAGE_KEY = 'calculadora_nutricional_state_v2';
const LEGACY_STORAGE_KEY = 'calculadora_nutricional_state_v1';

interface PersistedState {
  vdr: Record<string, number>;
  distribucionVDR: Record<string, number>;
  datosComidas: Record<string, ComidaItem[]>;
}

interface LegacyPersistedState {
  usuariosMap?: Record<string, { vdr?: Record<string, number>; distribucionVDR?: Record<string, number> }>;
  usuarioActivo?: string;
  datosComidas?: Record<string, ComidaItem[]>;
}

@Injectable({
  providedIn: 'root',
})
export class NutritionStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  private readonly ui = inject(UiOverlay);

  readonly vdr = signal<Record<string, number>>({ ...VDR_BASE });
  readonly distribucionVDR = signal<Record<string, number>>({ ...DISTRIBUCION_VDR_BASE });
  readonly distribucionTemp = signal<Record<string, number> | undefined>(undefined);

  readonly datosComidas = signal<Record<string, ComidaItem[]>>({});
  readonly mostrarTodosLosNutrientes = signal<Record<string, boolean>>({});
  readonly datosManuales = signal<Record<string, Record<string, number>>>({});
  readonly datosManualesUnidades = signal<Record<string, Record<string, string>>>({});

  readonly totalItemsActivo = computed<ComidaItem[]>(() => {
    const comidasMap = this.datosComidas();
    const result: ComidaItem[] = [];
    COMIDAS.forEach((c) => {
      (comidasMap[c] || []).forEach((item) => result.push(item));
    });
    return result;
  });

  readonly totalesTotalActivo = computed<Record<string, number | null>>(() => {
    return calcularTotalesComida(this.totalItemsActivo(), true);
  });

  constructor() {
    this.inicializarEstado();
    this.cargarDesdeStorage();
  }

  private inicializarEstado(): void {
    const defaultComidas: Record<string, ComidaItem[]> = {};
    const defaultMostrar: Record<string, boolean> = {};

    COMIDAS.forEach((c) => {
      defaultComidas[c] = [];
      defaultMostrar[c] = false;
    });

    this.vdr.set({ ...VDR_BASE });
    this.distribucionVDR.set({ ...DISTRIBUCION_VDR_BASE });
    this.distribucionTemp.set(undefined);
    this.datosComidas.set(defaultComidas);
    this.mostrarTodosLosNutrientes.set(defaultMostrar);
  }

  private cargarDesdeStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed && parsed.datosComidas) {
          if (parsed.vdr) this.vdr.set({ ...VDR_BASE, ...parsed.vdr });
          if (parsed.distribucionVDR) {
            this.distribucionVDR.set({ ...DISTRIBUCION_VDR_BASE, ...parsed.distribucionVDR });
          }
          const nextComidas: Record<string, ComidaItem[]> = {};
          COMIDAS.forEach((c) => {
            nextComidas[c] = parsed.datosComidas[c] || [];
          });
          this.datosComidas.set(nextComidas);
          return;
        }
      }

      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as LegacyPersistedState;
        const activo = legacy.usuarioActivo || 'Calculadora Nutricional';
        const userObj = legacy.usuariosMap?.[activo] || legacy.usuariosMap?.['Calculadora Nutricional'];
        if (userObj?.vdr) this.vdr.set({ ...VDR_BASE, ...userObj.vdr });
        if (userObj?.distribucionVDR) {
          this.distribucionVDR.set({ ...DISTRIBUCION_VDR_BASE, ...userObj.distribucionVDR });
        }
        const nextComidas: Record<string, ComidaItem[]> = {};
        COMIDAS.forEach((c) => {
          nextComidas[c] = legacy.datosComidas?.[`${activo}-${c}`] || [];
        });
        this.datosComidas.set(nextComidas);
      }
    } catch {
      // fallback a valores por defecto
    }
  }

  private guardarEnStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const payload: PersistedState = {
        vdr: this.vdr(),
        distribucionVDR: this.distribucionVDR(),
        datosComidas: this.datosComidas(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignorar errores de cuota
    }
  }

  obtenerItemsComida(comida: string): ComidaItem[] {
    if (comida === 'total') {
      return this.totalItemsActivo();
    }
    return this.datosComidas()[comida] || [];
  }

  calcularComida(comida: string): Record<string, number | null> {
    const items = this.obtenerItemsComida(comida);
    return calcularTotalesComida(items, comida === 'total');
  }

  agregarAlimento(
    comida: string,
    alimento: Alimento,
    peso: number,
  ): { ok: boolean; focusPeso?: boolean } {
    if (!peso || isNaN(peso) || peso <= 0) {
      this.ui.mostrarToast('Peso inválido. Ingresa un valor mayor a 0.');
      return { ok: false, focusPeso: true };
    }

    const totalesActuales = this.calcularComida(comida);
    for (const [nutriente, valor] of Object.entries(alimento.composicion || {})) {
      const nuevoValor = ((totalesActuales[nutriente] as number) || 0) + valor * (peso / 100);
      if (nuevoValor > 9999999) {
        this.ui.mostrarToast(
          `No se puede agregar "${alimento.nombre}" porque "${nutriente}" superaría el límite de 7 dígitos enteros.`,
          2500,
        );
        return { ok: false };
      }
    }

    this.datosComidas.update((map) => ({
      ...map,
      [comida]: [...(map[comida] || []), { alimento, peso }],
    }));

    this.guardarEnStorage();
    return { ok: true };
  }

  agregarItemManual(
    comida: string,
    nombre: string,
    cantidadIngresada: number,
    unidadIngresada: string,
    cantidadConvertida: number,
  ): boolean {
    const totalesActuales = this.calcularComida(comida);
    const actualEnBase = (totalesActuales[nombre] as number) || 0;
    if (actualEnBase + cantidadConvertida > 9999999) {
      return false;
    }

    const nuevoItem: ComidaItem = {
      alimento: {
        nombre,
        unidad: unidadIngresada,
        esManual: true,
        displayManual: `${nombre} ${cantidadIngresada} ${unidadIngresada}`,
        composicion: { [nombre]: cantidadConvertida },
      },
      peso: 100,
    };

    this.datosComidas.update((map) => ({
      ...map,
      [comida]: [...(map[comida] || []), nuevoItem],
    }));

    this.guardarEnStorage();
    return true;
  }

  eliminarItem(comida: string, index: number): void {
    this.datosComidas.update((map) => {
      const actuales = [...(map[comida] || [])];
      if (index >= 0 && index < actuales.length) {
        actuales.splice(index, 1);
      }
      return { ...map, [comida]: actuales };
    });

    this.guardarEnStorage();
  }

  toggleMostrarTodosNutrientes(comida: string): void {
    this.mostrarTodosLosNutrientes.update((map) => ({
      ...map,
      [comida]: !map[comida],
    }));
  }

  setDatoManual(comida: string, nutriente: string, valor: number): void {
    this.datosManuales.update((map) => ({
      ...map,
      [comida]: { ...(map[comida] || {}), [nutriente]: valor },
    }));
  }

  setUnidadManual(comida: string, nutriente: string, unidad: string): void {
    this.datosManualesUnidades.update((map) => ({
      ...map,
      [comida]: { ...(map[comida] || {}), [nutriente]: unidad },
    }));
  }

  limpiarManual(comida: string): void {
    this.datosManuales.update((map) => {
      const current = { ...(map[comida] || {}) };
      Object.keys(current).forEach((k) => (current[k] = 0));
      return { ...map, [comida]: current };
    });
    this.datosManualesUnidades.update((map) => ({
      ...map,
      [comida]: {},
    }));
  }

  actualizarVDR(nuevoVdr: Record<string, number>): void {
    this.vdr.update((prev) => ({ ...prev, ...nuevoVdr }));
    this.guardarEnStorage();
  }

  actualizarDistribucion(nuevaDist: Record<string, number>): void {
    this.distribucionVDR.set({ ...nuevaDist });
    this.distribucionTemp.set(undefined);
    this.guardarEnStorage();
  }

  setDistribucionTemp(comida: string, valor: number): void {
    const base = this.distribucionTemp()
      ? { ...this.distribucionTemp() }
      : { ...this.distribucionVDR() };
    base[comida] = valor;
    this.distribucionTemp.set(base);
  }

  descartarDistribucionTemp(): void {
    this.distribucionTemp.set(undefined);
  }

  vaciarComidas(): void {
    const next: Record<string, ComidaItem[]> = {};
    COMIDAS.forEach((c) => {
      next[c] = [];
    });
    this.datosComidas.set(next);
    this.guardarEnStorage();
    this.ui.mostrarToast('Comidas vaciadas');
  }

  restaurarMetas(): void {
    this.vdr.set({ ...VDR_BASE });
    this.distribucionVDR.set({ ...DISTRIBUCION_VDR_BASE });
    this.distribucionTemp.set(undefined);
    this.guardarEnStorage();
    this.ui.mostrarToast('Metas VDR% restauradas a los valores base');
  }

  enfocarPrimerPeso(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const pesoDiv = this.doc.getElementById(`peso-${COMIDAS[0]}`);
      if (pesoDiv) pesoDiv.focus();
    }, 1001);
  }

  compartirResultados(comida: string): string {
    const totales = this.calcularComida(comida);
    const vdrMap = this.vdr();
    const distMap = this.distribucionVDR();

    const titulo = comida === 'total' ? '📊 Resultados Totales' : `🍽️ ${comida}`;
    let texto = `${titulo}\n\n`;

    NUTRIENTES_PLANOS.forEach((n) => {
      const val = +(Number(totales[n.nombre]) || 0).toFixed(2);
      if (val === 0) return;

      const base = vdrMap[n.nombre] || 0;
      let porcTxt = '-';
      let icono = '';

      if (n.nombre !== 'pH (alimento)' && n.nombre !== 'pH estimado en estómago') {
        if (base) {
          const porc = +((val / base) * 100).toFixed(1);
          porcTxt = porc + '%';

          if (comida === 'total') {
            icono =
              porc >= 95 && porc <= 105
                ? '✔️'
                : (porc >= 90 && porc < 95) || (porc > 105 && porc <= 110)
                  ? '❗'
                  : '❌';
          } else {
            const obj = distMap[comida] || 25;
            const m = obj * 0.05;
            icono =
              porc >= obj - m && porc <= obj + m
                ? '✔️'
                : (porc >= obj - 2 * m && porc < obj - m) ||
                    (porc > obj + m && porc <= obj + 2 * m)
                  ? '❗'
                  : '❌';
          }
        }
      }

      texto += `${icono} ${n.nombre}: ${val} ${n.unidad} (${porcTxt})\n`;
    });

    if (isPlatformBrowser(this.platformId) && navigator.clipboard) {
      navigator.clipboard.writeText(texto).catch((err) => {
        console.error('Error copiando al portapapeles:', err);
      });
    }

    const mensajeToast =
      comida === 'total'
        ? 'Total copiado correctamente.'
        : `${comida.charAt(0).toUpperCase() + comida.slice(1)} copiado correctamente.`;

    this.ui.mostrarToast(mensajeToast);
    return texto;
  }
}
