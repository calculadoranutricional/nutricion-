import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';

@Directive({
  selector: '[appEditableInput]',
  host: {
    '(input)': 'onInput()',
    '(paste)': 'onPaste($event)',
    '(keydown)': 'onKeydown($event)',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class EditableInput implements OnInit {
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);

  readonly maxDigitos = input<number>(7);
  readonly soloEnteros = input<boolean>(false);
  readonly esBuscador = input<boolean>(false);
  readonly permitirDecimales = input<boolean>(false);

  private get el(): HTMLElement {
    return this.elRef.nativeElement;
  }

  ngOnInit(): void {
    this.el.setAttribute('data-input-activado', 'true');
  }

  private setCaretToEnd(target: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId) || !target) return;
    target.focus();

    const range = this.doc.createRange();
    const sel = window.getSelection();
    if (!sel) return;

    if (!target.lastChild) target.appendChild(this.doc.createTextNode(''));
    let lastNode: Node | null = target.lastChild;
    while (lastNode && lastNode.nodeType !== Node.TEXT_NODE) {
      lastNode = lastNode.lastChild || lastNode.previousSibling;
    }
    if (!lastNode) {
      lastNode = this.doc.createTextNode('');
      target.appendChild(lastNode);
    }

    range.setStart(lastNode, (lastNode.textContent || '').length);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
  }

  onInput(): void {
    if (this.permitirDecimales()) return;

    const max = this.maxDigitos();

    if (this.esBuscador()) {
      const texto = this.el.textContent || '';
      if (texto.length > max) {
        this.el.textContent = texto.slice(0, max);
        this.setCaretToEnd(this.el);
      }
      return;
    }

    if (this.soloEnteros() || this.el.getAttribute('inputmode') === 'decimal') {
      let texto = this.el.textContent || '';
      const original = texto;
      texto = texto.replace(/[^0-9]/g, '');
      if (texto.length > max) texto = texto.slice(0, max);

      if (texto !== original) {
        const pos = window.getSelection()?.focusOffset ?? texto.length;
        this.el.textContent = texto;
        if (pos >= texto.length - 1) this.setCaretToEnd(this.el);
      }
      return;
    }

    const original = this.el.textContent || '';
    if (original.length > max) {
      this.el.textContent = original.slice(0, max);
      this.setCaretToEnd(this.el);
    }
  }

  onPaste(e: ClipboardEvent): void {
    if (this.permitirDecimales()) return;
    e.preventDefault();

    const max = this.maxDigitos();
    const texto = e.clipboardData?.getData('text') || '';

    if (!this.esBuscador() && (this.soloEnteros() || this.el.getAttribute('inputmode') === 'decimal')) {
      this.el.textContent = texto.replace(/[^0-9]/g, '').slice(0, max);
    } else {
      this.el.textContent = texto.slice(0, max);
    }
    this.setCaretToEnd(this.el);
  }

  onKeydown(e: KeyboardEvent): void {
    if (this.esBuscador()) {
      if (e.key === 'Enter') e.preventDefault();
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const contenedor =
        this.el.closest('#panel, #panel2, #meal-page') || this.doc.body;
      const visibles = Array.from(
        contenedor.querySelectorAll<HTMLElement>('[contenteditable="true"]'),
      ).filter((x) => x.offsetParent !== null);
      const idx = visibles.indexOf(this.el);

      let siguiente: HTMLElement | undefined;
      if (e.shiftKey && idx > 0) siguiente = visibles[idx - 1];
      else if (!e.shiftKey && idx < visibles.length - 1) siguiente = visibles[idx + 1];

      if (siguiente) this.setCaretToEnd(siguiente);
    }
  }

  onFocus(): void {
    this.setCaretToEnd(this.el);
  }

  onBlur(): void {
    if ((this.el.textContent || '').trim() === '') {
      this.el.innerHTML = '';
    }
  }
}
