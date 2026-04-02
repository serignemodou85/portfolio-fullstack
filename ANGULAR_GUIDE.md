# Guide Angular - Concepts et Bonnes Pratiques

Ce guide resume les concepts essentiels d'Angular et les bonnes pratiques pour construire des applications modernes, maintenables et performantes.

## 1. Architecture et principes

- Angular est un framework base sur les composants, la programmation reactive et la modularite.
- L'objectif est de separer les responsabilites: UI, logique metier, acces aux donnees, routing.
- Favoriser la lisibilite du code, la cohesion et la reutilisation.

## 2. Structure de projet recommandee

- `core/` pour services globaux, guards, interceptors, models partages, utils.
- `features/` pour chaque fonctionnalite (pages + composants locaux + services locaux).
- `shared/` pour composants et styles reutilisables.
- `assets/` pour images, fonts, fichiers statiques.
- `environments/` pour variables par environnement.

## 3. Composants

- Un composant = template + style + logique.
- Garder les composants petits et responsables d'une seule chose.
- Extraire des composants UI reutilisables au besoin.
- Eviter la logique complexe dans le template.

Exemple:
```ts
@Component({
  selector: 'app-user-card',
  standalone: true,
  templateUrl: './user-card.html',
  styleUrl: './user-card.scss'
})
export class UserCard {
  @Input() user!: User;
}
```

## 4. Standalone Components

- Preferer `standalone: true` pour reduire la complexite.
- Importer explicitement `CommonModule`, `FormsModule`, et autres composants.

## 5. Services et injection de dependances

- Placer la logique d'acces API dans des services.
- Garder les services stateless, faciles a tester.
- Utiliser `providedIn: 'root'` pour les services globaux.

Exemple:
```ts
@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private http: HttpClient) {}
  getProjects() {
    return this.http.get<Project[]>('/api/projects');
  }
}
```

## 6. RxJS et gestion des donnees

- Utiliser `Observable` pour toutes les requetes async.
- Favoriser `pipe()` et des operators clairs (`map`, `switchMap`, `catchError`).
- Eviter `subscribe` imbriques.

Bon:
```ts
this.service.getProjects().pipe(
  map(items => items.filter(p => p.status !== 'archived'))
).subscribe(...);
```

## 7. Routing

- Declarer les routes dans `app.routes.ts`.
- Utiliser `canActivate` pour proteger les routes admin.
- Utiliser `loadComponent` pour le lazy loading.

## 8. Forms

- Forms simples: `FormsModule` (template-driven).
- Forms complexes: `ReactiveFormsModule`.
- Toujours valider cote client + cote serveur.
- Ajouter `autocomplete` aux inputs pour une UX propre.

## 9. Validation et erreurs

- Toujours afficher des erreurs claires a l'utilisateur.
- Ne jamais laisser une erreur silencieuse.
- Normaliser les messages d'erreur dans un helper.

## 10. Performance

- Utiliser `trackBy` dans les `*ngFor`.
- Eviter les calculs couteux dans le template.
- Charger les grosses features en lazy loading.
- Utiliser `ChangeDetectionStrategy.OnPush` si pertinent.

## 11. Securite frontend

- Ne jamais stocker des secrets cote frontend.
- Eviter d'exposer des tokens dans des URLs.
- Verifier les reponses avant de les afficher.
- Utiliser un `auth-interceptor` pour ajouter les tokens.

## 12. UI et styles

- Centraliser la palette et les variables CSS.
- Utiliser un systeme de composants reusable.
- Garder les layouts coherents.

## 13. Tests

- Tester les services et les composants critiques.
- Favoriser les tests unitaires et les tests d'integration.

## 14. Build et deploiement

- Configurer `environment.ts` et `environment.prod.ts`.
- Toujours tester un build prod avant de deployer.

## 15. Checklist rapide avant prod

- `ng build --configuration production`
- API accesibles
- Auth/guards testees
- Erreurs geres
- Images optimisees

## 16. Architecture Clean (pratique et simple)

Objectif: separer clairement Presentation / Domaine / Donnees.

Structure cible (simple):
- `features/xxx/` (UI + pages)
- `core/` (services API, auth, guards)
- `shared/` (UI reutilisable)
- `domain/` (interfaces, models metier, use-cases)

Exemple:
```
src/app/
  domain/
    models/
    use-cases/
  core/
    services/
    interceptors/
  features/
    projects/
      pages/
      components/
      data/
```

