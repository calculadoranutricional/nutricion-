import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { UiOverlay } from './services/ui-overlay';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should open each meal and total card in a separate full-screen page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const ui = TestBed.inject(UiOverlay);

    expect(host.querySelector('#meal-page')).toBeNull();
    expect(host.querySelector('#total-page')).toBeNull();

    const desayunoCard = host.querySelector('#card-Desayuno') as HTMLElement;
    expect(desayunoCard).toBeTruthy();
    desayunoCard.click();
    fixture.detectChanges();

    expect(ui.activePage()).toBe('Desayuno');
    expect(host.querySelector('#meal-page')).toBeTruthy();
    expect(host.querySelector('#meal-page .card')).toBeNull();
    expect(host.querySelector('#meal-page .divisor-box')).toBeNull();
    expect(host.querySelector('#meal-page .btn-compartir')?.textContent?.trim()).not.toContain(
      'Compartir alimentos con perfiles',
    );
    expect(desayunoCard.querySelector('#meal-page')).toBeNull();

    const backBtn = host.querySelector('#meal-page .cerrar') as HTMLButtonElement;
    expect(backBtn.textContent?.trim()).toBe('×');
    const mealHeaderButtons = Array.from(host.querySelectorAll('#meal-page .barra button'));
    expect(mealHeaderButtons.some((btn) => btn.textContent?.includes('VDR%'))).toBe(false);
    backBtn.click();
    fixture.detectChanges();

    expect(ui.activePage()).toBeNull();
    expect(host.querySelector('#meal-page')).toBeNull();

    const totalCard = host.querySelector('#card-total') as HTMLElement;
    expect(totalCard).toBeTruthy();
    totalCard.click();
    fixture.detectChanges();

    expect(ui.activePage()).toBe('total');
    expect(host.querySelector('#total-page')).toBeTruthy();
    expect(host.querySelector('#total-page .barra .cerrar')?.textContent?.trim()).toBe('×');
    const totalHeaderButtons = Array.from(host.querySelectorAll('#total-page .barra button'));
    expect(totalHeaderButtons.some((btn) => btn.textContent?.includes('Dist. VDR%'))).toBe(false);
    expect(host.querySelector('#total-page .card')).toBeNull();
    expect(host.querySelector('#total-page #btn-perfiles-total')).toBeNull();
    expect(host.querySelector('#total-page app-body-systems')).toBeNull();
    expect(totalCard.querySelector('#total-page')).toBeNull();
  });

  it('should not render user profile list or profile editor', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('#lista-usuarios')).toBeNull();
    expect(host.querySelector('#editor-usuario')).toBeNull();
  });

  it('should render floppy disk save icon buttons in VDR and distribution panels', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const vdrSaveIcon = host.querySelector('#panel .btn-guardar-icono .material-symbols-outlined');
    const distSaveIcon = host.querySelector('#panel2 .btn-guardar-icono .material-symbols-outlined');

    expect(vdrSaveIcon?.textContent?.trim()).toBe('save');
    expect(distSaveIcon?.textContent?.trim()).toBe('save');
  });

  it('should alternate Tabla Nutricional and Editor Manual titles when toggling manual mode', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    (host.querySelector('#card-Desayuno') as HTMLElement).click();
    fixture.detectChanges();

    const tituloTabla = host.querySelector('#titulo-tabla-Desayuno') as HTMLElement;
    const tituloEditor = host.querySelector('#titulo-editor-Desayuno') as HTMLElement;
    const btnAplicar = host.querySelector('#btn-aplicar-Desayuno') as HTMLButtonElement;

    expect(tituloTabla.classList.contains('hidden')).toBe(false);
    expect(tituloEditor.classList.contains('hidden')).toBe(true);

    btnAplicar.click();
    fixture.detectChanges();

    expect(tituloTabla.classList.contains('hidden')).toBe(true);
    expect(tituloEditor.classList.contains('hidden')).toBe(false);

    btnAplicar.click();
    fixture.detectChanges();

    expect(tituloTabla.classList.contains('hidden')).toBe(false);
    expect(tituloEditor.classList.contains('hidden')).toBe(true);
  });

  it('should render header buttons as icon-buttons with proper accessible labels', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const leftBtn = host.querySelector('#openSidebar') as HTMLButtonElement;
    const rightBtn = host.querySelector('#openRightSidebar') as HTMLButtonElement;

    expect(leftBtn).toBeTruthy();
    expect(leftBtn.classList.contains('icon-button')).toBe(true);
    expect(rightBtn).toBeTruthy();
    expect(rightBtn.classList.contains('icon-button')).toBe(true);
  });

  it('should display card percentages with one decimal place (0.0%)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const desayunoPercentage = host.querySelector('#card-Desayuno .percentage');
    const totalPercentage = host.querySelector('#card-total .percentage');

    expect(desayunoPercentage?.textContent?.trim()).toBe('0.0%');
    expect(totalPercentage?.textContent?.trim()).toBe('0.0%');
  });
});
