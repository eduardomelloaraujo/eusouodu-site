// Música Astral: envio da manhã. Roda todo dia pela agenda da Vercel (vercel.json → crons).
// Quem escolheu "todo dia" recebe sempre; quem escolheu "só aos domingos" recebe no domingo.
import { temBanco, redis, CHAVE_LISTA, chavePessoa, discoDe, hoje } from '../lib/musica.mjs';
import { montarEmail, enviarLote } from '../lib/musica-email.mjs';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  const autorizado = (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) ||
    (process.env.ADMIN_KEY && req.query.key === process.env.ADMIN_KEY) ||
    (!process.env.CRON_SECRET && /^vercel-cron\//.test(req.headers['user-agent'] || '') && !req.query.so);
  // Sem CRON_SECRET, aceita a agenda da Vercel; o envio do dia tem chave única no Resend, então repetir não duplica.
  if (!autorizado) return res.status(401).json({ erro: 'sem permissão' });
  if (!temBanco()) return res.status(503).json({ erro: 'sem banco' });

  const dia = hoje();
  const domingo = new Date(dia + 'T12:00:00Z').getUTCDay() === 0;
  const so = req.query.so ? String(req.query.so).toLowerCase() : null; // teste: manda só para este e-mail
  const emails = so ? [so] : (await redis('SMEMBERS', CHAVE_LISTA)) || [];

  const msgs = [];
  let pulados = 0, erros = 0;
  for (let i = 0; i < emails.length; i += 50) {
    const chaves = emails.slice(i, i + 50).map(chavePessoa);
    const regs = await redis('MGET', ...chaves);
    for (const bruto of regs || []) {
      if (!bruto) { pulados++; continue; }
      try {
        const r = JSON.parse(bruto);
        if (!so && r.freq === 'semanal' && !domingo) { pulados++; continue; }
        const disco = discoDe(r.perfil, dia);
        if (!disco) { erros++; continue; }
        msgs.push({ email: r.email, ...montarEmail({ email: r.email, perfil: r.perfil, disco, dia }) });
      } catch (e) { erros++; console.error('musica-diario item', e.message); }
    }
  }
  const enviados = msgs.length ? await enviarLote(msgs, so ? `${dia}-teste-${Date.now()}` : dia) : 0;
  return res.status(200).json({ dia, inscritos: emails.length, enviados, pulados, erros });
}
