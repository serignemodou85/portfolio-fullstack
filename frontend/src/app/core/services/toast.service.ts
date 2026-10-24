import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void { this.add('success', message); }
  error(message: string): void   { this.add('error', message); }
  info(message: string): void    { this.add('info', message); }
  warning(message: string): void { this.add('warning', message); }

  dismiss(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(type: ToastType, message: string): void {
    // Plusieurs requêtes qui échouent ensemble ne doivent pas empiler le même message.
    if (this._toasts().some(t => t.type === type && t.message === message)) {
      return;
    }
    const id = `${type}-${performance.now().toString(36)}`;
    this._toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4200);
  }
}
