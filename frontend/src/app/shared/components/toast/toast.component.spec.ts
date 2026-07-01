import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastComponent — Tests utilisateur', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ── Rendu initial ────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render no toasts initially', () => {
    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(0);
  });

  it('should contain the toast-container', () => {
    const container = fixture.nativeElement.querySelector('.toast-container');
    expect(container).not.toBeNull();
  });

  // ── Affichage des toasts ──────────────────────────────────────────────────────

  it('devrait afficher un toast de succès quand l\'utilisateur réussit une action', async () => {
    // L'utilisateur sauvegarde un formulaire → succès
    toastService.success('Profil mis à jour.');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast-success');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Profil mis à jour.');
  });

  it('devrait afficher un toast d\'erreur quand une action échoue', async () => {
    // L'utilisateur supprime un item → erreur serveur
    toastService.error('La suppression a échoué.');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast-error');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('La suppression a échoué.');
  });

  it('devrait afficher un toast info', async () => {
    toastService.info('Traitement en cours...');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast-info');
    expect(toast).not.toBeNull();
  });

  it('devrait afficher un toast warning', async () => {
    toastService.warning('Attention, cette action est irréversible.');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.toast-warning');
    expect(toast).not.toBeNull();
  });

  // ── Stacking ─────────────────────────────────────────────────────────────────

  it('devrait empiler plusieurs toasts simultanément', async () => {
    // Plusieurs actions successives
    toastService.success('Catégorie créée.');
    toastService.success('Tag créé.');
    toastService.error('Erreur sur l\'article.');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(3);
  });

  // ── Fermeture par l'utilisateur ──────────────────────────────────────────────

  it('devrait fermer le toast quand l\'utilisateur clique sur la croix', async () => {
    toastService.success('Je vais être fermé.');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.toast-close');
    expect(closeBtn).not.toBeNull();

    closeBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(0);
  });

  it('devrait fermer uniquement le toast ciblé parmi plusieurs', async () => {
    toastService.success('Toast 1 — à garder');
    toastService.error('Toast 2 — à fermer');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const closeBtns = fixture.nativeElement.querySelectorAll('.toast-close');
    expect(closeBtns.length).toBe(2);

    // Fermer le deuxième toast
    closeBtns[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const remaining = fixture.nativeElement.querySelectorAll('.toast');
    expect(remaining.length).toBe(1);
    expect(remaining[0].textContent).toContain('Toast 1');
  });

  // ── Auto-dismiss ──────────────────────────────────────────────────────────────

  it('devrait disparaître automatiquement après 4200ms', async () => {
    vi.useFakeTimers();
    toastService.success('Auto-dismiss');

    fixture.detectChanges();
    await fixture.whenStable();

    vi.advanceTimersByTime(4200);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(0);

    vi.useRealTimers();
  });
});
