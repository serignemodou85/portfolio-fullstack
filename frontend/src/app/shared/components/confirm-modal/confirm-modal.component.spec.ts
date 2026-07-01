import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ConfirmModalComponent } from './confirm-modal.component';
import { ConfirmService } from '../../../core/services/confirm.service';

describe('ConfirmModalComponent — Tests utilisateur', () => {
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let confirmService: ConfirmService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    confirmService = TestBed.inject(ConfirmService);
    // ⚠ pas de detectChanges() ici — chaque test le déclenche lui-même
    // pour éviter ExpressionChangedAfterItHasBeenCheckedError (voir ci-dessous)
  });

  // ── Rendu initial ────────────────────────────────────────────────────────────

  it('should create the component', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ne devrait pas afficher la modale par défaut', () => {
    fixture.detectChanges(); // ngOnInit → subscribe → reçoit null → state=null
    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  // ── Ouverture de la modale ────────────────────────────────────────────────────
  // Pattern : confirm() AVANT detectChanges → ngOnInit reçoit directement la valeur
  // → évite ECAIBCE (le changement arrive pendant l'init, pas après la vérification)

  it('devrait afficher la modale quand confirm() est appelé', () => {
    confirmService.confirm({ message: 'Supprimer ce projet ?' }).subscribe();
    fixture.detectChanges(); // ngOnInit → subscribe → reçoit config → state=config

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).not.toBeNull();
  });

  it('devrait afficher le message de confirmation dans la modale', () => {
    confirmService.confirm({ message: 'Voulez-vous supprimer cet article ?' }).subscribe();
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.modal-message');
    expect(message.textContent).toContain('Voulez-vous supprimer cet article ?');
  });

  it('devrait afficher le titre personnalisé', () => {
    confirmService.confirm({
      title: 'Suppression définitive',
      message: 'Cette action est irréversible.'
    }).subscribe();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.modal-title');
    expect(title.textContent).toContain('Suppression définitive');
  });

  it('devrait afficher les labels de boutons personnalisés', () => {
    confirmService.confirm({
      message: 'Confirmer ?',
      confirmLabel: 'Oui, supprimer',
      cancelLabel: 'Non, annuler'
    }).subscribe();
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Oui, supprimer');
    expect(el.textContent).toContain('Non, annuler');
  });

  // ── Scénario : L'utilisateur confirme l'action ───────────────────────────────

  it('devrait résoudre true quand l\'utilisateur clique sur Supprimer', async () => {
    const promise = firstValueFrom(confirmService.confirm({ message: 'Supprimer cette compétence ?' }));
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.btn-danger');
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();

    expect(await promise).toBe(true);
  });

  it('devrait fermer la modale après confirmation', () => {
    confirmService.confirm({ message: 'Test' }).subscribe();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.btn-danger').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
  });

  // ── Scénario : L'utilisateur annule l'action ─────────────────────────────────

  it('devrait résoudre false quand l\'utilisateur clique sur Annuler', async () => {
    const promise = firstValueFrom(confirmService.confirm({ message: 'Supprimer cet article ?' }));
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector('.btn-outline');
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();

    expect(await promise).toBe(false);
  });

  it('devrait fermer la modale après annulation', () => {
    confirmService.confirm({ message: 'Test' }).subscribe();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.btn-outline').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeNull();
  });

  it('devrait annuler quand l\'utilisateur clique sur le backdrop', async () => {
    const promise = firstValueFrom(confirmService.confirm({ message: 'Test' }));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.modal-backdrop').click();

    expect(await promise).toBe(false);
  });

  // ── Raccourcis clavier ────────────────────────────────────────────────────────

  it('devrait annuler quand l\'utilisateur appuie sur Echap', async () => {
    const promise = firstValueFrom(confirmService.confirm({ message: 'Test' }));
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(await promise).toBe(false);
  });

  it('devrait confirmer quand l\'utilisateur appuie sur Entrée', async () => {
    const promise = firstValueFrom(confirmService.confirm({ message: 'Test' }));
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(await promise).toBe(true);
  });

  it('ne devrait pas confirmer via Entrée si le mode prompt est actif avec textarea vide', () => {
    let resolved = false;
    confirmService.prompt({ message: 'Tapez quelque chose' }).subscribe(() => {
      resolved = true;
    });
    fixture.detectChanges();

    fixture.componentInstance.inputValue = '';
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(resolved).toBe(false);
  });

  // ── Mode prompt (avec textarea) ────────────────────────────────────────────────

  it('devrait afficher un textarea en mode prompt', () => {
    confirmService.prompt({
      message: 'Écrivez votre réponse',
      inputLabel: 'Votre réponse',
      inputPlaceholder: 'Tapez ici...'
    }).subscribe();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('.modal-textarea');
    expect(textarea).not.toBeNull();
  });

  it('devrait désactiver le bouton Confirmer si le textarea est vide', () => {
    confirmService.prompt({ message: 'Votre réponse' }).subscribe();
    fixture.detectChanges();

    // Le dernier bouton dans .modal-actions est toujours le bouton de confirmation
    const buttons = fixture.nativeElement.querySelectorAll('.modal-actions .btn');
    const confirmBtn = buttons[buttons.length - 1];
    expect(confirmBtn.disabled).toBe(true);
  });

  it('devrait envoyer la valeur saisie dans le textarea', async () => {
    const promise = firstValueFrom(confirmService.prompt({ message: 'Votre réponse' }));
    fixture.detectChanges();

    // Simuler la saisie via l'événement natif pour que ngModel se synchronise correctement
    const textarea = fixture.nativeElement.querySelector('.modal-textarea');
    textarea.value = 'Bonjour, voici ma réponse.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.modal-actions .btn');
    const confirmBtn = buttons[buttons.length - 1];
    expect(confirmBtn.disabled).toBe(false);
    confirmBtn.click();

    expect(await promise).toBe('Bonjour, voici ma réponse.');
  });

  // ── Icône danger / primary ────────────────────────────────────────────────────

  it('devrait afficher l\'icône danger par défaut', () => {
    confirmService.confirm({ message: 'Supprimer ?' }).subscribe();
    fixture.detectChanges();

    const dangerIcon = fixture.nativeElement.querySelector('.modal-icon-danger');
    expect(dangerIcon).not.toBeNull();
  });

  it('devrait afficher l\'icône primary quand danger=false', () => {
    confirmService.confirm({ message: 'Archiver ?', danger: false }).subscribe();
    fixture.detectChanges();

    const primaryIcon = fixture.nativeElement.querySelector('.modal-icon-primary');
    expect(primaryIcon).not.toBeNull();
  });
});
