# 🚧 RoadWatch — Documentation Complète

> Stack : **Spring Boot (Java)** + **React (Vite)** + **Firebase Firestore**

---

## 📁 Structure du projet

```
roadwatch-modern/
├── backend/                          ← Spring Boot (port 8080)
│   ├── pom.xml                       ← Dépendances Maven (iText, POI, Firebase...)
│   └── src/main/
│       ├── resources/
│       │   ├── application.properties
│       │   └── serviceAccountKey.json  ← 🔑 FICHIER SECRET FIREBASE (à placer ici)
│       └── java/com/roadwatch/admin/
│           ├── RoadWatchApplication.java  ← Point d'entrée Spring Boot
│           ├── config/
│           │   ├── FirebaseConfig.java    ← Initialise Firebase au démarrage
│           │   └── CorsConfig.java        ← Autorise React à appeler l'API
│           ├── model/
│           │   └── PotholeReport.java     ← Représente un signalement (données)
│           ├── dao/
│           │   └── ReportDAO.java         ← Toutes les requêtes Firebase/Firestore
│           └── controller/
│               └── ReportController.java  ← Gère toutes les requêtes HTTP (API REST)
│
└── frontend/                         ← React + Vite (port 5173)
    ├── package.json                  ← Dépendances npm
    ├── .npmrc                        ← legacy-peer-deps=true (compatibilité)
    ├── index.html
    └── src/
        ├── main.jsx                  ← Point d'entrée React + Sidebar + Router
        ├── services/
        │   └── api.js                ← Tous les appels vers Spring Boot
        └── pages/
            ├── Dashboard.jsx         ← Page stats générales
            ├── MapPage.jsx           ← Page carte interactive (Leaflet)
            ├── Reports.jsx           ← Page liste des signalements
            └── Stats.jsx             ← Page graphiques (Chart.js)
```

---

## 🔑 Fichier Secret Firebase (serviceAccountKey.json)

Ce fichier est **obligatoire** pour que le backend puisse accéder à Firebase.

**Comment l'obtenir :**
1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Ton projet → ⚙️ Paramètres → **Comptes de service**
3. Cliquer sur **Générer une nouvelle clé privée**
4. Télécharger le fichier `.json`

**Où le placer :**
```
backend/src/main/resources/serviceAccountKey.json
```

> ⚠️ Ne jamais committer ce fichier sur GitHub ! Ajouter au `.gitignore` :
> ```
> src/main/resources/serviceAccountKey.json
> ```

---

## 🚀 Installation et lancement

