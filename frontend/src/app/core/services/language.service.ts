import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'fr' | 'en';

const T: Record<string, Record<Lang, string>> = {
  // Navbar
  'nav.home':         { fr: 'Accueil',      en: 'Home'        },
  'nav.projects':     { fr: 'Projets',      en: 'Projects'    },
  'nav.experience':   { fr: 'Expérience',   en: 'Experience'  },
  'nav.skills':       { fr: 'Compétences',  en: 'Skills'      },
  'nav.blog':         { fr: 'Blog',         en: 'Blog'        },
  'nav.contact':      { fr: 'Contact',      en: 'Contact'     },
  // Home hero
  'home.eyebrow':     { fr: 'Bienvenue sur mon portfolio',  en: 'Welcome to my portfolio'  },
  'home.cta.hire':    { fr: 'Me contacter',                 en: 'Hire me'                  },
  'home.cta.work':    { fr: 'Voir mes projets',             en: 'View my work'             },
  // Sections
  'section.projects': { fr: 'Projets récents',   en: 'Recent Projects'  },
  'section.articles': { fr: 'Articles récents',  en: 'Recent Articles'  },
  'section.seeAll':   { fr: 'Voir tout',          en: 'See all'          },
  // CTA box
  'cta.title':   { fr: 'Travaillons ensemble',                              en: "Let's work together"                                   },
  'cta.text':    { fr: 'Je suis disponible pour des missions freelance.',   en: 'I am available for freelance missions.'                 },
  'cta.btn':     { fr: 'Démarrer un projet',                                en: 'Start a project'                                       },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly KEY = 'lang';
  lang$ = new BehaviorSubject<Lang>((localStorage.getItem('lang') as Lang) ?? 'fr');

  get current(): Lang { return this.lang$.value; }

  toggle(): void {
    const next: Lang = this.lang$.value === 'fr' ? 'en' : 'fr';
    localStorage.setItem(this.KEY, next);
    this.lang$.next(next);
  }

  t(key: string): string {
    return T[key]?.[this.current] ?? key;
  }
}