Règles:
- Le UI ne parle pas directement a l'API: il passe par un service/use-case.
- Les models du domaine restent neutres (pas de HttpClient ici).
- Le core gere tout ce qui est global (auth, config, interceptors).

## 17. Gestion d'etat: Signals vs NgRx

### Signals (simple, moderne)
Bon pour petites/moyennes apps.
- Etat local propre dans un composant.
- Service expose des `signal` ou `computed`.

Exemple:
```ts
const projects = signal<Project[]>([]);
const featured = computed(() => projects().filter(p => p.is_featured));
```

### NgRx (grand projet)
Utile si:
- beaucoup de pages partagent le meme etat
- besoin de time-travel/debug
- multiples effects async complexes

Règles:
- Actions simples, reducers purs
- Effects pour l'API
- Selectors pour la lecture

## 18. Bonnes pratiques API

- Centraliser les appels dans des services.
- Toujours typer les reponses (`interface`).
- Utiliser `map`, `catchError`, `finalize`.
- Ne jamais laisser un `subscribe` sans gestion d'erreur.
- Preferer `switchMap` pour eviter les requetes multiples concurrentes.
- Pour les listes: pagination, cache local, et `trackBy`.

Exemple:
```ts
return this.http.get<ApiResponse<Project>>(url).pipe(
  map(res => res.results),
  catchError(() => of([]))
);
```

## 19. Bonnes pratiques UI/UX (SaaS)

- Hierarchie visuelle: titre > sous-titre > contenu.
- Actions principales visibles (CTA).
- Tables: colonnes essentielles + actions a droite.
- Badges de statut clairs (couleurs + texte).
- Feedback utilisateur: loading, erreurs, success.
- Animations courtes, jamais trop lourdes.
- Eviter le scroll global infini dans les pages admin.

## 20. Patterns utiles

- `trackBy` pour toutes les listes.
- `OnPush` sur les composants "presentational".
- `async` pipe pour eviter les subscriptions manuelles.
- Helpers de formatage (date, monnaie, taille fichier).

## 21. Checklist rapide pour un nouveau projet Angular

1. Structure propre (core/features/shared)
2. Auth + guards + interceptor
3. Services API + models types
4. UI propre + erreurs gerees
5. Build prod + tests rapides


---

## 22. Exemples reels (projet portfolio)

### 22.1 Service API avec pagination et fallback multi-pages

Exemple utilise dans `core/services/experience.service.ts`:
```ts
getExperiences(options?: { page?: number; page_size?: number }) {
  let params = new HttpParams();
  if (options?.page_size) params = params.set('page_size', String(options.page_size));
  return this.http.get<PaginatedResponse<ExperienceItem>>(url, { params }).pipe(
    switchMap(res => res.next ? this.fetchAllPages(res) : of(res.results ?? []))
  );
}
```

### 22.2 Auth Interceptor propre

Exemple dans `core/interceptors/auth-interceptor.ts`:
```ts
if (token && !publicRead) {
  req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
```

### 22.3 Pagination locale (table admin)

Exemple dans `admin/skills-admin`:
```ts
get pagedSkills() { return this.paginate(this.processedSkills, this.skillPage); }
get skillTotalPages() { return Math.max(1, Math.ceil(this.processedSkills.length / this.pageSize)); }
```

### 22.4 Layout admin global (sidebar)

Composant partage:
- `shared/components/admin-shell`

Utilisation:
```html
<app-admin-shell>
  <div class="admin-page">...</div>
</app-admin-shell>
```

### 22.5 FormData + upload image

Exemple dans `admin/profile-admin`:
```ts
const payload = new FormData();
payload.append('profile_picture', file);
this.userService.updateMe(payload)
```

## 23. Checklist s?curit? frontend

- Pas de secrets dans le frontend
- Tokens uniquement via interceptor
- Routes admin prot?gees (guard)
- Erreurs gerees (UI + console)
- `trackBy` sur toutes les listes

## 24. Checklist s?curit? backend (avant prod)

1. DEBUG = False
2. ALLOWED_HOSTS verrouille
3. JWT rotation + blacklist active
4. Limites upload actives
5. Validateurs image/pdf actives
6. Throttle login/reset/contact
7. CORS strict
8. Servir media via nginx (pas Django)

## 25. Conventions de code (conseil)

- Nommage clair: `feature/action/component`
- Pas de logique metier lourde dans le template
- Centraliser les models dans `core/models`
- Utiliser `async` pipe quand possible

## 26. Lint et format

