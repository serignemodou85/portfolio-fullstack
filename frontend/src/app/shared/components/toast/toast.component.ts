import { Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
  readonly icons: Record<ToastType, string> = {
    success: 'check-circle',
    error: 'alert',
    info: 'info',
    warning: 'warning',
  };
}
