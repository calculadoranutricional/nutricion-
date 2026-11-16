import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  ConfirmacionState,
  ConfirmOpcionesBoton,
  PanelId,
  TotalViewMode,
} from '../models/nutrition.model';

interface ToastItem {
  mensaje: string;
  duracion: number;
}

@Injectable({
  providedIn: 'root',
})
export class UiOverlay {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);

  readonly activePanel = signal<PanelId | null>(null);
  readonly activePage = signal<string | null>(null);

  readonly totalFocusRequest = signal<{ mode: TotalViewMode; seq: number } | null>(null);

  readonly toastVisible = signal(false);
  readonly toastMensaje = signal('');

  readonly confirmacion = signal<ConfirmacionState>({
    visible: false,
    mostrar: false,
    mensaje: '',
    textoAceptar: 'Eliminar',
    colorAceptar: '',
    colorTexto: '',
  });

  private toastQueue: ToastItem[] = [];
  private toastActivo = false;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private totalRequestSeq = 0;

  openMealPage(comida: string): void {
    this.activePage.set(comida);
    this.syncScroll();
  }

  openTotalPage(): void {
    this.activePage.set('total');
    this.syncScroll();
  }

  closePage(): void {
    this.activePage.set(null);
    this.syncScroll();
  }

  requestTotalView(mode: TotalViewMode): void {
    this.totalRequestSeq += 1;
    this.totalFocusRequest.set({ mode, seq: this.totalRequestSeq });
    this.openTotalPage();
  }

  openPanel(id: PanelId): void {
    this.activePanel.set(id);
    this.syncScroll();
  }

  closePanel(id: PanelId): void {
    if (this.activePanel() === id) {
      this.activePanel.set(null);
    }
    this.syncScroll();
  }

  togglePanel(id: PanelId): void {
    if (this.activePanel() === id) {
      this.activePanel.set(null);
    } else {
      this.activePanel.set(id);
    }
    this.syncScroll();
  }

  syncScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const activePanel = this.activePanel();
    const activePage = this.activePage();
    const algunOverlayAbierto = activePanel !== null || activePage !== null;
    this.doc.body.classList.toggle('panel-abierto', algunOverlayAbierto);
    this.doc.documentElement.classList.toggle('panel-abierto', algunOverlayAbierto);

    if (activePanel) {
      requestAnimationFrame(() => {
        const panelEl = this.doc.getElementById(activePanel);
        if (panelEl) panelEl.scrollTop = 0;
      });
    } else if (activePage) {
      requestAnimationFrame(() => {
        const pageEl = this.doc.getElementById(activePage === 'total' ? 'total-page' : 'meal-page');
        if (pageEl) pageEl.scrollTop = 0;
      });
    }
  }

  mostrarToast(mensaje: string, duracion = 1000): void {
    this.toastQueue.push({ mensaje, duracion });
    this.procesarToast();
  }

  cerrarToastActual(): void {
    if (!this.toastActivo) return;
    if (this.toastTimeoutId !== null) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
    this.toastVisible.set(false);
    if (isPlatformBrowser(this.platformId)) {
      this.doc.body.style.overflow = '';
    }
    this.toastActivo = false;
    setTimeout(() => this.procesarToast(), 200);
  }

  private procesarToast(): void {
    if (this.toastActivo || this.toastQueue.length === 0) return;

    const item = this.toastQueue.shift()!;
    this.toastMensaje.set(item.mensaje);
    this.toastVisible.set(true);
    if (isPlatformBrowser(this.platformId)) {
      this.doc.body.style.overflow = 'hidden';
    }
    this.toastActivo = true;

    this.toastTimeoutId = setTimeout(() => {
      this.cerrarToastActual();
    }, item.duracion);
  }

  mostrarConfirmacion(
    mensaje: string,
    onAceptar?: () => void,
    onCancelar?: () => void,
    opcionesBoton: ConfirmOpcionesBoton = {},
  ): void {
    if (isPlatformBrowser(this.platformId)) {
      this.doc.body.style.overflow = 'hidden';
      this.doc.documentElement.style.overflow = 'hidden';
    }

    this.confirmacion.set({
      visible: true,
      mostrar: false,
      mensaje,
      textoAceptar: opcionesBoton.textoAceptar ?? 'Aceptar',
      colorAceptar: opcionesBoton.colorAceptar ?? '',
      colorTexto: opcionesBoton.colorTexto ?? '',
      onAceptar,
      onCancelar,
    });

    setTimeout(() => {
      this.confirmacion.update((s) => ({ ...s, mostrar: true }));
    }, 0);
  }

  cerrarConfirmacion(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.doc.body.style.overflow = '';
      this.doc.documentElement.style.overflow = '';
    }
    this.confirmacion.update((s) => ({ ...s, mostrar: false }));
    setTimeout(() => {
      this.confirmacion.update((s) => ({
        ...s,
        visible: false,
        onAceptar: undefined,
        onCancelar: undefined,
      }));
    }, 0);
  }

  aceptarConfirmacion(): void {
    const cb = this.confirmacion().onAceptar;
    setTimeout(() => {
      this.cerrarConfirmacion();
      if (cb) cb();
    }, 100);
  }

  cancelarConfirmacion(inmediato = false): void {
    const cb = this.confirmacion().onCancelar;
    if (inmediato) {
      this.cerrarConfirmacion();
      if (cb) cb();
      return;
    }
    setTimeout(() => {
      this.cerrarConfirmacion();
      if (cb) cb();
    }, 100);
  }
}
