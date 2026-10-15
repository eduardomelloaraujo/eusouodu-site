// E-mail da Música Astral: a música do dia de cada pessoa, com link de volta para o site.
import { assinatura } from './musica.mjs';

const SITE = process.env.SITE_URL || 'https://eusouodu.com';
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dataBonita = iso => { const [, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]}`; };

export function linkPerfil(perfil) {
  const p = { nome: perfil.nome, d: perfil.d, t: perfil.sem ? '' : perfil.t, sem: !!perfil.sem, city: perfil.city };
  const b64 = Buffer.from(JSON.stringify(p), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${SITE}/musica/?p=${b64}`;
}
export const linkSair = email => `${SITE}/api/musica-sair?e=${encodeURIComponent(email)}&s=${assinatura(email)}`;

export function montarEmail({ email, perfil, disco, dia, boasVindas }) {
  const B = disco.B;
  const assunto = boasVindas ? `A música de hoje: ${B[1]}` : `${dataBonita(dia)}: ${B[1]}`;
  const abrir = linkPerfil(perfil);
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F6F5F1">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F5F1"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E4E1D8">
<tr><td style="padding:28px 32px 8px;font-family:${SERIF};font-size:24px;color:#333230">eu<i style="color:#9C7A44">sou</i>odu</td></tr>
<tr><td style="padding:8px 32px 0;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9C7A44;font-weight:600">${boasVindas ? 'Música Astral · a primeira' : 'Música Astral · ' + esc(dataBonita(dia))}</td></tr>
<tr><td style="padding:10px 32px 0"><h1 style="margin:0;font-family:${SERIF};font-weight:400;font-size:40px;line-height:1.05;color:#333230">${esc(B[1])}</h1>
<p style="margin:6px 0 0;font-family:${SANS};font-size:15px;color:#6F6B62">${esc(B[2])}</p></td></tr>
<tr><td style="padding:22px 32px 0"><div style="border-left:2px solid #9C7A44;padding:2px 0 2px 14px;font-family:${SERIF};font-size:20px;line-height:1.45;color:#333230">
<p style="margin:0 0 8px">${esc(disco.l1)}</p><p style="margin:0">${esc(disco.l2)}</p></div></td></tr>
<tr><td style="padding:16px 32px 0;font-family:${SANS};font-size:14px;color:#6F6B62">O que ela carrega: ${esc(B[4])}.</td></tr>
<tr><td style="padding:26px 32px 8px"><a href="${abrir}" style="display:inline-block;background:#252421;color:#F2EFE2;font-family:${SANS};font-size:15px;font-weight:600;text-decoration:none;padding:14px 22px;border-radius:999px">Ouvir e ler o tom da música</a></td></tr>
<tr><td style="padding:4px 32px 28px;font-family:${SANS};font-size:13px;color:#6F6B62">No site o disco gira, a música toca e a leitura do tom explica por que ela é a de hoje.</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #E4E1D8;font-family:${SANS};font-size:12px;line-height:1.6;color:#6F6B62">
Este e-mail chega porque a música do dia foi pedida em eusouodu.com/musica.<br>
<a href="${linkSair(email)}" style="color:#6F6B62">Parar de receber</a> · <a href="https://instagram.com/eusouodu" style="color:#6F6B62">@eusouodu</a></td></tr>
</table></td></tr></table></body></html>`;
  return { assunto, html };
}

const DE = () => process.env.FROM_EMAIL || 'Eduardo · eusouodu <leituras@eusouodu.com>';
const cabecalhos = email => ({ 'List-Unsubscribe': `<${linkSair(email)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });

export async function enviarUm({ email, assunto, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: DE(), to: [email], reply_to: 'falecom@eusouodu.com', subject: assunto, html, headers: cabecalhos(email) }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

// Até 100 por chamada, como o Resend permite no envio em lote
export async function enviarLote(msgs, chaveDia) {
  let enviados = 0;
  for (let i = 0; i < msgs.length; i += 100) {
    const parte = msgs.slice(i, i + 100);
    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Idempotency-Key': `musica-${chaveDia}-${i}` },
      body: JSON.stringify(parte.map(m => ({ from: DE(), to: [m.email], reply_to: 'falecom@eusouodu.com', subject: m.assunto, html: m.html, headers: cabecalhos(m.email) }))),
    });
    if (!r.ok) { console.error('musica lote', i, r.status, (await r.text()).slice(0, 300)); continue; }
    enviados += parte.length;
  }
  return enviados;
}
