# Quran Studio — déploiement Vercel

Ce dossier contient :
- `index.html` — l'application (tout tourne dans le navigateur)
- `api/audio-proxy.js` — une petite fonction serveur (détectée et déployée
  automatiquement par Vercel) qui permet à l'export vidéo d'inclure le son
  de la récitation. Voir la section "Pourquoi le proxy audio ?" plus bas.

Aucune base de données, aucune variable d'environnement à configurer.

## Pourquoi le proxy audio ?

Le serveur qui héberge les récitations audio (`cdn.islamic.network`) ne
renvoie pas les en-têtes nécessaires pour qu'un navigateur puisse
**capturer** ce son dans une vidéo enregistrée — une restriction de
sécurité standard de tous les navigateurs, pas un bug de l'application.
La lecture normale (aperçu, écoute) fonctionne très bien sans ce proxy ;
c'est uniquement l'**export vidéo avec son** qui en a besoin.

`api/audio-proxy.js` va chercher le fichier audio à la place du
navigateur (un serveur n'est jamais soumis à cette restriction), puis le
renvoie avec l'en-tête `Access-Control-Allow-Origin` qui manquait. Comme
c'est un simple fichier `.js` dans le dossier `/api`, Vercel le déploie
automatiquement comme fonction serverless — aucune configuration
supplémentaire n'est nécessaire, il suffit de déployer normalement le
dossier tel quel (options A, B ou C ci-dessous).

**Important** : si vous déployez uniquement `index.html` sur un
hébergement purement statique (sans support des fonctions serverless),
l'export vidéo fonctionnera mais **sans son de récitation** — l'app vous
préviendra clairement dans ce cas plutôt que de produire une vidéo muette
sans explication.

## Option A — Le plus rapide (glisser-déposer, sans compte Git)

1. Allez sur https://vercel.com/new
2. En bas de la page, choisissez "Deploy without Git" / glissez le
   dossier `quran-studio-vercel` (celui qui contient `index.html`)
3. Vercel détecte un site statique automatiquement → cliquez "Deploy"
4. Votre site est en ligne en quelques secondes, avec une URL du type
   `https://quran-studio-xxxx.vercel.app`

## Option B — Avec la CLI Vercel

```bash
npm install -g vercel
cd quran-studio-vercel
vercel        # suivez les questions (nouveau projet)
vercel --prod # pour la mise en ligne définitive
```

## Option C — Avec GitHub (recommandé si vous voulez itérer souvent)

1. Créez un repo GitHub et poussez ce dossier dedans
2. Sur https://vercel.com/new, cliquez "Import Git Repository"
3. Sélectionnez le repo → Vercel détecte "Other" (site statique) →
   Deploy
4. Chaque `git push` redéploiera automatiquement le site

## Nom de domaine personnalisé

Une fois déployé, dans le dashboard Vercel du projet :
Settings → Domains → ajoutez votre propre nom de domaine
(ex: `quran-studio.com`) et suivez les instructions DNS affichées.

## Et Supabase ?

Pas nécessaire pour que l'outil fonctionne : la création et l'export
vidéo se font entièrement dans le navigateur de l'utilisateur, aucune
donnée n'est envoyée à un serveur.

Supabase deviendrait utile seulement si vous voulez ajouter, plus tard :
- Un compte utilisateur (connexion / historique de créations)
- Une galerie publique des vidéos générées (il faudrait alors uploader
  les fichiers vers un espace de stockage, ex: Supabase Storage)
- Des statistiques d'usage centralisées

Si l'une de ces fonctionnalités vous intéresse, je peux ajouter
l'intégration Supabase correspondante.
