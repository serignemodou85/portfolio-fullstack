import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuditLogEntry, AuditService } from '../../../core/services/audit.service';
import { LanguageService } from '../../../core/services/language.service';

const PAGE_SIZE = 25;

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [AdminShell, IconComponent, FormsModule, DatePipe, JsonPipe],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.scss'
})
export class AuditLog implements OnInit {
  private audit = inject(AuditService);
  lang = inject(LanguageService);

  readonly actions = [
    'login_success', 'login_failed', 'login_locked', 'logout',
    'mfa_enabled', 'mfa_disabled', 'mfa_failed', 'password_reset',
    'create', 'update', 'delete',
  ];

  readonly entries = signal<AuditLogEntry[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly expanded = signal<number | null>(null);
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));
  actionFilter = '';

  ngOnInit(): void {
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(false);
    this.audit.list(page, this.actionFilter || undefined).subscribe({
      next: (res) => {
        this.entries.set(res.results);
        this.total.set(res.count ?? res.results.length);
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.expanded.set(null);
    this.load(1);
  }

  toggle(entry: AuditLogEntry): void {
    if (!this.hasChanges(entry)) return;
    this.expanded.set(this.expanded() === entry.id ? null : entry.id);
  }

  hasChanges(entry: AuditLogEntry): boolean {
    return Object.keys(entry.changes || {}).length > 0;
  }

  changeCount(entry: AuditLogEntry): number {
    return Object.keys(entry.changes || {}).length;
  }

  tone(action: string): string {
    if (['login_failed', 'login_locked', 'mfa_failed', 'delete'].includes(action)) return 'danger';
    if (['mfa_enabled', 'login_success', 'create'].includes(action)) return 'success';
    if (['mfa_disabled', 'password_reset'].includes(action)) return 'warning';
    return 'neutral';
  }

  target(entry: AuditLogEntry): string {
    if (!entry.model_name) return '—';
    const model = entry.model_name.split('.').pop();
    return entry.object_repr ? `${model} · ${entry.object_repr}` : `${model} #${entry.object_id}`;
  }
}
