import {computed, inject, Injectable, signal} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {Driver, driver} from 'driver.js';
import {filter} from 'rxjs';
import {LoggedUserDataService} from '../auth/logged-user-data-service';
import {UserService} from '../../shared/services/user.service';
import {environment} from '../../../environments/environment';
import {modulesForRoles, ONBOARDING_MODULES, OnboardingModuleDef, OnboardingStep} from './onboarding-steps';
import {OnboardingApiService} from './onboarding-api.service';
import {OnboardingModuleId, OnboardingModuleProgress} from './onboarding.model';

const ELEMENT_TIMEOUT_MS = 4000;
const SETTLE_MS = 350;
const READING_WORDS_PER_SECOND = 4;
const MIN_READING_SECONDS = 3;
const MAX_READING_SECONDS = 10;
const MIN_TARGET_WIDTH = 24;
const MIN_TARGET_HEIGHT = 16;
/** Pages where an automatic task (profile, enrollments) may have just been completed. */
const REFRESH_ROUTES = ['/app/home', '/app/perfil', '/app/mi-ruta-formacion', '/app/calendario'];

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly router = inject(Router);
  private readonly loggedUserDataService = inject(LoggedUserDataService);
  private readonly userService = inject(UserService);
  private readonly api = inject(OnboardingApiService);
  private readonly messageService = inject(MessageService);

  /** Lets the tour open and close the side menu owned by the header. */
  readonly menuOpen = signal(false);
  readonly running = signal(false);
  readonly hubVisible = signal(false);
  readonly progress = signal<OnboardingModuleProgress[]>([]);
  readonly manualUrl = environment.userManualUrl;

  /** Modules available to the logged user, with their server-side progress. */
  readonly modules = computed(() => {
    const progress = this.progress();
    return ONBOARDING_MODULES
      .map(def => ({def, progress: progress.find(item => item.module === def.id)}))
      .filter((item): item is { def: OnboardingModuleDef; progress: OnboardingModuleProgress } => !!item.progress);
  });

  private tour?: Driver;
  private activeModule?: OnboardingModuleDef;
  private steps: OnboardingStep[] = [];
  private index = 0;
  /** Invalidates in-flight steps when the user moves on or the tour ends. */
  private generation = 0;
  private lockedElements: Element[] = [];
  private tracking = false;
  private enforceReading = false;
  private nextAllowedAt = 0;

  /** Loads the progress, starts the first-login tour and begins tracking task visits. */
  init(): void {
    this.refresh();
    this.trackNavigation();

    const me = this.loggedUserDataService.getLoggedUserData();
    if (me && !me.onboardingCompleted) {
      this.startModule('BASICS');
    }
  }

  refresh(): void {
    this.api.getProgress().subscribe({
      next: progress => this.applyProgress(progress),
      error: err => console.error('No se pudo cargar el progreso de la guía:', err)
    });
  }

  openHub(): void {
    this.refresh();
    this.hubVisible.set(true);
  }

  closeHub(): void {
    this.hubVisible.set(false);
  }

  startModule(id: OnboardingModuleId): void {
    if (this.running()) {
      return;
    }
    const roles = this.loggedUserDataService.getLoggedUserData()?.roles ?? [];
    const module = modulesForRoles(roles).find(def => def.id === id);
    if (!module) {
      return;
    }

    this.hubVisible.set(false);
    this.activeModule = module;
    // Only the first run of a module is timed; repeating it is free.
    this.enforceReading = !this.progress().find(item => item.module === id)?.tourCompleted;
    this.nextAllowedAt = 0;
    this.steps = module.steps(this.manualUrl);
    this.index = 0;
    this.running.set(true);
    this.tour = driver({
      allowClose: true,
      overlayClickBehavior: 'none',
      overlayOpacity: 0.45,
      disableActiveInteraction: true,
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: 'ecatlim-tour',
      onNextClick: () => {
        if (Date.now() >= this.nextAllowedAt) {
          void this.show(this.index + 1);
        }
      },
      onPrevClick: () => void this.show(this.index - 1),
      onCloseClick: () => this.finish(false),
      // Escape goes through here instead of onCloseClick.
      onDestroyStarted: () => this.finish(false)
    });
    void this.show(0);
  }

  private async show(index: number): Promise<void> {
    if (!this.running() || index < 0) {
      return;
    }
    if (index >= this.steps.length) {
      this.finish(true);
      return;
    }

    const generation = ++this.generation;
    const step = this.steps[index];
    this.index = index;
    // Blocks "next" (also via keyboard) until the step is rendered and its reading time, if any, has started.
    this.nextAllowedAt = Infinity;

    const menuChanged = this.menuOpen() !== !!step.menu;
    this.menuOpen.set(!!step.menu);

    const routeChanged = !!step.route && !this.router.url.startsWith(step.route);
    if (routeChanged) {
      await this.router.navigateByUrl(step.route!);
    }

    const element = step.selectors ? await this.waitForUsable(step.selectors) : null;
    if (menuChanged || routeChanged) {
      await this.delay(SETTLE_MS);
    }
    if (generation !== this.generation || !this.running()) {
      return;
    }

    this.lockApp();
    const isFirst = index === 0;
    const isLast = index === this.steps.length - 1;
    const nextLabel = isFirst ? 'Empezar' : isLast ? 'Terminar' : 'Siguiente';
    this.tour?.highlight({
      element: element ?? undefined,
      popover: {
        title: step.title,
        popoverClass: step.page ? 'ecatlim-tour ecatlim-tour-page' : 'ecatlim-tour',
        description: `${step.description}<div class="ecatlim-tour-progress">${index + 1} de ${this.steps.length}</div>`,
        side: step.side,
        align: 'center',
        showButtons: isFirst ? ['next', 'close'] : ['previous', 'next', 'close'],
        nextBtnText: nextLabel,
        prevBtnText: 'Anterior',
        onPopoverRender: popover => {
          if (this.enforceReading) {
            this.holdNextButton(popover.nextButton, nextLabel, this.readingSeconds(step), generation);
          } else {
            this.nextAllowedAt = 0;
          }
        }
      }
    });
  }

  /** Seconds the user must spend on a step, proportional to how much there is to read. */
  private readingSeconds(step: OnboardingStep): number {
    const words = `${step.title} ${step.description}`.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.min(Math.max(Math.ceil(words / READING_WORDS_PER_SECOND), MIN_READING_SECONDS), MAX_READING_SECONDS);
  }

  private holdNextButton(button: HTMLButtonElement, label: string, seconds: number, generation: number): void {
    this.nextAllowedAt = Date.now() + seconds * 1000;
    button.disabled = true;

    const tick = () => {
      if (generation !== this.generation || !button.isConnected) {
        return;
      }
      const remaining = Math.ceil((this.nextAllowedAt - Date.now()) / 1000);
      if (remaining <= 0) {
        button.disabled = false;
        button.textContent = label;
        return;
      }
      button.textContent = `${label} (${remaining})`;
      setTimeout(tick, 250);
    };
    tick();
  }

  private finish(completed: boolean): void {
    if (!this.running()) {
      return;
    }
    const module = this.activeModule;
    this.generation++;
    this.tour?.destroy();
    this.tour = undefined;
    this.activeModule = undefined;
    this.removeTourLeftovers();
    this.unlockApp();
    this.menuOpen.set(false);
    this.running.set(false);
    if (!this.router.url.startsWith('/app/home')) {
      void this.router.navigateByUrl('/app/home');
    }

    this.markWelcomeSeen();
    if (module && completed) {
      this.api.completeTour(module.id).subscribe({
        next: progress => {
          this.applyProgress(progress);
          this.hubVisible.set(true);
        },
        error: err => console.error('No se pudo guardar el recorrido completado:', err)
      });
    }
  }

  private markWelcomeSeen(): void {
    const me = this.loggedUserDataService.getLoggedUserData();
    if (!me || me.onboardingCompleted) {
      return;
    }
    this.userService.completeOnboarding().subscribe({
      next: () => this.loggedUserDataService.setUserData({...me, onboardingCompleted: true}),
      error: err => console.error('No se pudo guardar el estado del tutorial:', err)
    });
  }

  private applyProgress(progress: OnboardingModuleProgress[]): void {
    this.progress.set(progress);
    progress.filter(item => item.newlyAwarded).forEach(item => {
      const title = ONBOARDING_MODULES.find(def => def.id === item.module)?.title ?? item.module;
      this.messageService.add({
        severity: 'success',
        summary: '¡Insignia conseguida!',
        detail: `Has completado el módulo «${title}».`,
        life: 8000
      });
    });
  }

  /** Completes the manual tasks that ask the user to open a page, and refreshes automatic ones. */
  private trackNavigation(): void {
    if (this.tracking) {
      return;
    }
    this.tracking = true;
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        if (this.running() || !this.loggedUserDataService.getLoggedUserData()) {
          return;
        }
        const url = event.urlAfterRedirects.split('?')[0];

        const pending = this.modules().flatMap(({def, progress}) => progress.tasks
          .filter(task => task.manual && !task.done && def.tasks[task.key]?.visitRoute === url)
          .map(task => task.key));
        if (pending.length) {
          pending.forEach(task => this.api.completeTask(task).subscribe({
            next: progress => this.applyProgress(progress),
            error: err => console.error('No se pudo guardar la tarea:', err)
          }));
        } else if (REFRESH_ROUTES.includes(url)) {
          this.refresh();
        }
      });
  }

  /** The app cannot be used while the tour runs: only the tour popover stays interactive. */
  private lockApp(): void {
    Array.from(document.body.children)
      .filter(child => !child.classList.contains('driver-popover')
        && !child.classList.contains('driver-overlay')
        && !['SCRIPT', 'STYLE', 'LINK'].includes(child.tagName)
        && !child.hasAttribute('inert'))
      .forEach(child => {
        child.setAttribute('inert', '');
        this.lockedElements.push(child);
      });
  }

  private unlockApp(): void {
    this.lockedElements.forEach(element => element.removeAttribute('inert'));
    this.lockedElements = [];
  }

  /** Safety net: never leave the dimmed overlay on screen. */
  private removeTourLeftovers(): void {
    document.querySelectorAll('.driver-overlay, .driver-popover, #driver-dummy-element').forEach(el => el.remove());
    document.body.classList.remove('driver-active', 'driver-fade', 'driver-simple', 'driver-no-scroll');
  }

  private async waitForUsable(selectors: string[]): Promise<Element | null> {
    const deadline = Date.now() + ELEMENT_TIMEOUT_MS;
    while (Date.now() < deadline) {
      for (const selector of selectors) {
        const found = Array.from(document.querySelectorAll(selector)).find(element => this.isUsable(element));
        if (found) {
          return found;
        }
      }
      await this.delay(100);
    }
    return null;
  }

  /** An element with no real size would leave the popover pointing at nothing. */
  private isUsable(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= MIN_TARGET_WIDTH && rect.height >= MIN_TARGET_HEIGHT;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
