// Jornada: uma única função com várias ações (?a=...), para caber no limite de funções da Vercel.
// entrar · pedir-link · abrir · sync · conteudo · checkout · cancelar · webhook · diario · sair-emails · status
import {
  temBanco, redis, K, okEmail, sessao, lerToken, lerUser, salvarUser, planoAtivo, planoPublico, unidadesPagas, conteudoJornadas,
  mp, atualizarAssinatura, refAssinatura, processarPix, enviarEmail, emailBoasVindas, emailEntrada, emailFimPasse,
  APP, SITE, PRECO_SEMANA, PRECO_MES,
  PRECO_PASSE, PASSE_LIMITES, passeAtivo, planoDe, periodoUso, ativarPasse, emailEntradaPasse, emailPasseAtivo, emailFimPasseCeu,
} from '../lib/jornada.mjs';

export const config = { maxDuration: 60 };

const corpo = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
// a sessão vem no cabeçalho (Jornada, central) ou no campo t (os outros apps, servidor a servidor)
const quem = req => {
  const h = req.headers.authorization || '';
  return lerToken(h.startsWith('Bearer ') ? h.slice(7) : String((req.query || {}).t || (req.method === 'POST' ? corpo(req).t : '') || ''), 's');
};
const limparPerfil = p => {
  p = p || {};
  const city = Array.isArray(p.city) && p.city.length === 4 && isFinite(p.city[1]) && isFinite(p.city[2]) ? [String(p.city[0]).slice(0, 120), +p.city[1], +p.city[2], String(p.city[3]).slice(0, 60)] : null;
  if (city) { try { new Intl.DateTimeFormat('en', { timeZone: city[3] }); } catch { return null; } }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.birth || '') || !city) return null;
  return {
    nome: String(p.name || p.nome || '').trim().slice(0, 60),
    birth: p.birth, time: /^\d{2}:\d{2}$/.test(p.time || '') ? p.time : '', unknownTime: !!p.unknownTime || !/^\d{2}:\d{2}$/.test(p.time || ''),
    city, optin: p.optin !== false,
  };
};
const limparProgresso = g => {
  g = g || {};
  const arr = (v, n) => Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, n).map(x => x.slice(0, 40)) : [];
  const diario = {};
  if (g.diario && typeof g.diario === 'object') for (const [k, v] of Object.entries(g.diario).slice(0, 200)) diario[String(k).slice(0, 40)] = String(v).slice(0, 2000);
  return {
    done: arr(g.done, 400), lit: arr(g.lit, 60), cards: arr(g.cards, 200),
    xp: Math.max(0, Math.min(1e7, Number(g.xp) || 0)), streak: Math.max(0, Math.min(5000, Number(g.streak) || 0)),
    last: typeof g.last === 'string' ? g.last.slice(0, 10) : null, daily: typeof g.daily === 'string' ? g.daily.slice(0, 10) : null,
    luas: Math.max(0, Math.min(5, Number(g.luas) || 0)), luasEm: Number(g.luasEm) || 0, diario,
  };
};
const resposta = u => ({
  email: u.email, perfil: u.perfil, progresso: u.progresso || null, plano: planoPublico(planoDe(u)),
  precos: { semana: PRECO_SEMANA, mes: PRECO_MES }, mpPublic: CARTAO_NO_APP ? (MP_PUBLIC || null) : null,
});

