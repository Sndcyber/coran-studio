# Quran Studio — tout dans un seul dépôt

Ce dépôt contient **deux choses qui cohabitent sans se gêner** :

1. **Le site lui-même** (`index.html` + `api/audio-proxy.js`) → déployé par **Vercel**
2. **Le robot d'automatisation quotidienne** (`automate.js` + `.github/workflows/`) → exécuté par **GitHub Actions**

Vercel ne regarde que les fichiers dont il a besoin pour le site. GitHub
Actions ne regarde que son fichier de workflow. Aucun conflit — pas besoin
de deux dépôts séparés.

---

# Partie A — Déployer le site sur Vercel

## Option A1 — Le plus rapide (glisser-déposer, sans Git)

1. Allez sur https://vercel.com/new
2. Glissez ce dossier complet (celui qui contient `index.html`)
3. Vercel détecte le site statique + la fonction `api/audio-proxy.js`
   automatiquement → **Deploy**
4. Votre site est en ligne en quelques secondes

## Option A2 — Avec GitHub (recommandé, nécessaire pour l'automatisation de la Partie B)

1. Créez un dépôt sur [github.com](https://github.com) (bouton **New repository**), visibilité **Private** recommandée
2. Uploadez-y **tous les fichiers de ce dossier tel quel** (glissez-les sur
   la page GitHub, ou via Git si vous êtes à l'aise)
3. Sur https://vercel.com/new, cliquez **Import Git Repository**
4. Sélectionnez votre dépôt → Vercel détecte tout automatiquement → **Deploy**
5. Notez l'URL de votre site une fois déployé (ex: `https://quran-studio-xxxx.vercel.app`)
   → vous en aurez besoin à l'étape B4

> 💡 Choisissez l'option A2 si vous voulez aussi l'automatisation quotidienne
> (Partie B) — c'est le même dépôt qui servira aux deux.

## Pourquoi le fichier `api/audio-proxy.js` ?

Le serveur qui héberge les récitations audio ne renvoie pas les en-têtes
nécessaires pour qu'un navigateur puisse **capturer** ce son dans une vidéo
exportée (restriction de sécurité standard des navigateurs). Ce petit fichier
va chercher l'audio à la place du navigateur et le renvoie correctement.
Vercel le déploie automatiquement, aucune configuration requise.

---

# Partie B — Automatiser la génération quotidienne (optionnel)

Une fois le site déployé (Partie A2 avec GitHub), ce même dépôt peut aussi
générer **automatiquement 3 à 5 vidéos par jour** (mélange Coran/Hadith/Adhkar,
récitateur et thème aléatoires) et les envoyer dans un dossier Google Drive
— prêtes à récupérer sur votre téléphone pour Publer.

## B1 — Créer le compte de service Google

1. [console.cloud.google.com](https://console.cloud.google.com) → créez un projet
2. Recherchez **"Google Drive API"** → **Activer**
3. **API et services → Identifiants → Créer des identifiants → Compte de service**
4. Nommez-le (ex: "quran-studio-bot") → **Créer et continuer** → **OK**
5. Cliquez sur le compte créé → onglet **Clés** → **Ajouter une clé → Créer une clé** → format **JSON** → **Créer**
6. Un fichier `.json` se télécharge — gardez-le précieusement

Notez l'adresse email du compte de service (visible sur sa page, du type
`quran-studio-bot@votre-projet.iam.gserviceaccount.com`).

## B2 — Créer et partager le dossier Google Drive

1. Dans **votre** Google Drive, créez un dossier (ex: "Quran Studio — Vidéos automatiques")
2. Clic droit → **Partager** → collez l'email du compte de service → rôle **Éditeur** → **Envoyer**
3. Ouvrez le dossier, notez l'ID dans l'URL :
   `https://drive.google.com/drive/folders/XXXXXXXXXXXXXXXXXXXX`
   (la partie `XXXXXXXXXXXXXXXXXXXX`)

> ⚠️ Sans ce partage, le robot n'aura pas le droit d'écrire dans votre dossier.

## B3 — Ajouter les secrets sur le dépôt GitHub

Dans votre dépôt (le même que la Partie A2) : **Settings → Secrets and
variables → Actions → New repository secret**. Ajoutez ces trois secrets :

| Nom du secret | Valeur |
|---|---|
| `APP_URL` | L'URL de votre site Vercel notée en A2 (ex: `https://quran-studio-xxxx.vercel.app`) |
| `DRIVE_FOLDER_ID` | L'ID du dossier noté en B2 |
| `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` | Le fichier JSON de B1, encodé en base64 (voir ci-dessous) |

### Encoder le fichier JSON en base64

Mac/Linux (Terminal) :
```bash
base64 -i chemin/vers/le-fichier.json | tr -d '\n'
```

Windows (PowerShell) :
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("chemin\vers\le-fichier.json"))
```

Copiez tout le résultat et collez-le comme valeur du secret.

## B4 — Tester manuellement

1. Onglet **Actions** de votre dépôt GitHub
2. Cliquez **"Génération quotidienne des vidéos Quran Studio"** à gauche
3. **Run workflow** → **Run workflow** (bouton vert)
4. Attendez 2-10 minutes, rafraîchissez — ✅ vert = succès
5. Vérifiez votre Google Drive : un sous-dossier daté doit contenir les vidéos + hashtags

Si ❌ rouge, cliquez sur le job pour voir les logs en français, ils expliquent où ça coince.

## B5 — C'est automatique !

Le workflow se déclenche **tout seul chaque jour à 6h00 UTC**. Pour changer
l'heure, éditez la ligne `cron:` dans `.github/workflows/daily-videos.yml`
([crontab.guru](https://crontab.guru) aide à écrire l'expression).

## Et Publer ?

Le robot s'arrête à Google Drive — la suite (récupérer sur le téléphone,
publier sur vos trois comptes) reste manuelle via Publer, comme aujourd'hui.
Si vous passez un jour au forfait Publer Business/Enterprise, leur API
permettrait d'automatiser aussi cette dernière étape — dites-le-moi.

## Réglages possibles

- **Nombre de vidéos/jour** : secrets optionnels `VIDEO_COUNT_MIN` / `VIDEO_COUNT_MAX` (défaut 3 et 5)
- **Mélange Coran/Hadith/Adhkar** : tableau `CONTENT_TYPE_POOL` en haut de `automate.js`
- **Format vidéo** : `format: '9:16'` dans `automate.js`

## Limites à connaître

- GitHub Actions gratuit : 2000 min/mois pour un dépôt privé — largement
  suffisant (chaque run prend ~5-15 min selon le nombre de vidéos)
- Si un récitateur tiré au sort n'a pas l'audio d'un verset, la vidéo se
  génère quand même avec un rythme basé sur la longueur du texte
