# CertificationHub — Moteur de Validation IA (Module 2)

Microservice FastAPI + LangGraph qui automatise la validation des certificats
IT uploadés par les collaborateurs, en remplacement de la vérification
manuelle Excel. Correspond au bloc jaune "Microservice IA FastAPI : Moteur de
Validation" du schéma d'architecture, appelé par le gateway Spring Boot.

## Pourquoi OCR (et pas juste un LLM texte) ?

Le gateway Spring Boot envoie un **fichier binaire** (PDF ou image). Les
modèles Groq de ce projet (`llama-3.3-70b-versatile`, etc.) sont des LLM
**texte**, ils ne peuvent pas "voir" une image — il faut un pont image → texte
avant que le LLM Parser (nœud 2 du diagramme) puisse structurer quoi que ce
soit. Ce pont, c'est l'OCR (ou un VLM, voir plus bas).

Concrètement, le nœud `scan` fait un choix en deux temps plutôt que de lancer
l'OCR à l'aveugle :

1. **Texte natif d'abord.** La majorité des certificats (exports Credly,
   Udemy, badges AWS/Microsoft) sont des PDF *nativement numériques* — le
   texte est déjà encodé dans le fichier, extractible à 100% de précision et
   en quelques millisecondes (PyMuPDF), sans OCR du tout.
2. **OCR en secours.** Seulement si ce texte natif est trop court (< 40
   caractères, `MIN_NATIVE_TEXT_CHARS`) — signe que c'est un scan, une capture
   d'écran, ou un "imprimer en PDF" aplati en image — on rasterise les pages
   et on lance l'OCR dessus.
3. **Le rendu image est de toute façon toujours produit**, indépendamment du
   texte natif, car le QR code (nœud "Extrait QR/URLs") est un élément
   graphique qui n'existe jamais dans la couche texte, même sur un PDF
   parfaitement numérique.

## OCR vs VLM — comment chacun fonctionne, et lequel choisir ici

**OCR classique (Tesseract, EasyOCR, PaddleOCR "pipeline")** décompose la
lecture d'un document en étapes indépendantes : (1) *détection* — repérer les
zones de texte, (2) *reconnaissance* — classifier chaque caractère/mot dans
ces zones, (3) *reconstruction de layout* — recoller les lignes dans le bon
ordre de lecture. Chaque étape est un modèle séparé ; une erreur à l'étape 1
(zone non détectée) rend l'étape 2 aveugle à ce texte. Le résultat est du
texte brut + coordonnées, sans compréhension sémantique : l'OCR ne "sait" pas
que "Jhon Alaoui" est probablement une coquille pour "John Alaoui", il
retranscrit ce qu'il voit, point final.

**VLM (Vision-Language Model : Qwen-VL, PaddleOCR-VL, dots.ocr, GPT/Gemini
vision...)** traite la page entière en une seule passe : un encodeur visuel
transforme l'image en tokens, un décodeur type LLM les interprète et génère
directement du texte structuré (JSON, Markdown). Il "lit" de façon
contextuelle — meilleur sur l'écriture manuscrite, les mises en page
complexes, les logos/sceaux — mais c'est justement ce qui en fait un choix
**risqué pour ce cas d'usage précis** : un VLM est entraîné à être "utile",
donc face à un mot flou ou partiellement illisible, il a tendance à
*compléter* avec l'option la plus plausible plutôt que de rendre un
caractère incertain. Pour un module dont le but est justement de détecter les
incohérences frauduleuses, un modèle qui "devine élégamment" est un défaut,
pas une qualité — on veut un transcripteur fidèle, pas un assistant serviable.

**→ Décision retenue (celle du diagramme, d'ailleurs) : pipeline OCR classique
+ LLM Parser séparé**, avec un prompt système qui interdit explicitement au
LLM d'inventer ou de "corriger" un champ (voir
`app/services/llm/groq_client.py`). Le VLM reste une option pour un correctif
futur (champ manuscrit, mise en page inhabituelle) via
`GROQ_VISION_MODEL`, mais pas sur le chemin principal.