const pagina = (titulo, texto, link = APP, botao = 'Abrir a Jornada') => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo} · Jornada</title></head>
<body style="margin:0;background:#FFF5E8;color:#1F1433;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box">
<main style="max-width:420px;text-align:center"><p style="font-family:Georgia,serif;font-style:italic;font-weight:bold;font-size:36px;margin:0 0 18px">Jornada</p>
<h1 style="font-family:Georgia,serif;font-size:30px;margin:0 0 10px">${titulo}</h1><p style="color:#5A4B6E;line-height:1.6;margin:0 0 22px">${texto}</p>
<a href="${link}" style="display:inline-block;background:#FF4FAE;color:#1F1433;font-weight:800;text-decoration:none;padding:13px 20px;border:2.5px solid #1F1433;border-radius:14px">${botao}</a></main></body></html>`;

// Chave pública do Mercado Pago (é pública por definição: serve só para o formulário de cartão no navegador)
// cartão digitado dentro do app: desligado (o antifraude do Mercado Pago recusava com cc_rejected_high_risk).
// O cartão vai para a página do Mercado Pago (Checkout Pro), junto com o Pix.
const CARTAO_NO_APP = false;
const MP_PUBLIC = process.env.MP_PUBLIC_KEY || 'APP_USR-22d3eeb4-e031-4907-ad43-d0c6e4632b54';

export default async function handler(req, res) {
  const a = String((req.query || {}).a || '');
  res.setHeader('cache-control', 'no-store');
  try {
    if (a === 'webhook') return await webhook(req, res);
    if (!temBanco()) return res.status(503).json({ erro: 'A Jornada está em manutenção. Volte em alguns minutos.' });
    switch (a) {
      case 'entrar': return await entrar(req, res);
      case 'pedir-link': return await pedirLink(req, res);
      case 'abrir': return await abrir(req, res);
      case 'sync': return await sync(req, res);
      case 'conteudo': return await conteudo(req, res);
      case 'checkout': return await checkout(req, res);
      case 'cancelar': return await cancelar(req, res);
      case 'assinar': return await assinar(req, res);
      case 'diario': return await diario(req, res);
      case 'sair-emails': return await sairEmails(req, res);
      case 'status': return await status(req, res);
      case 'passe-assinar': return await passeAssinar(req, res);
      case 'passe-link': return await passeLink(req, res);
      case 'passe': return await passe(req, res);
      case 'passe-usar': return await passeUsar(req, res, 1);
      case 'passe-devolver': return await passeUsar(req, res, -1);
      case 'passe-cortesia': return await passeCortesia(req, res);
      default: return res.status(404).json({ erro: 'ação desconhecida' });
    }
  } catch (e) {
    console.error('jornada', a, e);
    return res.status(500).json({ erro: 'Algo deu errado do nosso lado. Tente de novo em instantes.' });
  }
}

// Cria a conta no fim da entrada. Se o e-mail já tem jornada, não entrega a conta: manda o link para o e-mail.
async function entrar(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const b = corpo(req);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 254);
  if (!okEmail(email)) return res.status(400).json({ erro: 'Confira o e-mail: falta algo como nome@email.com.' });
  const perfil = limparPerfil(b.perfil);
  if (!perfil) return res.status(400).json({ erro: 'Faltam dados de nascimento. Confira a data e a cidade.' });
  const atual = await lerUser(email);
  if (atual) {
    try { await enviarEmail({ para: email, ...emailEntrada(atual) }); } catch (e) { console.error('link', e.message); }
    return res.status(200).json({ existe: true });
  }
  const u = { email, perfil, progresso: limparProgresso(b.progresso), plano: null, criado: new Date().toISOString() };
  await salvarUser(u);
  await redis('SADD', K.leads, email);
  try { await enviarEmail({ para: email, chave: `jornada-boas-vindas-${email}`, ...emailBoasVindas({ ...u, nome: perfil.nome }) }); } catch (e) { console.error('boas-vindas', e.message); }
  return res.status(200).json({ sessao: sessao(email), ...resposta(u) });
}

async function pedirLink(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const email = String(corpo(req).email || '').trim().toLowerCase();
  if (!okEmail(email)) return res.status(400).json({ erro: 'Confira o e-mail: falta algo como nome@email.com.' });
  const u = await lerUser(email);
  if (u) { try { await enviarEmail({ para: email, ...emailEntrada({ ...u, nome: u.perfil?.nome }) }); } catch (e) { console.error('link', e.message); } }
  // mesma resposta exista ou não a conta, para não revelar quem tem cadastro
  return res.status(200).json({ ok: true });
}

// Link mágico do e-mail: troca por uma sessão e abre o app
async function abrir(req, res) {
  const email = lerToken(String(req.query.t || ''), 'l');
  res.setHeader('content-type', 'text/html; charset=utf-8');
  if (!email) return res.status(400).send(pagina('Link vencido', 'Esse link já passou de 48 horas ou está incompleto. Na tela de entrada, toque em "Já tenho uma conta" e peça outro.'));
  const u = await lerUser(email);
  if (!u) return res.status(404).send(pagina('Conta não encontrada', 'Não achamos uma jornada com esse e-mail. Dá para começar uma nova agora.'));
  res.setHeader('location', `${req.query.p ? SITE + '/passe/' : APP + '/'}#s=${encodeURIComponent(sessao(email))}`);
  return res.status(302).send('');
}

