// Jornada (jornada.eusouodu.com): contas, progresso, planos e pagamentos.
// Banco: o mesmo Upstash Redis da Música Astral. E-mail: Resend. Pagamento: Mercado Pago.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { redis, temBanco } from './musica.mjs';
import { enviarEmail } from './email.mjs';

export { redis, temBanco, enviarEmail };

export const APP = process.env.JORNADA_URL || 'https://jornada.eusouodu.com';
export const SITE = process.env.SITE_URL || 'https://eusouodu.com';
export const PRECO_SEMANA = Number(process.env.JORNADA_PRECO_SEMANA || 9.9);
export const PRECO_MES = Number(process.env.JORNADA_PRECO_MES || 29.9);
const SEGREDO = () => process.env.JORNADA_SECRET || process.env.ADMIN_KEY || '';

export const K = {
  user: e => 'jornada:u:' + String(e).toLowerCase(),
  leads: 'jornada:leads',
  pago: id => 'jornada:pago:' + id,
  semana: 'jornada:semana-ativos',
};
export const okEmail = e => /^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$/.test(e);

/* ---------- tokens assinados ---------- */
const b64 = s => Buffer.from(s, 'utf8').toString('base64url');
const unb64 = s => Buffer.from(s, 'base64url').toString('utf8');
const assinar = txt => createHmac('sha256', SEGREDO()).update(txt).digest('base64url');
export function criarToken(email, tipo, dias) {
  const exp = Date.now() + dias * 864e5;
  const corpo = `${tipo}.${b64(String(email).toLowerCase())}.${exp}`;
  return `${corpo}.${assinar(corpo)}`;
}
export function lerToken(tk, tipo) {
  if (!tk || !SEGREDO()) return null;
  const p = String(tk).split('.');
  if (p.length !== 4 || p[0] !== tipo) return null;
  const corpo = p.slice(0, 3).join('.');
  const a = Buffer.from(assinar(corpo)), b = Buffer.from(p[3]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(p[2]) < Date.now()) return null;
  return unb64(p[1]);
}
export const sessao = email => criarToken(email, 's', 365);
export const linkEntrada = email => `${SITE}/api/jornada?a=abrir&t=${encodeURIComponent(criarToken(email, 'l', 2))}`;
export const linkSair = email => `${SITE}/api/jornada?a=sair-emails&t=${encodeURIComponent(criarToken(email, 'x', 3650))}`;

/* ---------- pessoas ---------- */
export async function lerUser(email) {
  const r = await redis('GET', K.user(email));
  return r ? JSON.parse(r) : null;
}
export async function salvarUser(u) {
  u.atualizado = new Date().toISOString();
  await redis('SET', K.user(u.email), JSON.stringify(u));
  return u;
}

/* ---------- planos ---------- */
export function planoAtivo(p, agora = Date.now()) {
  if (!p) return false;
  if (p.type === 'semana') return Number(p.until) > agora;
  if (p.type === 'mes') return (p.status === 'authorized' && !p.canceled) || Number(p.until) > agora;
  return false;
}
export function planoPublico(p) {
  if (!p) return null;
  return { type: p.type, until: p.until || null, canceled: !!p.canceled, status: p.status || null, ativo: planoAtivo(p) };
}

/* ---------- conteúdo pago (fica fora da pasta pública) ---------- */
let UNIDADES = null;
export function unidadesPagas() {
  if (UNIDADES) return UNIDADES;
  const raiz = new URL('./jornada/', import.meta.url);
  const nomes = ['touro', 'gemeos', 'cancer', 'leao', 'virgem', 'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes'];
  UNIDADES = nomes.map(n => JSON.parse(readFileSync(new URL(n + '.json', raiz), 'utf8')));
  return UNIDADES;
}

/* ---------- Mercado Pago ---------- */
export async function mp(caminho, opcoes = {}) {
  const r = await fetch('https://api.mercadopago.com' + caminho, {
    ...opcoes,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, ...(opcoes.headers || {}) },
  });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  if (!r.ok) { const e = new Error(`MP ${caminho} ${r.status}: ${t.slice(0, 300)}`); e.status = r.status; e.body = j; throw e; }
  return j;
}

