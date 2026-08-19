# 🖥️ CertificationHub — Frontend Web (React + Vite)

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Nginx](https://img.shields.io/badge/Nginx-Production_Alpine-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://nginx.org/)

Le **Frontend Web** de **CertificationHub** est une application monopage (SPA) moderne, réactive et performante, construite avec **React 19**, **TypeScript** et **Tailwind CSS**. Elle offre une interface soignée adaptée aux différents profils (Collaborateurs, Managers, Administrateurs).

---

## 🎨 Fonctionnalités & Expérience Utilisateur

* 📊 **Tableau de Bord Personnalisé (Dashboard)** :
  - Métriques clés en temps réel (taux de réussite, budget consommé en MAD/USD, certifications en cours et expirations proches).
  - Graphiques de répartition par squad, fournisseur et niveau de difficulté.
* 📚 **Catalogue des Certifications & Formations** :
  - Exploration des **53 certifications** avec recherche instantanée et filtres à facettes (Squads cibles, Fournisseur, Niveau, Coût).
  - Fiche détaillée de certification présentant les compétences évaluées, les prérequis, les liens de formation Udemy et les portails d'examen.
* 🎯 **Gestion des Assignations & Vouchers** :
  - Espace collaborateur (**Mes Certifications**) pour suivre ses objectifs, planifier ses dates d'examen et soumettre ses diplômes.
  - Espace manager (**Gestion des Assignations**) pour assigner des parcours, valider les demandes de vouchers et suivre l'avancement de son équipe.
* 📤 **Module d'Upload avec Validation OCR IA** :
  - Modalité de téléversement Drag-and-Drop (PDF / PNG / JPEG).
  - Retour visuel immédiat des résultats de l'analyse OCR (score de confiance, statut de validation, motifs d'acceptation ou de rejet).
* 💬 **Assistant IA Flottant Intégré (RAG Chat)** :
  - Widget conversationnel accessible sur l'ensemble des pages.
  - Rendu Markdown fluide, affichage des sources consultées (pages officielles, base vectorielle, SQL) et suggestions d'actions contextuelles.

---

## 📁 Structure du Code Source

```text
frontend/
├── 📁 public/            # Ressources statiques publiques (logos, favicons)
├── 📁 src/
│   ├── 📁 assets/        # Images, icônes et illustrations
│   ├── 📁 components/    # Composants réutilisables & Modales
│   │   ├── 📄 ChatAssistant.tsx           # Widget conversationnel RAG IA
│   │   ├── 📄 UploadCertificateModal.tsx  # Modale d'upload & déclenchement OCR
│   │   ├── 📄 AssignItemModal.tsx         # Modale d'attribution de certification
│   │   ├── 📄 RoleGuard.tsx               # Garde de routage selon les permissions RBAC
│   │   └── 📁 ui/                         # Composants atomiques (Boutons, Inputs, Badges, Tables)
│   ├── 📁 contexts/      # Contextes React (AuthContext, NotificationContext, ThemeContext)
│   ├── 📁 layouts/       # Mises en page (MainLayout, Sidebar, Navbar, Header)
│   ├── 📁 pages/         # Vues et pages principales de l'application
│   │   ├── 📄 Dashboard.tsx               # Vue d'ensemble et analytique
│   │   ├── 📄 Certifications.tsx          # Liste et filtres du catalogue
│   │   ├── 📄 CertificationDetails.tsx    # Fiche complète d'une certification
│   │   ├── 📄 MyAssignments.tsx           # Suivi personnel du collaborateur
│   │   ├── 📄 ManageAssignments.tsx       # Pilotage manager / admin
│   │   ├── 📄 Hierarchy.tsx               # Organigramme et squads
│   │   ├── 📄 Users.tsx                   # Administration des comptes
│   │   └── 📄 Login.tsx                   # Page d'authentification
│   ├── 📁 services/      # Clients API (Axios / Fetch) avec gestion des intercepteurs JWT
│   └── 📁 utils/         # Fonctions utilitaires, formatage de dates, conversion devises
├── 📄 Dockerfile         # Image Nginx multi-stage pour la production
├── 📄 nginx.conf         # Configuration Nginx avec réécriture SPA (try_files)
├── 📄 package.json       # Dépendances et scripts npm
├── 📄 tailwind.config.js # Configuration du design system Tailwind CSS
└── 📄 vite.config.ts     # Configuration du bundler Vite
```

---

## 🛡️ Gestion des Rôles & Sécurité Côté Client

L'application protège dynamiquement les routes et les éléments de l'interface selon le rôle de l'utilisateur stocké dans le token JWT décodé :

| Rôle | Pages Accessibles | Actions Autorisées |
| :--- | :--- | :--- |
| **COLLABORATOR** | Dashboard, Catalogue, Mes Certifications, Profil | Demande d'assignation, upload de certificat, consultation des cours |
| **MANAGER** | Dashboard Squad, Catalogue, Mes Certifs, Gestion Assignations, Organigramme | Attribution de certifs à sa squad, validation des vouchers |
| **ADMIN** | Toutes les pages sans restriction | Gestion complète des utilisateurs, squads, catalogue et paramètres |

---

## 🛠️ Installation & Développement Local

### Prérequis
* Node.js v20+ (ou v22 LTS)
* npm ou pnpm

### 1. Installation des dépendances
```bash
cd frontend
npm install
```

### 2. Lancement du serveur de développement
```bash
npm run dev
```
L'application est disponible sur : **`http://localhost:5173`**.

Les requêtes API vers `/api` sont automatiquement redirigées vers le backend Spring Boot (`http://localhost:9090`).

### 3. Construction pour la production (Build)
```bash
npm run build
```
Les fichiers compilés et minifiés sont générés dans le répertoire `dist/`.

---

## 🐳 Déploiement en Conteneur (Nginx)

L'image Docker utilise un build multi-étapes optimisé :
1. **Étape Build** : Compilation Vite avec Node.js.
2. **Étape Run** : Serveur Nginx Alpine ultra-léger servant les fichiers statiques et gérant le routage SPA (`try_files $uri $uri/ /index.html`).

Le conteneur est exposé sur le port **80**.
