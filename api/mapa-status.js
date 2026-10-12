// Verifica se as peças do relatório estão funcionando: IA (créditos), Mercado Pago e Resend. Protegido pela ADMIN_KEY.
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const { chave } = req.query || {};
  if (!process.env.ADMIN_KEY || norm(chave) !== norm(process.env.ADMIN_KEY)) return res.status(403).json({ erro: 'Senha de administrador incorreta.' });
  const out = {};
  // IA: chamada mínima
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'ok' }] }),
    });
    const t = await r.text();
    out.ia = r.ok ? 'funcionando' : /credit|balance|billing/i.test(t) ? 'SEM CRÉDITOS na Anthropic' : r.status === 401 ? 'chave da Anthropic inválida' : `erro ${r.status}: ${t.slice(0, 160)}`;
  } catch (e) { out.ia = 'erro: ' + e.message; }
  // Mercado Pago: lê os dados da conta
  try {
    const r = await fetch('https://api.mercadopago.com/users/me', { headers: { authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
    out.mercadoPago = r.ok ? 'funcionando' : `erro ${r.status}`;
  } catch (e) { out.mercadoPago = 'erro: ' + e.message; }
  // Resend: lista os domínios
  try {
    const r = await fetch('https://api.resend.com/domains', { headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    out.email = r.ok ? 'funcionando' : r.status === 401 || r.status === 403 ? 'chave do Resend sem permissão para checar (o envio pode estar funcionando)' : `erro ${r.status}`;
  } catch (e) { out.email = 'erro: ' + e.message; }
  return res.status(200).json(out);
}