// Lê a assinatura no Mercado Pago e atualiza o plano da pessoa
export async function atualizarAssinatura(preapprovalId) {
  const pa = await mp(`/preapproval/${encodeURIComponent(preapprovalId)}`);
  const email = String(pa.external_reference || '').toLowerCase();
  if (!email.startsWith('jornada:')) return { ignorado: 'outra assinatura' };
  const em = email.slice(8);
  const u = await lerUser(em);
  if (!u) return { ignorado: 'pessoa não encontrada' };
  const prox = pa.next_payment_date ? Date.parse(pa.next_payment_date) : null;
  const antes = u.plano || {};
  const novo = { type: 'mes', preapprovalId: pa.id, status: pa.status, since: antes.type === 'mes' && antes.since ? antes.since : Date.now() };
  if (pa.status === 'authorized') {
    novo.canceled = false;
    novo.until = prox ? prox + 2 * 864e5 : Date.now() + 33 * 864e5; // 2 dias de folga para a cobrança cair
  } else if (pa.status === 'cancelled' || pa.status === 'paused') {
    novo.canceled = true;
    novo.until = Math.max(Number(antes.until || 0), prox || 0) || Date.now();
  } else {
    // ainda pendente: não libera nada por conta própria
    novo.canceled = false;
    novo.until = antes.type === 'mes' ? Number(antes.until || 0) : 0;
  }
  // passe semanal ainda valendo: só troca quando o mensal estiver autorizado
  if (antes.type === 'semana' && Number(antes.until) > Date.now() && pa.status !== 'authorized') return { mantido: 'semana' };
  const primeira = antes.type !== 'mes' || antes.status !== 'authorized';
  u.plano = novo;
  await salvarUser(u);
  if (pa.status === 'authorized' && primeira) {
    try { await enviarEmail({ para: em, chave: `jornada-mes-${pa.id}`, ...emailAssinatura(u) }); } catch (e) { console.error('email assinatura', e.message); }
  }
  return { ok: true, email: em, status: pa.status };
}

// Pix do passe semanal aprovado: soma 7 dias (a partir de agora ou do fim do passe atual)
export async function processarPix(id) {
  const pg = await mp(`/v1/payments/${encodeURIComponent(id)}`);
  const md = pg.metadata || {};
  if (pg.preapproval_id || (pg.metadata && pg.metadata.preapproval_id)) return atualizarAssinatura(pg.preapproval_id || pg.metadata.preapproval_id);
  if (md.produto !== 'jornada') return { ignorado: 'outro produto' };
  if (pg.status !== 'approved') return { ignorado: pg.status };
  const ja = await redis('SET', K.pago(id), '1', 'NX', 'EX', 60 * 60 * 24 * 400);
  if (ja !== 'OK') return { jaProcessado: true };
  const email = String(md.email || '').toLowerCase();
  const u = await lerUser(email);
  if (!u) { console.error('pix sem pessoa', id, email); return { ignorado: 'pessoa não encontrada' }; }
  const agora = Date.now();
  const p = u.plano || {};
  if (p.type === 'mes' && planoAtivo(p)) {
    // já assina o mensal: guarda os 7 dias como crédito depois do fim do mês
    u.creditoDias = (u.creditoDias || 0) + 7;
  } else {
    const base = p.type === 'semana' && Number(p.until) > agora ? Number(p.until) : agora;
    u.plano = { type: 'semana', since: agora, until: base + 7 * 864e5, pagamento: String(id) };
    await redis('SADD', K.semana, email);
  }
  await salvarUser(u);
  try { await enviarEmail({ para: email, chave: `jornada-pix-${id}`, ...emailPasse(u) }); } catch (e) { console.error('email passe', e.message); }
  return { ok: true, email };
}

/* ---------- e-mails ---------- */
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const primeiro = u => (u.nome || '').trim().split(/\s+/)[0] || '';
export const dataHora = ms => new Date(ms).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).replace(' ', ' ');
export const dataCurta = ms => new Date(ms).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' });

