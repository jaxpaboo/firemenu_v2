import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';

// Allow optional runtime `require` for an ignored local env file
declare const require: any;
import { CommonModule } from '@angular/common';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FireLink } from './models/fire-link';
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { FireLinkFormComponent } from './components/fire-link-form/fire-link-form.component';
import { FireLinkListComponent } from './components/fire-link-list/fire-link-list.component';
import { ConfirmationToastComponent } from './components/confirmation-toast/confirmation-toast.component';
import { AppHeaderComponent, FireMenuTab } from './components/app-header/app-header.component';
import { Lu2SearchModalComponent } from './components/lu2-search-modal/lu2-search-modal.component';
import { Lu2Mode } from './models/lu2-search';
import packageJson from '../../package.json';

@Component({
    selector: 'app-root',
    imports: [
      CommonModule,
      HttpClientModule,
      LoginModalComponent,
      FireLinkFormComponent,
      FireLinkListComponent,
      ConfirmationToastComponent,
      AppHeaderComponent,
      Lu2SearchModalComponent,
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dpadFocusAnchorRef') private dpadFocusAnchorRef?: ElementRef<HTMLElement>;

  title = 'Fire Menu';
  readonly appVersion = packageJson.version;

  menuTabs = [
    { label: 'Fire Menu', active: true },
    { label: 'Menu List', active: false },
    { label: 'Kissing Bridge Cams', active: false },
  ];

  // Try to load a local, ignored env file first. If it's not present, fall back to the value below.
  // Create `src/environments/firebase.env.ts` (ignored) or copy `src/environments/firebase.env.example.ts`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static staticLoadApiKey(): string {
    try {
      // Use require so the import is optional at runtime/build time.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const env = require('../environments/firebase.env') as any;
      if (env && env.FIREBASE_API_KEY) {
        return String(env.FIREBASE_API_KEY);
      }
    } catch {}
    return 'MISSING_API_KEY__MISSING_ENV_FILE';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static staticLoadDebugKeystrokeFlag(): boolean {
    try {
      // Use require so the import is optional at runtime/build time.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const env = require('../environments/firebase.env') as any;
      if (env && typeof env.DEBUG_KEYSTROKE !== 'undefined') {
        return Boolean(env.DEBUG_KEYSTROKE);
      }
    } catch {}
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static staticLoadDebugMouseEventFlag(): boolean {
    try {
      // Use require so the import is optional at runtime/build time.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const env = require('../environments/firebase.env') as any;
      if (env && typeof env.DEBUG_MOUSE_EVENT !== 'undefined') {
        return Boolean(env.DEBUG_MOUSE_EVENT);
      }
    } catch {}
    return false;
  }

  readonly firebaseApiKey: string = AppComponent.staticLoadApiKey();
  readonly debugKeystrokeEnabled: boolean = AppComponent.staticLoadDebugKeystrokeFlag();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static staticLoadDebugFocusEventFlag(): boolean {
    try {
      // Use require so the import is optional at runtime/build time.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const env = require('../environments/firebase.env') as any;
      if (env && typeof env.DEBUG_FOCUS_EVENT !== 'undefined') {
        return Boolean(env.DEBUG_FOCUS_EVENT);
      }
    } catch {}
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static staticLoadDebugTouchEventFlag(): boolean {
    try {
      // Use require so the import is optional at runtime/build time.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const env = require('../environments/firebase.env') as any;
      if (env && typeof env.DEBUG_TOUCH_EVENT !== 'undefined') {
        return Boolean(env.DEBUG_TOUCH_EVENT);
      }
    } catch {}
    return false;
  }
  readonly debugMouseEventEnabled: boolean = AppComponent.staticLoadDebugMouseEventFlag();
  readonly debugTouchEventEnabled: boolean = AppComponent.staticLoadDebugTouchEventFlag();
  readonly debugFocusEventEnabled: boolean = AppComponent.staticLoadDebugFocusEventFlag();
  readonly authUrl = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=';
  readonly dataUrl = 'https://fire-4961c-default-rtdb.firebaseio.com/pages.json';
  lastDebugKey: string | null = null;
  lastDebugMouseEvent: string | null = null;
  lastDebugTouchEvent: string | null = null;
  lastDebugFocusTarget: string | null = null;
  private debugKeystrokeTimer: number | null = null;
  private debugMouseEventTimer: number | null = null;
  private debugTouchEventTimer: number | null = null;

  // Storage key for persisted auth
  private readonly storageKey = 'firemenu_auth_v1';

  authEmail = '';
  authPassword = '';
  authToken = '';
  refreshToken = '';
  // expiry as ms since epoch
  tokenExpiry = 0;
  authError = '';
  isAuthenticated = false;
  showLoginPanel = false;

  items: FireLink[] = [];

  formModel: FireLink = this.emptyLink();
  editingId = 0;
  showModal = false;

  showLu2SearchModal = false;
  lu2Mode: Lu2Mode = 'movies';

  // Confirmation dialog state
  showConfirmation = false;
  confirmationMessage = '';
  pendingCallback: (() => void) | null = null;
  
  selectedTab: FireMenuTab = 'main';
  tabs: Array<{ label: string; value: FireMenuTab }> = [
    { label: 'Main', value: 'main' },
    { label: 'Watched', value: 'watched' },
    { label: 'Favorites', value: 'favorites' },
    { label: 'All', value: 'all' },
  ];

  constructor(private http: HttpClient, private renderer: Renderer2) {}

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (!this.debugKeystrokeEnabled) {
      return;
    }

    this.setDebugKeystrokeEvent('down', event);
  }

  @HostListener('document:keyup', ['$event'])
  onGlobalKeyup(event: KeyboardEvent): void {
    if (!this.debugKeystrokeEnabled) {
      return;
    }

    this.setDebugKeystrokeEvent('up', event);
  }

  private setDebugKeystrokeEvent(action: 'down' | 'up', event: KeyboardEvent): void {
    const legacyCode = this.getLegacyKeyCode(event);
    const fallbackKey = this.mapLegacyDpadKey(legacyCode);
    const rawKey = event.key && event.key !== 'Unidentified' ? event.key : '';
    const key = rawKey || fallbackKey || 'Unidentified';
    const codePart = event.code ? ` code:${event.code}` : '';
    const legacyPart = legacyCode ? ` kc:${legacyCode}` : '';
    const focusPart = ` focus:${this.getActiveElementDescriptor()}`;

    if (this.debugKeystrokeTimer !== null) {
      window.clearTimeout(this.debugKeystrokeTimer);
      this.debugKeystrokeTimer = null;
    }

    this.lastDebugKey = `${action} ${key}${codePart}${legacyPart}${focusPart}`;
    this.debugKeystrokeTimer = window.setTimeout(() => {
      this.lastDebugKey = null;
      this.debugKeystrokeTimer = null;
    }, 1000);
  }

  @HostListener('document:focusin', ['$event'])
  onGlobalFocusIn(event: FocusEvent): void {
    if (!this.debugFocusEventEnabled) {
      return;
    }

    const target = event.target as HTMLElement | null;
    this.lastDebugFocusTarget = target ? this.describeElement(target) : this.getActiveElementDescriptor();
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalMouseDown(event: MouseEvent): void {
    if (!this.debugMouseEventEnabled) {
      return;
    }

    this.setDebugMouseEvent(`mouse down (${this.getMouseButtonLabel(event.button)})`);
  }

  @HostListener('document:mouseup', ['$event'])
  onGlobalMouseUp(event: MouseEvent): void {
    if (!this.debugMouseEventEnabled) {
      return;
    }

    this.setDebugMouseEvent(`mouse up (${this.getMouseButtonLabel(event.button)})`);
  }

  @HostListener('document:auxclick', ['$event'])
  onGlobalAuxClick(event: MouseEvent): void {
    if (!this.debugMouseEventEnabled) {
      return;
    }

    if (event.button === 1) {
      this.setDebugMouseEvent('scroll wheel click');
      return;
    }

    this.setDebugMouseEvent(`aux click (${this.getMouseButtonLabel(event.button)})`);
  }

  @HostListener('document:wheel', ['$event'])
  onGlobalWheel(event: WheelEvent): void {
    if (!this.debugMouseEventEnabled) {
      return;
    }

    if (event.deltaY < 0) {
      this.setDebugMouseEvent('scroll wheel up');
      return;
    }

    if (event.deltaY > 0) {
      this.setDebugMouseEvent('scroll wheel down');
      return;
    }

    this.setDebugMouseEvent('scroll wheel');
  }

  @HostListener('document:touchstart', ['$event'])
  onGlobalTouchStart(event: TouchEvent): void {
    if (!this.debugTouchEventEnabled) {
      return;
    }

    this.setDebugTouchEvent(`touch start (${event.touches.length})`);
  }

  @HostListener('document:touchmove', ['$event'])
  onGlobalTouchMove(event: TouchEvent): void {
    if (!this.debugTouchEventEnabled) {
      return;
    }

    this.setDebugTouchEvent(`touch move (${event.touches.length})`);
  }

  @HostListener('document:touchend', ['$event'])
  onGlobalTouchEnd(event: TouchEvent): void {
    if (!this.debugTouchEventEnabled) {
      return;
    }

    this.setDebugTouchEvent(`touch end (${event.changedTouches.length})`);
  }

  @HostListener('document:touchcancel', ['$event'])
  onGlobalTouchCancel(event: TouchEvent): void {
    if (!this.debugTouchEventEnabled) {
      return;
    }

    this.setDebugTouchEvent(`touch cancel (${event.changedTouches.length})`);
  }

  ngOnInit(): void {
    this.tryRestoreSession().then(() => this.loadItems());
  }

  ngAfterViewInit(): void {
    this.focusDpadAnchor();

    if (this.debugFocusEventEnabled) {
      this.lastDebugFocusTarget = this.getActiveElementDescriptor();
    }
  }

  ngOnDestroy(): void {
    if (this.debugKeystrokeTimer !== null) {
      window.clearTimeout(this.debugKeystrokeTimer);
      this.debugKeystrokeTimer = null;
    }

    if (this.debugMouseEventTimer !== null) {
      window.clearTimeout(this.debugMouseEventTimer);
      this.debugMouseEventTimer = null;
    }

    if (this.debugTouchEventTimer !== null) {
      window.clearTimeout(this.debugTouchEventTimer);
      this.debugTouchEventTimer = null;
    }
  }

  private setDebugMouseEvent(value: string): void {
    if (this.debugMouseEventTimer !== null) {
      window.clearTimeout(this.debugMouseEventTimer);
      this.debugMouseEventTimer = null;
    }

    this.lastDebugMouseEvent = value;
    this.debugMouseEventTimer = window.setTimeout(() => {
      this.lastDebugMouseEvent = null;
      this.debugMouseEventTimer = null;
    }, 1000);
  }

  private getMouseButtonLabel(button: number): string {
    if (button === 0) {
      return 'left button';
    }

    if (button === 1) {
      return 'scroll wheel';
    }

    if (button === 2) {
      return 'right button';
    }

    return `button ${button}`;
  }

  private getLegacyKeyCode(event: KeyboardEvent): number {
    const legacyEvent = event as KeyboardEvent & { which?: number };
    return event.keyCode || legacyEvent.which || 0;
  }

  private mapLegacyDpadKey(code: number): string {
    if (code === 19 || code === 38) {
      return 'ArrowUp';
    }

    if (code === 20 || code === 40) {
      return 'ArrowDown';
    }

    if (code === 21 || code === 37) {
      return 'ArrowLeft';
    }

    if (code === 22 || code === 39) {
      return 'ArrowRight';
    }

    if (code === 23 || code === 13) {
      return 'Enter';
    }

    return '';
  }

  private setDebugTouchEvent(value: string): void {
    if (this.debugTouchEventTimer !== null) {
      window.clearTimeout(this.debugTouchEventTimer);
      this.debugTouchEventTimer = null;
    }

    this.lastDebugTouchEvent = value;
    this.debugTouchEventTimer = window.setTimeout(() => {
      this.lastDebugTouchEvent = null;
      this.debugTouchEventTimer = null;
    }, 1000);
  }

  private getActiveElementDescriptor(): string {
    const active = document.activeElement as HTMLElement | null;
    if (!active) {
      return 'none';
    }

    return this.describeElement(active);
  }

  private describeElement(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    const idPart = element.id ? `#${element.id}` : '';
    const classPart = element.className
      ? `.${String(element.className).trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.')}`
      : '';

    return `${tag}${idPart}${classPart}`;
  }

  private updateScrollLock(): void {
    const isAnyModalOpen = this.showLoginPanel || this.showModal || this.showLu2SearchModal;
    if (isAnyModalOpen) {
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    } else {
      this.renderer.removeStyle(document.body, 'overflow');
    }
  }

  isModalActive(): boolean {
    return this.showLoginPanel || this.showModal || this.showLu2SearchModal;
  }

  toggleLoginPanel(): void {
    this.showLoginPanel = !this.showLoginPanel;
    this.authError = '';
    this.updateScrollLock();
  }

  login(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    if (!this.firebaseApiKey) {
      this.authError = 'Firebase API key is required in app.component.ts';
      return;
    }

    const payload = {
      email: this.authEmail,
      password: this.authPassword,
      returnSecureToken: true,
    };

    this.http
      .post<{ idToken: string; email: string; refreshToken: string; expiresIn: string }>(
        `${this.authUrl}${this.firebaseApiKey}`,
        payload
      )
      .subscribe({
        next: (result) => {
          this.setSession(result.idToken, result.refreshToken, Number(result.expiresIn));
          this.authError = '';
          this.showLoginPanel = false;
          this.updateScrollLock();
          this.loadItems();
        },
        error: (error) => {
          this.authError = error?.error?.error?.message ?? 'Login failed';
        },
      });
  }

  logout(): void {
    this.isAuthenticated = false;
    this.authToken = '';
    this.refreshToken = '';
    this.tokenExpiry = 0;
    this.authEmail = '';
    this.authPassword = '';
    this.showLoginPanel = false;
    this.updateScrollLock();
    try {
      localStorage.removeItem(this.storageKey);
    } catch {}
  }

  private setSession(idToken: string, refreshToken: string, expiresInSeconds: number) {
    this.authToken = idToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresInSeconds * 1000;
    this.isAuthenticated = true;

    const payload = {
      idToken: this.authToken,
      refreshToken: this.refreshToken,
      tokenExpiry: this.tokenExpiry,
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {}
  }

  private async tryRestoreSession(): Promise<void> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { idToken?: string; refreshToken?: string; tokenExpiry?: number };
      if (parsed?.idToken && parsed.tokenExpiry && parsed.tokenExpiry > Date.now() + 60000) {
        this.authToken = parsed.idToken;
        this.refreshToken = parsed.refreshToken ?? '';
        this.tokenExpiry = parsed.tokenExpiry;
        this.isAuthenticated = true;
        return;
      }

      if (parsed?.refreshToken) {
        // try to refresh
        await this.refreshIdToken(parsed.refreshToken);
      }
    } catch (e) {
      // ignore malformed storage
    }
  }

  private refreshIdToken(oldRefreshToken: string): Promise<void> {
    const url = `https://securetoken.googleapis.com/v1/token?key=${this.firebaseApiKey}`;
    const body = `grant_type=refresh_token&refresh_token=${encodeURIComponent(oldRefreshToken)}`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    return new Promise((resolve, reject) => {
      this.http.post<{ id_token: string; refresh_token: string; expires_in: string }>(url, body, { headers }).subscribe({
        next: (res) => {
          this.setSession(res.id_token, res.refresh_token, Number(res.expires_in));
          resolve();
        },
        error: (err) => {
          // clear any stored session on failure
          try {
            localStorage.removeItem(this.storageKey);
          } catch {}
          this.isAuthenticated = false;
          this.authToken = '';
          this.refreshToken = '';
          this.tokenExpiry = 0;
          resolve();
        },
      });
    });
  }

  get isEditing() {
    return this.editingId !== 0;
  }

  emptyLink(): FireLink {
    return { id: 0, name: '', icon: '', url: '' };
  }

  startNew() {
    if (!this.isAuthenticated) {
      this.showLoginPanel = true;
      this.updateScrollLock();
      return;
    }

    this.editingId = 0;
    this.formModel = this.emptyLink();
    this.showModal = true;
    this.updateScrollLock();
  }

  openLu2SearchModal(mode: Lu2Mode): void {
    if (!this.isAuthenticated) {
      this.showLoginPanel = true;
      this.updateScrollLock();
      return;
    }

    this.lu2Mode = mode;
    this.showLu2SearchModal = true;
    this.updateScrollLock();
  }

  onLu2ModalClose(): void {
    this.showLu2SearchModal = false;
    this.updateScrollLock();
  }

  onLu2LinkAdded(entry: FireLink): void {
    const nextId = this.items.length ? Math.max(...this.items.map((item) => item.id)) + 1 : 1;
    this.items = [...this.items, { ...entry, id: nextId }];
    this.persistItems();
  }

  private loadItems(): void {
    const url = this.requestUrl(this.dataUrl);

    this.http.get<unknown>(url).subscribe({
      next: (response) => {
        const loaded = this.normalizeResponse(response);
        if (loaded.length) {
          this.items = loaded;
        }
      },
      error: (error) => {
        console.error('Unable to load Fire Links from source:', error);
      },
    });
  }

  private normalizeResponse(response: unknown): FireLink[] {
    if (!response) {
      return [];
    }

    const rawEntries = Array.isArray(response)
      ? response.map((item, index) => [String(index), item] as const)
      : Object.entries(response as Record<string, unknown>);

    return rawEntries
      .map(([key, item], index) => {
        const data = item as Record<string, unknown>;
        const name = String(data?.['name'] ?? '');
        const icon = String(data?.['imagePath'] ?? data?.['icon'] ?? '');
        const url = String(data?.['url'] ?? data?.['link'] ?? '');
        const isFavorite = Boolean(data?.['isFavorite'] ?? false);
        const isWatched = Boolean(data?.['isWatched'] ?? false);

        return {
          id: index + 1,
          name,
          icon: icon || 'https://via.placeholder.com/320x140?text=No+icon',
          url,
          isFavorite,
          isWatched,
        };
      })
      .filter((item) => item.name || item.url);
  }

  editItem(item: FireLink) {
    if (!this.isAuthenticated) {
      this.showLoginPanel = true;
      return;
    }

    this.editingId = item.id;
    this.formModel = { ...item };
    this.showModal = true;
  }

  deleteItem(item: FireLink) {
    this.items = this.items.filter((entry) => entry.id !== item.id);
    if (this.editingId === item.id) {
      this.startNew();
    }
    this.persistItems();
  }

  save(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.isEditing) {
      this.items = this.items.map((entry) =>
        entry.id === this.editingId ? { ...this.formModel, id: entry.id } : entry
      );
    } else {
      const nextId = this.items.length ? Math.max(...this.items.map((item) => item.id)) + 1 : 1;
      this.items = [...this.items, { ...this.formModel, id: nextId }];
    }

    this.persistItems();
    this.startNew();
    form.resetForm(this.formModel);
    this.showModal = false;
    this.updateScrollLock();
  }

  cancel(form?: NgForm) {
    this.startNew();
    if (form) {
      form.resetForm(this.formModel);
    }
    this.showModal = false;
    this.updateScrollLock();
  }

  private persistItems(): void {
    const payload = this.items.map((item) => ({
      name: item.name,
      imagePath: item.icon,
      url: item.url,
      isFavorite: item.isFavorite ?? false,
      isWatched: item.isWatched ?? false,
    }));

    const url = this.requestUrl(this.dataUrl);

    this.http.put(url, payload).subscribe({
      next: () => {
        console.log('Firebase list updated successfully');
      },
      error: (error) => {
        console.error('Error updating Firebase list:', error);
      },
    });
  }

  toggleFavorite(item: FireLink): void {
    const index = this.items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      this.items[index].isFavorite = !this.items[index].isFavorite;
      this.persistItems();
    }
  }

  toggleWatched(item: FireLink): void {
    const index = this.items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      this.items[index].isWatched = !this.items[index].isWatched;
      this.persistItems();
    }
  }

  getDisplayedItems(): FireLink[] {
    switch (this.selectedTab) {
      case 'watched':
        return this.items.filter((item) => item.isWatched);
      case 'favorites':
        return this.items.filter((item) => item.isFavorite);
      case 'all':
        return this.items;
      case 'main':
      default:
        return this.items.filter((item) => !item.isWatched && !item.isFavorite);
    }
  }

  selectTab(tab: FireMenuTab): void {
    this.selectedTab = tab;
  }

  scrollToBottom(): void {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private requestUrl(baseUrl: string): string {
    if (!this.authToken) {
      return baseUrl;
    }
    return `${baseUrl}?auth=${encodeURIComponent(this.authToken)}`;
  }

  onConfirmationNeeded(data: {action: string, item: FireLink, callback: () => void}): void {
    this.confirmationMessage = data.action;
    this.pendingCallback = data.callback;
    this.showConfirmation = true;
  }

  onConfirmationConfirm(): void {
    if (this.pendingCallback) {
      this.pendingCallback();
    }
    this.showConfirmation = false;
    this.pendingCallback = null;
    this.confirmationMessage = '';
  }

  onConfirmationCancel(): void {
    this.showConfirmation = false;
    this.pendingCallback = null;
    this.confirmationMessage = '';
  }

  onHeaderDoubleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.shouldTriggerAutoScroll(target)) {
      this.toggleScroll();
    }
  }

  onListPanelDoubleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Header already has its own double-click handler.
    if (target.closest('.list-header')) {
      return;
    }

    // Trigger on panel whitespace only, not cards or interactive elements.
    if (this.shouldTriggerAutoScroll(target)) {
      this.toggleScroll();
    }
  }

  private shouldTriggerAutoScroll(target: HTMLElement): boolean {
    return !target.closest('button, a, input, textarea, select, label, .dropdown-menu, .settings-dropdown, .card, app-fire-link-card');
  }

  private toggleScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Check if bottom is visible (within 50px tolerance for scroll tolerance)
    const isBottomVisible = (scrollTop + windowHeight) >= (documentHeight - 50);
    
    if (isBottomVisible) {
      this.scrollToTop();
    } else {
      this.scrollToBottom();
    }
  }

  private focusDpadAnchor(): void {
    // Keep a stable focused element so TV remotes route directional keys reliably.
    window.setTimeout(() => {
      this.dpadFocusAnchorRef?.nativeElement.focus();
    });
  }

}