async function sync(req, res) {
  const email = quem(req);
  if (!email) return res.status(401).json({ erro: 'Sessão expirada. Entre de novo pelo link no e-mail.' });
  const u = await lerUser(email);
  if (!u) return res.status(401).json({ erro: 'Conta não encontrada.' });
  // atualiza a assinatura direto no Mercado Pago quando ela ainda não está confirmada (não depende só do aviso automático)
  const b = req.method === 'POST' ? corpo(req) : {};
  const perto = u.plano && u.plano.type === 'mes' && u.plano.status === 'authorized' && !u.plano.canceled && Number(u.plano.until) - Date.now() < 3 * 864e5; // renovação: confere no Mercado Pago
  const pa = (req.query.preapproval_id || b.preapproval_id || (u.plano && u.plano.pendenteMes) || (u.plano && u.plano.type === 'mes' && ((u.plano.status !== 'authorized' && !u.plano.canceled) || perto) && u.plano.preapprovalId) || '').toString();
  if (pa) { try { await atualizarAssinatura(pa); } catch (e) { console.error('sync assinatura', e.message); } }
  const fresco = pa ? await lerUser(email) : u;
  if (req.method === 'POST') {
    if (b.progresso) fresco.progresso = limparProgresso(b.progresso);
    if (b.perfil) { const p = limparPerfil(b.perfil); if (p) fresco.perfil = p; }
    await salvarUser(fresco);
  }
  // crédito de passe semanal comprado durante o mensal: entra quando o mensal acaba
  if (fresco.creditoDias && fresco.plano && fresco.plano.type === 'mes' && !planoAtivo(fresco.plano)) {
    fresco.plano = { type: 'semana', since: Date.now(), until: Date.now() + fresco.creditoDias * 864e5 };
    fresco.creditoDias = 0;
    await salvarUser(fresco);
  }
  return res.status(200).json(resposta(fresco));
}

async function conteudo(req, res) {
  const email = quem(req);
  if (!email) return res.status(401).json({ erro: 'Sessão expirada.' });
  const u = await lerUser(email);
  if (!u || !planoAtivo(planoDe(u))) return res.status(402).json({ erro: 'Essas lições são para quem tem um plano ativo.' });
  return res.status(200).json({ unidades: unidadesPagas(), ...conteudoJornadas() });
}

async function checkout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const email = quem(req);
  if (!email) return res.status(401).json({ erro: 'Sessão expirada. Entre de novo pelo link no e-mail.' });
  const u = await lerUser(email);
  if (!u) return res.status(401).json({ erro: 'Conta não encontrada.' });
  const plano = corpo(req).plano;
  if (plano === 'semana') {
    const pref = {
      items: [{ id: 'jornada-semana', title: 'Jornada · passe semanal (7 dias)', quantity: 1, unit_price: PRECO_SEMANA, currency_id: 'BRL' }],
      payer: { email, name: u.perfil?.nome || undefined },
      payment_methods: { excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }, { id: 'atm' }, { id: 'prepaid_card' }], installments: 1 },
      metadata: { produto: 'jornada', plano: 'semana', email },
      back_urls: { success: `${APP}/?pago=semana`, pending: `${APP}/?pago=pendente`, failure: `${APP}/?pago=falhou` },
      auto_return: 'approved',
      notification_url: `${SITE}/api/jornada?a=webhook`,
      statement_descriptor: 'EUSOUODU',
      external_reference: `jornada-semana:${email}:${Date.now()}`,
    };
    const j = await mp('/checkout/preferences', { method: 'POST', body: JSON.stringify(pref) });
    return res.status(200).json({ url: j.init_point });
  }
  if (plano === 'mes' || plano === 'mes30') {
    // passe mensal no Pix: 30 dias, pago uma vez, sem renovação. A assinatura recorrente no cartão é a ação 'assinar'.
    const pref = {
      items: [{ id: 'jornada-mes', title: 'Jornada · 30 dias', quantity: 1, unit_price: PRECO_MES, currency_id: 'BRL' }],
      payer: { email },
      payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }], installments: 1 },
      metadata: { produto: 'jornada', plano: 'mes', email },
      back_urls: { success: `${APP}/?pago=passe`, pending: `${APP}/?pago=pendente`, failure: `${APP}/?pago=falhou` },
      auto_return: 'approved',
      notification_url: `${SITE}/api/jornada?a=webhook`,
      statement_descriptor: 'EUSOUODU',
      external_reference: `jornada-mes:${email}:${Date.now()}`,
    };
    const j = await mp('/checkout/preferences', { method: 'POST', body: JSON.stringify(pref) });
    return res.status(200).json({ url: j.init_point });
  }
  return res.status(400).json({ erro: 'Escolha o passe semanal ou a assinatura mensal.' });
}

