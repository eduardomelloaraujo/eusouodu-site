// Música Astral: guarda o e-mail e os dados do mapa de quem quer receber a música do dia.
import { temBanco, redis, CHAVE_LISTA, chavePessoa, discoDe, hoje } from '../lib/musica.mjs';
import { montarEmail, enviarUm } from '../lib/musica-email.mjs';

const okEmail = e => /^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$/.test(e);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  if (!temBanco()) return res.status(503).json({ erro: 'O envio por e-mail abre em breve.' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = String(b.email || '').trim().toLowerCase().slice(0, 254);
  const freq = b.freq === 'semanal' ? 'semanal' : 'diario';
  const p = b.perfil || {};
  const city = Array.isArray(p.city) && p.city.length === 4 ? [String(p.city[0]).slice(0, 120), +p.city[1], +p.city[2], String(p.city[3]).slice(0, 60)] : null;
  if (!okEmail(email)) return res.status(400).json({ erro: 'Confere o e-mail.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.d || '') || !city || !isFinite(city[1]) || !isFinite(city[2])) return res.status(400).json({ erro: 'Faltam os dados do mapa.' });
  const perfil = { nome: String(p.nome || '').trim().slice(0, 60), d: p.d, t: /^\d{2}:\d{2}$/.test(p.t || '') ? p.t : '', sem: !!p.sem, city };

  try {
    const disco = discoDe(perfil, hoje());
    if (!disco) return res.status(400).json({ erro: 'Não consegui calcular o mapa.' });
    const antes = await redis('GET', chavePessoa(email));
    const registro = { email, freq, perfil, criado: antes ? JSON.parse(antes).criado : new Date().toISOString(), atualizado: new Date().toISOString() };
    await redis('SET', chavePessoa(email), JSON.stringify(registro));
    await redis('SADD', CHAVE_LISTA, email);
    if (!antes) {
      try { const m = montarEmail({ email, perfil, disco, dia: hoje(), boasVindas: true }); await enviarUm({ email, ...m }); }
      catch (e) { console.error('musica boas-vindas', e.message); }
    }
    return res.status(200).json({ ok: true, freq });
  } catch (e) {
    console.error('musica-inscrever', e);
    return res.status(500).json({ erro: 'Não deu certo agora. Tenta de novo.' });
  }
}
