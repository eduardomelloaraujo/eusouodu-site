// Leitura viva do mapa: as ações mapa, checkout, webhook, meu, falar, link e cortesia.
// Roda dentro de api/jornada.js (/api/leitura é reescrito para lá) porque o plano Hobby da Vercel aceita só 12 funções.
import { waitUntil } from '@vercel/functions';
import { redis, temBanco, okEmail, enviarEmail, SITE } from './jornada.mjs';
import { calcular, item, indice, falar, processarPagamento, lerUser, emailDoToken, emailAcesso, salvarUser, linkAcesso, PRECO, LIMITE_DIA, DIAS_ACESSO, K } from './leitura.mjs';

const GRATIS = 'sol'; // o que fala antes da compra
const corpo = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

// dados de nascimento validados (os mesmos campos do /mapa)
function nascimento(b) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data || '')) throw new Error('Confira a data de nascimento.');
  if (!/^\d{2}:\d{2}$/.test(b.hora || '')) throw new Error('Informe a hora de nascimento.');
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !b.tz) throw new Error('Escolha a cidade de nascimento na lista.');
  try { new Intl.DateTimeFormat('en', { timeZone: b.tz }); } catch { throw new Error('Escolha a cidade de nascimento na lista.'); }
  return { data: b.data, hora: b.hora, tz: b.tz, lat, lon, cidade: String(b.cidade || '').slice(0, 120), nome: String(b.nome || '').trim().slice(0, 80) };
}

// o mapa com os textos: todos para quem comprou, só o Sol para quem ainda não
function pacote(p, aberto) {
  const m = calcular(p), idx = indice(m), textos = {};
  for (const id of [...idx.planetas, ...idx.pontos, ...idx.casas, ...idx.aspectos]) {
    const it = item(m, id);
    textos[id] = aberto || id === GRATIS ? { titulo: it.titulo, sub: it.sub, base: it.base, pergunta: it.pergunta, temTransito: !!it.transito, grau: it.grau, filosofia: it.filosofia, livros: it.livros } : { titulo: it.titulo, sub: it.sub, fechado: true };
  }
  return { mapa: m, indice: idx, textos };
}

async function usuarioDoPedido(req) {
  const h = req.headers.authorization || '';
  const email = emailDoToken(h.startsWith('Bearer ') ? h.slice(7) : '');
  if (!email || !temBanco()) return null;
  const u = await lerUser(email);
  return u && u.until > Date.now() ? u : null;
}

async function contar(chave, limite, dias = 1) {
  const n = await redis('INCR', chave);
  if (n === 1) await redis('EXPIRE', chave, dias * 86400);
  return n <= limite;
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const a = String((req.query || {}).a || '');
  try {
    if (a === 'webhook') {
      const q = req.query || {}, b = corpo(req), id = (b.data && b.data.id) || q['data.id'] || q.id;
      if ((b.type || b.topic || q.type || q.topic) === 'payment' && id) waitUntil(processarPagamento(String(id)).catch(e => console.error('leitura pagamento', id, e)));
      return res.status(200).send('ok');
    }
    if (a === 'mapa' && req.method === 'POST') {
      return res.status(200).json({ ...pacote(nascimento(corpo(req)), false), preco: PRECO });
    }
    if (a === 'meu') {
      const u = await usuarioDoPedido(req);
      if (!u) return res.status(401).json({ erro: 'O acesso terminou ou o link não vale mais. Peça um novo link com o e-mail da compra.' });
      return res.status(200).json({ ...pacote(u, true), pessoa: { nome: u.nome, cidade: u.cidade, data: u.data, hora: u.hora, until: u.until } });
    }
    if (a === 'falar' && req.method === 'POST') {
      const b = corpo(req), id = String(b.id || ''), tipo = b.tipo === 'transito' ? 'transito' : 'natal';
      const u = await usuarioDoPedido(req);
      let p;
      if (u) {
        if (!await contar(K.uso(u.email, hojeBR()), LIMITE_DIA)) return res.status(429).json({ erro: 'Por hoje o mapa já falou bastante. Amanhã ele volta a falar tudo.' });
        p = u;
      } else {
        if (id !== GRATIS || tipo !== 'natal') return res.status(402).json({ erro: 'Este ponto abre com a leitura completa.' });
        const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'sem-ip';
        if (temBanco() && !await contar(`leitura:gratis:${ip}:${hojeBR()}`, 4)) return res.status(429).json({ erro: 'A amostra grátis já falou várias vezes daqui hoje.' });
        p = nascimento(b);
      }
      return res.status(200).json(await falar(calcular(p), id, tipo));
    }
    if (a === 'checkout' && req.method === 'POST') {
      const b = corpo(req), p = nascimento(b), email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      if (p.nome.length < 2) throw new Error('Informe o nome.');
      if (!okEmail(email)) throw new Error('Confira o e-mail.');
      const pref = {
        items: [{ id: 'leitura-viva', title: 'Leitura viva do mapa · 6 meses', quantity: 1, unit_price: PRECO, currency_id: 'BRL' }],
        payer: { email, name: p.nome },
        metadata: { produto: 'leitura', email, ...p },
        back_urls: { success: `${SITE}/leitura/?pago=1`, pending: `${SITE}/leitura/?pago=pendente`, failure: `${SITE}/leitura/?pago=falhou` },
        auto_return: 'approved',
        notification_url: `${SITE}/api/leitura?a=webhook`,
        statement_descriptor: 'EUSOUODU',
        external_reference: `leitura-${Date.now()}`,
      };
      const r = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }, body: JSON.stringify(pref) });
      if (!r.ok) { console.error('MP', r.status, await r.text()); return res.status(502).json({ erro: 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.' }); }
      return res.status(200).json({ url: (await r.json()).init_point });
    }
    if (a === 'link' && req.method === 'POST') {
      const email = String(corpo(req).email || '').trim().toLowerCase();
      if (!okEmail(email)) throw new Error('Confira o e-mail.');
      if (await contar(`leitura:link:${email}`, 5)) {
        const u = await lerUser(email);
        if (u && u.until > Date.now()) { const { assunto, html } = emailAcesso(u, false); await enviarEmail({ para: email, assunto, html }); }
      }
      return res.status(200).json({ ok: true }); // a mesma resposta com ou sem compra, para não revelar quem comprou
    }
    if (a === 'cortesia' && req.method === 'POST') {
      // sempre com a ADMIN_KEY: a prévia pode ficar aberta para quem tem o link
      const b = corpo(req), chaves = [process.env.JORNADA_ADMIN_KEY, process.env.ADMIN_KEY];
      if (!chaves.some(k => k && String(b.key || '') === k)) return res.status(403).json({ erro: 'sem permissão' });
      const p = nascimento(b), email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      if (!okEmail(email)) throw new Error('Confira o e-mail.');
      const u = { email, ...p, until: Date.now() + DIAS_ACESSO * 864e5, pagamentos: ['cortesia-' + Date.now()] };
      await salvarUser(u);
      return res.status(200).json({ ok: true, until: u.until, link: linkAcesso(u) });
    }
    return res.status(404).json({ erro: 'Ação desconhecida.' });
  } catch (e) {
    console.error('leitura', a, e);
    return res.status(400).json({ erro: e.message || 'Algo falhou.' });
  }
}
