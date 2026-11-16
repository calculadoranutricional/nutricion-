import { COLORES_VDR, NUTRIENTES_PLANOS } from '../data/nutrients.data';
import { ComidaItem } from '../models/nutrition.model';

export const CONVERSIONES: Record<string, Record<string, number>> = {
  energia: { kcal: 1, kJ: 4.184 },
  masa: { g: 1, mg: 1000, µg: 1e6 },
  volumen: { L: 1, ml: 1000 },
};

export function tipoUnidad(u: string): 'energia' | 'masa' | 'volumen' | null {
  if (['kcal', 'kJ'].includes(u)) return 'energia';
  if (['g', 'mg', 'µg'].includes(u)) return 'masa';
  if (['L', 'ml'].includes(u)) return 'volumen';
  return null;
}

const DENSIDADES: Record<string, number> = {
  Agua: 1,
};

export function convertir(v: number, d: string, h: string, sustancia = 'Agua'): number {
  const tipoD = tipoUnidad(d);
  const tipoH = tipoUnidad(h);

  if (!tipoD || !tipoH) return v;

  if (tipoD === tipoH) {
    const c = CONVERSIONES[tipoD];
    if (!c[d] || !c[h]) return v;
    return v * (c[h] / c[d]);
  }

  if (sustancia !== 'Agua') return v;

  const densidad = DENSIDADES[sustancia];
  if (!densidad) return v;

  if (tipoD === 'volumen' && tipoH === 'masa') {
    const volML = v * (CONVERSIONES['volumen']['ml'] / CONVERSIONES['volumen'][d]);
    const gramos = volML * densidad;
    return gramos * (CONVERSIONES['masa'][h] / CONVERSIONES['masa']['g']);
  }

  if (tipoD === 'masa' && tipoH === 'volumen') {
    const gramos = v / CONVERSIONES['masa'][d];
    const volML = gramos / densidad;
    return volML * (CONVERSIONES['volumen'][h] / CONVERSIONES['volumen']['ml']);
  }

  return v;
}

export function calcularPHComida(alimentosComida: ComidaItem[]): {
  pH: number | null;
  pHEst: number | null;
} {
  let sumaH = 0;
  let sumaHEst = 0;
  let pesoConPH = 0;
  let pesoConHEst = 0;

  (alimentosComida || []).forEach(({ alimento, peso }) => {
    const pHAlimento = alimento?.composicion?.['pH (alimento)'];
    const pHEst = alimento?.composicion?.['pH estimado en estómago'];

    if (Number.isFinite(pHAlimento)) {
      sumaH += Math.pow(10, -pHAlimento) * peso;
      pesoConPH += peso;
    }
    if (Number.isFinite(pHEst)) {
      sumaHEst += Math.pow(10, -pHEst) * peso;
      pesoConHEst += peso;
    }
  });

  const pH = pesoConPH > 0 && sumaH > 0 ? -Math.log10(sumaH / pesoConPH) : null;
  const pHEst = pesoConHEst > 0 && sumaHEst > 0 ? -Math.log10(sumaHEst / pesoConHEst) : null;

  return { pH, pHEst };
}

export function calcularTotalesComida(
  items: ComidaItem[],
  esTotal: boolean,
): Record<string, number | null> {
  const totales: Record<string, number | null> = {};
  NUTRIENTES_PLANOS.forEach((n) => (totales[n.nombre] = 0));

  items.forEach(({ alimento, peso }) => {
    for (const [nombre, valor] of Object.entries(alimento.composicion || {})) {
      totales[nombre] = ((totales[nombre] as number) || 0) + (valor * peso) / 100;
    }
  });

  if (!esTotal) {
    const { pH, pHEst } = calcularPHComida(items);
    totales['pH (alimento)'] = pH != null && Number.isFinite(pH) ? Number(pH.toFixed(2)) : null;
    totales['pH estimado en estómago'] =
      pHEst != null && Number.isFinite(pHEst) ? Number(pHEst.toFixed(2)) : null;
  }

  return totales;
}

export function colorPorcentajeVDR(p: number, obj: number, esTotal: boolean): string {
  if (esTotal) {
    if (p >= 95 && p <= 105) return COLORES_VDR.verde;
    if ((p >= 90 && p < 95) || (p > 105 && p <= 110)) return COLORES_VDR.amarillo;
    return COLORES_VDR.rojo;
  }
  const m = obj * 0.05;
  if (p >= obj - m && p <= obj + m) return COLORES_VDR.verde;
  if ((p >= obj - 2 * m && p < obj - m) || (p > obj + m && p <= obj + 2 * m)) {
    return COLORES_VDR.amarillo;
  }
  return COLORES_VDR.rojo;
}
