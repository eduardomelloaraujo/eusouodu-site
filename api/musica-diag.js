// Diagnóstico temporário: a página avisa cada etapa que o navegador conseguiu passar (só com ?diag).
import { temBanco, redis } from '../lib/musica.mjs';
export default async function handler(req, res) {
  if (!temBanco()) return res.status(503).json({ erro: 'sem banco' });
  if (req.query.m) {
    const ua = String(req.headers['user-agent'] || '').replace(/.*(Version\/[\d.]+|Chrome\/[\d.]+).*/, '$1');
    await redis('LPUSH', 'musica:diag', new Date().toISOString().slice(11, 19) + ' | ' + String(req.query.m).slice(0, 200) + ' | ' + ua);
    await redis('LTRIM', 'musica:diag', 0, 200);
    return res.status(204).end();
  }
  res.setHeader('cache-control', 'no-store');
  return res.status(200).json(await redis('LRANGE', 'musica:diag', 0, 80));
}
