// automate.js
//
// Génère automatiquement 3 à 5 vidéos par jour avec Quran Studio (Coran /
// Hadith / Adhkar mélangés, thème et récitateur aléatoires), puis les
// envoie dans un dossier Google Drive, rangées dans un sous-dossier du jour.
//
// Conçu pour tourner via GitHub Actions (voir
// .github/workflows/daily-videos.yml) sur un cron quotidien, mais fonctionne
// aussi en local avec les mêmes variables d'environnement — utile pour
// tester avant de l'automatiser.
//
// Variables d'environnement requises :
//   APP_URL                URL de votre site Vercel déployé
//   GOOGLE_CLIENT_ID        Identifiant du client OAuth (voir get-refresh-token.js)
//   GOOGLE_CLIENT_SECRET    Secret du client OAuth
//   GOOGLE_REFRESH_TOKEN    Jeton de rafraîchissement obtenu une seule fois
//   DRIVE_FOLDER_ID         ID du dossier Drive de destination
//   VIDEO_COUNT_MIN (optionnel, défaut 3)
//   VIDEO_COUNT_MAX (optionnel, défaut 5)

const { chromium } = require('playwright');
const { google } = require('googleapis');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

const APP_URL = process.env.APP_URL;
const FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const COUNT_MIN = parseInt(process.env.VIDEO_COUNT_MIN || '3', 10);
const COUNT_MAX = parseInt(process.env.VIDEO_COUNT_MAX || '5', 10);

if (!APP_URL || !FOLDER_ID || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error('❌ Variables manquantes : APP_URL, DRIVE_FOLDER_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN doivent être définies.');
  process.exit(1);
}

// Mélange Coran/Hadith/Adhkar pondéré : ~60% Coran, ~20% Hadith, ~20% Adhkar.
// Pour changer les proportions, ajoutez/retirez des entrées dans ce tableau.
const CONTENT_TYPE_POOL = ['quran', 'quran', 'quran', 'hadith', 'adhkar'];

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

async function getDriveClient() {
  // Authentification OAuth2 AU NOM DE L'UTILISATEUR (pas un compte de
  // service) : les fichiers créés utilisent alors le quota de stockage
  // personnel de l'utilisateur (15 Go gratuits), plutôt que le quota d'un
  // compte de service qui est toujours de 0 Go sur un compte Gmail
  // personnel (voir get-refresh-token.js pour obtenir le refresh token).
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function uploadToDrive(drive, filePath, mimeType, folderId) {
  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id, name, webViewLink',
  });
  return res.data;
}

async function getOrCreateDayFolder(drive, parentId, name) {
  // Évite de créer un doublon si le job est relancé le même jour
  const existing = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  });
  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }
  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  });
  return created.data.id;
}

async function main() {
  const outputDir = path.join(__dirname, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('🔑 Connexion à Google Drive...');
  const drive = await getDriveClient();

  const today = new Date().toISOString().slice(0, 10);
  const dayFolderId = await getOrCreateDayFolder(drive, FOLDER_ID, today);
  console.log(`📁 Dossier du jour prêt : ${today}`);

  console.log('🌐 Ouverture de', APP_URL);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Attend que l'appli ait fini son chargement initial (sourates, récitateurs
  // vérifiés, traductions...) avant de lancer la première génération. C'est
  // le vrai signal de disponibilité — plus fiable que d'attendre un réseau
  // "silencieux" (networkidle), qui ne se produit jamais vraiment tant que
  // l'appli teste chaque récitateur en arrière-plan.
  await page.waitForFunction(() => window.__quranStudioReady === true, { timeout: 90000 });
  console.log('✅ Application prête.');

  const count = randomInt(COUNT_MIN, COUNT_MAX);
  console.log(`🎬 Génération de ${count} vidéo(s) aujourd'hui...\n`);

  let success = 0;
  for (let i = 1; i <= count; i++) {
    console.log(`--- Vidéo ${i}/${count} ---`);
    try {
      const contentTypes = [CONTENT_TYPE_POOL[randomInt(0, CONTENT_TYPE_POOL.length - 1)]];

      const result = await page.evaluate(async (types) => {
        return await window.QuranStudioAutomation.generateRandomVideo({
          contentTypes: types,
          format: '9:16',
        });
      }, contentTypes);

      const videoPath = path.join(outputDir, result.filename);
      fs.writeFileSync(videoPath, Buffer.from(result.base64, 'base64'));

      const hashtagsName = result.filename.replace(/\.[^.]+$/, '') + '-hashtags.txt';
      const hashtagsPath = path.join(outputDir, hashtagsName);
      fs.writeFileSync(hashtagsPath, result.hashtags);

      console.log(`  Généré : ${result.filename} (${result.contentType}, ${(result.base64.length * 0.75 / 1024 / 1024).toFixed(1)} Mo)`);

      const mimeType = result.ext === 'mp4' ? 'video/mp4' : 'video/webm';
      await uploadToDrive(drive, videoPath, mimeType, dayFolderId);
      await uploadToDrive(drive, hashtagsPath, 'text/plain', dayFolderId);
      console.log('  ✅ Envoyé vers Google Drive');

      // Nettoyage local (le fichier est en sécurité sur Drive)
      try { fs.unlinkSync(videoPath); } catch (e) { /* pas grave si ça échoue */ }
      try { fs.unlinkSync(hashtagsPath); } catch (e) { /* pas grave si ça échoue */ }

      success++;
    } catch (err) {
      console.error(`  ❌ Échec pour la vidéo ${i} :`, err.message);
      // On continue avec la vidéo suivante plutôt que d'arrêter tout le run
    }
    console.log('');
  }

  await browser.close();
  console.log(`🏁 Terminé : ${success}/${count} vidéo(s) générée(s) et envoyée(s) vers Drive.`);
  if (success === 0) process.exit(1);
}

main().catch((err) => {
  console.error('💥 Erreur fatale :', err);
  process.exit(1);
});