- Utiliser ESLint/Prettier
- Format SCSS uniformise
- Pas de styles inline sauf exception

## 27. Exemple de refacto simple

Avant:
```ts
this.http.get(url).subscribe(x => this.list = x);
```

Apres:
```ts
this.service.getItems().pipe(
  catchError(() => of([]))
).subscribe(items => this.list = items);
```

## 28. Deploiement rapide

- build Angular
- collectstatic Django
- config nginx (media + static)
- activer HTTPS + HSTS



---

## 29. Schemas d'architecture (texte simple)

### 29.1 Architecture globale (frontend)
```
UI Components -> Feature Pages -> Services API -> Backend
        ^                |              |
        |                v              v
    Shared UI        State/Logic     Interceptors/Auth
```

### 29.2 Architecture admin
```
Admin Shell (sidebar)
  -> Page (dashboard / forms / tables)
     -> Service API
        -> Backend (DRF)
```

### 29.3 Flux auth
```
Login -> JWT access/refresh -> Interceptor ajoute Authorization -> API
                                 |-> 401 -> refresh -> retry
```

## 30. Guide tests unitaires (Angular)

### 30.1 Types de tests utiles
- Test de composant (render + interactions UI)
- Test de service (API + transformations)
- Test de guard/interceptor

### 30.2 Exemple composant
```ts
it('doit afficher le titre', () => {
  const fixture = TestBed.createComponent(MyComponent);
  fixture.detectChanges();
  const title = fixture.nativeElement.querySelector('h1');
  expect(title.textContent).toContain('Dashboard');
});
```

### 30.3 Exemple service
```ts
it('doit mapper les donnees', () => {
  service.getItems().subscribe(items => {
    expect(items.length).toBeGreaterThan(0);
  });
});
```

### 30.4 Mock HTTP
```ts
const req = httpMock.expectOne('/api/projects');
req.flush([{ id: 1, title: 'Test' }]);
```

### 30.5 Bonnes pratiques tests
- Pas de test fragile (pas de dependance timing)
- Mock API au lieu de requetes reelles
- Une attente = un test
- Nom de test explicite

## 31. Guide de deploiement (Django + Angular)

### 31.1 Build Angular
```bash
cd frontend
npx ng build --configuration production
```

### 31.2 Django collectstatic
```bash
cd backend
python manage.py collectstatic
```

### 31.3 Gunicorn (Linux)
```bash
pip install gunicorn

gunicorn portfolio_backend.wsgi:application   --bind 0.0.0.0:8000   --workers 3
```

### 31.4 Nginx (exemple simple)
```
server {
  listen 80;
  server_name ton-domaine.com;

  location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /media/ {
    alias /path/to/media/;
  }

  location / {
    root /path/to/frontend/dist;
    try_files $uri $uri/ /index.html;
  }
}
```

### 31.5 HTTPS (Let?s Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.com
```

### 31.6 Checklist finale prod
- DEBUG=False
- ALLOWED_HOSTS correct
- CORS/CSRF strict
- JWT rotation active
- Logs actifs
- HTTPS valide
- Monitoring basique (uptime)



---

## 32. CI/CD (GitHub Actions) - exemple simple

### 32.1 Build Angular
```yaml
name: Frontend Build

on:
  push:
    paths:
      - 'frontend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm ci && npm run build
```

### 32.2 Tests + Lint
```yaml
name: Frontend Tests

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm ci && npm run test -- --watch=false
```

## 33. Monitoring + logs

### 33.1 Logs Django
- Utiliser `logging` Django avec rotation
- Stocker les logs dans un fichier
- En prod, rediriger vers un service (Sentry/Datadog)

### 33.2 Frontend monitoring
- Ajouter Sentry ou LogRocket pour erreurs UI
- Logger les erreurs critiques dans un service

### 33.3 Check minimal
- 500 erreurs backend
- 401/403 en masse
- Temps de reponse API

## 34. Performance frontend + SEO

### 34.1 Performance
- Lazy loading des pages
- `trackBy` pour toutes les listes
- Optimiser images (WebP)
- Eviter gros bundles inutiles

### 34.2 SEO
- Titre page dynamique
- Meta description
- OpenGraph pour partage

Exemple simple:
```ts
this.title.setTitle('Portfolio - Modou Fall');
this.meta.updateTag({ name: 'description', content: '...' });
```

### 34.3 Accessibilite
- Labels sur inputs
- Contraste suffisant
- Navigation clavier

