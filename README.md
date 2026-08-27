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

## B1 — Créer les identifiants OAuth Google

Contrairement à un compte de service (qui n'a aucun espace de stockage sur
un compte Gmail personnel), on va autoriser le robot à agir **en votre
nom**, avec votre propre espace Drive (15 Go gratuits).

1. [console.cloud.google.com](https://console.cloud.google.com) → créez un projet (ou réutilisez-en un)
2. Recherchez **"Google Drive API"** → **Activer**
3. Allez dans **API et services → Écran de consentement OAuth**
   - Type d'utilisateur : **Externe** → **Créer**
   - Nom de l'appli (au choix), email de support et email développeur : le vôtre
   - Sur la page "Scopes", vous pouvez passer sans rien ajouter
   - Sur la page "Utilisateurs de test", ajoutez votre propre adresse Gmail
   - Une fois créé, retournez sur la page principale de l'écran de consentement
     et cliquez **"Publier l'application"** (statut "En production") — ça reste
     "non vérifiée par Google" et c'est très bien pour un usage personnel,
     ça évite juste que l'autorisation expire au bout de 7 jours
4. Allez dans **API et services → Identifiants → Créer des identifiants → ID client OAuth**
   - Type d'application : **Application de bureau (Desktop app)**
   - Nom au choix → **Créer**
5. Notez le **Client ID** et le **Client Secret** affichés (vous en aurez besoin juste après)

## B2 — Obtenir votre jeton d'autorisation (une seule fois)

Ce dépôt contient un petit outil (`get-refresh-token.js`) à lancer **une
seule fois**, sur votre ordinateur ou dans Google Cloud Shell (bouton
`>_` en haut de la console Google Cloud, aucune installation requise).

1. Si vous utilisez Cloud Shell : cliquez sur `>_` en haut de
   [console.cloud.google.com](https://console.cloud.google.com), puis
   glissez-déposez le fichier `get-refresh-token.js` dans l'éditeur qui
   s'ouvre (ou copiez-collez son contenu dans un nouveau fichier).
   Si vous préférez votre ordinateur : assurez-vous d'avoir
   [Node.js](https://nodejs.org) installé, et placez-vous dans ce dossier.

2. Installez la dépendance nécessaire :
   ```bash
   npm install googleapis
   ```

3. Lancez l'outil avec votre Client ID et Client Secret de B1 :
   ```bash
   node get-refresh-token.js VOTRE_CLIENT_ID VOTRE_CLIENT_SECRET
   ```

4. Ouvrez le lien affiché dans un navigateur, connectez-vous avec le compte
   Google dont vous voulez utiliser le Drive, acceptez l'autorisation
   (l'avertissement "application non vérifiée" est normal, c'est votre
   propre projet — cliquez "Paramètres avancés" puis "Accéder à... (non
   sécurisé)")

5. Le terminal affiche votre **refresh token** — copiez-le, vous en aurez
   besoin à l'étape B3

## B3 — Créer le dossier Google Drive

1. Dans votre Drive, créez un dossier (ex: "Quran Studio — Vidéos automatiques")
2. Ouvrez-le, notez l'ID dans l'URL :
   `https://drive.google.com/drive/folders/XXXXXXXXXXXXXXXXXXXX`
   (la partie `XXXXXXXXXXXXXXXXXXXX`)

Pas besoin de le partager avec qui que ce soit cette fois — le robot agit
directement en votre nom.

## B4 — Ajouter les secrets sur le dépôt GitHub

Dans votre dépôt : **Settings → Secrets and variables → Actions → New
repository secret**. Ajoutez ces cinq secrets :

| Nom du secret | Valeur |
|---|---|
| `APP_URL` | L'URL de votre site Vercel (ex: `https://quran-studio-xxxx.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Le Client ID de B1 |
| `GOOGLE_CLIENT_SECRET` | Le Client Secret de B1 |
| `GOOGLE_REFRESH_TOKEN` | Le refresh token obtenu en B2 |
| `DRIVE_FOLDER_ID` | L'ID du dossier noté en B3 |

## B5 — Tester manuellement

1. Onglet **Actions** de votre dépôt GitHub
2. Cliquez **"Génération quotidienne des vidéos Quran Studio"** à gauche
3. **Run workflow** → **Run workflow** (bouton vert)
4. Attendez 2-10 minutes, rafraîchissez — ✅ vert = succès
5. Vérifiez votre Google Drive : un sous-dossier daté doit contenir les vidéos + hashtags

Si ❌ rouge, cliquez sur le job pour voir les logs en français, ils expliquent où ça coince.

## B6 — C'est automatique !

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
