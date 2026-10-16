// Diagnóstico temporário: a página avisa cada etapa que o navegador conseguiu passar.
import { temBanco, redis } from '../lib/musica.mjs';
export default async function handler(req, res) {
  if (!temBanco()) return res.status(503).json({ erro: 'sem banco' });
  if (req.method === 'POST' || req.query.m) {
    const m = String(req.query.m || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || ''))).slice(0, 300);
    const ua = String(req.headers['user-agent'] || '').slice(0, 160);
    await redis('LPUSH', 'musica:diag', new Date().toISOString().slice(11, 19) + ' | ' + m + ' | ' + ua);
    await redis('LTRIM', 'musica:diag', 0, 300);
    return res.status(204).end();
  }
  res.setHeader('cache-control', 'no-store');
  return res.status(200).json(await redis('LRANGE', 'musica:diag', 0, 120));
}
