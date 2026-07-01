import { TestBed } from '@angular/core/testing';
import { firstValueFrom, skip, take } from 'rxjs';
import { vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  // ── Création ────────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty toast list', async () => {
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts).toEqual([]);
  });

  // ── Ajout de toasts ─────────────────────────────────────────────────────────

  it('should add a success toast', async () => {
    service.success('Enregistré avec succès.');
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Enregistré avec succès.');
  });

  it('should add an error toast', async () => {
    service.error('Une erreur est survenue.');
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('Une erreur est survenue.');
  });

  it('should add an info toast', async () => {
    service.info('Information importante.');
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts[0].type).toBe('info');
  });

  it('should add a warning toast', async () => {
    service.warning('Attention !');
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts[0].type).toBe('warning');
  });

  it('should assign a unique id to each toast', async () => {
    service.success('Toast 1');
    service.error('Toast 2');
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts[0].id).toBeTruthy();
    expect(toasts[1].id).toBeTruthy();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('should stack multiple toasts', async () => {
    service.success('Toast A');
    service.error('Toast B');
    service.info('Toast C');
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts.length).toBe(3);
  });

  // ── Dismiss manuel ──────────────────────────────────────────────────────────

  it('should dismiss a toast by id', async () => {
    service.success('À supprimer');
    const before = await firstValueFrom(service.toasts$);
    const id = before[0].id;

    service.dismiss(id);

    const after = await firstValueFrom(service.toasts$);
    expect(after.length).toBe(0);
  });

  it('should only dismiss the targeted toast', async () => {
    service.success('Toast 1');
    service.error('Toast 2');

    const before = await firstValueFrom(service.toasts$);
    service.dismiss(before[0].id);

    const after = await firstValueFrom(service.toasts$);
    expect(after.length).toBe(1);
    expect(after[0].message).toBe('Toast 2');
  });

  // ── Auto-dismiss ─────────────────────────────────────────────────────────────

  it('should auto-dismiss after 4200ms', async () => {
    vi.useFakeTimers();
    service.success('Auto-dismiss');

    let toasts = await firstValueFrom(service.toasts$);
    expect(toasts.length).toBe(1);

    vi.advanceTimersByTime(4200);
    toasts = await firstValueFrom(service.toasts$);
    expect(toasts.length).toBe(0);

    vi.useRealTimers();
  });

  it('should NOT dismiss before 4200ms', async () => {
    vi.useFakeTimers();
    service.success('Persistent');

    vi.advanceTimersByTime(3000);
    const toasts = await firstValueFrom(service.toasts$);
    expect(toasts.length).toBe(1);

    vi.useRealTimers();
  });
});