// Assinatura mensal recorrente com o cartão digitado dentro da Jornada (Card Payment Brick).
// A assinatura já nasce autorizada: a jornada libera na mesma hora e o Mercado Pago cobra todo mês.
async function assinar(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const email = quem(req);
  if (!email) return res.status(401).json({ erro: 'Sessão expirada. Entre de novo pelo link no e-mail.' });
  const u = await lerUser(email);
  if (!u) return res.status(401).json({ erro: 'Conta não encontrada.' });
  if (u.plano && u.plano.type === 'mes' && u.plano.status === 'authorized' && !u.plano.canceled) return res.status(200).json({ ...resposta(u), ja: true });
  const b = corpo(req);
  const token = String(b.token || '');
  if (!token) return res.status(400).json({ erro: 'Faltou o cartão.' });
  const pagador = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.email || '')) ? String(b.email).toLowerCase() : email;
  // o Mercado Pago recusa (invalid_field_content) assinatura com cartão quando a referência leva um e-mail:
  // a referência vira um código, e o código aponta para o e-mail no banco
  const ref = await refAssinatura(email);
  let pa = null, motivo = '';
  // a checagem da assinatura recorrente do Mercado Pago reprova muitos cartões bons (CC_VAL_433) e ainda inutiliza o token:
  // por enquanto o cartão vai direto para a compra normal de 30 dias, que aprova como qualquer compra online
  const TENTAR_RECORRENTE = false;
  if (TENTAR_RECORRENTE) try {
    pa = await mp('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Jornada assinatura mensal',
        external_reference: ref,
        payer_email: pagador,
        card_token_id: token,
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: PRECO_MES, currency_id: 'BRL' },
        back_url: APP,
        status: 'authorized',
      }),
    });
    if (pa.status !== 'authorized') {
      motivo = 'status ' + pa.status;
      if (pa.id) { try { await mp(`/preapproval/${encodeURIComponent(pa.id)}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) }); } catch {} }
      pa = null;
    }
  } catch (e) {
    motivo = String((e.body && (e.body.message || e.body.error)) || e.message || '');
    console.error('assinar recorrente', email, motivo.slice(0, 200));
    pa = null;
  }
  if (!pa) {
    // a assinatura recorrente recusou o cartão (validação do Mercado Pago é mais rígida que uma compra):
    // o mesmo cartão paga o primeiro mês como compra normal, que libera 30 dias na hora
    let pg;
    try {
      pg = await mp('/v1/payments', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': 'jornada-mes-' + token },
        body: JSON.stringify({
          transaction_amount: PRECO_MES, token, installments: 1, binary_mode: true,
          payment_method_id: String(b.payment_method_id || '') || undefined,
          issuer_id: b.issuer_id ? String(b.issuer_id) : undefined,
          description: 'Jornada · 30 dias',
          payer: { email: pagador, identification: b.identification && b.identification.number ? { type: String(b.identification.type || 'CPF'), number: String(b.identification.number) } : undefined },
          metadata: { produto: 'jornada', plano: 'mes', email },
          external_reference: `jornada-mes:${Date.now()}`,
          notification_url: `${SITE}/api/jornada?a=webhook`,
          statement_descriptor: 'EUSOUODU',
        }),
      });
    } catch (e) {
      const m = String((e.body && (e.body.message || e.body.error)) || e.message || '');
      console.error('assinar pagamento', email, m.slice(0, 200));
      return res.status(402).json({ erro: 'O cartão não foi aceito. Confira os dados ou tente outro cartão de crédito. O Pix de 30 dias também libera na hora.', detalhe: m.slice(0, 160) });
    }
    if (pg.status !== 'approved') {
      console.error('assinar pagamento recusado', email, pg.id, pg.status, pg.status_detail);
      const d = String(pg.status_detail || '');
      const msg = {
        cc_rejected_insufficient_amount: 'O cartão foi recusado por limite. Tente outro cartão de crédito ou o Pix.',
        cc_rejected_bad_filled_security_code: 'O código de segurança não confere. Confira e tente de novo.',
        cc_rejected_bad_filled_date: 'A data de vencimento não confere. Confira e tente de novo.',
        cc_rejected_bad_filled_other: 'Algum dado do cartão não confere. Confira e tente de novo.',
        cc_rejected_call_for_authorize: 'O banco pediu autorização para essa compra. Autorize no app do banco e tente de novo.',
        cc_rejected_card_disabled: 'O cartão está bloqueado para compras online. Libere no app do banco ou tente outro.',
        cc_rejected_high_risk: 'O Mercado Pago recusou por segurança. Tente outro cartão ou pague no Pix.',
      }[d] || 'O banco recusou o cartão. Tente outro cartão de crédito ou pague no Pix, que libera na hora.';
      return res.status(402).json({ erro: msg, detalhe: d });
    }
    await processarPix(String(pg.id));
    const f = await lerUser(email);
    return res.status(200).json({ ...resposta(f), semRecorrencia: true });
  }
  // passe semanal/mensal ainda valendo: os dias que sobram viram crédito depois do fim do mês
  if (u.plano && u.plano.type === 'semana' && Number(u.plano.until) > Date.now()) {
    u.creditoDias = (u.creditoDias || 0) + Math.ceil((Number(u.plano.until) - Date.now()) / 864e5);
    u.plano = { type: 'mes', status: 'pending', until: 0, preapprovalId: pa.id };
    await salvarUser(u);
  }
  await atualizarAssinatura(pa.id);
  const f = await lerUser(email);
  return res.status(200).json(resposta(f));
}

async function cancelar(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const email = quem(req);
  if (!email) return res.status(401).json({ erro: 'Sessão expirada.' });
  const u = await lerUser(email);
  if (!u || !u.plano || u.plano.type !== 'mes' || !u.plano.preapprovalId) return res.status(400).json({ erro: 'Não há assinatura mensal para cancelar.' });
  await mp(`/preapproval/${encodeURIComponent(u.plano.preapprovalId)}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) });
  await atualizarAssinatura(u.plano.preapprovalId);
  const f = await lerUser(email);
  return res.status(200).json(resposta(f));
}

