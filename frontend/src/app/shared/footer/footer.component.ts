import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { IconComponent } from '../components/icon/icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  lang = inject(LanguageService);
  readonly year = new Date().getFullYear();

  readonly links = [
    { path: '/projects', key: 'nav.projects' },
    { path: '/experience', key: 'nav.experience' },
    { path: '/skills', key: 'nav.skills' },
    { path: '/blog', key: 'nav.blog' },
    { path: '/contact', key: 'nav.contact' },
  ];

  scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
