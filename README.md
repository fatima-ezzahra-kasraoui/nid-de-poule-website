# 🚧 RoadWatch — Plateforme de gestion des nids-de-poule

> Stack : **Spring Boot 3.2 (Java 17)** · **React 18 (Vite)** · **Firebase Firestore + Auth**

RoadWatch est une application web fullstack permettant aux administrateurs de gérer les signalements de nids-de-poule soumis par des utilisateurs mobiles. Elle offre un tableau de bord analytique, une carte interactive, un système de priorité IA, et des exports PDF/Excel.

---

## 📋 Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Structure du projet](#-structure-du-projet)
- [Installation](#-installation)
- [Endpoints API](#-endpoints-api)
- [Tests](#-tests)
- [Variables d'environnement](#-variables-denvironnement)

---

## ✨ Fonctionnalités

**Tableau de bord**
- KPIs en temps réel (total, en attente, confirmés, réparés)
- Taux de résolution et temps moyen de réparation
- Signalements prioritaires avec score IA + météo + likes
- Zones les plus touchées

**Carte interactive**
- Visualisation Leaflet avec clustering des marqueurs
- Marqueurs colorés par statut (orange / bleu / vert)
- Mise à jour du statut directement depuis la popup
- Navigation depuis le tableau de bord vers un signalement spécifique

**Gestion des signalements**
- Filtres par statut et par plage de dates
- Historique des changements de statut
- Commentaires paginés par signalement
- Système de likes / confirmations citoyennes
- Export Excel et PDF

**Utilisateurs**
- Liste des comptes Firebase Auth avec stats
- Activation / désactivation / suppression de comptes
- Recherche par email, nom ou UID

**Notifications**
- Notifications temps réel via Server-Sent Events (SSE)
- Déduplication automatique par `reportId`

**Météo**
- Score de risque météo par coordonnées GPS
- Intégration dans le calcul de priorité des signalements

---

## 🏗️ Architecture

```
Utilisateur mobile (app)
        ↓ signalement
Firebase Firestore ←────────────────────────────────┐
        ↓                                            │
ReportListener (SSE) → NotificationController        │
        ↓                                            │
Spring Boot (port 8080)                              │
  ├── AuthController      → JWT + Firebase Auth      │
  ├── ReportController    → CRUD signalements ────────┘
  ├── UserController      → Gestion utilisateurs
  ├── WeatherController   → Score météo
  └── NotificationController → SSE
        ↓ JSON
React / Vite (port 5173)
  ├── Dashboard.jsx       → KPIs + priorités
  ├── MapPage.jsx         → Carte Leaflet
  ├── Reports.jsx         → Liste + filtres
  ├── Users.jsx           → Gestion comptes
  ├── Stats.jsx           → Graphiques
  └── Comments.jsx / Likes.jsx
```

---

## 📁 Structure du projet

```
roadwatch/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── resources/
│       │   │   ├── application.properties
│       │   │   └── serviceAccountKey.json        ← 🔑 SECRET (ne pas committer)
│       │   └── java/com/roadwatch/admin/
│       │       ├── RoadWatchApplication.java
│       │       ├── config/
│       │       │   ├── FirebaseConfig.java        ← Initialise Firebase Admin SDK
│       │       │   ├── SecurityConfig.java        ← Spring Security + JWT
│       │       │   ├── JwtService.java            ← Génération / validation JWT
│       │       │   └── CorsConfig.java
│       │       ├── model/
│       │       │   ├── PotholeReport.java
│       │       │   ├── Comment.java
│       │       │   └── HistoryEntry.java
│       │       ├── dao/
│       │       │   ├── ReportDAO.java
│       │       │   ├── FirebaseAuthDAO.java
│       │       │   ├── CommentDAO.java
│       │       │   └── HistoryDAO.java
│       │       ├── controller/
│       │       │   ├── ReportController.java
│       │       │   ├── AuthController.java
│       │       │   ├── UserController.java
│       │       │   ├── WeatherController.java
│       │       │   └── NotificationController.java
│       │       ├── service/
│       │       │   └── WeatherService.java
│       │       └── listener/
│       │           └── ReportListener.java        ← Écoute Firestore en temps réel
│       └── test/
│           └── java/com/roadwatch/admin/          ← 105 tests JUnit 5
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx                               ← Router + Sidebar
        ├── services/
        │   ├── api.js                             ← Tous les appels HTTP
        │   └── auth.js                            ← Gestion token JWT
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── MapPage.jsx
        │   ├── Reports.jsx
        │   ├── Users.jsx
        │   ├── Stats.jsx
        │   ├── Comments.jsx
        │   ├── Likes.jsx
        │   └── Login.jsx
        └── components/
            ├── NotificationBell.jsx
            └── HistoryModal.jsx
```

---

## 🚀 Installation

### Prérequis

| Outil | Version |
|---|---|
| Java | 17+ |
| Maven | 3.9+ |
| Node.js | 18+ |
| IntelliJ IDEA | recommandé pour le backend |

---

### 1. Clé Firebase

1. [Firebase Console](https://console.firebase.google.com) → ton projet → ⚙️ Paramètres → **Comptes de service**
2. **Générer une nouvelle clé privée** → télécharger le `.json`
3. Le placer dans :

```
backend/src/main/resources/serviceAccountKey.json
```

> ⚠️ Ce fichier est dans `.gitignore` — ne jamais le committer.

---

### 2. Backend

```bash
cd backend

# Avec le wrapper Maven
./mvnw spring-boot:run

# Ou avec Maven installé
mvn spring-boot:run
```

✅ Prêt quand la console affiche :
```
✅ Firebase Admin SDK initialisé
Tomcat started on port 8080
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

✅ Prêt quand la console affiche :
```
VITE ready
➜ Local: http://localhost:5173/
```

> ⚠️ Le backend doit être démarré avant d'utiliser l'application.

---

### 4. Connexion

Accéder à **http://localhost:5173** et se connecter avec un compte admin enregistré dans Firebase Auth.

---

## 🔗 Endpoints API

Toutes les routes (sauf `/api/auth/login`) nécessitent un header :
```
Authorization: Bearer <token_jwt>
```

### Auth
| Méthode | URL | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion → retourne un JWT |

### Signalements
| Méthode | URL | Description |
|---|---|---|
| GET | `/api/dashboard` | KPIs globaux + 5 signalements récents |
| GET | `/api/stats` | Données graphiques (par mois, par statut) |
| GET | `/api/reports` | Liste avec filtres `?status=&dateFrom=&dateTo=` |
| GET | `/api/reports/{id}` | Détail d'un signalement |
| POST | `/api/reports` | Créer un signalement |
| POST | `/api/reports/{id}/status` | Changer le statut `{ "status": "confirmed" }` |
| DELETE | `/api/reports/{id}` | Supprimer un signalement |
| GET | `/api/reports/{id}/history` | Historique des changements |
| GET | `/api/reports/{id}/comments` | Commentaires paginés `?page=0&limit=20` |
| DELETE | `/api/reports/{id}/comments/{commentId}` | Supprimer un commentaire |
| GET | `/api/reports/{id}/likes` | Nombre de likes |
| GET | `/api/reports/{id}/likes/paginated` | Likes avec infos utilisateurs |
| GET | `/api/export` | Export `?format=excel\|pdf&status=` |

### Utilisateurs
| Méthode | URL | Description |
|---|---|---|
| GET | `/api/users` | Liste tous les utilisateurs Firebase |
| GET | `/api/users/stats` | Stats (total, actifs, désactivés) |
| GET | `/api/users/{uid}` | Détail + signalements d'un utilisateur |
| POST | `/api/users/{uid}/disable` | Désactiver un compte |
| POST | `/api/users/{uid}/enable` | Activer un compte |
| DELETE | `/api/users/{uid}` | Supprimer un compte |

### Météo & Notifications
| Méthode | URL | Description |
|---|---|---|
| GET | `/api/weather?lat=&lng=` | Score de risque météo |
| GET | `/api/notifications/subscribe` | Flux SSE temps réel |

---

## 🧪 Tests

### Frontend (Vitest + Testing Library)

```bash
cd frontend
npm run test          # Lancer les tests
npm run coverage      # Rapport de couverture
```

| Fichier | Couverture |
|---|---|
| `Dashboard.jsx` | 89% |
| `Reports.jsx` | 92% |
| `Login.jsx` | 100% |
| `Users.jsx` | 97% |
| `MapPage.jsx` | 82% |
| `HistoryModal.jsx` | 100% |
| **Total** | **60%+** |

### Backend (JUnit 5 + Mockito)

```bash
cd backend
mvn test                        # Lancer les tests
start target/site/jacoco/index.html  # Rapport JaCoCo (Windows)
```

| Package | Couverture |
|---|---|
| `model` | 100% |
| `config` | 98% |
| `service` | 91% |
| `controller` | 49% |
| **Total** | **65%** |

> Les DAOs Firebase (Firestore) sont exclus de la couverture JaCoCo car ils nécessitent une connexion Firebase réelle.

---

## ⚙️ Variables d'environnement

| Fichier | Variable | Description |
|---|---|---|
| `api.js` | `BASE_URL` | URL du backend (`http://localhost:8080/api`) |
| `CorsConfig.java` | `allowedOrigins` | URL du frontend autorisée |
| `MapPage.jsx` | `center` | Coordonnées GPS par défaut de la carte |
| `application.properties` | `jwt.secret` | Clé secrète JWT |

---

## 🛠️ Technologies utilisées

**Backend**
- Spring Boot 3.2 · Spring Security · JWT (jjwt 0.11)
- Firebase Admin SDK 9.2
- iText 5 (PDF) · Apache POI (Excel)
- JUnit 5 · Mockito 5 · JaCoCo

**Frontend**
- React 18 · Vite · React Router 6
- Leaflet · react-leaflet · react-leaflet-cluster
- Chart.js · Recharts
- Vitest · Testing Library

---

*RoadWatch · Spring Boot + React + Firebase · 2026*
