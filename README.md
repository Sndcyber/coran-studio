# Quran Studio — déploiement Vercel

Ce dossier ne contient qu'un seul fichier statique (`index.html`).
Aucune base de données, aucun serveur, aucune variable d'environnement
requise : tout le calcul (récupération des versets, audio, rendu vidéo,
export) se fait dans le navigateur de la personne qui utilise le site.

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
