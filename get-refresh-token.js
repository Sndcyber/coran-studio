// get-refresh-token.js
//
// À lancer UNE SEULE FOIS, sur votre ordinateur (ou dans Google Cloud
// Shell), pour autoriser le robot à écrire dans VOTRE Google Drive avec
// VOTRE propre quota de stockage (15 Go gratuits), plutôt qu'un compte de
// service qui n'a aucun quota de stockage sur un compte Gmail personnel.
//
// Usage :
//   node get-refresh-token.js VOTRE_CLIENT_ID VOTRE_CLIENT_SECRET
//
// (le CLIENT_ID et le CLIENT_SECRET viennent de Google Cloud Console —
// voir le README, section B1)

const { google } = require('googleapis');
const http = require('http');
const { URL } = require('url');

const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Usage : node get-refresh-token.js VOTRE_CLIENT_ID VOTRE_CLIENT_SECRET');
  process.exit(1);
}

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // force l'obtention d'un refresh_token même en cas de réautorisation
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

console.log('\n1. Ouvrez ce lien dans votre navigateur :\n');
console.log(authUrl);
console.log('\n2. Connectez-vous avec le compte Google dont vous voulez utiliser le Drive.');
console.log('   Si un écran "Google n\'a pas vérifié cette application" apparaît, cliquez');
console.log('   "Paramètres avancés" puis "Accéder à [nom de votre projet] (non sécurisé)"');
console.log('   — c\'est normal, il s\'agit de votre propre projet.\n');
console.log(`En attente de l'autorisation sur ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get('code');
    if (!code) {
      res.end('Aucun code reçu — réessayez.');
      return;
    }
    res.end('✅ Autorisation réussie ! Vous pouvez fermer cet onglet et retourner au terminal.');
    server.close();

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      console.log('\n⚠️  Aucun refresh_token reçu. Cela arrive si vous avez déjà autorisé cette');
      console.log('    application avant. Allez sur https://myaccount.google.com/permissions,');
      console.log('    retirez l\'accès à votre projet, puis relancez ce script.\n');
      process.exit(1);
    }

    console.log('\n✅ Voici votre refresh token — copiez-le tel quel dans le secret GitHub');
    console.log('   nommé GOOGLE_REFRESH_TOKEN :\n');
    console.log(tokens.refresh_token);
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('Erreur :', err.message);
    process.exit(1);
  }
});

server.listen(PORT);
