import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  template: `
    <span class="priority-badge" [class]="'priority-badge priority-' + priority.toLowerCase()">
      {{ priority }}
    </span>
  `,
})
export class PriorityBadgeComponent {
  @Input({ required: true }) priority!: string;
}