function moldura({ rotulo, titulo, corpo, botao, link, email }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#FFF5E8">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF5E8"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:2.5px solid #1F1433;border-radius:22px">
<tr><td style="padding:26px 30px 6px;font-family:${SERIF};font-style:italic;font-weight:bold;font-size:30px;color:#1F1433">Jornada</td></tr>
<tr><td style="padding:6px 30px 0;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5A4B6E;font-weight:700">${esc(rotulo)}</td></tr>
<tr><td style="padding:8px 30px 0"><h1 style="margin:0;font-family:${SERIF};font-size:30px;line-height:1.15;color:#1F1433">${esc(titulo)}</h1></td></tr>
<tr><td style="padding:14px 30px 0;font-family:${SANS};font-size:15px;line-height:1.6;color:#1F1433">${corpo}</td></tr>
${botao ? `<tr><td style="padding:20px 30px 6px"><a href="${link}" style="display:inline-block;background:#FF4FAE;color:#1F1433;font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 22px;border:2.5px solid #1F1433;border-radius:14px">${esc(botao)}</a></td></tr>` : ''}
<tr><td style="padding:22px 30px 26px;font-family:${SANS};font-size:12px;line-height:1.6;color:#5A4B6E">Jornada · Astrologia, mito e filosofia · @eusouodu<br>Dúvidas: falecom@eusouodu.com${email ? ` · <a href="${linkSair(email)}" style="color:#5A4B6E">não receber mais e-mails</a>` : ''}</td></tr>
</table></td></tr></table></body></html>`;
}
export function emailBoasVindas(u) {
  return {
    assunto: 'A jornada começou',
    html: moldura({
      rotulo: 'Boas-vindas', titulo: `${primeiro(u) ? primeiro(u) + ', o' : 'O'} mapa está guardado`,
      corpo: `<p style="margin:0 0 12px">A jornada começa por Áries, o grau zero da roda. A subjornada inteira é grátis.</p><p style="margin:0">Para abrir a jornada em outro celular, sem senha, é só tocar no botão abaixo. Este link vale por 48 horas; depois, dá para pedir outro na tela de entrada.</p>`,
      botao: 'Abrir a jornada', link: linkEntrada(u.email), email: u.email,
    }),
  };
}
export function emailEntrada(u) {
  return {
    assunto: 'Link para entrar na Jornada',
    html: moldura({
      rotulo: 'Entrar sem senha', titulo: 'Um toque e a jornada abre',
      corpo: `<p style="margin:0">O link abre a jornada no ponto onde ela parou. Ele vale por 48 horas e só funciona para ${esc(u.email)}. Se não foi um pedido seu, é só ignorar este e-mail.</p>`,
      botao: 'Entrar na Jornada', link: linkEntrada(u.email),
    }),
  };
}
export function emailPasse(u) {
  return {
    assunto: 'Passe semanal ativo',
    html: moldura({
      rotulo: 'Pagamento confirmado', titulo: 'As doze subjornadas estão abertas',
      corpo: `<p style="margin:0 0 12px">Recebemos o Pix de R$ ${PRECO_SEMANA.toFixed(2).replace('.', ',')}. O acesso completo vale até <b>${esc(dataHora(u.plano.until))}</b> (horário de Brasília).</p><p style="margin:0">O passe não renova sozinho: nenhuma cobrança automática vai acontecer. No último dia, a gente avisa.</p>`,
      botao: 'Continuar a jornada', link: APP, email: u.email,
    }),
  };
}
export function emailAssinatura(u) {
  return {
    assunto: 'Assinatura mensal ativa',
    html: moldura({
      rotulo: 'Assinatura confirmada', titulo: 'A jornada inteira está aberta',
      corpo: `<p style="margin:0 0 12px">A assinatura mensal de R$ ${PRECO_MES.toFixed(2).replace('.', ',')} está ativa e renova automaticamente todo mês, no cartão cadastrado.</p><p style="margin:0">Para cancelar, é só abrir Meu plano dentro da Jornada, a qualquer momento, sem multa. O acesso continua até o fim do mês já pago.</p>`,
      botao: 'Continuar a jornada', link: APP, email: u.email,
    }),
  };
}
export function emailFimPasse(u) {
  return {
    assunto: 'O passe semanal termina amanhã',
    html: moldura({
      rotulo: 'Lembrete', titulo: 'O passe termina em menos de 24 horas',
      corpo: `<p style="margin:0 0 12px">O acesso completo vale até <b>${esc(dataHora(u.plano.until))}</b>. Depois, a jornada volta para a versão grátis, sem perder o progresso nem as cartas.</p><p style="margin:0">Para seguir, dá para pagar outro passe por Pix ou passar para o mensal.</p>`,
      botao: 'Ver os planos', link: APP + '/#planos', email: u.email,
    }),
  };
}