// Avisos do Mercado Pago: Pix (payment) e assinaturas (subscription_preapproval / subscription_authorized_payment)
async function webhook(req, res) {
  const q = req.query || {};
  const b = corpo(req);
  const tipo = String(b.type || b.topic || q.type || q.topic || '');
  const id = String((b.data && b.data.id) || q['data.id'] || q.id || '');
  if (!id || !temBanco()) return res.status(200).send('ok');
  try {
    if (tipo === 'payment') await processarPix(id);
    else if (tipo === 'subscription_preapproval' || tipo === 'preapproval') await atualizarAssinatura(id);
    else if (tipo === 'subscription_authorized_payment' || tipo === 'authorized_payment') {
      const ap = await mp(`/authorized_payments/${encodeURIComponent(id)}`);
      if (ap.preapproval_id) await atualizarAssinatura(ap.preapproval_id);
    }
  } catch (e) { console.error('jornada webhook', tipo, id, e.message); return res.status(500).send('erro'); }
  return res.status(200).send('ok');
}

// Agenda diária: avisa quem tem passe semanal terminando nas próximas 24 horas
async function diario(req, res) {
  const auth = req.headers.authorization || '';
  const ok = (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) ||
    (process.env.ADMIN_KEY && req.query.key === process.env.ADMIN_KEY) ||
    (!process.env.CRON_SECRET && /^vercel-cron\//.test(req.headers['user-agent'] || ''));
  if (!ok) return res.status(401).json({ erro: 'sem permissão' });
  const emails = (await redis('SMEMBERS', K.semana)) || [];
  const agora = Date.now();
  let avisados = 0, removidos = 0;
  for (const e of emails) {
    const u = await lerUser(e);
    if (!u || !u.plano || u.plano.type !== 'semana') { await redis('SREM', K.semana, e); removidos++; continue; }
    const fim = Number(u.plano.until);
    if (fim < agora) { await redis('SREM', K.semana, e); removidos++; continue; }
    if (fim - agora <= 30 * 3600e3 && u.perfil?.optin !== false) {
      try { await enviarEmail({ para: e, chave: `jornada-fim-${e}-${fim}`, ...emailFimPasse({ ...u, nome: u.perfil?.nome }) }); avisados++; } catch (x) { console.error('fim passe', x.message); }
    }
  }
  for (const e of (await redis('SMEMBERS', K.passes)) || []) {
    const u = await lerUser(e);
    const fim = Number(u?.passe?.until || 0);
    if (fim < agora) { await redis('SREM', K.passes, e); continue; }
    if (fim - agora <= 30 * 3600e3) {
      try { await enviarEmail({ para: e, chave: `passe-fim-${e}-${fim}`, ...emailFimPasseCeu(u) }); avisados++; } catch (x) { console.error('fim passe do céu', x.message); }
    }
  }
  return res.status(200).json({ ativos: emails.length, avisados, removidos });
}

async function sairEmails(req, res) {
  const email = lerToken(String(req.query.t || ''), 'x');
  res.setHeader('content-type', 'text/html; charset=utf-8');
  if (!email) return res.status(400).send(pagina('Link incompleto', 'Para parar de receber, escreva para falecom@eusouodu.com que a gente tira na hora.'));
  const u = await lerUser(email);
  if (u) { u.perfil = { ...(u.perfil || {}), optin: false }; await salvarUser(u); }
  return res.status(200).send(pagina('Pronto', 'Os e-mails da Jornada param por aqui. Os avisos de pagamento continuam chegando, porque fazem parte da compra. A jornada segue aberta no app.'));
}

// Diagnóstico protegido pela JORNADA_ADMIN_KEY (ou ADMIN_KEY): banco, Mercado Pago, e-mail e números
async function status(req, res) {
  const chave = String(req.query.key || '');
  const okChave = [process.env.JORNADA_ADMIN_KEY, process.env.ADMIN_KEY].some(k => k && chave === k);
  if (!okChave) return res.status(403).json({ erro: 'sem permissão' });
  const out = { banco: 'funcionando' };
  try { await mp('/users/me'); out.mercadoPago = 'funcionando'; } catch (e) { out.mercadoPago = 'erro: ' + e.message.slice(0, 120); }
  out.segredo = process.env.JORNADA_SECRET ? 'JORNADA_SECRET' : process.env.ADMIN_KEY ? 'usando ADMIN_KEY' : 'FALTANDO';
  out.cadastros = await redis('SCARD', K.leads);
  out.passesAtivos = await redis('SCARD', K.semana);
  return res.status(200).json(out);
}

/* ---------- Passe do céu ---------- */
const emailDe = req => String(corpo(req).email || '').trim().toLowerCase().slice(0, 254);

// Abre o pagamento do passe só com o e-mail. A conta nasce aqui; o link da central chega no e-mail depois do pagamento.
async function passeAssinar(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const email = emailDe(req);
  if (!okEmail(email)) return res.status(400).json({ erro: 'Confira o e-mail: falta algo como nome@email.com.' });
  if (!(await lerUser(email))) await salvarUser({ email, perfil: null, progresso: null, plano: null, criado: new Date().toISOString(), origem: 'passe' });
  const pref = {
    items: [{ id: 'passe-do-ceu', title: 'Passe do céu · 30 dias', quantity: 1, unit_price: PRECO_PASSE, currency_id: 'BRL' }],
    payer: { email },
    payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }], installments: 1 },
    metadata: { produto: 'jornada', plano: 'passe', email },
    back_urls: { success: `${SITE}/passe/?pago=1`, pending: `${SITE}/passe/?pago=pendente`, failure: `${SITE}/passe/?pago=falhou` },
    auto_return: 'approved',
    notification_url: `${SITE}/api/jornada?a=webhook`,
    statement_descriptor: 'EUSOUODU',
    external_reference: `passe:${Date.now()}`,
  };
  const j = await mp('/checkout/preferences', { method: 'POST', body: JSON.stringify(pref) });
  return res.status(200).json({ url: j.init_point });
}

