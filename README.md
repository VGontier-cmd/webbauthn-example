# WebAuthn Example

Un exemple complet d'implémentation WebAuthn avec authentification par passkeys, utilisant React, NestJS, PostgreSQL et Docker.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Comprendre WebAuthn : Flux et Challenges](#-comprendre-webauthn--flux-et-challenges)
- [Structure du projet](#-structure-du-projet)
- [API Endpoints](#-api-endpoints)
- [Configuration](#-configuration)
- [Développement](#-développement)
- [Production](#-production)
- [Dépannage](#-dépannage)
- [License](#-license)

## ✨ Fonctionnalités

### Authentification classique
- ✅ **Inscription** avec email, mot de passe, prénom et nom
- ✅ **Connexion** avec email et mot de passe
- ✅ Validation des données avec class-validator

### Authentification WebAuthn
- ✅ **Ajout de passkeys** depuis le dashboard
- ✅ **Connexion par passkey** depuis la page de login
- ✅ **Test d'authentification** depuis le dashboard
- ✅ **Gestion des passkeys** : affichage et suppression
- ✅ Détection automatique du type d'appareil (iOS, Android, Desktop)

### Interface utilisateur
- ✅ Interface moderne avec **Tailwind CSS** et **Shadcn UI**
- ✅ Design responsive
- ✅ Gestion des erreurs et feedback utilisateur
- ✅ États de chargement

## 🛠 Technologies

### Frontend
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS utility-first
- **Shadcn UI** - Composants UI accessibles
- **React Router** - Routage
- **@simplewebauthn/browser** - Client WebAuthn

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Typage statique
- **TypeORM** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données relationnelle
- **@simplewebauthn/server** - Serveur WebAuthn
- **bcrypt** - Hashage des mots de passe
- **class-validator** - Validation des DTOs

### Infrastructure
- **Docker** & **Docker Compose** - Containerisation
- **PostgreSQL 15** - Base de données

## 📦 Prérequis

- **Docker** (version 20.10+) et **Docker Compose** (version 2.0+)
- **Node.js** 20+ (pour le développement local)
- **npm** ou **yarn**

## 🚀 Installation

### Option 1 : Avec Docker (Recommandé)

1. **Cloner le repository**
   ```bash
   git clone https://github.com/VGontier-cmd/webbauthn-example.git
   cd webbauthn-example
   ```

2. **Lancer tous les services**
   ```bash
   docker-compose up --build
   ```

   Cette commande va :
   - Construire les images Docker
   - Démarrer PostgreSQL
   - Démarrer le backend NestJS
   - Démarrer le frontend React

3. **Accéder à l'application**
   - Frontend : http://localhost:5173
   - Backend API : http://localhost:3001
   - PostgreSQL : localhost:5432

### Option 2 : Développement local

#### Base de données PostgreSQL

Assurez-vous d'avoir PostgreSQL installé et démarré, ou utilisez Docker uniquement pour la base de données :

```bash
docker-compose up postgres -d
```

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

Le backend sera disponible sur http://localhost:3001

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend sera disponible sur http://localhost:5173

## 📖 Utilisation

### 1. Créer un compte

1. Accédez à http://localhost:5173
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire :
   - Prénom
   - Nom
   - Email
   - Mot de passe (minimum 6 caractères)
4. Cliquez sur "S'inscrire"

### 2. Se connecter avec mot de passe

1. Sur la page de connexion, entrez votre email et mot de passe
2. Cliquez sur "Se connecter avec mot de passe"

### 3. Ajouter une passkey

1. Une fois connecté, vous arrivez sur le dashboard
2. Cliquez sur "Ajouter une passkey"
3. Suivez les instructions de votre navigateur/appareil :
   - **Desktop** : Utilisez votre gestionnaire de mots de passe ou une clé de sécurité
   - **iOS** : Utilisez Face ID ou Touch ID
   - **Android** : Utilisez l'empreinte digitale ou le déverrouillage facial
4. La passkey est maintenant enregistrée

### 4. Se connecter avec une passkey

1. Sur la page de connexion, entrez votre email
2. Cliquez sur "Se connecter avec une passkey"
3. Confirmez avec votre méthode d'authentification (Face ID, Touch ID, etc.)
4. Vous êtes automatiquement connecté

### 5. Gérer vos passkeys

Sur le dashboard, vous pouvez :
- Voir toutes vos passkeys enregistrées
- Tester une passkey avec le bouton "Tester la passkey"
- Supprimer une passkey avec le bouton de suppression

## 🔐 Comprendre WebAuthn : Flux et Challenges

### Pourquoi stocker un challenge ?

Le **challenge** est un élément crucial de la sécurité WebAuthn. Voici pourquoi il doit être stocké côté serveur :

#### 1. **Protection contre les attaques de rejeu (Replay Attacks)**

Sans challenge, un attaquant pourrait :
- Intercepter une réponse d'authentification valide
- La réutiliser plus tard pour s'authentifier à votre place

**Avec le challenge** :
- Le serveur génère un challenge unique et aléatoire
- L'authentificateur signe ce challenge spécifique
- Le serveur vérifie que la réponse correspond exactement au challenge qu'il a généré
- Le challenge est supprimé après usage (one-time use)
- Si quelqu'un réutilise une ancienne réponse, le challenge ne correspondra plus → **Échec**

#### 2. **Vérification de l'authenticité**

Le challenge permet de vérifier que :
- La réponse vient bien de l'authentificateur qui possède la clé privée
- La réponse n'a pas été modifiée en transit
- La réponse est récente (grâce au timeout)

#### 3. **Liaison avec la session**

Le challenge lie la requête d'authentification à une session spécifique :
- Challenge généré → Stocké avec l'ID utilisateur
- Réponse reçue → Vérifiée contre le challenge stocké
- Challenge supprimé → Empêche la réutilisation

#### 4. **Timeout et expiration**

Dans ce projet, les challenges :
- Expirent après 5 minutes (nettoyage automatique)
- Sont supprimés après usage (one-time use)
- Ne peuvent pas être réutilisés

**Exemple d'attaque bloquée** :
```
1. Attaquant intercepte : { challenge: "ABC123", signature: "xyz..." }
2. Attaquant tente de réutiliser cette réponse
3. Serveur génère un NOUVEAU challenge : "DEF456"
4. L'ancienne signature ne correspond pas au nouveau challenge
5. ❌ Authentification échouée
```

### Flux d'enregistrement d'une passkey

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌─────────────┐
│Frontend │         │ Backend │         │Navigateur│         │Authentif.   │
└────┬────┘         └────┬────┘         └────┬─────┘         └──────┬──────┘
     │                    │                    │                      │
     │ 1. generateOptions│                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Récupère user     │                      │
     │                    │ • Génère challenge  │                      │
     │                    │ • Stocke challenge  │                      │
     │                    │   (reg-{userId})    │                      │
     │                    │ • Exclut passkeys   │                      │
     │                    │   existantes        │                      │
     │<───────────────────│                    │                      │
     │    options          │                    │                      │
     │  (challenge inclus) │                    │                      │
     │                    │                    │                      │
     │ 2. startRegistration│                    │                      │
     │─────────────────────┼───────────────────>│                      │
     │                    │                    │ 3. Demande confirm.  │
     │                    │                    │    (Touch/Face ID)  │
     │                    │                    │─────────────────────>│
     │                    │                    │                      │
     │                    │                    │ 4. Génère clés       │
     │                    │                    │    Signe challenge   │
     │                    │                    │    Crée attestation  │
     │                    │                    │<─────────────────────│
     │                    │                    │                      │
     │<────────────────────┼────────────────────│                      │
     │ attestationResponse │                    │                      │
     │  (signature incluse)│                    │                      │
     │                    │                    │                      │
     │ 5. verifyRegistration│                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Récupère challenge│                      │
     │                    │ • Vérifie challenge │                      │
     │                    │ • Vérifie signature │                      │
     │                    │ • Vérifie origin    │                      │
     │                    │ • Extrait clé pub.   │                      │
     │                    │ • Sauvegarde passkey│                      │
     │                    │ • Supprime challenge│                      │
     │<───────────────────│                    │                      │
     │    success          │                    │                      │
```

**Étapes détaillées** :

1. **Génération des options** :
   - Le backend génère un challenge aléatoire unique
   - Le challenge est stocké en mémoire avec la clé `reg-{userId}`
   - Les options incluent le challenge, l'ID utilisateur, le domaine, etc.

2. **Interaction navigateur** :
   - Le navigateur demande confirmation à l'utilisateur
   - L'authentificateur génère une paire de clés (privée/publique)
   - La clé privée reste dans l'authentificateur (jamais exposée)
   - L'authentificateur signe le challenge avec la clé privée

3. **Vérification** :
   - Le backend récupère le challenge stocké
   - Vérifie que la signature correspond au challenge
   - Si valide, sauvegarde la clé publique et supprime le challenge

### Flux d'authentification avec une passkey

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌─────────────┐
│Frontend │         │ Backend │         │Navigateur│         │Authentif.   │
└────┬────┘         └────┬────┘         └────┬─────┘         └──────┬──────┘
     │                    │                    │                      │
     │ 1. generateOptions │                    │                      │
     │    (email)          │                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Trouve user       │                      │
     │                    │ • Récupère passkeys │                      │
     │                    │ • Génère challenge  │                      │
     │                    │ • Stocke challenge  │                      │
     │                    │   (auth-email-{email})│                    │
     │                    │ • Liste credential  │                      │
     │                    │   IDs autorisés     │                      │
     │<───────────────────│                    │                      │
     │    options          │                    │                      │
     │  (challenge inclus) │                    │                      │
     │                    │                    │                      │
     │ 2. startAuthentication│                    │                      │
     │─────────────────────┼───────────────────>│                      │
     │                    │                    │ 3. Trouve passkey    │
     │                    │                    │    par credential ID  │
     │                    │                    │    Demande confirm.   │
     │                    │                    │─────────────────────>│
     │                    │                    │                      │
     │                    │                    │ 4. Signe challenge   │
     │                    │                    │    avec clé privée   │
     │                    │                    │    Incrémente counter│
     │                    │                    │<─────────────────────│
     │                    │                    │                      │
     │<────────────────────┼────────────────────│                      │
     │ assertionResponse  │                    │                      │
     │  (signature incluse)│                    │                      │
     │                    │                    │                      │
     │ 3. verifyLogin      │                    │                      │
     │    (email + response)│                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Trouve user       │                      │
     │                    │ • Trouve passkey    │                      │
     │                    │ • Récupère challenge│                      │
     │                    │ • Vérifie challenge │                      │
     │                    │ • Vérifie signature │                      │
     │                    │   (avec clé pub.)   │                      │
     │                    │ • Vérifie counter  │                      │
     │                    │ • Met à jour counter│                      │
     │                    │ • Supprime challenge│                      │
     │<───────────────────│                    │                      │
     │    user data        │                    │                      │
```

**Étapes détaillées** :

1. **Génération des options** :
   - L'utilisateur entre son email
   - Le backend trouve l'utilisateur et ses passkeys
   - Génère un nouveau challenge unique
   - Stocke le challenge avec la clé `auth-email-{email}`
   - Retourne les credential IDs autorisés

2. **Interaction navigateur** :
   - Le navigateur trouve la passkey correspondante
   - Demande confirmation (Touch ID, Face ID, etc.)
   - L'authentificateur signe le challenge
   - Incrémente le compteur anti-replay

3. **Vérification** :
   - Le backend récupère le challenge stocké
   - Vérifie la signature avec la clé publique
   - Vérifie que le compteur a augmenté
   - Met à jour le compteur en base
   - Supprime le challenge (usage unique)

### Stockage des challenges dans ce projet

**Implémentation actuelle** (mémoire) :
```typescript
private challenges: Map<string, { challenge: string; timestamp: number }> = new Map();

// Stockage
this.challenges.set(`reg-${userId}`, {
  challenge: options.challenge,
  timestamp: Date.now(),
});

// Récupération et suppression
const stored = this.challenges.get(key);
this.challenges.delete(key); // Usage unique
```

**Avantages** :
- ✅ Simple à implémenter
- ✅ Rapide (accès mémoire)
- ✅ Nettoyage automatique (5 minutes)

**Limitations** (pour la production) :
- ❌ Perdu au redémarrage du serveur
- ❌ Ne fonctionne pas avec plusieurs serveurs (load balancing)
- ❌ Pas de persistance

**Pour la production** : Utiliser **Redis** ou une base de données pour :
- Persistance entre redémarrages
- Partage entre plusieurs serveurs
- Expiration automatique configurable

## 📁 Structure du projet

```
webbauthn-example/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── auth/              # Module d'authentification
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── dto/           # Data Transfer Objects
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── entities/          # Entités TypeORM
│   │   │   ├── user.entity.ts
│   │   │   └── credential.entity.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   └── main.ts            # Point d'entrée
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/         # Composants Shadcn UI
│   │   │   └── ui/
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       └── ...
│   │   ├── pages/             # Pages de l'application
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/           # Services API
│   │   │   └── api.ts
│   │   ├── lib/               # Utilitaires
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── docker-compose.yml          # Configuration Docker
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Authentification classique

- `POST /auth/register` - Inscription
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

- `POST /auth/login` - Connexion
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `GET /auth/user/:userId` - Récupérer les informations utilisateur

### WebAuthn - Enregistrement

- `POST /auth/webauthn/register/options/:userId` - Générer les options d'enregistrement
- `POST /auth/webauthn/register/verify/:userId` - Vérifier l'enregistrement
  ```json
  {
    "response": { /* attestationResponse */ },
    "deviceType": "Desktop"
  }
  ```

### WebAuthn - Authentification

- `POST /auth/webauthn/login/options` - Générer les options de connexion (par email)
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `POST /auth/webauthn/login/verify` - Vérifier l'authentification
  ```json
  {
    "email": "user@example.com",
    "response": { /* assertionResponse */ }
  }
  ```

- `POST /auth/webauthn/authenticate/options/:userId` - Options d'authentification (depuis dashboard)
- `POST /auth/webauthn/authenticate/verify/:userId` - Vérifier l'authentification

### Gestion des passkeys

- `POST /auth/webauthn/credential/:userId/:credentialId` - Supprimer une passkey

## ⚙️ Configuration

### Variables d'environnement

#### Backend (`backend/.env` ou docker-compose.yml)

```env
DATABASE_URL=postgresql://webauthn:webauthn123@postgres:5432/webauthn_db
PORT=3001
ORIGIN=http://localhost:5173
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001
```

### Configuration WebAuthn

Dans `backend/src/auth/auth.service.ts`, vous pouvez modifier :

```typescript
private rpName = "WebAuthn Example";  // Nom de votre application
private rpID = "localhost";            // Domaine (localhost pour dev)
private origin = "http://localhost:5173"; // Origine autorisée
```

⚠️ **Important** : Pour la production, `rpID` doit correspondre à votre domaine (sans protocole ni port).

## 💻 Développement

### Scripts disponibles

#### Backend

```bash
cd backend
npm run start:dev      # Démarrage en mode développement avec hot-reload
npm run build          # Compilation TypeScript
npm run start:prod     # Démarrage en mode production
npm run lint           # Linter le code
npm run test           # Exécuter les tests
```

#### Frontend

```bash
cd frontend
npm run dev            # Démarrage du serveur de développement
npm run build          # Build de production
npm run preview        # Prévisualiser le build de production
```

### Hot-reload

Avec Docker Compose, les volumes montés permettent le hot-reload :
- Les modifications dans `backend/src/` rechargent automatiquement le serveur
- Les modifications dans `frontend/src/` rechargent automatiquement le navigateur

### Base de données

Pour accéder à PostgreSQL via Docker :

```bash
docker exec -it webauthn-postgres psql -U webauthn -d webauthn_db
```

## 🚢 Production

### Préparations nécessaires

1. **Domaine et HTTPS**
   - WebAuthn nécessite HTTPS en production (sauf localhost)
   - Configurez un certificat SSL valide
   - Mettez à jour `rpID` dans `auth.service.ts` avec votre domaine

2. **Variables d'environnement**
   - Créez des fichiers `.env` sécurisés
   - Utilisez des mots de passe forts pour PostgreSQL
   - Configurez `ORIGIN` avec votre domaine de production

3. **Gestion des challenges**
   - Remplacez le stockage en mémoire par **Redis** ou une base de données
   - Implémentez une expiration automatique des challenges

4. **Sessions**
   - Ajoutez une gestion de session sécurisée (JWT, sessions serveur)
   - Configurez les cookies sécurisés (HttpOnly, Secure, SameSite)

5. **Sécurité**
   - Activez CORS avec des origines spécifiques
   - Implémentez rate limiting
   - Ajoutez des logs de sécurité
   - Configurez des headers de sécurité (Helmet)

### Build de production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Servir le dossier dist/ avec un serveur web (nginx, etc.)
```

## 🐛 Dépannage

### Erreur "database does not exist"

Assurez-vous que PostgreSQL est démarré et que la base de données est créée :

```bash
docker-compose up postgres -d
```

### Erreur "Challenge not found"

Les challenges sont stockés en mémoire et expirent après 5 minutes. Si vous attendez trop longtemps entre la génération des options et la vérification, vous devrez recommencer.

### Passkey ne fonctionne pas

1. Vérifiez que vous utilisez HTTPS (ou localhost)
2. Assurez-vous que votre navigateur supporte WebAuthn
3. Vérifiez la console du navigateur pour les erreurs
4. Vérifiez les logs du backend

### Erreur CORS

Vérifiez que `ORIGIN` dans le backend correspond à l'URL du frontend.

### Port déjà utilisé

Modifiez les ports dans `docker-compose.yml` si nécessaire :

```yaml
ports:
  - "3002:3001"  # Backend sur port 3002
  - "5174:5173"  # Frontend sur port 5174
```

## 📝 Notes importantes

- ⚠️ Ce projet est un **exemple éducatif**. Pour la production, ajoutez :
  - Validation côté serveur plus robuste
  - Gestion d'erreurs complète
  - Logs et monitoring
  - Tests unitaires et d'intégration
  - Documentation API (Swagger/OpenAPI)

- 🔒 **Sécurité** : Les mots de passe sont hashés avec bcrypt, mais en production, ajoutez :
  - Rate limiting
  - Protection CSRF
  - Validation d'email (vérification par email)
  - Mots de passe plus forts

## 📄 License

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📚 Ressources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Shadcn UI](https://ui.shadcn.com/)
