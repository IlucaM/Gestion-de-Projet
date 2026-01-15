# Gestion de Projets

Application web de gestion de projets et tâches développée avec Next.js et TypeScript.

## Technologies

- Next.js 16 - Framework React full-stack
- TypeScript - Typage statique
- Tailwind CSS - Framework CSS utilitaire
- Shadcn/ui - Composants UI réutilisables
- Lucide React - Icônes
- LocalStorage - Persistance des données côté client

## Fonctionnalités

- Gestion complète des projets (création, modification, suppression)
- Gestion des tâches avec statuts, priorités et échéances
- Vue Tableau avec édition inline
- Vue Kanban pour l'organisation visuelle
- Recherche et filtres avancés
- Statistiques en temps réel
- Interface responsive

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes

1. Cloner le repository
```bash
git clone <url-du-repo>
cd gestion-projet
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer le serveur de développement
```bash
npm run dev
```

4. Ouvrir l'application à `http://localhost:3000`

## Build de production

```bash
npm run build
npm start
```

## Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Compilation pour la production
- `npm start` - Serveur de production
- `npm run lint` - Vérification du code avec ESLint

## Déploiement

### Vercel (recommandé)

Vercel est la solution idéale pour déployer cette application Next.js.

Le localStorage fonctionne parfaitement sur Vercel car il s'exécute dans le navigateur de l'utilisateur, non sur le serveur.

Étapes :
1. Créer un compte Vercel sur https://vercel.com
2. Connecter votre repository Git
3. Vercel détecte automatiquement Next.js et configure le projet
4. Cliquer sur "Deploy"
5. L'application est accessible via une URL automatique

Avantages : Déploiement instantané, HTTPS gratuit, CDN global, déploiements automatiques, plan gratuit généreux.

Coût : Gratuit pour les projets personnels.

### AWS Amplify

AWS Amplify offre une alternative avec configuration minimale.

Étapes :
1. Connecter le repository Git à AWS Amplify
2. Amplify détecte automatiquement Next.js
3. Déploiement automatique à chaque push
4. URL de production générée automatiquement

Avantages : Déploiement simple, HTTPS inclus, CDN intégré, déploiements automatiques.

## Stockage des données

L'application utilise actuellement le localStorage pour stocker les données côté client. Cela signifie :

- Les données sont stockées localement dans le navigateur de chaque utilisateur
- Chaque utilisateur dispose de ses propres données
- Les données persistent après fermeture du navigateur
- Les données sont perdues si l'utilisateur vide son cache

Pour une utilisation en production avec plusieurs utilisateurs, il sera nécessaire d'ajouter une base de données et un système d'authentification.

## Structure du projet

```
gestion-projet/
├── app/               # Pages Next.js
│   ├── dashboard/     # Tableau de bord
│   └── tasks/         # Gestion des tâches
├── hooks/             # Hooks personnalisés
├── components/        # Composants UI
├── lib/               # Utilitaires
└── public/            # Fichiers statiques
```

## Licence
MIT