async function passeLink(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const email = emailDe(req);
  if (!okEmail(email)) return res.status(400).json({ erro: 'Confira o e-mail: falta algo como nome@email.com.' });
  const u = await lerUser(email);
  if (u) { try { await enviarEmail({ para: email, ...emailEntradaPasse(u) }); } catch (e) { console.error('link passe', e.message); } }
  return res.status(200).json({ ok: true }); // mesma resposta exista ou não a conta
}

// Estado do passe: a central usa para desenhar a tela, e cada app usa (servidor a servidor) para saber se libera
async function passe(req, res) {
  const email = quem(req);
  if (!email) return res.status(401).json({ erro: 'Sessão expirada. Peça um link novo para entrar.' });
  const u = await lerUser(email);
  if (!u) return res.status(401).json({ erro: 'Conta não encontrada.' });
  const ativo = passeAtivo(u);
  const out = { email, ativo, nome: u.perfil?.nome || '', until: u.passe?.until || null, perfil: u.perfil || null, preco: PRECO_PASSE };
  if (ativo) {
    const rel = await redis('GET', K.passeRel(email, u.passe.ciclo));
    out.relatorio = { usado: !!rel, em: rel ? Number(rel) : null };
    out.usos = {};
    for (const [app, lim] of Object.entries(PASSE_LIMITES)) out.usos[app] = { usados: Number(await redis('GET', K.passeUso(app, email, periodoUso(u, app))) || 0), limite: lim.n, por: lim.por };
  }
  return res.status(200).json(out);
}

