import { Component, OnInit } from '@angular/core';

// Allow optional runtime `require` for an ignored local env file
declare const require: any;
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface FireLink {
  id: number;
  name: string;
  icon: string;
  url: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Fire Menu';

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

  readonly firebaseApiKey: string = AppComponent.staticLoadApiKey();
  readonly authUrl = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=';
  readonly dataUrl = 'https://fire-4961c-default-rtdb.firebaseio.com/pages.json';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.tryRestoreSession().then(() => this.loadItems());
  }

  toggleLoginPanel(): void {
    this.showLoginPanel = !this.showLoginPanel;
    this.authError = '';
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
      return;
    }

    this.editingId = 0;
    this.formModel = this.emptyLink();
    this.showModal = true;
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
      .map(([key, item]) => {
        const data = item as Record<string, unknown>;
        const name = String(data?.['name'] ?? '');
        const icon = String(data?.['imagePath'] ?? data?.['icon'] ?? '');
        const url = String(data?.['url'] ?? data?.['link'] ?? '');

        return {
          id: Number.isFinite(Number(key)) && Number(key) > 0 ? Number(key) : 0,
          name,
          icon: icon || 'https://via.placeholder.com/320x140?text=No+icon',
          url,
        };
      })
      .filter((item) => item.name || item.url)
      .map((item, index) => ({
        ...item,
        id: item.id || index + 1,
      }));
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
  }

  cancel(form?: NgForm) {
    this.startNew();
    if (form) {
      form.resetForm(this.formModel);
    }
    this.showModal = false;
  }

  private persistItems(): void {
    const payload = this.items.map((item) => ({
      name: item.name,
      imagePath: item.icon,
      url: item.url,
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

  private requestUrl(baseUrl: string): string {
    if (!this.authToken) {
      return baseUrl;
    }
    return `${baseUrl}?auth=${encodeURIComponent(this.authToken)}`;
  }
}
