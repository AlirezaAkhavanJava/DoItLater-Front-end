import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitPriority } from '../../../core/models/habit.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="priority-badge" [ngClass]="'priority-' + priority.toLowerCase()">{{ priority }}</span>`,
  styles: [`
    .priority-badge {
      font-size: .65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .6px; padding: 3px 8px; border-radius: 10px;
      background-color: #2a2a2a; color: #888; flex-shrink: 0;
      white-space: nowrap; align-self: center;
    }
    :host-context([data-theme='90s']) .priority-badge {
      border: 2px solid #1a1a1a; border-radius: 0; background: #ece7dc; color: #1a1a1a; font-weight: 800;
    }
    .priority-low      { background-color: rgba(92,184,92,.15);  color: var(--prio-low); }
    .priority-medium   { background-color: rgba(240,173,78,.15); color: var(--prio-medium); }
    .priority-high     { background-color: rgba(230,126,34,.18); color: var(--prio-high); }
    .priority-critical { background-color: rgba(217,83,79,.18);  color: var(--prio-critical); }

    :host-context([data-theme='90s']) .priority-low      { background: var(--prio-low); color: #fff; }
    :host-context([data-theme='90s']) .priority-medium   { background: #ffd84d; color: #1a1a1a; }
    :host-context([data-theme='90s']) .priority-high     { background: var(--prio-high); color: #1a1a1a; }
    :host-context([data-theme='90s']) .priority-critical { background: var(--prio-critical); color: #fff; }
  `],
})
export class PriorityBadgeComponent {
  @Input({ required: true }) priority!: HabitPriority;
}