// Conta um uso de um app com limite (dir = 1) ou devolve quando o app falhou (dir = -1)
async function passeUsar(req, res, dir) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const app = String(corpo(req).app || '');
  const lim = PASSE_LIMITES[app];
  if (!lim) return res.status(400).json({ erro: 'app sem limite' });
  const email = quem(req);
  const u = email && await lerUser(email);
  if (!passeAtivo(u)) return res.status(402).json({ erro: 'O Passe do céu não está ativo.' });
  const k = K.passeUso(app, email, periodoUso(u, app));
  if (dir < 0) { const n = Number(await redis('DECR', k)); if (n < 0) await redis('SET', k, '0'); return res.status(200).json({ ok: true }); }
  const n = Number(await redis('INCR', k));
  if (n === 1) await redis('EXPIRE', k, 40 * 86400);
  if (n > lim.n) {
    await redis('DECR', k);
    const quando = lim.por === 'dia' ? 'amanhã' : 'quando você renovar o passe';
    return res.status(429).json({ erro: `O passe já usou os ${lim.n} ${app === 'sonhos' ? 'sonhos deste ciclo' : 'julgamentos de hoje'}. Libera de novo ${quando}.`, usados: lim.n, limite: lim.n });
  }
  return res.status(200).json({ ok: true, email, usados: n, limite: lim.n });
}

// Passe de presente (e para testar, já que o Mercado Pago não deixa pagar para a própria conta). Protegido pela ADMIN_KEY.
async function passeCortesia(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });
  const b = corpo(req);
  // na prévia, a chave de bypass da Vercel também vale, para testar sem a ADMIN_KEY de produção
  const chaves = [process.env.JORNADA_ADMIN_KEY, process.env.ADMIN_KEY, process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_AUTOMATION_BYPASS_SECRET];
  if (!chaves.some(k => k && String(b.key || '') === k)) return res.status(403).json({ erro: 'sem permissão' });
  const email = emailDe(req);
  if (!okEmail(email)) return res.status(400).json({ erro: 'Confira o e-mail.' });
  const u = (await lerUser(email)) || { email, perfil: null, progresso: null, plano: null, criado: new Date().toISOString(), origem: 'passe' };
  await ativarPasse(u, 'cortesia-' + Date.now(), 0);
  if (b.avisar !== false) { try { await enviarEmail({ para: email, ...emailPasseAtivo(u) }); } catch (e) { console.error('cortesia passe', e.message); } }
  return res.status(200).json({ ok: true, until: u.passe.until });
}
