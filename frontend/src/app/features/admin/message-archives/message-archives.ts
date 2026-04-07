import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ContactService } from '../../../core/services/contact.service';
import { ContactMessage } from '../../../core/models/contact.model';

@Component({
  selector: 'app-message-archives',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminShell, IconComponent],
  templateUrl: './message-archives.html',
  styleUrl: './message-archives.scss'
})
export class MessageArchives implements OnInit {
  archivedMessages: ContactMessage[] = [];
  loading = true;
  error: string | null = null;
  pageSize = 5;
  pageSizeOptions = [4, 5, 10, 20];
  page = 1;
  searchTerm = '';
  sortKey: 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' = 'date_desc';

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    this.loadArchivedMessages();
  }

  loadArchivedMessages(): void {
    this.loading = true;
    this.error = null;

    this.contactService.getMessages({ page_size: 1000 }).subscribe({
      next: (messages) => {
        this.archivedMessages = messages.filter((msg) => msg.status === 'archived');
        this.syncPage();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement messages archives:', err);
        this.error = 'Impossible de charger les messages archives.';
        this.loading = false;
      }
    });
  }

  get pagedMessages(): ContactMessage[] {
    return this.paginate(this.processedMessages, this.page);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.processedMessages.length / this.pageSize));
  }

  setPage(page: number): void {
    this.page = this.clampPage(page, this.totalPages);
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.syncPage();
  }

  get processedMessages(): ContactMessage[] {
    const query = this.searchTerm.trim().toLowerCase();
    let items = this.archivedMessages;
    if (query) {
      items = items.filter((message) =>
        [message.name, message.email, message.subject, message.message]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query))
      );
    }
    return this.sortMessages(items);
  }

  restoreMessage(message: ContactMessage): void {
    if (!message?.id) {
      return;
    }
    this.contactService.restore(message.id).subscribe({
      next: () => {
        this.archivedMessages = this.archivedMessages.filter((item) => item.id !== message.id);
        this.syncPage();
      },
      error: (err) => {
        console.error('Erreur restauration message:', err);
        window.alert('La restauration a echoue.');
      }
    });
  }

  deleteMessage(message: ContactMessage): void {
    if (!message?.id) {
      return;
    }
    const confirmed = window.confirm('Supprimer ce message definitivement ?');
    if (!confirmed) {
      return;
    }
    this.contactService.deleteMessage(message.id).subscribe({
      next: () => {
        this.archivedMessages = this.archivedMessages.filter((item) => item.id !== message.id);
        this.syncPage();
      },
      error: (err) => {
        console.error('Erreur suppression message:', err);
        window.alert('La suppression a echoue.');
      }
    });
  }

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private clampPage(page: number, total: number): number {
    return Math.min(Math.max(page, 1), total);
  }

  private syncPage(): void {
    this.page = this.clampPage(this.page, this.totalPages);
  }

  private sortMessages(items: ContactMessage[]): ContactMessage[] {
    return [...items].sort((a, b) => {
      if (this.sortKey === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (this.sortKey === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      const dateA = new Date(a.created_at || '').getTime();
      const dateB = new Date(b.created_at || '').getTime();
      if (this.sortKey === 'date_asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }

  trackByMessage(index: number, item: ContactMessage): number {
    return item.id ?? index;
  }
}
