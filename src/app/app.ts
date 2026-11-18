import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { AlertModal } from './components/alert-modal/alert-modal';
import { DistributionPanel } from './components/distribution-panel/distribution-panel';
import { LeftSidebar } from './components/left-sidebar/left-sidebar';
import { MealPage } from './components/meal-page/meal-page';
import { MealSection } from './components/meal-section/meal-section';
import { RightSidebar } from './components/right-sidebar/right-sidebar';
import { SettingsModal } from './components/settings-modal/settings-modal';
import { Toast } from './components/toast/toast';
import { TotalPage } from './components/total-page/total-page';
import { TotalSection } from './components/total-section/total-section';
import { VdrPanel } from './components/vdr-panel/vdr-panel';
import { COMIDAS } from './data/nutrients.data';
import { DrawerController } from './services/drawer-controller';
import { NutritionStore } from './services/nutrition-store';
import { UiOverlay } from './services/ui-overlay';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    LeftSidebar,
    RightSidebar,
    VdrPanel,
    DistributionPanel,
    SettingsModal,
    MealSection,
    TotalSection,
    MealPage,
    TotalPage,
    AlertModal,
    Toast,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly ui = inject(UiOverlay);
  readonly drawer = inject(DrawerController);
  readonly store = inject(NutritionStore);
  private readonly platformId = inject(PLATFORM_ID);

  readonly comidas = COMIDAS;

  private readonly sidebarRef = viewChild<ElementRef<HTMLElement>>('sidebarEl');
  private readonly sidebarInnerRef = viewChild<ElementRef<HTMLElement>>('sidebarInnerEl');
  private readonly sidebarShadowRef = viewChild<ElementRef<HTMLElement>>('sidebarShadowEl');
  private readonly rightSidebarRef = viewChild<ElementRef<HTMLElement>>('rightSidebarEl');
  private readonly rightSidebarInnerRef =
    viewChild<ElementRef<HTMLElement>>('rightSidebarInnerEl');
  private readonly rightSidebarShadowRef =
    viewChild<ElementRef<HTMLElement>>('rightSidebarShadowEl');
  private readonly envoltorioRef = viewChild<ElementRef<HTMLElement>>('envoltorioEl');
  private readonly overlayRef = viewChild<ElementRef<HTMLElement>>('overlayEl');
  private readonly openBtnRef = viewChild<ElementRef<HTMLElement>>('openBtnEl');
  private readonly openRightBtnRef = viewChild<ElementRef<HTMLElement>>('openRightBtnEl');
  private readonly fabRef = viewChild<ElementRef<HTMLElement>>('fabEl');

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const sidebar = this.sidebarRef()?.nativeElement;
      const rightSidebar = this.rightSidebarRef()?.nativeElement;
      const envoltorio = this.envoltorioRef()?.nativeElement;
      const overlay = this.overlayRef()?.nativeElement;
      const openBtn = this.openBtnRef()?.nativeElement;
      const openRightBtn = this.openRightBtnRef()?.nativeElement;
      if (!sidebar || !rightSidebar || !envoltorio || !overlay || !openBtn || !openRightBtn) {
        return;
      }

      const fab = this.fabRef()?.nativeElement;
      this.drawer.init({
        sidebar,
        sidebarInner: this.sidebarInnerRef()?.nativeElement ?? null,
        sidebarShadow: this.sidebarShadowRef()?.nativeElement ?? null,
        rightSidebar,
        rightSidebarInner: this.rightSidebarInnerRef()?.nativeElement ?? null,
        rightSidebarShadow: this.rightSidebarShadowRef()?.nativeElement ?? null,
        envoltorio,
        overlay,
        openBtn,
        openRightBtn,
        fabs: fab ? [fab] : [],
      });
    });
  }
}