### Note Groq (juillet 2026)

Groq a déprécié `llama-3.1-8b-instant` et `llama-3.3-70b-versatile` pour les
comptes free/developer-tier le 17/06/2026, recommandant `openai/gpt-oss-120b`
/ `openai/gpt-oss-20b` ou `qwen/qwen3.6-27b` (aussi vision-capable). Vérifie
`console.groq.com/docs/models` avant déploiement — le modèle est un simple
paramètre d'environnement (`GROQ_PARSER_MODEL`) ici, jamais codé en dur.

## Benchmark OCR / VLM pour de la lecture de certificats

Sources : OmniDocBench v1.5/v1.6 (Shanghai AI Lab), leaderboards CodeSOTA
(OCRBench, olmOCR-Bench), et comparatifs indépendants PaddleOCR/Tesseract/
EasyOCR — état de l'art mi-2026.

| Outil | Type | Précision (OmniDocBench / rapportée) | Vitesse | Poids/déploiement | Verdict pour ce projet |
|---|---|---|---|---|---|
| **Tesseract** | OCR pipeline | Correcte sur texte imprimé propre ; faible sur manuscrit (~45%) | Le plus rapide, ~450 ms/page CPU | Léger, binaire système, 100+ langues | Bon **fallback** CPU-only si PaddlePaddle est trop lourd à déployer |
| **EasyOCR** | OCR pipeline | Moyenne sur documents structurés ; correcte sur texte de scène/photo | Plus lent que Tesseract sur CPU (~700 ms/page) | Facile à installer (PyTorch pur) | Bon pour prototyper vite, pas pour la prod |
| **PaddleOCR (PP-OCRv5)** | OCR pipeline + layout | Meilleure précision open-source classique, ~73% sur manuscrit, table/layout natifs (PP-Structure) | ~2.1s/page CPU, 120 pages/min sur GPU | Dépendance PaddlePaddle (lourde) | **Choix retenu par défaut** — meilleur compromis précision/fonctionnalités open-source |
| **PaddleOCR-VL(-1.5)** | VLM spécialisé, 0.9B | **94.5 sur OmniDocBench v1.5** — état de l'art open-weight, malgré une taille minuscule | Léger pour un VLM (0.9B) | Un seul modèle fait tout (detect+reco+layout) | Piste d'évolution sérieuse pour une v2 du module |
| **dots.ocr (3B)** | VLM spécialisé | 88.4 OmniDocBench, 100+ langues | Modéré | Open-weight | Alternative solide si besoin multilingue étendu |
| **MinerU2.5** | VLM pipeline découplé | 90.7 OmniDocBench | Modéré | Open-weight | Bon sur tableaux/formules complexes |
| **Qwen3-VL-235B / Gemini-3 Pro / GPT-5.2** | VLM généraliste | 85–90 OmniDocBench | Lent, API payante | Aucun déploiement (API) | Overkill ici — conçus pour du raisonnement général, pas spécialisés document |
| **Groq `qwen/qwen3.6-27b`** | VLM (preview sur Groq) | Non benchmarké séparément, mais famille Qwen3-VL solide | Très rapide (inférence Groq) | Zéro dépendance OCR locale, mais modèle **preview**, pas garanti en prod | Piste intéressante pour un pipeline "tout-Groq" si le statut passe en GA |

**Pourquoi PaddleOCR et pas un VLM en défaut**, malgré des scores VLM
supérieurs sur le papier : (1) les certificats visés ici sont en écrasante
majorité des PDF *nativement numériques et propres* (pas des scans dégradés)
— l'écart de précision entre PaddleOCR classique et un VLM SOTA est marginal
sur ce type de document, largement dans la marge d'erreur ; (2) le risque de
"complétion plausible" d'un VLM est un vrai problème pour un module
anti-fraude ; (3) déploiement 100% local/open-weight (pas de dépendance à un
modèle "preview" susceptible d'être déprécié, comme on vient de le voir avec
Groq). PaddleOCR-VL-1.5 reste noté comme la piste d'évolution la plus
crédible si tu veux upgrader plus tard — même famille d'outils, juste la
variante VLM au lieu de la variante pipeline.

