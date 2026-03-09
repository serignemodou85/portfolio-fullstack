// src/app/shared/components/icon/icon.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg 
      [attr.width]="size" 
      [attr.height]="size" 
      [attr.viewBox]="viewBox"
      fill="none" 
      stroke="currentColor" 
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round" 
      stroke-linejoin="round"
      [class]="customClass"
    >
      <ng-container [ngSwitch]="resolvedName">
        <!-- Edit Icon -->
        <g *ngSwitchCase="'edit'">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </g>

        <!-- Trash Icon -->
        <g *ngSwitchCase="'trash'">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </g>

        <!-- Archive Icon -->
        <g *ngSwitchCase="'archive'">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5"></rect>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </g>

        <!-- Eye Icon -->
        <g *ngSwitchCase="'eye'">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </g>

        <!-- Plus Icon -->
        <g *ngSwitchCase="'plus'">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </g>

        <!-- Check Icon -->
        <g *ngSwitchCase="'check'">
          <polyline points="20 6 9 17 4 12"></polyline>
        </g>

        <!-- X Icon -->
        <g *ngSwitchCase="'x'">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </g>

        <!-- Arrow Right Icon -->
        <g *ngSwitchCase="'arrow-right'">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </g>

        <!-- Settings Icon -->
        <g *ngSwitchCase="'settings'">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m5.66-13.66l-4.24 4.24m-2.83 2.83l-4.24 4.24m12.02 0l-4.24-4.24m-2.83-2.83l-4.24-4.24"></path>
        </g>

        <!-- File Icon -->
        <g *ngSwitchCase="'file'">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </g>

        <!-- Download Icon -->
        <g *ngSwitchCase="'download'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </g>

        <!-- User Icon -->
        <g *ngSwitchCase="'user'">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </g>

        <!-- Mail Icon -->
        <g *ngSwitchCase="'mail'">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </g>

        <!-- Search Icon -->
        <g *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </g>

        <!-- Code Icon -->
        <g *ngSwitchCase="'code'">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </g>

        <!-- Database Icon -->
        <g *ngSwitchCase="'database'">
          <ellipse cx="12" cy="5" rx="8" ry="3"></ellipse>
          <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"></path>
          <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>
        </g>

        <!-- Cloud Icon -->
        <g *ngSwitchCase="'cloud'">
          <path d="M20 17.5a4.5 4.5 0 0 0-.8-8.9A6 6 0 0 0 7.4 7 4 4 0 0 0 7 15h13z"></path>
        </g>

        <!-- Server Icon -->
        <g *ngSwitchCase="'server'">
          <rect x="3" y="3" width="18" height="7" rx="1.6"></rect>
          <rect x="3" y="14" width="18" height="7" rx="1.6"></rect>
          <line x1="7" y1="6.5" x2="7.01" y2="6.5"></line>
          <line x1="7" y1="17.5" x2="7.01" y2="17.5"></line>
          <line x1="11" y1="6.5" x2="17" y2="6.5"></line>
          <line x1="11" y1="17.5" x2="17" y2="17.5"></line>
        </g>

        <!-- CPU Icon -->
        <g *ngSwitchCase="'cpu'">
          <rect x="7" y="7" width="10" height="10" rx="2"></rect>
          <rect x="10" y="10" width="4" height="4"></rect>
          <line x1="9" y1="1" x2="9" y2="4"></line>
          <line x1="15" y1="1" x2="15" y2="4"></line>
          <line x1="9" y1="20" x2="9" y2="23"></line>
          <line x1="15" y1="20" x2="15" y2="23"></line>
          <line x1="20" y1="9" x2="23" y2="9"></line>
          <line x1="20" y1="15" x2="23" y2="15"></line>
          <line x1="1" y1="9" x2="4" y2="9"></line>
          <line x1="1" y1="15" x2="4" y2="15"></line>
        </g>

        <!-- Chart Icon -->
        <g *ngSwitchCase="'chart'">
          <line x1="4" y1="20" x2="20" y2="20"></line>
          <rect x="6" y="11" width="3" height="7"></rect>
          <rect x="11" y="8" width="3" height="10"></rect>
          <rect x="16" y="5" width="3" height="13"></rect>
        </g>

        <!-- Default (si icône inconnue) -->
        <g *ngSwitchDefault>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </g>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    svg {
      flex-shrink: 0;
    }
  `]
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: number | string = 20;
  @Input() strokeWidth: number | string = 2;
  @Input() customClass: string = '';
  
  get viewBox(): string {
    return '0 0 24 24';
  }

  get resolvedName(): string {
    return (this.name || '').toLowerCase().trim();
  }
}
