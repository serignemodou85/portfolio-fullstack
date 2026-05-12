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

  // ── Home hero ────────────────────────────────────────────────────────────────
  'home.eyebrow':          { fr: 'Data Engineer · ML · Full-Stack',                                  en: 'Data Engineer · ML · Full-Stack'                                 },
  'home.h1':               { fr: 'Je transforme vos données en solutions métier',                    en: 'I turn your data into business solutions'                        },
  'home.lead':             { fr: 'De la collecte des données à l\'interface utilisateur : pipelines robustes, modèles ML, APIs Django et dashboards Angular — livrés de bout en bout.', en: 'From data collection to user interface: robust pipelines, ML models, Django APIs and Angular dashboards — delivered end-to-end.' },
  'home.cta.hire':         { fr: 'Me contacter',                                                     en: 'Hire me'                                                         },
  'home.cta.work':         { fr: 'Voir mes projets',                                                 en: 'View my work'                                                    },
  'home.cta.cv':           { fr: 'Télécharger CV',                                                   en: 'Download CV'                                                     },
  'home.cta.discuss':      { fr: 'Démarrer une discussion',                                          en: 'Start a discussion'                                              },
  'home.metric.projects':  { fr: 'projets mis en avant',                                             en: 'featured projects'                                               },
  'home.metric.articles':  { fr: 'articles techniques',                                              en: 'technical articles'                                              },
  'home.metric.e2e':       { fr: 'approche delivery',                                                en: 'delivery approach'                                               },

  // ── Home "Ce que je fais" section ────────────────────────────────────────────
  'home.what.eyebrow':           { fr: 'Expertise',                                           en: 'Expertise'                                                       },
  'home.what.title':             { fr: 'Ce que je fais',                                      en: 'What I do'                                                       },
  'home.what.de.title':          { fr: 'Data Engineering',                                    en: 'Data Engineering'                                                },
  'home.what.de.text':           { fr: 'Pipelines ETL/ELT, Apache Spark, SQL avancé, orchestration Airflow et entrepôts de données cloud.', en: 'ETL/ELT pipelines, Apache Spark, advanced SQL, Airflow orchestration and cloud data warehouses.' },
  'home.what.ml.title':          { fr: 'Machine Learning',                                    en: 'Machine Learning'                                                },
  'home.what.ml.text':           { fr: 'Modèles prédictifs, MLflow, scikit-learn, feature engineering et mise en production de modèles.', en: 'Predictive models, MLflow, scikit-learn, feature engineering and model deployment.' },
  'home.what.backend.title':     { fr: 'Backend & API',                                       en: 'Backend & API'                                                   },
  'home.what.backend.text':      { fr: 'Django REST Framework, FastAPI, microservices, authentification JWT et intégration de bases de données.', en: 'Django REST Framework, FastAPI, microservices, JWT authentication and database integration.' },
  'home.what.frontend.title':    { fr: 'Frontend & Dashboards',                               en: 'Frontend & Dashboards'                                           },
  'home.what.frontend.text':     { fr: 'Applications Angular standalone, visualisation de données interactives et interfaces responsives.', en: 'Angular standalone apps, interactive data visualization and responsive interfaces.' },

  // ── Home sections ─────────────────────────────────────────────────────────────
  'home.projects.eyebrow':  { fr: 'Sélection',                    en: 'Selection'                },
  'home.projects.title':    { fr: 'Projets récents',              en: 'Recent projects'          },
  'home.projects.all':      { fr: 'Tous les projets',             en: 'All projects'             },
  'home.articles.eyebrow':  { fr: 'Publication',                  en: 'Publication'              },
  'home.articles.title':    { fr: 'Articles en avant',            en: 'Featured articles'        },
  'home.articles.blog':     { fr: 'Voir le blog',                 en: 'View the blog'            },
  'home.articles.read':     { fr: 'Lire l\'article',              en: 'Read article'             },
  'home.articles.empty':    { fr: 'Aucun article mis en avant pour le moment.', en: 'No featured articles yet.' },
  'home.articles.min':      { fr: 'min',                          en: 'min'                      },

  // ── Home project card ─────────────────────────────────────────────────────────
  'home.project.detail':    { fr: 'Voir le détail',               en: 'View details'             },

  // ── Home CTA box ──────────────────────────────────────────────────────────────
  'home.cta2.title':   { fr: 'Vous avez un projet data ou applicatif ?',                                      en: 'Do you have a data or application project?'                             },
  'home.cta2.text':    { fr: 'Je peux intervenir sur l\'architecture, le dev backend/frontend et la mise en production.', en: 'I can help with architecture, backend/frontend development and deployment.' },
  'home.cta2.btn':     { fr: 'Planifier un échange',                                                          en: 'Schedule a call'                                                        },

  // ── Sections (shared) ─────────────────────────────────────────────────────────
  'section.projects': { fr: 'Projets récents',   en: 'Recent Projects'  },
  'section.articles': { fr: 'Articles récents',  en: 'Recent Articles'  },
  'section.seeAll':   { fr: 'Voir tout',          en: 'See all'          },

  // ── Shared CTA box ────────────────────────────────────────────────────────────
  'cta.title':   { fr: 'Travaillons ensemble',                              en: "Let's work together"                                   },
  'cta.text':    { fr: 'Je suis disponible pour des missions freelance.',   en: 'I am available for freelance missions.'                 },
  'cta.btn':     { fr: 'Démarrer un projet',                                en: 'Start a project'                                       },

  // ── Shared status labels ──────────────────────────────────────────────────────
  'status.completed':   { fr: 'Terminé',   en: 'Completed'    },
  'status.in_progress': { fr: 'En cours',  en: 'In progress'  },
  'status.archived':    { fr: 'Archivé',   en: 'Archived'     },
  'status.loading':     { fr: 'Chargement...', en: 'Loading...' },

  // ── Projects page ─────────────────────────────────────────────────────────────
  'projects.eyebrow':         { fr: 'Portfolio',                               en: 'Portfolio'                           },
  'projects.title':           { fr: 'Tous les projets',                        en: 'All projects'                        },
  'projects.cta':             { fr: 'Parler d\'un projet',                     en: 'Discuss a project'                   },
  'projects.filter.all':      { fr: 'Tous',                                    en: 'All'                                 },
  'projects.filter.done':     { fr: 'Terminés',                                en: 'Completed'                           },
  'projects.filter.progress': { fr: 'En cours',                                en: 'In progress'                         },
  'projects.loading':         { fr: 'Chargement des projets...',               en: 'Loading projects...'                 },
  'projects.view':            { fr: 'Voir le projet',                          en: 'View project'                        },
  'projects.empty':           { fr: 'Aucun projet ne correspond au filtre actuel.', en: 'No projects match the current filter.' },

  // ── Experience page ───────────────────────────────────────────────────────────
  'exp.eyebrow':              { fr: 'Parcours',                                en: 'Career path'                         },
  'exp.title':                { fr: 'Expérience professionnelle & formations', en: 'Professional experience & education' },
  'exp.subtitle':             { fr: 'Un parcours construit entre production logicielle, data engineering et apprentissage continu.', en: 'A career built across software delivery, data engineering and continuous learning.' },
  'exp.cta':                  { fr: 'Proposer une mission',                    en: 'Propose a mission'                   },
  'exp.stat.total':           { fr: 'Total',                                   en: 'Total'                               },
  'exp.stat.current':         { fr: 'En cours',                                en: 'Active'                              },
  'exp.stat.certs':           { fr: 'Certifications',                          en: 'Certifications'                      },
  'exp.loading':              { fr: 'Chargement des expériences...',           en: 'Loading experiences...'              },
  'exp.filter.all':           { fr: 'Tout',                                    en: 'All'                                 },
  'exp.filter.work':          { fr: 'Expériences',                             en: 'Work'                                },
  'exp.filter.edu':           { fr: 'Formations',                              en: 'Education'                           },
  'exp.filter.cert':          { fr: 'Certifications',                          en: 'Certifications'                      },
  'exp.badge.current':        { fr: 'En cours',                                en: 'Current'                             },
  'exp.badge.done':           { fr: 'Terminé',                                 en: 'Done'                                },
  'exp.present':              { fr: 'Présent',                                 en: 'Present'                             },
  'exp.cert.view':            { fr: 'Voir certificat',                         en: 'View certificate'                    },
  'exp.type.work':            { fr: 'Expérience',                              en: 'Experience'                          },
  'exp.type.education':       { fr: 'Formation',                               en: 'Education'                           },
  'exp.type.certification':   { fr: 'Certification',                           en: 'Certification'                       },
  'exp.prev':                 { fr: 'Précédent',                               en: 'Previous'                            },
  'exp.next':                 { fr: 'Suivant',                                 en: 'Next'                                },
  'exp.page':                 { fr: 'Page',                                    en: 'Page'                                },
  'exp.of':                   { fr: '/',                                       en: 'of'                                  },
  'exp.empty':                { fr: 'Aucun élément pour ce filtre.',           en: 'No items for this filter.'           },
  'exp.cta2.title':           { fr: 'Construisons votre prochaine solution data ou web', en: 'Let\'s build your next data or web solution' },
  'exp.cta2.text':            { fr: 'Je développe des solutions robustes: backend, frontend et intégration data pour transformer des besoins métier en produits utiles.', en: 'I build robust solutions: backend, frontend and data integration to turn business needs into useful products.' },
  'exp.cta2.btn':             { fr: 'Me contacter',                            en: 'Contact me'                          },

  // ── Skills page ───────────────────────────────────────────────────────────────
  'skills.eyebrow':   { fr: 'Compétences',                                                   en: 'Skills'                                                              },
  'skills.title':     { fr: 'Stack Data Engineering & ML',                                   en: 'Data Engineering & ML Stack'                                        },
  'skills.subtitle':  { fr: 'Outils et technologies utilisés en production pour construire des solutions data-driven de bout en bout.', en: 'Tools and technologies used in production to build end-to-end data-driven solutions.' },
  'skills.cta':       { fr: 'Demander une mission',                                          en: 'Request a mission'                                                   },
  'skills.loading':   { fr: 'Chargement des compétences...',                                 en: 'Loading skills...'                                                   },
  'skills.count':     { fr: 'skills',                                                        en: 'skills'                                                              },
  'skills.years':     { fr: 'an(s)',                                                         en: 'yr(s)'                                                               },
  'skills.cta2.title': { fr: 'Transformons vos données en solutions intelligentes',          en: 'Let\'s turn your data into intelligent solutions'                    },
  'skills.cta2.text':  { fr: 'Je conçois et déploie des solutions data-driven : data engineering, machine learning, APIs backend et interfaces interactives.', en: 'I design and deploy data-driven solutions: data engineering, machine learning, backend APIs and interactive interfaces.' },
  'skills.cta2.btn':   { fr: 'Discutons de votre projet',                                   en: 'Discuss your project'                                                },

  // ── Contact page ──────────────────────────────────────────────────────────────
  'contact.eyebrow':            { fr: 'Contact',                                      en: 'Contact'                                       },
  'contact.title':              { fr: 'Parlons de votre besoin',                      en: 'Let\'s talk about your needs'                  },
  'contact.subtitle':           { fr: 'Décrivez votre contexte et je vous reviens avec une proposition claire.', en: 'Describe your context and I\'ll come back with a clear proposal.' },
  'contact.form.title':         { fr: 'Envoyer un message',                           en: 'Send a message'                                },
  'contact.form.success':       { fr: 'Votre message a été envoyé. Merci.',           en: 'Your message has been sent. Thank you.'        },
  'contact.form.name':          { fr: 'Nom complet *',                                en: 'Full name *'                                   },
  'contact.form.name.error':    { fr: 'Votre nom est requis.',                        en: 'Your name is required.'                        },
  'contact.form.email':         { fr: 'Email *',                                      en: 'Email *'                                       },
  'contact.form.email.req':     { fr: 'L\'adresse email est requise.',                en: 'Email address is required.'                    },
  'contact.form.email.invalid': { fr: 'Email invalide.',                              en: 'Invalid email.'                                },
  'contact.form.phone':         { fr: 'Téléphone',                                    en: 'Phone'                                         },
  'contact.form.subject':       { fr: 'Sujet *',                                      en: 'Subject *'                                     },
  'contact.form.subject.error': { fr: 'Ce champ est obligatoire.',                   en: 'This field is required.'                       },
  'contact.form.message':       { fr: 'Message *',                                    en: 'Message *'                                     },
  'contact.form.message.error': { fr: 'Merci de détailler votre demande.',           en: 'Please detail your request.'                   },
  'contact.form.submit':        { fr: 'Envoyer',                                      en: 'Send'                                          },
  'contact.form.sending':       { fr: 'Envoi en cours...',                            en: 'Sending...'                                    },
  'contact.form.privacy':       { fr: 'Vos informations sont utilisées uniquement pour traiter votre message.', en: 'Your information is used only to process your message.' },
  'contact.info.email':         { fr: 'Email',                                        en: 'Email'                                         },
  'contact.info.phone':         { fr: 'Téléphone',                                   en: 'Phone'                                         },
  'contact.info.location':      { fr: 'Localisation',                                 en: 'Location'                                      },
  'contact.info.social':        { fr: 'Réseaux',                                      en: 'Networks'                                      },
  'contact.available.title':    { fr: 'Je suis disponible pour',                      en: 'Available for'                                 },
  'contact.available.text':     { fr: 'Missions data engineering · Projets full-stack · Consulting ML · Freelance', en: 'Data engineering missions · Full-stack projects · ML consulting · Freelance' },

  // ── Blog / Article list page ──────────────────────────────────────────────────
  'blog.eyebrow':          { fr: 'Blog',                                              en: 'Blog'                                          },
  'blog.title':            { fr: 'Notes techniques',                                  en: 'Technical notes'                               },
  'blog.subtitle':         { fr: 'Articles sur le développement, la data et les choix d\'architecture.', en: 'Articles on development, data and architecture decisions.' },
  'blog.cta':              { fr: 'Proposer un sujet',                                 en: 'Suggest a topic'                               },
  'blog.loading':          { fr: 'Chargement des articles...',                        en: 'Loading articles...'                           },
  'blog.read':             { fr: 'Lire',                                              en: 'Read'                                          },
  'blog.views':            { fr: 'vues',                                              en: 'views'                                         },
  'blog.min':              { fr: 'min',                                               en: 'min'                                           },
  'blog.general':          { fr: 'Général',                                           en: 'General'                                       },
  'blog.status.published': { fr: 'Publié',                                            en: 'Published'                                     },
  'blog.status.archived':  { fr: 'Archivé',                                           en: 'Archived'                                      },
  'blog.status.draft':     { fr: 'Brouillon',                                         en: 'Draft'                                         },
  'blog.empty':            { fr: 'Aucun article publié pour le moment.',              en: 'No articles published yet.'                    },
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
