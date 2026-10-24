import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { ContactService } from '../../../core/services/contact.service';
import { ContactMessage } from '../../../core/models/contact.model';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { LanguageService } from '../../../core/services/language.service';
import { byDate, byText, tableState } from '../../../core/utils/table-state';

type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

@Component({
  selector: 'app-message-archives',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, AdminShell, IconComponent, PagerComponent],
  templateUrl: './message-archives.html',
  styleUrl: './message-archives.scss'
})
export class MessageArchives implements OnInit {
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);
  lang = inject(LanguageService);

  readonly archivedMessages = signal<ContactMessage[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly table = tableState<ContactMessage, SortKey>(this.archivedMessages, {
    sort: 'date_desc',
    searchIn: m => [m.name, m.email, m.subject, m.message],
    compare: sort => ({
      date_desc: byDate<ContactMessage>(m => m.created_at, -1),
      date_asc: byDate<ContactMessage>(m => m.created_at, 1),
      name_asc: byText<ContactMessage>(m => m.name, 1),
      name_desc: byText<ContactMessage>(m => m.name, -1),
    })[sort],
  });

  ngOnInit(): void {
    this.loadArchivedMessages();
  }

  loadArchivedMessages(): void {
    this.loading.set(true);
    this.error.set(false);
    this.contactService.getMessages({ page_size: 1000 }).subscribe({
      next: (messages) => {
        this.archivedMessages.set(messages.filter(msg => msg.status === 'archived'));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  restoreMessage(message: ContactMessage): void {
    if (!message.id) return;
    this.confirmService.confirm({
      title: 'Restaurer le message',
      message: `Restaurer le message de ${message.name} dans la boîte de réception ?`,
      confirmLabel: 'Restaurer',
      danger: false
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.contactService.restore(message.id!).subscribe({
        next: () => {
          this.removeLocally(message);
          this.toastService.success('Message restauré.');
        },
        error: () => this.toastService.error('La restauration a échoué.')
      });
    });
  }

  deleteMessage(message: ContactMessage): void {
    if (!message.id) return;
    this.confirmService.confirm({
      title: 'Supprimer le message',
      message: `Supprimer définitivement le message de ${message.name} ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.contactService.deleteMessage(message.id!).subscribe({
        next: () => {
          this.removeLocally(message);
          this.toastService.success('Message supprimé.');
        },
        error: () => this.toastService.error('La suppression a échoué.')
      });
    });
  }

  private removeLocally(message: ContactMessage): void {
    this.archivedMessages.update(list => list.filter(item => item.id !== message.id));
  }
}
