# ⚙️ CertificationHub — Backend Spring Boot

[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-Migrations-CC0200?style=for-the-badge&logo=flyway&logoColor=white)](https://flywaydb.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)

Le **Backend Spring Boot** constitue le cœur applicatif et transactionnel de **CertificationHub**. Il gère l'intégrité des données métiers, la sécurité, l'attribution des certifications et vouchers, l'orchestration des validations asynchrones et la communication avec le microservice d'intelligence artificielle.

---

## 🏗️ Architecture en Couches

```text
com.example.certificationHub/
├── 📁 config/          # Configurations Spring (Security, RabbitMQ, WebClient, CORS, Jackson)
├── 📁 controller/      # Contrôleurs REST (Points d'entrée de l'API)
├── 📁 service/         # Logique métier et orchestration
├── 📁 repository/      # Interfaces Spring Data JPA & Requêtes spécifiques
├── 📁 entity/          # Entités JPA mappées sur la base PostgreSQL
├── 📁 dto/             # Objets de transfert de données (Request / Response)
├── 📁 mapper/          # Mappings Entité <-> DTO (MapStruct / Manuel)
├── 📁 security/        # Filtres JWT, UserDetailsService, Context Holder & RLS Handler
├── 📁 messaging/       # Producteurs et consommateurs de messages RabbitMQ
├── 📁 validator/       # Validateurs Jakarta personnalisés
└── 📁 exception/       # Gestionnaire global des erreurs (@ControllerAdvice)
```

---

## 🛡️ Sécurité & Contrôle d'Accès (RBAC & RLS)

L'application implémente une double couche de sécurité :

1. **Spring Security (RBAC au niveau applicatif)** :
   - Authentification sans état via token **JWT (JSON Web Token)**.
   - Contrôle d'accès basé sur les rôles : `@PreAuthorize("hasRole('ADMIN')")`, `hasRole('MANAGER')`, `hasRole('COLLABORATOR')`.
   - Filtre d'interception validant les signatures et injectant le `UserPrincipal` dans le `SecurityContext`.

2. **Row-Level Security (RLS au niveau PostgreSQL)** :
   - Des politiques de sécurité dynamiques en base garantissent qu'un collaborateur ne peut accéder qu'à ses propres assignations et certificats.
   - Les managers n'ont de visibilité que sur les membres de leur squad respective.
   - L'identifiant utilisateur courant est injecté dans la session SQL via `SET LOCAL app.current_user_id`.

---

## 🗄️ Schéma de Base de Données & Migrations Flyway

Toutes les évolutions structurelles de la base sont versionnées sous `src/main/resources/db/migration/` :

| Version | Description |
| :--- | :--- |
| **`V1__init_schema.sql`** | Création des tables fondamentales (`users`, `squads`, `certifications`, `assignments`, `certificates`, `notifications`, `vouchers`). |
| **`V2__enable_rls_policies.sql`** | Activation et définition des politiques Row-Level Security (RLS) sur PostgreSQL. |
| **`V3__seed_test_data.sql`** | Jeu de données initial de démonstration (utilisateurs, squads, assignations). |
| **`V4__add_deleted_at_to_squads.sql`** | Support du soft delete sur les squads. |
| **`V5__fix_rls_role_typo.sql`** | Harmonisation des rôles RLS. |
| **`V6__add_certificate_validation_details.sql`** | Extension de la table `certificates` pour stocker les scores OCR, dates et motifs IA. |
| **`V7__add_action_url_to_notifications.sql`** | Ajout de liens de redirection interactifs dans les notifications. |
| **`V8__import_catalog_53_certifications.sql`** | Importation du catalogue officiel complet de 53 certifications avec leurs métadonnées. |
| **`V9__create_certification_chunks.sql`** | Création de la table `certification_chunks` avec extension `vector(1024)`. |
| **`V10__certification_notify_trigger.sql`** | Trigger PostgreSQL `trg_certif_changed` émettant une notification `NOTIFY certif_changed`. |
| **`V11__upgrade_certification_chunks_to_nemotron.sql`** | Migration de la colonne vectorielle vers `vector(2048)` pour supporter les embeddings Nemotron. |

---

## 🔌 Intégration avec le Moteur IA (FastAPI)

Le backend Spring communique avec le conteneur IA (`backend-ai`) via **Spring WebClient** réactif :

* **Validation de Certificat** : Lors de l'upload d'un justificatif (PDF / Image), Spring enregistre le fichier dans le volume partagé `/uploads` et appelle `POST /api/v1/validate` sur l'IA en transmettant la clé sécurisée `X-API-Key`.
* **Chatbot RAG** : Le contrôleur `ChatController` peut relayer de façon transparente les requêtes de l'interface utilisateur vers `POST /api/v1/chat` en conservant le contexte du collaborateur (rôle, squadId, user_id).

---

## 📡 Principaux Endpoints REST

| Méthode | Route | Rôle requis | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authentification et émission du token JWT |
| `GET` | `/api/v1/certifications` | Authentifié | Consultation du catalogue des certifications |
| `POST` | `/api/v1/certifications` | ADMIN | Création d'une nouvelle certification dans le catalogue |
| `GET` | `/api/v1/assignments/my` | COLLABORATOR | Liste des certifications assignées au collaborateur connecté |
| `POST` | `/api/v1/assignments` | MANAGER / ADMIN | Assigner une certification à un membre de son équipe |
| `POST` | `/api/v1/certificates/upload` | COLLABORATOR | Téléversement d'un justificatif et déclenchement de l'OCR IA |
| `GET` | `/api/v1/dashboard/stats` | MANAGER / ADMIN | Indicateurs de performance, taux de réussite et suivi budgétaire |
| `GET` | `/api/v1/notifications` | Authentifié | Récupération des alertes et relances de l'utilisateur |
| `POST` | `/api/v1/chat` | Authentifié | Proxy vers l'assistant conversationnel intelligent |

---

## 🛠️ Développement Local

### Prérequis
* Java 21 JDK installé
* Maven 3.9+ (ou utilisation du wrapper `./mvnw`)
* PostgreSQL 16 actif sur le port `5432`
* RabbitMQ actif sur le port `5672`

### Compilation et Lancement
```bash
cd backend-spring

# Compilation et exécution des tests unitaires
./mvnw clean package

# Lancement de l'application en mode local
./mvnw spring-boot:run
```

L'application démarre sur le port configuré : **`http://localhost:9090`**.
