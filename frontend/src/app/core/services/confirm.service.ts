import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  readonly state$ = new BehaviorSubject<ConfirmConfig | null>(null);

  confirm(config: ConfirmConfig): Observable<boolean> {
    return new Observable(observer => {
      if (this.resolveRef) this.resolveRef(false);
      this.resolveRef = (val: boolean) => {
        observer.next(val);
        observer.complete();
      };
      this.state$.next(config);
    });
  }

  prompt(config: ConfirmConfig): Observable<string | null> {
    return new Observable(observer => {
      if (this.resolveRef) this.resolveRef(null);
      this.resolveRef = (val: string | null) => {
        observer.next(val);
        observer.complete();
      };
      this.state$.next({ ...config, withInput: true });
    });
  }

  accept(inputValue?: string): void {
    const resolve = this.resolveRef;
    this.resolveRef = null;
    this.state$.next(null);
    if (resolve) resolve(inputValue !== undefined ? inputValue : true);
  }

  cancel(): void {
    const resolve = this.resolveRef;
    this.resolveRef = null;
    this.state$.next(null);
    if (resolve) resolve(false);
  }
}
