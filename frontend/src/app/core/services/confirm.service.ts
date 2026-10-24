import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface ConfirmConfig {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  withInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private resolveRef: ((val: any) => void) | null = null;

  private readonly _state = signal<ConfirmConfig | null>(null);
  /** Boîte de dialogue ouverte (null = fermée). */
  readonly state = this._state.asReadonly();

  confirm(config: ConfirmConfig): Observable<boolean> {
    return new Observable(observer => {
      if (this.resolveRef) this.resolveRef(false);
      this.resolveRef = (val: boolean) => {
        observer.next(val);
        observer.complete();
      };
      this._state.set(config);
    });
  }

  prompt(config: ConfirmConfig): Observable<string | null> {
    return new Observable(observer => {
      if (this.resolveRef) this.resolveRef(null);
      this.resolveRef = (val: string | null) => {
        observer.next(val);
        observer.complete();
      };
      this._state.set({ ...config, withInput: true });
    });
  }

  accept(inputValue?: string): void {
    const resolve = this.resolveRef;
    this.resolveRef = null;
    this._state.set(null);
    if (resolve) resolve(inputValue !== undefined ? inputValue : true);
  }

  cancel(): void {
    const resolve = this.resolveRef;
    this.resolveRef = null;
    this._state.set(null);
    if (resolve) resolve(false);
  }
}
