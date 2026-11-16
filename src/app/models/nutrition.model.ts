export interface NutrienteInfo {
  nombre: string;
  unidad: string;
  descripcion: string;
}

export interface NutrientePlano extends NutrienteInfo {
  niveles: string[];
}

export type NodoNutrientes = NutrienteInfo[] | Record<string, unknown>;

export interface Alimento {
  nombre: string;
  categoria?: string;
  unidad?: string;
  esManual?: boolean;
  displayManual?: string;
  composicion: Record<string, number>;
}

export interface ComidaItem {
  alimento: Alimento;
  peso: number;
}

export type PanelId = 'panel' | 'panel2' | 'settings';

export type TotalViewMode = 'summary' | 'stats' | 'progress';

export interface ConfirmOpcionesBoton {
  textoAceptar?: string;
  colorAceptar?: string;
  colorTexto?: string;
}

export interface ConfirmacionState {
  visible: boolean;
  mostrar: boolean;
  mensaje: string;
  textoAceptar: string;
  colorAceptar: string;
  colorTexto: string;
  onAceptar?: () => void;
  onCancelar?: () => void;
}
