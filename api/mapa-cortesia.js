// Relatório de cortesia, sem pagamento. Protegido pela ADMIN_KEY.
import { waitUntil } from '@vercel/functions';
import { gerarEEnviar, diaSeguinte } from '../lib/processar.mjs';
import { enviarEmail } from '../lib/email.mjs';
import { lerToken, lerUser, salvarUser, passeAtivo, redis, K } from '../lib/jornada.mjs';

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  // Passe do céu: um relatório de 30 dias por ciclo do passe, no lugar da senha de administrador
  const doPasse = b.t ? lerToken(String(b.t), 's') : null;
  let u = null;
  if (b.t) {
    u = doPasse && await lerUser(doPasse);
    if (!passeAtivo(u)) return res.status(402).json({ erro: 'O Passe do céu não está ativo. Renove para emitir o relatório.' });
  } else if (!process.env.ADMIN_KEY || norm(b.chave) !== norm(process.env.ADMIN_KEY)) return res.status(403).json({ erro: 'Senha de administrador incorreta.' });
  const plano = doPasse ? 30 : Number(b.plano) === 30 ? 30 : 7;
  const email = doPasse || String(b.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: 'Confira o e-mail.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data || '') || !/^\d{2}:\d{2}$/.test(b.hora || '')) return res.status(400).json({ erro: 'Confira data e hora de nascimento.' });
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!isFinite(lat) || !isFinite(lon) || !b.tz) return res.status(400).json({ erro: 'Escolha a cidade na lista.' });
  const pessoa = { nome: String(b.nome || '').slice(0, 80), email, data: b.data, hora: b.hora, cidade: String(b.cidade || '').slice(0, 120), tz: b.tz, lat, lon };
  const inicio = diaSeguinte(Date.now());
  let chaveRel = null;
  if (doPasse) {
    chaveRel = K.passeRel(email, u.passe.ciclo);
    const ok = await redis('SET', chaveRel, String(Date.now()), 'NX', 'EX', 90 * 86400);
    if (ok !== 'OK') return res.status(409).json({ erro: 'O relatório deste passe já foi emitido. O próximo libera quando você renovar.', em: Number(await redis('GET', chaveRel)) });
    if (!u.perfil) { u.perfil = { nome: pessoa.nome, birth: pessoa.data, time: pessoa.hora, unknownTime: false, city: [pessoa.cidade, lat, lon, b.tz], optin: true }; await salvarUser(u); }
  }
  waitUntil(gerarEEnviar(pessoa, plano, inicio).catch(async e => {
    console.error('cortesia', e);
    if (chaveRel) await redis('DEL', chaveRel).catch(() => {}); // falhou: devolve o relatório do passe
    try { await enviarEmail({ para: process.env.ALERTA_EMAIL || 'falecom@eusouodu.com', assunto: 'Falha num relatório de cortesia', html: `<p>Para ${email} (${plano} dias).</p><p>Erro: ${String(e.message || e).replace(/</g, '&lt;')}</p>` }); } catch {}
  }));
  return res.status(202).json({ ok: true, inicio });
}
