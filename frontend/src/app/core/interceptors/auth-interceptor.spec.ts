import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth-interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('refreshes once for concurrent 401s, then replays every request with the new token', () => {
    const results: unknown[] = [];
    http.get(`${environment.apiUrl}/users/me/`).subscribe(r => results.push(r));
    http.get(`${environment.apiUrl}/contact/`).subscribe(r => results.push(r));

    backend.expectOne(`${environment.apiUrl}/users/me/`).flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${environment.apiUrl}/contact/`).flush({}, { status: 401, statusText: 'Unauthorized' });

    // Avec la rotation + blacklist côté serveur, un second refresh ferait échouer la session.
    const refresh = backend.match(`${environment.authUrl}/refresh/`);
    expect(refresh.length).toBe(1);
    expect(refresh[0].request.withCredentials).toBe(true);
    refresh[0].flush({ access: 'new-token' });

    const retriedMe = backend.expectOne(`${environment.apiUrl}/users/me/`);
    const retriedContact = backend.expectOne(`${environment.apiUrl}/contact/`);
    expect(retriedMe.request.headers.get('Authorization')).toBe('Bearer new-token');
    expect(retriedContact.request.headers.get('Authorization')).toBe('Bearer new-token');
    retriedMe.flush({ id: 1 });
    retriedContact.flush([]);

    expect(results.length).toBe(2);
  });

  it('does not try to refresh when the login itself is rejected', () => {
    let status = 0;
    http.post(`${environment.authUrl}/login/`, {}).subscribe({ error: e => (status = e.status) });
    backend.expectOne(`${environment.authUrl}/login/`).flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(`${environment.authUrl}/refresh/`);
    expect(status).toBe(401);
  });

  it('never sends the access token on public read requests', () => {
    http.get(`${environment.apiUrl}/projects/`).subscribe();
    const req = backend.expectOne(`${environment.apiUrl}/projects/`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