## Test réel effectué (2026-07-31)

Le pipeline a été testé sur un vrai certificat Coursera (`Python for Data
Science, AI & Development`, IBM/Coursera). Résultats concrets :

- **Extraction native** : PyMuPDF a extrait le texte proprement (391
  caractères, aucun OCR déclenché) — confirme que les vrais certificats
  Coursera sont bien du PDF natif, pas des scans.
- **Détection d'URL** : `https://coursera.org/verify/6OGLBB1GDF6R` extrait
  correctement en un seul token propre, reconnu comme domaine de confiance.
- **⚠️ Découverte critique : `coursera.org/robots.txt` interdit l'accès
  automatisé aux chemins `/verify/*`.** httpx ne respecte pas robots.txt
  tout seul — rien n'empêchait techniquement le code de scraper quand même
  — mais un service interne qui ignore délibérément la politique de crawl
  affichée par un site tiers est un vrai risque de conformité/ToS pour un
  outil d'entreprise, en plus d'être fragile en pratique (les sites qui
  bloquent via robots.txt ont souvent aussi une détection de bots qui
  bloquera/rate-limitera une IP de datacenter de toute façon). **Le
  scraper vérifie donc maintenant robots.txt avant chaque requête**
  (`app/services/scraper/web_scraper.py`, `_is_allowed_by_robots`), et
  traite un refus exactement comme n'importe quelle autre erreur de
  scraping : dégradation propre vers `source=TEXT_ONLY`, jamais de crash.
- **Résultat final observé** : `PENDING_REVIEW`, avec comme raison exacte
  *"Web verification could not be completed: coursera.org disallows
  automated access via robots.txt"* — même avec un score de similarité
  nom/titre/date de 100%. C'est le comportement voulu : sans preuve web
  indépendante, jamais d'auto-approbation, quel que soit le score.

