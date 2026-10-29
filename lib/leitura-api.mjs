// Leitura viva do mapa: as ações mapa, checkout, webhook, meu, falar, link e cortesia.
// Roda dentro de api/jornada.js (/api/leitura é reescrito para lá) porque o plano Hobby da Vercel aceita só 12 funções.
import { waitUntil } from '@vercel/functions';
import { redis, temBanco, okEmail, enviarEmail, SITE } from './jornada.mjs';
import { randomBytes } from 'node:crypto';
import { calcular, item, indice, falar, processarPagamento, processarHotmart, textoEn, tituloEn, K_PEND, lerUser, emailDoToken, emailAcesso, salvarUser, linkAcesso, PRECO, PRECO_EN, LIMITE_DIA, DIAS_ACESSO, K } from './leitura.mjs';

const GRATIS = 'sol'; // o que fala antes da compra
const corpo = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
// a mesma comparação de senha do /mapa/cortesia (sem acento, maiúscula ou espaço)
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
// as mensagens de erro do /reading
const EN = {
  'Confira a data de nascimento.': 'Check the date of birth.', 'Informe a hora de nascimento.': 'Enter the time of birth.',
  'Escolha a cidade de nascimento na lista.': 'Choose the city of birth from the list.', 'Informe o nome.': 'Enter your name.', 'Confira o e-mail.': 'Check the e-mail.',
  'O acesso terminou ou o link não vale mais. Peça um novo link com o e-mail da compra.': 'Your access has ended or this link is no longer valid. Ask for a new link with the e-mail you used to buy.',
  'Por hoje o mapa já falou bastante. Amanhã ele volta a falar tudo.': 'Your chart has spoken a lot today. Tomorrow it will speak again.',
  'Este ponto abre com a leitura completa.': 'This point opens with the full reading.', 'A amostra grátis já falou várias vezes daqui hoje.': 'The free sample has already spoken several times from here today.',
  'Não foi possível abrir o pagamento agora. Tente de novo em instantes.': 'Checkout could not open right now. Please try again in a moment.',
  'Este ponto não existe neste mapa.': 'This point does not exist in this chart.', 'Este ponto não tem trânsito para ler.': 'This point has no transit to read.', 'Algo falhou.': 'Something went wrong.',
};
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
function pacote(p, aberto, en) {
  const m = calcular(p), idx = indice(m), textos = {};
  for (const id of [...idx.planetas, ...idx.pontos, ...idx.casas, ...idx.aspectos]) {
    const it = item(m, id);
    // em inglês só vão os títulos; o resto chega traduzido quando a pessoa abre o ponto (ação "texto")
    if (en) { textos[id] = { titulo: tituloEn(m, id), sub: '', ...(aberto || id === GRATIS ? { traduzir: true, temTransito: !!it.transito } : { fechado: true }) }; continue; }
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
  const en = (req.query || {}).lang === 'en';
  const erro = (st, msg) => res.status(st).json({ erro: en ? EN[msg] || msg : msg });
  try {
    if (a === 'hotmart') {
      // a Hotmart assina o aviso com o hottok do produto
      const b = corpo(req), hottok = req.headers['x-hotmart-hottok'] || b.hottok;
      if (!process.env.HOTMART_HOTTOK || hottok !== process.env.HOTMART_HOTTOK) return res.status(403).send('hottok');
      const r = await processarHotmart(b);
      if (r.erro) console.error('hotmart', r);
      return res.status(200).json(r);
    }
    if (a === 'webhook') {
      const q = req.query || {}, b = corpo(req), id = (b.data && b.data.id) || q['data.id'] || q.id;
      if ((b.type || b.topic || q.type || q.topic) === 'payment' && id) waitUntil(processarPagamento(String(id)).catch(e => console.error('leitura pagamento', id, e)));
      return res.status(200).send('ok');
    }
    if (a === 'mapa' && req.method === 'POST') {
      return res.status(200).json({ ...pacote(nascimento(corpo(req)), false, en), preco: en ? PRECO_EN : PRECO });
    }
    if (a === 'meu') {
      const u = await usuarioDoPedido(req);
      if (!u) return erro(401, 'O acesso terminou ou o link não vale mais. Peça um novo link com o e-mail da compra.');
      return res.status(200).json({ ...pacote(u, true, en), pessoa: { nome: u.nome, cidade: u.cidade, data: u.data, hora: u.hora, until: u.until } });
    }
    if (a === 'falar' && req.method === 'POST') {
      const b = corpo(req), id = String(b.id || ''), tipo = b.tipo === 'transito' ? 'transito' : 'natal';
      const u = await usuarioDoPedido(req);
      let p;
      if (u) {
        if (!await contar(K.uso(u.email, hojeBR()), LIMITE_DIA)) return erro(429, 'Por hoje o mapa já falou bastante. Amanhã ele volta a falar tudo.');
        p = u;
      } else {
        if (id !== GRATIS || tipo !== 'natal') return erro(402, 'Este ponto abre com a leitura completa.');
        const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'sem-ip';
        if (temBanco() && !await contar(`leitura:gratis:${ip}:${hojeBR()}`, 4)) return erro(429, 'A amostra grátis já falou várias vezes daqui hoje.');
        p = nascimento(b);
      }
      return res.status(200).json(await falar(calcular(p), id, tipo, en ? 'en' : 'pt'));
    }
    if (a === 'texto' && req.method === 'POST') {
      const b = corpo(req), id = String(b.id || ''), u = await usuarioDoPedido(req);
      if (!u && id !== GRATIS) return erro(402, 'Este ponto abre com a leitura completa.');
      return res.status(200).json(await textoEn(calcular(u || nascimento(b)), id));
    }
    if (a === 'checkout' && req.method === 'POST') {
      const b = corpo(req), p = nascimento(b), email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      if (p.nome.length < 2) throw new Error('Informe o nome.');
      if (!okEmail(email)) throw new Error('Confira o e-mail.');
      if (en) {
        if (!process.env.HOTMART_CHECKOUT_URL) return erro(502, 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.');
        // a Hotmart devolve o sck no aviso de venda; o e-mail serve de reserva se ele não vier
        const sck = randomBytes(9).toString('base64url'), dados = JSON.stringify({ email, ...p });
        await redis('SET', K_PEND(sck), dados, 'EX', 30 * 86400);
        await redis('SET', K_PEND(email), dados, 'EX', 30 * 86400);
        const url = new URL(process.env.HOTMART_CHECKOUT_URL);
        url.searchParams.set('email', email); url.searchParams.set('name', p.nome); url.searchParams.set('sck', sck);
        return res.status(200).json({ url: url.toString() });
      }
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
      if (!r.ok) { console.error('MP', r.status, await r.text()); return erro(502, 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.'); }
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
      if (!chaves.some(k => k && norm(b.key) === norm(k))) return res.status(403).json({ erro: 'sem permissão' });
      const p = nascimento(b), email = String(b.email || '').trim().toLowerCase().slice(0, 120);
      if (!okEmail(email)) throw new Error('Confira o e-mail.');
      const u = { email, ...p, until: Date.now() + DIAS_ACESSO * 864e5, pagamentos: ['cortesia-' + Date.now()] };
      await salvarUser(u);
      return res.status(200).json({ ok: true, until: u.until, link: linkAcesso(u) });
    }
    return res.status(404).json({ erro: 'Ação desconhecida.' });
  } catch (e) {
    console.error('leitura', a, e);
    return erro(400, e.message || 'Algo falhou.');
  }
}
