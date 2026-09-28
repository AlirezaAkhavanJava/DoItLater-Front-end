import { Injectable, signal } from '@angular/core';

export type Theme = '90s' | 'hana';

const STORAGE_KEY = 'doitlater.theme';
const THEMES: Theme[] = ['90s', 'hana'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readSaved() ?? '90s');

  constructor() {
    this.apply(this.theme());

    // cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      if (!THEMES.includes(e.newValue as Theme)) return;
      this.theme.set(e.newValue as Theme);
      this.apply(this.theme());
    });
  }

  private readSaved(): Theme | null {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      return v && THEMES.includes(v) ? v : null;
    } catch {
      return null;
    }
  }

  private apply(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  labelFor(theme: Theme): string {
    return theme === '90s' ? "90's" : 'Hana';
  }

  toggle() {
    this.set(this.theme() === '90s' ? 'hana' : '90s');
  }

  set(theme: Theme) {
    if (!THEMES.includes(theme)) return;
    this.theme.set(theme);
    this.apply(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }
}