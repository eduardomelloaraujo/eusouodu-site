// Cria o pagamento no Mercado Pago para "A semana no seu mapa" (7 dias) ou "O mês no seu mapa" (30 dias)
const PLANOS = {
  7: { titulo: 'A semana no seu mapa · 7 dias', preco: Number(process.env.PRECO_7 || 37) },
  30: { titulo: 'O mês no seu mapa · 30 dias', preco: Number(process.env.PRECO_30 || 97) },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const plano = Number(b.plano);
  const erro = (m) => res.status(400).json({ erro: m });
  if (!PLANOS[plano]) return erro('Escolha 7 ou 30 dias.');
  const nome = String(b.nome || '').trim().slice(0, 80);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
  if (nome.length < 2) return erro('Informe o nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('Confira o e-mail.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data || '')) return erro('Confira a data de nascimento.');
  if (!/^\d{2}:\d{2}$/.test(b.hora || '')) return erro('Informe a hora de nascimento.');
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!isFinite(lat) || !isFinite(lon) || !b.tz) return erro('Escolha a cidade de nascimento na lista.');
  try { new Intl.DateTimeFormat('en', { timeZone: b.tz }); } catch { return erro('Escolha a cidade de nascimento na lista.'); }

  const base = process.env.SITE_URL || 'https://eusouodu.com';
  const pref = {
    items: [{ id: `mapa-${plano}`, title: PLANOS[plano].titulo, quantity: 1, unit_price: PLANOS[plano].preco, currency_id: 'BRL' }],
    payer: { email, name: nome },
    metadata: { produto: 'mapa', plano, nome, email, data: b.data, hora: b.hora, cidade: String(b.cidade || '').slice(0, 120), tz: b.tz, lat, lon },
    back_urls: { success: `${base}/mapa/obrigado.html`, pending: `${base}/mapa/obrigado.html?pendente=1`, failure: `${base}/mapa/?falhou=1` },
    auto_return: 'approved',
    notification_url: `${base}/api/mapa-webhook`,
    statement_descriptor: 'EUSOUODU',
    external_reference: `mapa-${plano}-${Date.now()}`,
  };
  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    body: JSON.stringify(pref),
  });
  if (!r.ok) { console.error('MP', r.status, await r.text()); return res.status(502).json({ erro: 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.' }); }
  const j = await r.json();
  return res.status(200).json({ url: j.init_point });
}
