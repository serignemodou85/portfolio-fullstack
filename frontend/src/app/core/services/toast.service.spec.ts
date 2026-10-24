import { TestBed } from '@angular/core/testing';
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

  it('should start with an empty toast list', () => {
    const toasts = service.toasts();
    expect(toasts).toEqual([]);
  });

  // ── Ajout de toasts ─────────────────────────────────────────────────────────

  it('should add a success toast', () => {
    service.success('Enregistré avec succès.');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Enregistré avec succès.');
  });

  it('should add an error toast', () => {
    service.error('Une erreur est survenue.');
    const toasts = service.toasts();
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('Une erreur est survenue.');
  });

  it('should add an info toast', () => {
    service.info('Information importante.');
    const toasts = service.toasts();
    expect(toasts[0].type).toBe('info');
  });

  it('should add a warning toast', () => {
    service.warning('Attention !');
    const toasts = service.toasts();
    expect(toasts[0].type).toBe('warning');
  });

  it('should assign a unique id to each toast', () => {
    service.success('Toast 1');
    service.error('Toast 2');
    const toasts = service.toasts();
    expect(toasts[0].id).toBeTruthy();
    expect(toasts[1].id).toBeTruthy();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('should stack multiple toasts', () => {
    service.success('Toast A');
    service.error('Toast B');
    service.info('Toast C');
    const toasts = service.toasts();
    expect(toasts.length).toBe(3);
  });

  // ── Dismiss manuel ──────────────────────────────────────────────────────────

  it('should dismiss a toast by id', () => {
    service.success('À supprimer');
    const before = service.toasts();
    const id = before[0].id;

    service.dismiss(id);

    const after = service.toasts();
    expect(after.length).toBe(0);
  });

  it('should only dismiss the targeted toast', () => {
    service.success('Toast 1');
    service.error('Toast 2');

    const before = service.toasts();
    service.dismiss(before[0].id);

    const after = service.toasts();
    expect(after.length).toBe(1);
    expect(after[0].message).toBe('Toast 2');
  });

  // ── Auto-dismiss ─────────────────────────────────────────────────────────────

  it('should auto-dismiss after 4200ms', () => {
    vi.useFakeTimers();
    service.success('Auto-dismiss');

    let toasts = service.toasts();
    expect(toasts.length).toBe(1);

    vi.advanceTimersByTime(4200);
    toasts = service.toasts();
    expect(toasts.length).toBe(0);

    vi.useRealTimers();
  });

  it('should NOT dismiss before 4200ms', () => {
    vi.useFakeTimers();
    service.success('Persistent');

    vi.advanceTimersByTime(3000);
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);

    vi.useRealTimers();
  });
});
