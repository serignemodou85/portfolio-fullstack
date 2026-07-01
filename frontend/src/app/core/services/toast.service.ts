import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts.asObservable();

  success(message: string): void { this.add('success', message); }
  error(message: string): void   { this.add('error', message); }
  info(message: string): void    { this.add('info', message); }
  warning(message: string): void { this.add('warning', message); }

  dismiss(id: string): void {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }

  private add(type: ToastType, message: string): void {
    const id = `${type}-${performance.now().toString(36)}`;
    this._toasts.next([...this._toasts.value, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4200);
  }
}
