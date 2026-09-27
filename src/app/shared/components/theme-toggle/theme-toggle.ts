import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="theme-toggle"
      (click)="theme.toggle()"
      [attr.aria-label]="'Switch to ' + theme.nextLabel() + ' theme'"
      [title]="'Switch to ' + theme.nextLabel() + ' theme'">
      Theme: {{ theme.label() }}
    </button>
  `,
  styles: [`
    .theme-toggle {
      font-family: inherit;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .8px;
      text-transform: uppercase;
      cursor: pointer;
      padding: 0 16px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      line-height: 1;
      transition: background-color .15s, border-color .15s, color .15s;
    }
    :host-context([data-theme='90s']) .theme-toggle {
      background: #fff; color: #1a1a1a; border: 2px solid #1a1a1a; border-radius: 0;
    }
    :host-context([data-theme='90s']) .theme-toggle:hover {
      background: #1a1a1a; color: #fff;
    }
    :host-context([data-theme='hana']) .theme-toggle {
      background: #1e1e1e; color: #fff; border: 1px solid #333; border-radius: 999px;
    }
    :host-context([data-theme='hana']) .theme-toggle:hover {
      background: #262626; border-color: #4a90e2;
    }
    @media (max-width: 600px) {
      .theme-toggle { height: 36px; padding: 0 12px; font-size: 11px; }
    }
  `],
})
export class ThemeToggleComponent {
  protected theme = inject(ThemeService);
}