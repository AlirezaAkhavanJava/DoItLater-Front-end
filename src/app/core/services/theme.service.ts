import { Injectable, signal, effect } from '@angular/core';

export type ThemeName = '90s' | 'hana';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'doitlater.theme';
  private readonly THEMES: ThemeName[] = ['90s', 'hana'];
  private readonly defaultTheme: ThemeName = '90s';

  readonly theme = signal<ThemeName>(this.readSaved() ?? this.defaultTheme);

  constructor() {
    // React to theme changes
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(this.STORAGE_KEY, t); } catch { /* ignore */ }
    });

    // Cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key !== this.STORAGE_KEY) return;
      const v = e.newValue as ThemeName | null;
      if (v && this.THEMES.includes(v) && v !== this.theme()) {
        this.theme.set(v);
      }
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === '90s' ? 'hana' : '90s');
  }

  label(): string {
    return this.theme() === '90s' ? "90's" : 'Hana';
  }

  nextLabel(): string {
    return this.theme() === '90s' ? 'Hana' : "90's";
  }

  private readSaved(): ThemeName | null {
    try {
      const v = localStorage.getItem(this.STORAGE_KEY) as ThemeName | null;
      return v && this.THEMES.includes(v) ? v : null;
    } catch {
      return null;
    }
  }
}