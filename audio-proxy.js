// Proxy serveur pour l'audio de récitation du Coran.
//
// Pourquoi ce fichier existe : cdn.islamic.network (le CDN audio public
// utilisé par l'application) ne renvoie pas d'en-tête
// "Access-Control-Allow-Origin". Cela n'empêche pas la LECTURE normale de
// l'audio dans le navigateur (un <audio> simple fonctionne très bien), mais
// empêche totalement de CAPTURER cet audio pour l'inclure dans une vidéo
// exportée — c'est une restriction de sécurité imposée par tous les
// navigateurs, pas un bug de l'application.
//
// Ce petit proxy (exécuté côté serveur, donc jamais soumis au CORS) va
// chercher le fichier à notre place et le renvoie avec les en-têtes
// nécessaires. Le navigateur peut alors le capturer sans problème.
//
// Déployé automatiquement par Vercel : tout fichier .js dans /api devient
// une fonction serverless accessible à /api/<nom-du-fichier>.

module.exports = async (req, res) => {
  const { reciter, ayah } = req.query;

  // Validation stricte pour éviter tout détournement du proxy vers une
  // autre destination (SSRF) : uniquement des identifiants de récitateur
  // et des numéros de verset au format attendu.
  if (!reciter || !ayah || !/^[a-zA-Z0-9._-]+$/.test(reciter) || !/^[0-9]{1,4}$/.test(ayah)) {
    res.status(400).json({ error: 'Paramètres invalides' });
    return;
  }

  const upstreamUrl = `https://cdn.islamic.network/quran/audio/128/${reciter}/${ayah}.mp3`;

  try {
    const upstream = await fetch(upstreamUrl);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'Fichier audio introuvable en amont' });
      return;
    }
    const arrayBuffer = await upstream.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Le contenu ne change jamais pour un couple récitateur/verset donné :
    // on peut le mettre en cache longtemps, ce qui réduit la charge sur le
    // proxy et accélère les exports suivants.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(502).json({ error: 'Impossible de récupérer le fichier audio en amont' });
  }
};
