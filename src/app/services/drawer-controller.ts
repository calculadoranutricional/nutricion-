import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { UiOverlay } from './ui-overlay';

export interface DrawerElements {
  sidebar: HTMLElement;
  sidebarInner: HTMLElement | null;
  sidebarShadow: HTMLElement | null;
  rightSidebar: HTMLElement;
  rightSidebarInner: HTMLElement | null;
  rightSidebarShadow: HTMLElement | null;
  envoltorio: HTMLElement;
  overlay: HTMLElement;
  openBtn: HTMLElement;
  openRightBtn: HTMLElement;
  fabs: HTMLElement[];
}

interface DrawerFrame {
  displacementX: number;
  menuTranslateX: number;
  innerTranslateX: number;
  innerWidth: number;
  menuWidth: number;
  overlayProgress: number;
  phase: 'slide' | 'resize';
}

type DrawerSide = 'left' | 'right';

const PARTIAL_WIDTH = 290;
const SENSITIVITY = 50;
const DESKTOP_BREAKPOINT = 768;
const DIRECTION_LOCK_THRESHOLD = 4;
const TRANSITION_MS = 250;
const TRANSITION = '0.25s cubic-bezier(0.22, 1, 0.36, 1)';

@Injectable({
  providedIn: 'root',
})
export class DrawerController {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiOverlay);

  private els: DrawerElements | null = null;
  private initialized = false;

  private menuState = 0;
  private rightMenuState = 0;
  private isDragging = false;
  private isClosing = false;
  private isRightClosing = false;
  private tracking = false;
  private activeDragSide: DrawerSide | null = null;
  private lastAnimatedSide: DrawerSide = 'left';
  private startState = 0;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private dragStartDisplacementX: number | null = null;
  private direction: 'undecided' | 'horizontal' | 'vertical' = 'undecided';
  private lastFrame: DrawerFrame | null = null;
  private restTimer: ReturnType<typeof setTimeout> | null = null;

  private lastOverlayOpacity = '';
  private lastOverlayVisibility = '';
  private lastSidebarPointerEvents = '';
  private lastRightSidebarPointerEvents = '';
  private lastTransitionMode: 'none' | 'animate' | null = null;

  private readonly onOverlayClick = () => {
    if (!this.isMobileViewport()) return;
    if (
      this.rightMenuState !== 0 ||
      this.isRightClosing ||
      (this.lastAnimatedSide === 'right' && this.lastFrame && this.lastFrame.displacementX < 0)
    ) {
      this.setMenuState('right', 0);
    } else {
      this.setMenuState('left', 0);
    }
  };

  private readonly onWrapperTransitionEnd = (event: TransitionEvent) => {
    if (!this.els) return;
    if (
      event.target === this.els.envoltorio &&
      event.propertyName === 'transform' &&
      this.isMobileViewport() &&
      !this.isDragging &&
      !this.tracking
    ) {
      this.clearRestTimer();
      if (this.menuState === 0 && this.rightMenuState === 0) {
        this.resetWrapperToRest();
      } else {
        this.setScrollLock(true);
      }
    }
  };

  private readonly onTouchStart = (event: TouchEvent) => {
    if (!this.isMobileViewport() || !this.els) return;
    if (this.hasBlockingOverlayOpen()) {
      this.resetTouchTracking();
      return;
    }

    if (event.touches.length !== 1) {
      if (this.tracking) {
        this.finishActiveDrag();
      } else {
        this.resetTouchTracking();
      }
      return;
    }

    if (this.hasHorizontallyScrollableAncestor(event.target)) {
      this.resetTouchTracking();
      return;
    }

    this.clearRestTimer();
    const touch = event.touches[0];
    this.tracking = true;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.currentX = touch.clientX;
    this.dragStartDisplacementX = null;
    this.direction = 'undecided';

    if (this.menuState !== 0) {
      this.activeDragSide = 'left';
      this.startState = this.menuState;
    } else if (this.rightMenuState !== 0) {
      this.activeDragSide = 'right';
      this.startState = this.rightMenuState;
    } else {
      this.activeDragSide = null;
      this.startState = 0;
    }

    if (this.lastTransitionMode === 'animate') {
      const visualX = this.readCurrentWrapperDisplacementX();
      const midSide: DrawerSide | null =
        this.activeDragSide !== null
          ? this.activeDragSide
          : visualX < 0
            ? 'right'
            : visualX > 0
              ? 'left'
              : this.isRightClosing
                ? 'right'
                : this.isClosing
                  ? 'left'
                  : null;

      if (midSide !== null && Math.abs(visualX) > 0) {
        this.activeDragSide = midSide;
        const frozen = this.computeDragFrame(
          this.startState,
          0,
          window.innerWidth,
          visualX,
          midSide,
        );
        this.dragStartDisplacementX = frozen.displacementX;
        this.applyFrame(midSide, frozen, true, false, true);
      }
    }
  };

  private readonly onTouchMove = (event: TouchEvent) => {
    if (!this.tracking || !this.isMobileViewport()) return;

    if (event.touches.length !== 1) {
      this.finishActiveDrag();
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    if (this.direction === 'undecided') {
      const detected = this.detectSwipeDirection(deltaX, deltaY);
      if (detected === 'undecided') return;
      if (detected === 'vertical') {
        if (this.dragStartDisplacementX !== null && this.activeDragSide !== null) {
          this.setMenuState(
            this.activeDragSide,
            this.activeDragSide === 'right' ? this.rightMenuState : this.menuState,
          );
        }
        this.resetTouchTracking();
        return;
      }
      this.clearRestTimer();
      this.direction = 'horizontal';
      if (this.activeDragSide === null) {
        this.activeDragSide = deltaX >= 0 ? 'left' : 'right';
      }
      this.isDragging = true;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const side = this.activeDragSide || 'left';
    this.currentX = touch.clientX;
    const frame = this.computeDragFrame(
      this.startState,
      deltaX,
      window.innerWidth,
      this.dragStartDisplacementX,
      side,
    );
    this.applyFrame(side, frame, true, false, false);
  };

  private readonly onTouchEnd = () => {
    if (!this.tracking) return;
    this.finishActiveDrag();
  };

  private readonly onViewportChange = () => {
    if (!this.els) return;
    if (!this.isMobileViewport()) {
      this.resetTouchTracking();
      this.applyDesktopMode();
      return;
    }
    if (!this.isDragging) {
      const side: DrawerSide = this.rightMenuState !== 0 ? 'right' : 'left';
      const state = side === 'right' ? this.rightMenuState : this.menuState;
      this.syncAccessibilityAndScroll();
      this.applyFrame(side, this.computeStateFrame(state, window.innerWidth, side), false, false, true);
    }
  };

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  init(elements: DrawerElements): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.initialized) {
      this.cleanup();
    }

    this.els = elements;
    this.initialized = true;

    elements.overlay.addEventListener('click', this.onOverlayClick);
    elements.envoltorio.addEventListener('transitionend', this.onWrapperTransitionEnd);
    this.doc.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.doc.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.doc.addEventListener('touchend', this.onTouchEnd, { passive: true });
    this.doc.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
    window.addEventListener('resize', this.onViewportChange, { passive: true });
    window.addEventListener('orientationchange', this.onViewportChange, { passive: true });

    this.onViewportChange();
  }

  toggleLeft(): void {
    if (!this.isMobileViewport()) return;
    this.setMenuState('left', this.menuState === 0 ? 1 : 0);
  }

  toggleRight(): void {
    if (!this.isMobileViewport()) return;
    this.setMenuState('right', this.rightMenuState === 0 ? 1 : 0);
  }

  closeAll(): void {
    if (!this.isMobileViewport()) return;
    if (this.rightMenuState !== 0 || this.isRightClosing) {
      this.setMenuState('right', 0);
    } else if (this.menuState !== 0 || this.isClosing) {
      this.setMenuState('left', 0);
    }
  }

  private cleanup(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.clearRestTimer();
    if (this.els) {
      this.els.overlay.removeEventListener('click', this.onOverlayClick);
      this.els.envoltorio.removeEventListener('transitionend', this.onWrapperTransitionEnd);
    }
    this.doc.removeEventListener('touchstart', this.onTouchStart);
    this.doc.removeEventListener('touchmove', this.onTouchMove);
    this.doc.removeEventListener('touchend', this.onTouchEnd);
    this.doc.removeEventListener('touchcancel', this.onTouchEnd);
    window.removeEventListener('resize', this.onViewportChange);
    window.removeEventListener('orientationchange', this.onViewportChange);
    this.setScrollLock(false);
    this.initialized = false;
    this.els = null;
  }

  private hasBlockingOverlayOpen(): boolean {
    return (
      this.ui.activePanel() !== null ||
      this.ui.activePage() !== null ||
      this.ui.confirmacion().visible ||
      this.ui.toastVisible()
    );
  }

  private isMobileViewport(): boolean {
    return isPlatformBrowser(this.platformId) && window.innerWidth < DESKTOP_BREAKPOINT;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private getEffectivePartialWidth(viewportWidth: number): number {
    if (viewportWidth <= 0) return PARTIAL_WIDTH;
    return Math.min(PARTIAL_WIDTH, viewportWidth);
  }

  private detectSwipeDirection(deltaX: number, deltaY: number): 'undecided' | 'horizontal' | 'vertical' {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX >= 2 && absX > absY * 1.5) return 'horizontal';
    if (Math.max(absX, absY) < DIRECTION_LOCK_THRESHOLD) return 'undecided';
    return absY > absX ? 'vertical' : 'horizontal';
  }

  private buildFrame(
    displacementMagnitude: number,
    effectivePartial: number,
    fullWidth: number,
    phase: 'slide' | 'resize',
    side: DrawerSide,
  ): DrawerFrame {
    const overlayProgress =
      effectivePartial > 0 ? this.clamp(displacementMagnitude / effectivePartial, 0, 1) : 0;
    const innerWidth = Math.max(effectivePartial, displacementMagnitude);

    if (side === 'right') {
      return {
        displacementX: displacementMagnitude === 0 ? 0 : -displacementMagnitude,
        menuTranslateX: fullWidth - displacementMagnitude,
        innerTranslateX: 0,
        innerWidth,
        menuWidth: fullWidth,
        overlayProgress,
        phase,
      };
    }

    return {
      displacementX: displacementMagnitude,
      menuTranslateX: displacementMagnitude - fullWidth,
      innerTranslateX: fullWidth - innerWidth,
      innerWidth,
      menuWidth: fullWidth,
      overlayProgress,
      phase,
    };
  }

  private computeStateFrame(state: number, viewportWidth: number, side: DrawerSide): DrawerFrame {
    const effectivePartial = this.getEffectivePartialWidth(viewportWidth);
    const fullWidth = Math.max(effectivePartial, viewportWidth);

    if (state === 0) {
      return this.buildFrame(0, effectivePartial, fullWidth, 'slide', side);
    }

    if (state === 1) {
      return this.buildFrame(effectivePartial, effectivePartial, fullWidth, 'slide', side);
    }

    return this.buildFrame(fullWidth, effectivePartial, fullWidth, 'resize', side);
  }

  private computeDragFrame(
    state: number,
    deltaX: number,
    viewportWidth: number,
    startDisplacementX: number | null,
    side: DrawerSide,
  ): DrawerFrame {
    const effectivePartial = this.getEffectivePartialWidth(viewportWidth);
    const fullWidth = Math.max(effectivePartial, viewportWidth);
    const defaultBase = state === 0 ? 0 : state === 1 ? effectivePartial : fullWidth;

    if (side === 'right') {
      const baseMag =
        startDisplacementX !== null && startDisplacementX !== undefined
          ? Math.max(0, -startDisplacementX)
          : defaultBase;
      const rawMag = baseMag - deltaX;

      if (state === 0 || (state === 1 && rawMag < effectivePartial)) {
        const mag = this.clamp(rawMag, 0, effectivePartial);
        return this.buildFrame(mag, effectivePartial, fullWidth, 'slide', 'right');
      }

      const mag = this.clamp(rawMag, effectivePartial, fullWidth);
      return this.buildFrame(mag, effectivePartial, fullWidth, 'resize', 'right');
    }

    const base =
      startDisplacementX !== null && startDisplacementX !== undefined ? startDisplacementX : defaultBase;
    const raw = base + deltaX;

    if (state === 0 || (state === 1 && raw < effectivePartial)) {
      const displacementX = this.clamp(raw, 0, effectivePartial);
      return this.buildFrame(displacementX, effectivePartial, fullWidth, 'slide', 'left');
    }

    const displacementX = this.clamp(raw, effectivePartial, fullWidth);
    return this.buildFrame(displacementX, effectivePartial, fullWidth, 'resize', 'left');
  }

  private resolveSnapState(params: {
    startState: number;
    displacementX: number;
    deltaX: number;
    currentX: number;
    viewportWidth: number;
    side: DrawerSide;
  }): number {
    const effectivePartial = this.getEffectivePartialWidth(params.viewportWidth);
    const fullWidth = Math.max(effectivePartial, params.viewportWidth);

    if (params.side === 'right') {
      const mag = Math.max(0, -params.displacementX);

      if ((params.startState === 1 || params.startState === 2) && mag >= effectivePartial) {
        const midpoint = (fullWidth + effectivePartial) / 2;
        return mag >= midpoint ? 2 : 1;
      }

      if (params.startState === 1 && mag < effectivePartial) {
        return params.deltaX > SENSITIVITY ? 0 : 1;
      }

      if (params.startState === 0) {
        const distFromRight = params.viewportWidth - params.currentX;
        return params.deltaX < -SENSITIVITY && distFromRight > SENSITIVITY ? 1 : 0;
      }

      return params.startState;
    }

    if (
      (params.startState === 1 || params.startState === 2) &&
      params.displacementX >= effectivePartial
    ) {
      const midpoint = (fullWidth + effectivePartial) / 2;
      return params.displacementX >= midpoint ? 2 : 1;
    }

    if (params.startState === 1 && params.displacementX < effectivePartial) {
      return params.deltaX < -SENSITIVITY ? 0 : 1;
    }

    if (params.startState === 0) {
      return params.deltaX > SENSITIVITY && params.currentX > SENSITIVITY ? 1 : 0;
    }

    return params.startState;
  }

  private isElementHorizontallyScrollable(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    const allowsOverflow = style.overflowX === 'auto' || style.overflowX === 'scroll';
    return allowsOverflow && el.scrollWidth > el.clientWidth + 1;
  }

  private hasHorizontallyScrollableAncestor(target: EventTarget | null): boolean {
    let node = target instanceof HTMLElement ? target : null;
    while (node && node !== this.doc.body && node !== this.doc.documentElement) {
      if (this.isElementHorizontallyScrollable(node)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  private clearRestTimer(): void {
    if (this.restTimer !== null) {
      clearTimeout(this.restTimer);
      this.restTimer = null;
    }
  }

  private readCurrentWrapperDisplacementX(): number {
    if (!this.els) return 0;
    const transform = window.getComputedStyle(this.els.envoltorio).transform;
    if (!transform || transform === 'none') {
      return 0;
    }
    return new DOMMatrixReadOnly(transform).m41;
  }

  private clearStyleCaches(): void {
    this.lastOverlayOpacity = '';
    this.lastOverlayVisibility = '';
    this.lastSidebarPointerEvents = '';
    this.lastRightSidebarPointerEvents = '';
    this.lastTransitionMode = null;
  }

  private setScrollLock(locked: boolean): void {
    this.doc.documentElement.classList.toggle('drawer-scroll-locked', locked);
    this.doc.body.classList.toggle('drawer-scroll-locked', locked);
  }

  private resetWrapperToRest(): void {
    if (!this.els) return;
    const {
      envoltorio,
      fabs,
      sidebar,
      sidebarInner,
      sidebarShadow,
      rightSidebar,
      rightSidebarInner,
      rightSidebarShadow,
      overlay,
    } = this.els;

    this.isClosing = false;
    this.isRightClosing = false;
    this.setScrollLock(false);
    this.syncAccessibilityAndScroll();
    envoltorio.style.transition = 'none';
    envoltorio.style.transform = 'none';
    for (const fab of fabs) {
      fab.style.transition = 'none';
      fab.style.transform = 'none';
    }
    sidebar.style.transition = 'none';
    if (sidebarInner) sidebarInner.style.transition = 'none';
    if (sidebarShadow) sidebarShadow.style.transition = 'none';
    rightSidebar.style.transition = 'none';
    if (rightSidebarInner) rightSidebarInner.style.transition = 'none';
    if (rightSidebarShadow) rightSidebarShadow.style.transition = 'none';
    overlay.style.transition = 'none';
    this.lastTransitionMode = 'none';
  }

  private applyDesktopMode(): void {
    if (!this.els) return;
    const {
      sidebar,
      sidebarInner,
      sidebarShadow,
      rightSidebar,
      rightSidebarInner,
      rightSidebarShadow,
      envoltorio,
      fabs,
      overlay,
      openBtn,
      openRightBtn,
    } = this.els;

    this.clearRestTimer();
    this.clearStyleCaches();
    this.menuState = 0;
    this.rightMenuState = 0;
    this.isDragging = false;
    this.isClosing = false;
    this.isRightClosing = false;
    this.lastFrame = null;

    sidebar.style.transform = '';
    sidebar.style.transition = '';
    sidebar.style.pointerEvents = '';
    if (sidebarInner) {
      sidebarInner.style.transform = '';
      sidebarInner.style.width = '';
      sidebarInner.style.transition = '';
    }
    if (sidebarShadow) {
      sidebarShadow.style.transform = '';
      sidebarShadow.style.opacity = '';
      sidebarShadow.style.transition = '';
    }
    sidebar.setAttribute('data-state', 'desktop');
    sidebar.setAttribute('aria-hidden', 'false');
    sidebar.removeAttribute('inert');

    rightSidebar.style.transform = '';
    rightSidebar.style.transition = '';
    rightSidebar.style.pointerEvents = '';
    if (rightSidebarInner) {
      rightSidebarInner.style.transform = '';
      rightSidebarInner.style.width = '';
      rightSidebarInner.style.transition = '';
    }
    if (rightSidebarShadow) {
      rightSidebarShadow.style.transform = '';
      rightSidebarShadow.style.opacity = '';
      rightSidebarShadow.style.transition = '';
    }
    rightSidebar.setAttribute('data-state', 'desktop');
    rightSidebar.setAttribute('aria-hidden', 'false');
    rightSidebar.removeAttribute('inert');

    envoltorio.style.transform = '';
    envoltorio.style.transition = '';
    for (const fab of fabs) {
      fab.style.transform = '';
      fab.style.transition = '';
    }

    overlay.style.opacity = '';
    overlay.style.visibility = '';
    overlay.style.pointerEvents = '';
    overlay.style.transition = '';

    openBtn.setAttribute('aria-expanded', 'false');
    openRightBtn.setAttribute('aria-expanded', 'false');
    this.setScrollLock(false);
  }

  private applyFrame(
    side: DrawerSide,
    frame: DrawerFrame,
    dragging: boolean,
    keepZeroTransform: boolean,
    immediate: boolean,
  ): void {
    if (!this.els) return;
    const {
      sidebar,
      sidebarInner,
      sidebarShadow,
      rightSidebar,
      rightSidebarInner,
      rightSidebarShadow,
      envoltorio,
      fabs,
      overlay,
    } = this.els;

    this.lastFrame = frame;
    const activeState = side === 'right' ? this.rightMenuState : this.menuState;
    const interactive = activeState !== 0 || dragging;
    const progress = frame.overlayProgress;
    const transitionMode: 'none' | 'animate' =
      dragging || immediate || (activeState === 0 && !keepZeroTransform) ? 'none' : 'animate';

    if (transitionMode !== this.lastTransitionMode) {
      this.lastTransitionMode = transitionMode;
      if (transitionMode === 'none') {
        envoltorio.style.transition = 'none';
        for (const fab of fabs) {
          fab.style.transition = 'none';
        }
        sidebar.style.transition = 'none';
        if (sidebarInner) sidebarInner.style.transition = 'none';
        if (sidebarShadow) sidebarShadow.style.transition = 'none';
        rightSidebar.style.transition = 'none';
        if (rightSidebarInner) rightSidebarInner.style.transition = 'none';
        if (rightSidebarShadow) rightSidebarShadow.style.transition = 'none';
        overlay.style.transition = 'none';
      } else {
        envoltorio.style.transition = `transform ${TRANSITION}`;
        for (const fab of fabs) {
          fab.style.transition = `transform ${TRANSITION}`;
        }
        sidebar.style.transition = `transform ${TRANSITION}`;
        if (sidebarInner) {
          sidebarInner.style.transition = `transform ${TRANSITION}, width ${TRANSITION}`;
        }
        if (sidebarShadow) {
          sidebarShadow.style.transition = `transform ${TRANSITION}, opacity ${TRANSITION}`;
        }
        rightSidebar.style.transition = `transform ${TRANSITION}`;
        if (rightSidebarInner) {
          rightSidebarInner.style.transition = `transform ${TRANSITION}, width ${TRANSITION}`;
        }
        if (rightSidebarShadow) {
          rightSidebarShadow.style.transition = `transform ${TRANSITION}, opacity ${TRANSITION}`;
        }
        overlay.style.transition = `opacity ${TRANSITION}, visibility ${TRANSITION}`;
      }
    }

    const wrapTransform =
      frame.displacementX === 0 && !dragging && !keepZeroTransform
        ? 'none'
        : `translateX(${frame.displacementX}px)`;
    envoltorio.style.transform = wrapTransform;
    for (const fab of fabs) {
      fab.style.transform = wrapTransform;
    }

    const nextOpacity = progress > 0 ? String(progress) : '0';
    const nextPointerEvents = interactive ? 'auto' : 'none';

    if (side === 'left') {
      sidebar.style.transform = `translateX(${frame.menuTranslateX}px)`;
      if (sidebarInner) {
        sidebarInner.style.transform = `translateX(${frame.innerTranslateX}px)`;
        sidebarInner.style.width = `${frame.innerWidth}px`;
      }
      if (sidebarShadow) {
        sidebarShadow.style.transform = `translateX(${frame.displacementX}px)`;
        sidebarShadow.style.opacity = nextOpacity;
      }
      if (nextPointerEvents !== this.lastSidebarPointerEvents) {
        this.lastSidebarPointerEvents = nextPointerEvents;
        sidebar.style.pointerEvents = nextPointerEvents;
      }

      rightSidebar.style.transform = 'translateX(100%)';
      if (rightSidebarInner) {
        rightSidebarInner.style.transform = 'translateX(0px)';
        rightSidebarInner.style.width = '';
      }
      if (rightSidebarShadow) {
        rightSidebarShadow.style.transform = 'translateX(0px)';
        rightSidebarShadow.style.opacity = '0';
      }
      if (this.lastRightSidebarPointerEvents !== 'none') {
        this.lastRightSidebarPointerEvents = 'none';
        rightSidebar.style.pointerEvents = 'none';
      }
    } else {
      rightSidebar.style.transform = `translateX(${frame.menuTranslateX}px)`;
      if (rightSidebarInner) {
        rightSidebarInner.style.transform = `translateX(${frame.innerTranslateX}px)`;
        rightSidebarInner.style.width = `${frame.innerWidth}px`;
      }
      if (rightSidebarShadow) {
        rightSidebarShadow.style.transform = `translateX(${frame.displacementX}px)`;
        rightSidebarShadow.style.opacity = nextOpacity;
      }
      if (nextPointerEvents !== this.lastRightSidebarPointerEvents) {
        this.lastRightSidebarPointerEvents = nextPointerEvents;
        rightSidebar.style.pointerEvents = nextPointerEvents;
      }

      sidebar.style.transform = 'translateX(-100%)';
      if (sidebarInner) {
        sidebarInner.style.transform = 'translateX(0px)';
        sidebarInner.style.width = '';
      }
      if (sidebarShadow) {
        sidebarShadow.style.transform = 'translateX(0px)';
        sidebarShadow.style.opacity = '0';
      }
      if (this.lastSidebarPointerEvents !== 'none') {
        this.lastSidebarPointerEvents = 'none';
        sidebar.style.pointerEvents = 'none';
      }
    }

    if (nextOpacity !== this.lastOverlayOpacity) {
      this.lastOverlayOpacity = nextOpacity;
      overlay.style.opacity = nextOpacity;
    }

    const nextVisibility = progress > 0 ? 'visible' : 'hidden';
    if (nextVisibility !== this.lastOverlayVisibility) {
      this.lastOverlayVisibility = nextVisibility;
      overlay.style.visibility = nextVisibility;
      overlay.style.pointerEvents = progress > 0 ? 'auto' : 'none';
    }
  }

  private syncAccessibilityAndScroll(): void {
    if (!this.els) return;
    const { sidebar, rightSidebar, openBtn, openRightBtn } = this.els;

    const isClosed = this.menuState === 0 && !this.isClosing;
    sidebar.setAttribute('data-state', String(this.menuState));
    sidebar.setAttribute('aria-hidden', String(isClosed));
    if (isClosed) {
      sidebar.setAttribute('inert', '');
    } else {
      sidebar.removeAttribute('inert');
    }
    openBtn.setAttribute('aria-expanded', String(this.menuState !== 0));

    const isRightClosed = this.rightMenuState === 0 && !this.isRightClosing;
    rightSidebar.setAttribute('data-state', String(this.rightMenuState));
    rightSidebar.setAttribute('aria-hidden', String(isRightClosed));
    if (isRightClosed) {
      rightSidebar.setAttribute('inert', '');
    } else {
      rightSidebar.removeAttribute('inert');
    }
    openRightBtn.setAttribute('aria-expanded', String(this.rightMenuState !== 0));
  }

  private setMenuState(side: DrawerSide, nextState: number): void {
    if (!this.isMobileViewport()) {
      this.applyDesktopMode();
      return;
    }
    this.clearRestTimer();
    const wasOpen = side === 'right' ? this.rightMenuState !== 0 : this.menuState !== 0;
    const wasMoved =
      wasOpen ||
      (this.lastFrame && Math.abs(this.lastFrame.displacementX) > 0) ||
      this.dragStartDisplacementX !== null;
    const animateBackToZero = nextState === 0 && !!wasMoved;

    this.lastAnimatedSide = side;
    this.isDragging = false;
    if (side === 'right') {
      this.menuState = 0;
      this.isClosing = false;
      this.rightMenuState = nextState;
      this.isRightClosing = nextState === 0 && wasOpen;
    } else {
      this.rightMenuState = 0;
      this.isRightClosing = false;
      this.menuState = nextState;
      this.isClosing = nextState === 0 && wasOpen;
    }
    this.syncAccessibilityAndScroll();

    const frame = this.computeStateFrame(nextState, window.innerWidth, side);
    this.applyFrame(side, frame, false, animateBackToZero, false);

    if (animateBackToZero) {
      this.restTimer = setTimeout(() => {
        if (
          this.isMobileViewport() &&
          this.menuState === 0 &&
          this.rightMenuState === 0 &&
          !this.isDragging &&
          !this.tracking
        ) {
          this.resetWrapperToRest();
        }
      }, TRANSITION_MS + 30);
    } else if (nextState === 0) {
      this.setScrollLock(false);
    } else {
      this.restTimer = setTimeout(() => {
        if (
          this.isMobileViewport() &&
          (this.menuState !== 0 || this.rightMenuState !== 0) &&
          !this.isDragging &&
          !this.tracking
        ) {
          this.setScrollLock(true);
        }
      }, TRANSITION_MS + 30);
    }
  }

  private resetTouchTracking(): void {
    this.tracking = false;
    this.activeDragSide = null;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.dragStartDisplacementX = null;
    this.direction = 'undecided';
  }

  private finishActiveDrag(): void {
    if (this.direction === 'horizontal' && this.isDragging && this.activeDragSide !== null) {
      const side = this.activeDragSide;
      const deltaX = this.currentX - this.startX;
      const frame = this.computeDragFrame(
        this.startState,
        deltaX,
        window.innerWidth,
        this.dragStartDisplacementX,
        side,
      );
      const nextState = this.resolveSnapState({
        startState: this.startState,
        displacementX: frame.displacementX,
        deltaX,
        currentX: this.currentX,
        viewportWidth: window.innerWidth,
        side,
      });
      this.setMenuState(side, nextState);
    } else {
      this.isDragging = false;
      if (this.dragStartDisplacementX !== null && this.activeDragSide !== null) {
        this.setMenuState(
          this.activeDragSide,
          this.activeDragSide === 'right' ? this.rightMenuState : this.menuState,
        );
      } else {
        this.syncAccessibilityAndScroll();
      }
    }
    this.resetTouchTracking();
  }
}
