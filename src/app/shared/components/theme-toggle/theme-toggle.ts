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
      [attr.aria-label]="'Switch to ' + (theme.theme() === '90s' ? 'Hana' : '90\\'s') + ' theme'"
      [title]="'Switch to ' + (theme.theme() === '90s' ? 'Hana' : '90\\'s') + ' theme'"
    >
      Theme: {{ theme.labelFor(theme.theme()) }}
    </button>
  `,
})
export class ThemeToggleComponent {
  protected theme = inject(ThemeService);
}