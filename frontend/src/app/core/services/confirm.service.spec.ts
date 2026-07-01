import { TestBed } from '@angular/core/testing';
import { firstValueFrom, skip } from 'rxjs';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmService);
  });

  // ── Création ────────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null state initially', async () => {
    const state = await firstValueFrom(service.state$);
    expect(state).toBeNull();
  });

  // ── confirm() ────────────────────────────────────────────────────────────────

  it('should open a confirm dialog with the right config', async () => {
    const nextState = firstValueFrom(service.state$.pipe(skip(1)));
    service.confirm({ message: 'Supprimer cet élément ?' }).subscribe();

    const state = await nextState;
    expect(state).not.toBeNull();
    expect(state!.message).toBe('Supprimer cet élément ?');
  });

  it('should include optional title and labels in state', async () => {
    const nextState = firstValueFrom(service.state$.pipe(skip(1)));
    service.confirm({
      title: 'Confirmation',
      message: 'Continuer ?',
      confirmLabel: 'Oui',
      cancelLabel: 'Non',
      danger: true
    }).subscribe();

    const state = await nextState;
    expect(state!.title).toBe('Confirmation');
    expect(state!.confirmLabel).toBe('Oui');
    expect(state!.cancelLabel).toBe('Non');
    expect(state!.danger).toBe(true);
  });

  it('should resolve true when accept() is called', async () => {
    const promise = firstValueFrom(service.confirm({ message: 'Test' }));
    service.accept();
    expect(await promise).toBe(true);
  });

  it('should resolve false when cancel() is called', async () => {
    const promise = firstValueFrom(service.confirm({ message: 'Test' }));
    service.cancel();
    expect(await promise).toBe(false);
  });

  it('should close the modal after accept()', async () => {
    service.confirm({ message: 'Test' }).subscribe();
    service.accept();
    const state = await firstValueFrom(service.state$);
    expect(state).toBeNull();
  });

  it('should close the modal after cancel()', async () => {
    service.confirm({ message: 'Test' }).subscribe();
    service.cancel();
    const state = await firstValueFrom(service.state$);
    expect(state).toBeNull();
  });

  it('should emit a single value then complete', async () => {
    const promise = firstValueFrom(service.confirm({ message: 'Test' }));
    service.accept();
    // firstValueFrom se complète automatiquement après la première valeur
    expect(await promise).toBe(true);
  });

  // ── prompt() ─────────────────────────────────────────────────────────────────

  it('should mark state as withInput for prompt()', async () => {
    const nextState = firstValueFrom(service.state$.pipe(skip(1)));
    service.prompt({ message: 'Votre réponse' }).subscribe();

    const state = await nextState;
    expect(state!.withInput).toBe(true);
  });

  it('should resolve with string value when accept(inputValue) is called', async () => {
    const promise = firstValueFrom(service.prompt({ message: 'Entrez du texte' }));
    service.accept('Ma réponse');
    expect(await promise).toBe('Ma réponse');
  });

  it('should resolve false when prompt is cancelled', async () => {
    const promise = firstValueFrom(service.prompt({ message: 'Test' }));
    service.cancel();
    expect(await promise).toBe(false);
  });

  // ── Gestion conflits ─────────────────────────────────────────────────────────

  it('should cancel the previous confirm if a new one is opened', async () => {
    const first = firstValueFrom(service.confirm({ message: 'Premier' }));
    const second = firstValueFrom(service.confirm({ message: 'Deuxième' }));
    service.accept();
    const [r1, r2] = await Promise.all([first, second]);
    expect(r1).toBe(false);
    expect(r2).toBe(true);
  });
});
