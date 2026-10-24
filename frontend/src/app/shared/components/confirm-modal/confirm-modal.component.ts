import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  readonly confirmService = inject(ConfirmService);
  readonly state = this.confirmService.state;
  readonly inputValue = signal('');

  constructor() {
    // Champ vidé à chaque ouverture.
    effect(() => {
      if (this.state()) {
        this.inputValue.set('');
      }
    });
  }

  accept(): void {
    if (this.state()?.withInput) {
      this.confirmService.accept(this.inputValue());
    } else {
      this.confirmService.accept();
    }
  }

  cancel(): void {
    this.confirmService.cancel();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const state = this.state();
    if (!state) return;
    if (event.key === 'Escape') { event.preventDefault(); this.cancel(); }
    if (event.key === 'Enter' && !state.withInput) { event.preventDefault(); this.accept(); }
  }
}
