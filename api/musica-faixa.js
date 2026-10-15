// Música Astral: acha a faixa no Spotify pelo nome e artista, para o player tocar a música certa.
// Usa as chaves SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET. Sem elas, responde sem id e a página
// mostra só o botão que abre a música no Spotify.
let token = null, validade = 0;

async function pegaToken() {
  if (token && Date.now() < validade) return token;
  const cred = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${cred}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error('token ' + r.status);
  const j = await r.json();
  token = j.access_token; validade = Date.now() + (j.expires_in - 60) * 1000;
  return token;
}

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function handler(req, res) {
  const m = String(req.query.m || '').slice(0, 120), a = String(req.query.a || '').slice(0, 120);
  if (!m) return res.status(400).json({ id: null });
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) return res.status(200).json({ id: null });
  try {
    const artista = a.replace(/\(.*?\)/g, '').split(/,| e | & /)[0].trim();
    const busca = async q => {
      const r = await fetch('https://api.spotify.com/v1/search?type=track&limit=5&market=BR&q=' + encodeURIComponent(q), {
        headers: { Authorization: `Bearer ${await pegaToken()}` },
      });
      if (!r.ok) throw new Error('busca ' + r.status);
      return (await r.json()).tracks?.items || [];
    };
    let itens = await busca(`track:${m} artist:${artista}`);
    if (!itens.length) itens = await busca(`${m} ${artista}`);
    const certo = itens.find(t => t.artists.some(x => norm(x.name).includes(norm(artista).split(' ')[0]))) || itens[0];
    res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=86400');
    return res.status(200).json({ id: certo ? certo.id : null });
  } catch (e) {
    console.error('musica-faixa:', e.message);
    return res.status(200).json({ id: null });
  }
}