### Prérequis
- [IntelliJ IDEA](https://www.jetbrains.com/idea/) (pour le backend)
- [VSCode](https://code.visualstudio.com/) (pour le frontend)
- Java 17+ (ou 21+)
- Node.js 18+

---

### 1. Backend — IntelliJ IDEA

1. Ouvrir IntelliJ → **File > Open** → sélectionner le dossier `backend/`
2. Attendre qu'IntelliJ télécharge les dépendances Maven automatiquement
3. Vérifier que `serviceAccountKey.json` est dans `src/main/resources/`
4. Ouvrir `RoadWatchApplication.java`
5. Cliquer sur le bouton ▶️ vert en haut à droite (ou clic droit → **Run**)

✅ Le backend est prêt quand tu vois dans la console :
```
✅ Firebase Admin SDK initialisé
Tomcat started on port 8080
Started RoadWatchApplication
```

---

### 2. Frontend — VSCode

1. Ouvrir VSCode → **File > Open Folder** → sélectionner le dossier `frontend/`
2. Ouvrir le terminal VSCode : **Ctrl + `**
3. S'assurer que le terminal est en **Command Prompt (cmd)** et non PowerShell
4. Exécuter les commandes :

```cmd
npm install
npm run dev
```

✅ Le frontend est prêt quand tu vois :
```
VITE ready in Xms
➜ Local: http://localhost:5173/
```

---

### 3. Ouvrir l'application

Aller sur **http://localhost:5173** dans le navigateur.

> ⚠️ Le backend (IntelliJ) doit être lancé **avant** d'utiliser l'application sinon les données ne s'affichent pas.

---

## 📂 Rôle de chaque fichier

### 🟦 Backend

| Fichier | Rôle |
|---|---|
| `RoadWatchApplication.java` | Point d'entrée, démarre Spring Boot et Tomcat intégré |
| `FirebaseConfig.java` | Lit `serviceAccountKey.json` et initialise la connexion Firebase |
| `CorsConfig.java` | Autorise le frontend (port 5173) à appeler l'API (port 8080) |
| `PotholeReport.java` | Modèle de données — représente un signalement avec ses attributs |
| `ReportDAO.java` | Toutes les requêtes Firestore (lire, filtrer, mettre à jour) |
| `ReportController.java` | Reçoit les requêtes HTTP et retourne du JSON automatiquement |

### 🟩 Frontend

| Fichier | Rôle |
|---|---|
| `main.jsx` | Point d'entrée React, définit la sidebar et les routes de navigation |
| `api.js` | Centralise tous les appels HTTP vers Spring Boot |
| `Dashboard.jsx` | Affiche les stats globales (total, en attente, confirmés, réparés) |
| `MapPage.jsx` | Carte Leaflet avec marqueurs colorés, clustering et flyTo |
| `Reports.jsx` | Liste des signalements avec filtres par statut et date |
| `Stats.jsx` | Graphiques Chart.js (par mois, par statut) |

---

## 🔗 Comment Frontend et Backend sont reliés

### Le lien : `api.js`

Tout passe par ce fichier. Il définit l'URL du backend :

```javascript
const BASE_URL = "http://localhost:8080/api";
```

Et expose des fonctions appelées par les composants React :

```javascript
export async function fetchReports() {
  const res = await fetch(`${BASE_URL}/reports`);
  return res.json();
}
```

### Le flux complet

```
Composant React (ex: MapPage.jsx)
        ↓ appelle fetchReports()
api.js → fetch("http://localhost:8080/api/reports")
        ↓ requête HTTP GET
ReportController.java → getReports()
        ↓ appelle
ReportDAO.java → Firebase Firestore
        ↓ retourne List<PotholeReport>
Spring Boot convertit automatiquement en JSON
        ↓ réponse JSON
api.js reçoit les données
        ↓
React affiche les marqueurs sur la carte
```

### Pourquoi CORS est nécessaire

Le frontend (port **5173**) et le backend (port **8080**) sont sur des ports différents. Le navigateur bloque par défaut les appels entre ports différents. `CorsConfig.java` dit au backend :

```java
// "Accepte les requêtes venant de http://localhost:5173"
allowedOrigins("http://localhost:5173")
```

---

## 🌐 Endpoints API

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/dashboard` | Stats générales (total, pending, confirmed, fixed) |
| GET | `/api/stats` | Données graphiques (par mois, par statut) |
| GET | `/api/reports` | Liste avec filtres (`?status=&dateFrom=&dateTo=`) |
| POST | `/api/reports/{id}/status` | Changer le statut (`{ "status": "confirmed" }`) |
| GET | `/api/export?format=excel` | Télécharger Excel |
| GET | `/api/export?format=pdf` | Télécharger PDF |

---

## 🏗️ Architecture MVC

Spring Boot suit le pattern **Model - View - Controller** :

```
Requête HTTP (React)
        ↓
Controller  →  reçoit et retourne JSON
        ↓
DAO         →  parle à Firebase
        ↓
Model       →  structure des données
```

Les annotations Java remplacent la configuration manuelle des Servlets :

| Annotation | Rôle |
|---|---|
| `@RestController` | Déclare que la classe gère des requêtes HTTP |
| `@GetMapping` | Associe une méthode à une route GET |
| `@PostMapping` | Associe une méthode à une route POST |
| `@RequestBody` | Lit le JSON envoyé dans la requête |
| `@PathVariable` | Lit une variable dans l'URL (ex: `{id}`) |

---

## ⚙️ Variables à modifier selon l'environnement

| Fichier | Variable | Quand la changer |
|---|---|---|
| `api.js` | `BASE_URL` | Si le backend est déployé sur un serveur distant |
| `MapPage.jsx` | `center={[35.7595, -5.8340]}` | Changer les coordonnées GPS de ta ville |
| `CorsConfig.java` | `allowedOrigins(...)` | Mettre l'URL du frontend en production |

---

*RoadWatch · Spring Boot + React · 2026*
