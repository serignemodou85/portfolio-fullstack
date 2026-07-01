import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService, ConfirmConfig } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent implements OnInit {
  state: ConfirmConfig | null = null;
  inputValue = '';

  constructor(public confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.confirmService.state$.subscribe(config => {
      this.state = config;
      if (config) this.inputValue = '';
    });
  }

  accept(): void {
    if (this.state?.withInput) {
      this.confirmService.accept(this.inputValue);
    } else {
      this.confirmService.accept();
    }
  }

  cancel(): void {
    this.confirmService.cancel();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.state) return;
    if (event.key === 'Escape') { event.preventDefault(); this.cancel(); }
    if (event.key === 'Enter' && !this.state.withInput) { event.preventDefault(); this.accept(); }
  }
}
