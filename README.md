#  Portfolio Full Stack - Django + Angular

##  Technologies

### Backend
- Python 3.x
- Django 5.x
- Django REST Framework
- MySQL
- JWT Authentication (SimpleJWT)

### Frontend
- Angular 18+
- TypeScript
- SCSS
- Standalone Components



### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```


##  Structure du Projet
```
portfolio-fullstack/
├── backend/              # Django REST API
│   ├── accounts/         # Gestion utilisateurs
│   ├── projects/         # Projets portfolio
│   ├── experience/       # Parcours professionnel
│   ├── skills/           # Compétences techniques
│   ├── blog/             # Articles de blog
│   └── contact/          # Formulaire de contact
└── frontend/             # Application Angular
    ├── src/app/
    │   ├── core/         # Services, guards, interceptors
    │   ├── features/     # Modules fonctionnels
    │   └── shared/       # Composants partagés
    └── ...
```

## Configuration

### Variables d'environnement (.env)



- **Base de données** : Identifiants MySQL
- **Django** : SECRET_KEY, DEBUG, ALLOWED_HOSTS
- **Email** : Configuration SMTP Gmail
- **CORS** : URLs autorisées

##  Fonctionnalités

### Public
-  Page d'accueil avec présentation
-  Liste et détail des projets
-  Articles de blog
-  Formulaire de contact
-  CV téléchargeable

### Admin
-  Authentification JWT
-  Dashboard avec statistiques
-  CRUD projets
-  Gestion expériences
-  Gestion compétences
-  Gestion articles blog

##  Auteur

**Modou Fall**
- **Profil** : Data Scientist | Data Engineer | Full-Stack Developer
- **Email** : modou2000f@gmail.com
- **LinkedIn** : 
- **GitHub** : 

## 📝 Licence

© 2024 Modou Fall - Tous droits réservés
