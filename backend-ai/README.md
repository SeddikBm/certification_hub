# 🧠 CertificationHub — Microservice IA (FastAPI + LangGraph)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-FF4F00?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![PaddleOCR](https://img.shields.io/badge/PaddleOCR-PP--OCRv5-2D7DD2?style=for-the-badge&logo=baidu&logoColor=white)](https://github.com/PaddlePaddle/PaddleOCR)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Nemotron_2048d-7B2CBF?style=for-the-badge)](https://openrouter.ai/)
[![Groq](https://img.shields.io/badge/Groq_Inference-gpt--oss--120b-F55036?style=for-the-badge)](https://groq.com/)
[![pgvector](https://img.shields.io/badge/pgvector-Cosine_Search-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)

Le **Backend IA** de CertificationHub est un microservice haute performance orchestré par **FastAPI** et **LangGraph**. Il intègre deux sous-systèmes d'intelligence artificielle :

1. 📄 **Moteur de Validation OCR & Anti-Fraude** : Analyse et valide les justificatifs de certification (PDF / Image) téléversés par les collaborateurs.
2. 💬 **Moteur RAG Hybride & Assistant Conversationnel** : Assistant intelligent guidant les collaborateurs et managers sur les certifications IT, combinant recherche vectorielle dense 2048-dim, recherche textuelle PostgreSQL FTS, et Text-to-SQL analytique.

---

## 🏛️ Architecture des Deux Moteurs IA

```mermaid
flowchart TD
    subgraph Moteur1["📄 Moteur 1 : Validation OCR de Justificatifs"]
        Upload["📥 Fichier PDF / Image"] --> Native{"Texte Natif ?"}
        Native -->|Oui > 40 chars| Extractor["PyMuPDF Native Parser"]
        Native -->|Non / Scan| OCR["PaddleOCR / Tesseract"]
        Upload --> QR["Détecteur QR Code / URLs"]
        Extractor --> LLMParse["Groq LLM Parser (JSON Structuré)"]
        OCR --> LLMParse
        QR --> WebCheck["Vérificateur Web d'Authenticité"]
        LLMParse --> Fusion["Fusion & Score de Confiance"]
        WebCheck --> Fusion
        Fusion --> Decision["Décision : VALIDATED / REJECTED / NEEDS_REVIEW"]
    end

    subgraph Moteur2["💬 Moteur 2 : Agent RAG & Chat Intelligent"]
        Query["💬 Question Utilisateur"] --> Guardrail["Guardrail & Topic Classifier"]
        Guardrail --> Router{"Routeur d'Intention"}
        Router -->|Analytique / Comptage| TextToSQL["Text-to-SQL + Guardrail sqlglot"]
        Router -->|Contenu / Syllabus| HybridRAG["Recherche Hybride (pgvector 2048d + FTS)"]
        HybridRAG --> Rerank["Reranker Cosinus OpenRouter"]
        Rerank --> CheckContext{"Score suffisant ?"}
        CheckContext -->|Oui| Generator["Générateur de Réponse (Groq LLM)"]
        CheckContext -->|Non| LiveScrape["Scraping Web Temps Réel (Udemy + Portail)"]
        LiveScrape --> Generator
        TextToSQL --> Generator
        Generator --> Groundedness["Contrôle d'Ancrage (Groundedness Check)"]
        Groundedness --> FinalAnswer["Réponse Finale + Sources + Actions Suggérées"]
    end
```

---

## 📄 Module 1 : Moteur de Validation OCR

### Fonctionnement du Pipeline
1. **Extraction de Texte en Deux Niveaux** :
   - **Natif en priorité** : Si le document est un PDF numérique vectoriel (Credly, AWS, Microsoft), PyMuPDF extrait 100% du texte textuel en $< 20\text{ ms}$.
   - **OCR en secours** : Si le texte est insuffisant ($< 40$ caractères), déclenchement automatique de **PaddleOCR** (ou Tesseract) pour numériser le scan.
2. **Détection de Preuves d'Authenticité** :
   - Extraction des QR codes et URLs de vérification (Credly, Badgr, Microsoft Learn, etc.).
   - Interrogation en ligne du badge pour comparer le nom du titulaire et la date d'émission.
3. **Structuration par LLM (Groq `openai/gpt-oss-120b`)** :
   - Le LLM extrait précisément : Titulaire, Organisme émetteur, Nom de la certification, Date d'obtention, Date d'expiration, ID de certificat.
4. **Calcul de Décision Multi-Facteurs** :
   - Score de similarité textuelle avec les données de la base.
   - Validation temporelle (non expirée, cohérente avec la date d'examen).

---

## 💬 Module 2 : Moteur RAG & Chatbot Intelligent

### 1. Ingestion Multi-Sources & Chunking Structuré
* Pour chacune des **53 certifications** du catalogue, le pipeline d'ingestion (`pipeline.py`) :
  - Récupère en parallèle la page de formation (Udemy / Devoteam Learning) et le portail officiel de l'examen.
  - Fusionne et déduplique les contenus via LLM en 6 sections canoniques :
    - `## Description`
    - `## Compétences et domaines évalués`
    - `## Prérequis`
    - `## Format de l'examen`
    - `## Préparation recommandée`
    - `## Liens officiels`
  - Découpe en chunks contextualisés (`[Titre Certification — Nom Section]`).
  - Calcule les vecteurs denses **2048 dimensions** via l'API OpenRouter (`nvidia/nemotron-3-embed-1b:free`).
  - Stocke les chunks dans la table PostgreSQL `certification_chunks`.

### 2. Recherche Hybride RRF (Reciprocal Rank Fusion)
* **Recherche Dense** : Distance cosinus exacte pgvector (`1 - (embedding <=> qvec)`).
* **Recherche Lexicale** : Full-Text Search PostgreSQL (`tsvector` avec dictionnaire `french`).
* **Fusion RRF** : Combinaison des rangs dense + lexical via la formule standard $RRF(d) = \sum \frac{1}{60 + r_i}$.

### 3. Branche Text-to-SQL Sécurisée
* Pour les questions quantitatives (*"Combien de personnes dans ma squad ont validé AWS ?"*, *"Quelles sont les certifications niveau Expert ?"*) :
  - Génération de la requête SQL PostgreSQL par le LLM.
  - Validation syntaxique et sécurisation du périmètre utilisateur via **`sqlglot`** (interdiction des écritures `INSERT/UPDATE/DELETE`, forçage de filtres RLS).
  - Exécution en lecture seule (`READ ONLY`).

---

## ⚙️ Configuration & Variables d'Environnement

Créez ou éditez le fichier `backend-ai/.env` :

```dotenv
# Environnement
ENV=dev
DEBUG=true
PORT=8000
INTERNAL_API_KEY=certifhub-internal-key-2026

# Base de données PostgreSQL avec pgvector
RAG_DB_DSN=postgresql://certif_user:certif_password@localhost:5432/certifhub_db
RAG_DB_DSN_WRITE=postgresql://certif_user:certif_password@localhost:5432/certifhub_db

# Modèles IA & LLM (Groq & OpenRouter)
GROQ_API_KEY=votre_cle_groq
GROQ_PARSER_MODEL=openai/gpt-oss-120b
RAG_LLM_MODEL=openai/gpt-oss-120b

OPENROUTER_API_KEY=votre_cle_openrouter
EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b:free
RERANKER_MODEL=nvidia/llama-nemotron-rerank-vl-1b-v2:free

# OCR Engine (paddleocr ou tesseract)
OCR_ENGINE=paddleocr
```

---

## 📡 Endpoints de l'API

### 1. `POST /api/v1/validate` — Validation OCR
Téléverse un fichier et retourne le verdict d'authenticité.
* **Headers** : `X-API-Key: certifhub-internal-key-2026`
* **Form-Data** : `file: <certificat.pdf>`, `expected_holder: "Jean Dupont"`, `certification_name: "CKA"`

### 2. `POST /api/v1/chat` — Assistant RAG
Interroge l'assistant intelligent.
* **Headers** : `Content-Type: application/json`, `X-API-Key: certifhub-internal-key-2026`
* **Body** :
```json
{
  "message": "Quels sont les prérequis et le format d'examen pour la certification TOGAF 10 ?",
  "user_id": "f1111111-1111-1111-1111-111111111111",
  "user_role": "COLLABORATOR",
  "squad_id": "squad-devops"
}
```

---

## 🛠️ Développement Local

```bash
cd backend-ai

# Création et activation de l'environnement virtuel
python -m venv venv
source venv/bin/activate  # ou .\venv\Scripts\activate sous Windows

# Installation des dépendances
pip install -r requirements.txt

# Lancer le serveur de développement FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Accédez ensuite à la documentation interactive : **`http://localhost:8000/docs`**.