**Conséquence pratique pour Coursera/Udemy** : l'automatisation complète
("Conforme & Prouvé") n'est pas atteignable par scraping pour les émetteurs
dont le robots.txt bloque — vérifie le cas par cas (Coursera confirmé
bloqué ; ne pas supposer qu'Udemy/AWS se comportent pareil sans tester). Si
Devoteam veut une automatisation complète sur ces plateformes, la bonne
piste est un accès API officiel partenaire/entreprise (Coursera for
Business, Udemy Business), pas contourner robots.txt. Les certifications
émises comme badges **Credly** (confirmé : AWS, Google Cloud, CompTIA,
Cisco, PMI) restent le meilleur pari pour une automatisation complète :
Credly publie une vraie API de vérification publique, pensée précisément
pour ce cas d'usage RH. Azure/Microsoft n'en fait **pas** partie — voir
plus bas.

## Fuzzy matching : nom vs titre vs date — pourquoi ce n'est pas le même traitement

- **Nom** : texte libre, transcrit par OCR depuis une police cursive/serif,
  parfois avec un prénom manquant ou un ordre différent ("Karim Alaoui" vs
  "Alaoui Karim" est une variation légitime). `score_name_field` utilise
  `token_sort_ratio` (insensible à l'ordre) sur texte sans accents/casse.
- **Titre de certification** : ce n'est **pas** du texte libre — c'est une
  chaîne exacte issue d'un catalogue fini défini par l'émetteur ("AZ-204",
  "Python for Data Science, AI & Development"...). L'ordre des mots n'y
  varie jamais légitimement, donc `score_title_field` utilise `fuzz.ratio`
  (sensible à l'ordre, plus strict), après une normalisation plus agressive
  que pour les noms : "&" ↔ "and" traités comme équivalents, ponctuation
  supprimée — pour absorber les divergences de formatage entre le
  catalogue interne Devoteam et le libellé exact de l'émetteur, sans
  tolérer un mot réellement différent.
- **Date** : **aucune comparaison floue de texte** — `score_date_field`
  compare des objets `date` réels (déjà normalisés en amont par le LLM
  Parser en YYYY-MM-DD), via une simple règle de fenêtre de tolérance. Une
  date est déjà systématisée au moment où elle atteint cette fonction ; il
  n'y a rien de "flou" à comparer.

## Extraction d'URL : gérer les liens imprimés sans schéma

`extract_urls()` reconnaît aussi bien `https://exemple.com/x` que
`exemple.com/x` ou `www.exemple.com/x` sans préfixe — les certificats
imprimés/PDF affichent très souvent le lien de vérification sans
`https://` (personne n'imprime le schéma pour un humain qui va le
retaper). Limite honnête à connaître : ceci ne corrige pas une OCR qui
lirait mal une lettre du domaine lui-même (ex. le point après `www`
avalé par un artefact d'OCR sur un lien souligné) — c'est un problème
d'exactitude de l'OCR, pas un problème de regex, et aucune des deux
corrections ne remplace l'autre.

## Sur le contournement de robots.txt — deux obstacles différents, pas un seul

Le switch `RESPECT_ROBOTS_TXT` (voir plus haut, dans `.env.example` il est
à `false` — un choix assumé pour ce projet, en dev/test uniquement, sur vos
propres certificats) est ce qui permet de le désactiver, en connaissance de
cause. Mécaniquement, c'est effectivement simple : `httpx` ne vérifie
jamais robots.txt tout seul, donc `RESPECT_ROBOTS_TXT=false` suffit à
faire passer la requête *sur votre propre machine*, avec un accès internet
normal — rien de plus compliqué que ça de ce côté-là.

Ce qui est **indépendant** de ce switch, et qui ne se résout PAS en le
désactivant, ce sont deux murs séparés côté outils de Claude, pas côté
robots.txt de Coursera/Udemy :

1. **`web_fetch` (l'outil de Claude) applique robots.txt de façon fixe,
   côté Anthropic** — aucun réglage de votre application ne peut changer
   ce comportement, parce que ce n'est pas votre code qui l'exécute, c'est
   l'outil de Claude lui-même, avec sa propre politique.
2. **Le sandbox d'exécution de Claude a une liste blanche réseau** limitée
   à des domaines comme pypi.org/npmjs.org/github.com — coursera.org et
   udemy.com n'y sont simplement pas, indépendamment de tout robots.txt.
   Je l'ai démontré concrètement plus tôt avec Playwright pointant vers
   `example.com` : bloqué avec `"Host not in allowlist"`, une erreur de mon
   propre environnement, sans aucun rapport avec une politique de site web.

Concrètement : sur **votre machine**, avec un accès internet normal, ni
l'un ni l'autre de ces deux murs n'existe — votre code Python fait une
requête `httpx` comme n'importe quel script, sans passer par mes outils.
`RESPECT_ROBOTS_TXT=false` fonctionnera donc mécaniquement chez vous. Ce
que je ne peux toujours pas garantir : si Coursera/Udemy ont en plus une
détection de bots active (Cloudflare, rate-limiting, CAPTCHA) — chose
totalement indépendante de robots.txt — le réglage ne change rien à ça, et
je n'ai aucun moyen de le vérifier sans un accès réseau que je n'ai pas ici.

**`tests/test_live_scraper.py`** reste le mécanisme pour tester ça vous-même,
proprement : un test paramétré (`LIVE_URLS`, un dict à éditer — ajouter un
émetteur = une ligne), marqué `live`, **exclu automatiquement** de toute
exécution normale de `pytest` (39 tests passent par défaut ; ces 3-là sont
"deselected"). À lancer uniquement quand vous le décidez :

```bash
RESPECT_ROBOTS_TXT=false pytest tests/test_live_scraper.py -m live -v -s
```

## Faisabilité du scraping, émetteur par émetteur (vérifié, pas supposé)

| Émetteur | Modèle de vérification | robots.txt | Piste officielle |
|---|---|---|---|
| **Coursera** | URL unique par certif (`/verify/{id}`), domaine propre | `Disallow: /verify/*` (confirmé en direct) | API Coursera for Business (`api.coursera.com`) |
| **Udemy** | URL unique par certif (`/certificate/{id}`), domaine propre | `Disallow:/certificate/` pour tous sauf `LinkedInBot` (confirmé) | Udemy Business REST/Reporting API |
| **Credly** — **AWS et Google Cloud confirmés ici** (Google Cloud route via le "Credential Wallet, powered by Credly"), plus PMI/CompTIA/Cisco | Badge (`credly.com/badges/{uuid}`) + API publique | Atteignable (testé en direct, pas de blocage) | `GET https://api.credly.com/v1/obi/v2/badge_assertions/{uuid}` — JSON structuré, statut de révocation inclus |
| **Azure / Microsoft** | **Pas Credly** — Microsoft a quitté Credly mi-2023 ; vérification via leur propre domaine `learn.microsoft.com` (déjà dans l'allowlist) | non vérifié directement | Extracteur générique (meta-tags), pas d'API dédiée connue |

Ce tableau confirme le modèle à deux catégories que vous proposiez : soit
un badge Credly (avec son extracteur dédié + API), soit un certificat à URL
de vérification propre à l'émetteur (extracteur générique, peu importe si
le chemin est `/verify/`, `/certificate/`, ou autre — c'est le domaine dans
l'allowlist qui décide de la confiance, pas la forme du chemin). Pas besoin
de logique par motif d'URL : le code ne fait déjà que ces deux branches.

Nuance à connaître sur Credly : l'API anonyme hash le champ
`recipient.identity` (SHA-256 salé, préservation de la vie privée par
design des Open Badges) — donc le nom du titulaire ne vient jamais de
l'API, seulement de la page HTML publique du badge (qui l'affiche en clair
pour un humain). `_extract_credly` combine les deux sources : nom depuis
le HTML, titre/émetteur/date/révocation depuis l'API.

## Observabilité : savoir quelle étape a échoué, et pourquoi

Chaque nœud du graphe logue clairement son entrée/sortie, préfixée par une
étiquette qui identifie directement la catégorie de problème :

```
[SCAN]          extraction PDF/image + détection OCR/URL/QR
[LLM]           appel Groq + parsing du JSON retourné
[ROUTE]         décision "URL de confiance trouvée ou non"
[SCRAPING]      vérification sur le site de l'émetteur
[FUZZY_MATCH]   scores nom/titre/date calculés
[EVALUATE]      décision finale + raisons
```

Mettez `LOG_LEVEL=DEBUG` dans votre `.env` (déjà fait dans `.env.example`)
pour voir chaque étape en direct pendant vos tests. Exemple réel, sur le
certificat Coursera de ce projet (Groq et le scraping simulés, extraction
PDF réelle) :

```
[SCAN] Starting extraction for '6__certificat.pdf' (mime=application/pdf)
[SCAN] Using native PDF text (391 chars, no OCR needed)
[SCAN] Found 1 candidate URL(s): ['https://coursera.org/verify/6OGLBB1GDF6R']
[LLM] Sending 391 chars to Groq (model=openai/gpt-oss-120b)
[LLM] Parsed: name='Seddik Boumhamdi' title='Python for Data Science, AI & Development' ...
[ROUTE] Trusted URL found: https://coursera.org/verify/6OGLBB1GDF6R -> will attempt web verification
[SCRAPING] Verifying against issuer site: https://coursera.org/verify/6OGLBB1GDF6R
[SCRAPING] Verification failed for https://...: coursera.org disallows automated access via robots.txt
[FUZZY_MATCH] source=TEXT_ONLY name=1.00 title=1.00 date=1.00 overall=1.00
[EVALUATE] decision=PENDING_REVIEW reasons=['Web verification could not be completed: ...']
```

**Trois catégories d'exceptions distinctes** (`app/exceptions.py`), chacune
levée au bon endroit avec un message qui dit exactement ce qui a échoué :

- `DocumentExtractionError` — extraction PDF/image (`[SCAN]`) OU l'OCR lui-même
  (le message précise lequel des deux : "Could not read '...' as a PDF/image"
  vs "OCR engine '...' failed to process '...'").
- `LLMParsingError` — l'appel Groq a échoué, ou la réponse n'était pas du
  JSON valide (`[LLM]`).
- `WebScrapingError` / `UntrustedDomainError` — la vérification web a échoué
  (`[SCRAPING]`) ; ne fait jamais planter la requête, dégrade vers
  `PENDING_REVIEW` (voir `scrape_node`).

**Si une erreur remonte jusqu'à l'API** (les trois premières catégories ne
sont *pas* rattrapées à l'intérieur du graphe, contrairement au scraping —
un échec OCR ou LLM signifie qu'il n'y a tout simplement aucune donnée à
comparer), le handler de `POST /api/v1/validate` la convertit en
`PENDING_REVIEW` plutôt qu'un 500, et **inclut le nom du type d'exception
dans `reasons`** — donc même sans regarder les logs serveur, la réponse
JSON dit directement `"(LLMParsingError: Groq call failed: ...)"` ou
`"(DocumentExtractionError: OCR engine 'paddleocr' failed to process ...)"`.
Origine de l'erreur visible des deux côtés : logs et réponse API.

## "Comparer d'abord" : le nœud early_match, avant tout scraping

Ajouté puis étendu suite à deux remarques justes : (1) la comparaison
contre les infos attendues (Spring Boot / l'utilisateur connecté) ne doit
pas attendre la fin du scraping, et (2) elle ne doit pas se limiter au
nom — un **vrai certificat, de la bonne personne, mais pour la mauvaise
formation** doit aussi être filtré avant tout scraping, puisque vérifier
qu'un vrai certificat de quelqu'un est réel ne prouve rien s'il ne
correspond pas à l'affectation demandée.

`early_match_node` tourne juste après le LLM Parser et vérifie trois
champs, chacun avec son propre traitement — même principe que le score
final, appliqué plus tôt et plus strictement :

- **Nom** — flou, tolérant (`EARLY_REJECT_NAME_THRESHOLD=0.50`). Texte
  libre transcrit par OCR, l'ordre des mots peut légitimement varier.
- **Titre** — flou mais strict (`EARLY_REJECT_TITLE_THRESHOLD=0.75`). Un
  titre de certification vient d'un catalogue fixe, pas de texte libre —
  il n'y a pas de variante personnelle légitime de "AZ-204", seulement du
  bruit OCR sur le même titre ou une certification réellement différente.
  **C'est ce champ qui attrape le cas "vrai certificat, mauvaise
  formation"** : le score global pondéré seul (nom 45%/titre 45%/date 10%)
  peut laisser passer ce cas en "à vérifier" plutôt qu'en rejet si le nom
  est parfait — d'où un seuil dédié, appliqué en dur, pas juste moyenné.
- **Date** — pas de comparaison floue de texte du tout : `score_date_field`
  compare des objets `date` réels avec une fenêtre de tolérance.

Seuils calibrés sur de vraies paires, pas inventés :

| Nom (`token_sort_ratio`) | score |
|---|---|
| Personnes différentes (5 paires testées) | 0.18 – 0.39 |
| Même personne, bruit OCR réaliste | 0.91 – 1.00 |

| Titre (`ratio`, sensible à l'ordre) | score |
|---|---|
| Titres différents (5 paires, y compris même famille d'examen) | 0.08 – 0.68 |
| Même titre, bruit OCR réaliste | 0.83 – 1.00 |

`EARLY_REJECT_NAME_THRESHOLD=0.50` et `EARLY_REJECT_TITLE_THRESHOLD=0.75`
tombent chacun dans l'écart correspondant — net pour le nom (0.52 de marge),
plus étroit mais réel pour le titre (0.15 de marge, à cause des codes
d'examen courts d'une même famille type "AZ-204" vs "AZ-900" qui partagent
beaucoup de caractères). `tests/test_early_match.py` contient ces mêmes
paires en tests de non-régression — à relancer si la fonction de scoring
change un jour.

**Le seuil de titre s'applique aussi après le scraping** (`evaluate_node`),
pas seulement dans le filtre précoce : si le titre officiel récupéré sur le
site de l'émetteur reste sous 75% de similarité, c'est un rejet direct,
jamais dilué dans une moyenne pondérée qui aurait pu masquer le problème
derrière un bon score de nom/date.

## Architecture du graphe (LangGraph)

```
scan -> parse -> early_match -+-> detect_trusted_url -+-> scrape -+
                              |   (pas d'URL de conf.)  |          |
                              +----(nom/titre/date KO)--+----------+-> fuzzy_match -> evaluate -> END
```

- **Pas de checkpointer** : chaque validation est une requête complète, sans
  conversation multi-tour à reprendre. La boucle "révision manuelle" du
  diagramme (Career Manager) est un processus *externe* au graphe — si tu
  veux un jour que le graphe lui-même se mette en pause via `interrupt()` en
  attendant une décision humaine, ajoute un `PostgresSaver` ici ; aucun nœud
  n'a besoin de changer.
- Chaque service externe (OCR, LLM, scraper) est isolé derrière une
  interface/fonction dédiée, ce qui rend les tests possibles sans jamais
  appeler un vrai modèle ou un vrai site web (voir `tests/`).

## Structure du projet

```
certificate-validation-service/
├── app/
│   ├── main.py                        # FastAPI app factory + lifespan
│   ├── exceptions.py                  # Hiérarchie d'exceptions métier
│   ├── core/
│   │   ├── config.py                  # Settings (pydantic-settings, tout en env vars)
│   │   └── logging.py                 # Logging structuré + request-id
│   ├── api/
│   │   ├── deps.py                    # Auth par clé API partagée (Spring Boot <-> FastAPI)
│   │   └── routes/
│   │       ├── health.py
│   │       └── validation.py          # POST /api/v1/validate — étapes 4-6 du diagramme
│   ├── schemas/
│   │   ├── enums.py                   # Decision, SourceType
│   │   ├── validation.py              # Contrats HTTP publics (ExpectedInfo, ValidationResponse...)
│   │   └── state.py                   # GraphState (TypedDict) — l'état partagé du graphe
│   ├── graph/
│   │   ├── builder.py                 # Assemblage StateGraph (topologie du diagramme)
│   │   ├── runner.py                  # run_validation() — invoqué par la route API
│   │   └── nodes/
│   │       ├── scan.py                # Nœud "Scanner Multi-Modal"
│   │       ├── parse.py               # Nœud "LLM Parser"
│   │       ├── early_match.py         # "Comparer d'abord" — filtre nom avant tout scraping
│   │       ├── route.py               # Nœud + edge conditionnel "URL Officielle détectée ?"
│   │       ├── scrape.py              # Nœud "Agent Web Scraper"
│   │       ├── fuzzy_match.py         # Nœud "Calculateur Fuzzy Logic"
│   │       └── evaluate.py            # Nœud "Évaluation Finale"
│   ├── services/
│   │   ├── ocr/
│   │   │   ├── base.py                # Protocol OCREngine — contrat commun
│   │   │   ├── paddle_engine.py       # Implémentation PaddleOCR (défaut)
│   │   │   ├── tesseract_engine.py    # Implémentation Tesseract (fallback léger)
│   │   │   └── factory.py             # get_ocr_engine() — swap via .env
│   │   ├── qr/qr_extractor.py         # Décodage QR via OpenCV
│   │   ├── llm/groq_client.py         # Wrapper Groq, JSON mode strict
│   │   ├── scraper/web_scraper.py     # Agent de vérification web + allowlist anti-spoofing
│   │   └── fuzzy/matcher.py           # Scoring rapidfuzz pondéré (nom/titre/date)
│   └── utils/
│       ├── pdf_utils.py               # Extraction texte natif + rasterization (PyMuPDF)
│       └── url_utils.py               # Regex URL + vérification stricte de domaine
├── tests/
│   ├── conftest.py                    # Fixtures partagées
│   ├── test_url_utils.py
│   ├── test_fuzzy.py
│   ├── test_early_match.py            # Seuil "comparer d'abord", calibré sur vraies paires de noms
│   ├── test_web_scraper.py            # Allowlist, robots.txt, extracteur Credly
│   ├── test_graph.py                  # Pipeline complet (mocks aux frontières I/O)
│   ├── test_api.py                    # Couche HTTP (auth, erreurs, dégradation gracieuse)
│   └── test_live_scraper.py           # Tests opt-in contre les vrais sites (marqueur `live`)
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── Dockerfile
├── pyproject.toml                     # Config pytest + ruff
└── .gitignore
```

## Lancer le service

```bash
cp .env.example .env   # puis remplis GROQ_API_KEY et API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Lancer les tests

```bash
pip install -r requirements-dev.txt
pytest -v
ruff check app tests
```

Les 25 tests couvrent : normalisation/scoring fuzzy, extraction et
vérification stricte de domaine (anti-spoofing), 4 scénarios de bout en bout
sur le graphe complet (APPROVED / PENDING_REVIEW / REJECTED / date
antérieure à l'affectation), et la couche HTTP (auth, type de fichier
refusé, dégradation gracieuse vers `PENDING_REVIEW` sur erreur interne).
Aucun test n'appelle Groq, un vrai moteur OCR, ou un vrai site web — les
trois frontières I/O (`OCREngine`, `GroqClient`, `verify_on_issuer_site`)
sont conçues précisément pour être mockées ici.

## Exemple d'appel (depuis Spring Boot)

```bash
curl -X POST http://validation-engine:8000/api/v1/validate \
  -H "X-API-Key: <secret>" \
  -F "file=@certificat.pdf" \
  -F "assignment_id=42" \
  -F "expected_name=Karim Alaoui" \
  -F "expected_certification_title=AZ-204" \
  -F "expected_not_before=2026-01-01"
```

Réponse :

```json
{
  "assignment_id": 42,
  "decision": "APPROVED",
  "source": "WEB_VERIFIED",
  "scores": {"name_score": 1.0, "title_score": 1.0, "date_score": 1.0, "overall_score": 1.0},
  "extracted": {"holder_name": "Karim Alaoui", "certification_title": "AZ-204", "issue_date": "2026-02-01", "issuer": "learn.microsoft.com"},
  "detected_urls": ["https://learn.microsoft.com/verify/xyz"],
  "reasons": ["Name and title confirmed on the issuer's official site with 100% similarity."],
  "requires_manual_review": false
}
```

## Pistes d'évolution

- **Endpoint async + webhook** : pour des certificats scannés volumineux, le
  scraping web peut ajouter quelques secondes de latence — un `POST
  /validate/async` avec `BackgroundTasks` + callback vers Spring Boot évite
  de bloquer le thread HTTP.
- **Parsers par domaine** (`app/services/scraper/web_scraper.py`,
  `_DOMAIN_EXTRACTORS`) : le générique (Open Graph / JSON-LD) fonctionne
  souvent, mais un parser dédié par émetteur (Credly, AWS...) sera plus
  fiable — à écrire une fois que tu as inspecté une vraie page de chaque
  émetteur cible.
- **PaddleOCR-VL** comme upgrade du moteur `scan`, si les scans manuscrits ou
  les mises en page inhabituelles deviennent fréquents en pratique.
