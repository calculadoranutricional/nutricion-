import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiOverlay } from '../../services/ui-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-alert-modal',
  template: `
    <div
      #modalEl
      id="alerta-modal"
      [class.hidden]="!ui.confirmacion().visible"
      [class.mostrar]="ui.confirmacion().mostrar"
    >
      <div class="alerta-contenido">
        <p id="alerta-texto" [innerHTML]="mensajeSeguro()"></p>
        <div style="display:flex; justify-content:center; gap:12px;">
          <button type="button" id="alerta-cancelar" (click)="ui.cancelarConfirmacion()">
            Cancelar
          </button>
          <button
            type="button"
            id="alerta-aceptar"
            [style.backgroundColor]="ui.confirmacion().colorAceptar || null"
            [style.color]="ui.confirmacion().colorTexto || null"
            (click)="ui.aceptarConfirmacion()"
          >
            {{ ui.confirmacion().textoAceptar }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AlertModal {
  readonly ui = inject(UiOverlay);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modalRef = viewChild<ElementRef<HTMLDivElement>>('modalEl');

  private touchHandler = (e: TouchEvent) => e.preventDefault();
  private clickHandler = (e: MouseEvent) => {
    const modal = this.modalRef()?.nativeElement;
    if (modal && e.target === modal) {
      this.ui.cancelarConfirmacion(true);
    }
  };
  private touchAttached = false;

  constructor() {
    effect(() => {
      const visible = this.ui.confirmacion().visible;
      if (!isPlatformBrowser(this.platformId)) return;
      const modal = this.modalRef()?.nativeElement;
      if (!modal) return;

      if (visible && !this.touchAttached) {
        modal.addEventListener('touchmove', this.touchHandler, { passive: false });
        modal.addEventListener('click', this.clickHandler);
        this.touchAttached = true;
      } else if (!visible && this.touchAttached) {
        modal.removeEventListener('touchmove', this.touchHandler);
        modal.removeEventListener('click', this.clickHandler);
        this.touchAttached = false;
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.touchAttached && isPlatformBrowser(this.platformId)) {
        const modal = this.modalRef()?.nativeElement;
        modal?.removeEventListener('touchmove', this.touchHandler);
        modal?.removeEventListener('click', this.clickHandler);
        this.doc.body.style.overflow = '';
        this.doc.documentElement.style.overflow = '';
      }
    });
  }

  mensajeSeguro(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.ui.confirmacion().mensaje);
  }
}
