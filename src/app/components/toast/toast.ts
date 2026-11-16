import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiOverlay } from '../../services/ui-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  template: `
    <div #toastEl id="toast" [class.mostrar]="ui.toastVisible()">
      <div class="toast-contenido" [innerHTML]="mensajeSeguro()"></div>
    </div>
  `,
})
export class Toast {
  readonly ui = inject(UiOverlay);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly toastRef = viewChild<ElementRef<HTMLDivElement>>('toastEl');

  private readonly clickHandler = (event: MouseEvent) => {
    const el = this.toastRef()?.nativeElement;
    if (el && event.target === el) {
      this.ui.cerrarToastActual();
    }
  };

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const el = this.toastRef()?.nativeElement;
      el?.addEventListener('click', this.clickHandler);
    });

    this.destroyRef.onDestroy(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const el = this.toastRef()?.nativeElement;
      el?.removeEventListener('click', this.clickHandler);
    });
  }

  mensajeSeguro(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.ui.toastMensaje());
  }
}
