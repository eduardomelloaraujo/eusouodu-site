// Relatório de cortesia, sem pagamento. Protegido pela ADMIN_KEY.
import { waitUntil } from '@vercel/functions';
import { gerarEEnviar, diaSeguinte } from '../lib/processar.mjs';
import { enviarEmail } from '../lib/email.mjs';

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (!process.env.ADMIN_KEY || norm(b.chave) !== norm(process.env.ADMIN_KEY)) return res.status(403).json({ erro: 'Senha de administrador incorreta.' });
  const plano = Number(b.plano) === 30 ? 30 : 7;
  const email = String(b.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: 'Confira o e-mail.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data || '') || !/^\d{2}:\d{2}$/.test(b.hora || '')) return res.status(400).json({ erro: 'Confira data e hora de nascimento.' });
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!isFinite(lat) || !isFinite(lon) || !b.tz) return res.status(400).json({ erro: 'Escolha a cidade na lista.' });
  const pessoa = { nome: String(b.nome || '').slice(0, 80), email, data: b.data, hora: b.hora, cidade: String(b.cidade || '').slice(0, 120), tz: b.tz, lat, lon };
  const inicio = diaSeguinte(Date.now());
  waitUntil(gerarEEnviar(pessoa, plano, inicio).catch(async e => {
    console.error('cortesia', e);
    try { await enviarEmail({ para: process.env.ALERTA_EMAIL || 'falecom@eusouodu.com', assunto: 'Falha num relatório de cortesia', html: `<p>Para ${email} (${plano} dias).</p><p>Erro: ${String(e.message || e).replace(/</g, '&lt;')}</p>` }); } catch {}
  }));
  return res.status(202).json({ ok: true, inicio });
}
