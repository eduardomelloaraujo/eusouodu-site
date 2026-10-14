import { intervalo } from './astro.mjs';
// E-mail do relatório: HTML em tabelas (compatível com Gmail, Apple Mail e Outlook)
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const C = { tinta: '#333230', cinza: '#6F6B62', ouro: '#9C7A44', linha: '#E4E1D8', areia: '#F6F5F1' };
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const ENERGIA = {
  fluida: { txt: 'Energia mais fluida', cor: '#4F6F4B', fundo: '#EDF2EA' },
  mista: { txt: 'Energia mista', cor: '#7A6A45', fundo: '#F4F0E4' },
  desafiadora: { txt: 'Energia mais desafiadora', cor: '#8E4E3F', fundo: '#F6EAE6' },
};
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const curto = iso => { const [, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]}`; };

const p = (t, estilo = '') => t ? `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.tinta};${estilo}">${esc(t).replace(/\n+/g, '</p><p style="margin:0 0 14px;font-family:' + SANS + ';font-size:15px;line-height:1.65;color:' + C.tinta + ';' + estilo + '">')}</p>` : '';
const rotulo = t => `<p style="margin:0 0 8px;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.cinza};font-weight:600">${esc(t)}</p>`;
const titulo = (t, tam = 28) => `<h2 style="margin:0 0 14px;font-family:${SERIF};font-weight:400;font-size:${tam}px;line-height:1.15;color:${C.tinta}">${esc(t)}</h2>`;
const bloco = (conteudo, fundo = '#FFFFFF') => `<tr><td style="padding:28px 32px;background:${fundo};border-top:1px solid ${C.linha}">${conteudo}</td></tr>`;
const pergunta = t => t ? `<p style="margin:4px 0 0;font-family:${SERIF};font-style:italic;font-size:19px;line-height:1.35;color:${C.ouro}">${esc(t)}</p>` : '';

function ritmo(sem) {
  const cel = sem.dias.map(d => {
    const e = ENERGIA[d.energia] || ENERGIA.mista, top = sem.melhores.includes(d.data);
    return `<td align="center" style="padding:3px"><div style="background:${e.fundo};border:1px solid ${top ? C.ouro : e.fundo};padding:8px 2px;font-family:${SANS};font-size:11px;color:${e.cor};line-height:1.3">${esc(d.rotulo.split(',')[0].slice(0, 3))}<br><b style="font-size:14px">${+d.data.slice(8)}</b>${top ? `<br><span style="color:${C.ouro}">★</span>` : ''}</div></td>`;
  }).join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="table-layout:fixed;margin:6px 0 10px"><tr>${cel}</tr></table>
  <p style="margin:0;font-family:${SANS};font-size:12px;color:${C.cinza}"><span style="color:${ENERGIA.fluida.cor}">■</span> mais fluida &nbsp; <span style="color:${ENERGIA.mista.cor}">■</span> mista &nbsp; <span style="color:${ENERGIA.desafiadora.cor}">■</span> mais desafiadora &nbsp; <span style="color:${C.ouro}">★</span> dia de destaque</p>`;
}

function dia(d, destaque) {
  const e = ENERGIA[d.energia] || ENERGIA.mista;
  const item = (t, v) => v ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.tinta}"><b style="font-weight:600">${t}</b><br>${esc(v)}</p>` : '';
  return `<tr><td style="padding:24px 32px;border-top:1px solid ${C.linha}">
    <p style="margin:0 0 6px;font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${C.cinza}">${esc(d.rotulo)}</p>
    <h3 style="margin:0 0 10px;font-family:${SERIF};font-weight:400;font-size:24px;line-height:1.2;color:${C.tinta}">${esc(d.titulo || '')}</h3>
    <p style="margin:0 0 12px"><span style="display:inline-block;background:${e.fundo};color:${e.cor};font-family:${SANS};font-size:12px;padding:4px 10px">${e.txt}</span>${destaque ? ` <span style="display:inline-block;color:${C.ouro};font-family:${SANS};font-size:12px;padding:4px 6px">★ dia de destaque</span>` : ''} <span style="font-family:${SANS};font-size:12px;color:${C.cinza}">Lua em ${esc(d.lua?.signo)}, na casa ${esc(d.lua?.casaNatal)}</span></p>
    ${p(d.texto)}
    ${item('O que vale trabalhar', d.trabalhar)}
    ${item('Pontos fortes', d.fortes)}
    ${item('Pontos desafiadores', d.desafios)}
  </td></tr>`;
}

function semana(s, i, total) {
  const cab = `<tr><td style="padding:40px 32px 8px;background:${C.areia};border-top:1px solid ${C.linha}">
      ${rotulo(total > 1 ? `Semana ${i + 1} de ${total}` : 'Os próximos sete dias')}
      <h2 style="margin:0;font-family:${SERIF};font-weight:400;font-size:34px;line-height:1.1;color:${C.tinta}">${esc(s.rotulo)}</h2>
    </td></tr>`;
  const chave = bloco(`${rotulo(total > 1 ? 'A chave desta semana' : 'A chave central')}${titulo(s.chave?.titulo || '')}${p(s.chave?.texto)}`, C.areia);
  const carta = bloco(`${rotulo('A carta da semana · Tarot de Marselha')}${titulo(s.cartaNome, 24)}${p(s.cartaLeitura)}`);
  const luas = (s.lua || []).length ? bloco(`${rotulo('As fases da Lua')}${(s.lua || []).map((l, k) => {
    const f = (s.fases || [])[k];
    return `<p style="margin:0 0 4px;font-family:${SERIF};font-size:21px;color:${C.tinta}">${esc(l.fase)}${f ? ` <span style="font-family:${SANS};font-size:13px;color:${C.cinza}">· ${esc(f.rotulo)}, ${esc(f.hora)} · ${esc(f.signo)} · casa ${esc(f.casaNatal)}</span>` : ''}</p>${p(l.texto)}`;
  }).join('')}`) : '';
  const rit = bloco(`${rotulo('O ritmo da semana')}${ritmo(s)}`);
  const cor = s.cor ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 10px"><tr><td style="width:44px;height:44px;background:${/^#[0-9a-f]{6}$/i.test(s.cor.hex) ? s.cor.hex : C.ouro};border:1px solid ${C.linha}"></td><td style="padding-left:14px;font-family:${SERIF};font-size:24px;color:${C.tinta}">${esc(s.cor.nome)}</td></tr></table>${p(s.cor.texto)}${pergunta(s.cor.pergunta)}` : '';
  const inc = s.incenso ? `<p style="margin:0 0 8px;font-family:${SERIF};font-size:24px;color:${C.tinta}">${esc(s.incenso.nome)}</p>${p(s.incenso.texto)}${pergunta(s.incenso.pergunta)}` : '';
  const oleo = s.oleo ? `<p style="margin:0 0 8px;font-family:${SERIF};font-size:24px;color:${C.tinta}">${esc(s.oleo.nome)}</p>${p(s.oleo.texto)}${pergunta(s.oleo.pergunta)}${s.oleo.cuidado ? `<p style="margin:12px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${C.cinza}">Cuidado: ${esc(s.oleo.cuidado)}</p>` : ''}` : '';
  const sentidos = bloco(`${rotulo('A cor da semana')}${cor}`) + bloco(`${rotulo('O incenso da semana')}${inc}`) + bloco(`${rotulo('O óleo essencial da semana')}${oleo}`);
  const dias = `<tr><td style="padding:32px 32px 4px;border-top:1px solid ${C.linha}">${rotulo('Dia a dia')}</td></tr>` + s.dias.map(d => dia(d, s.melhores.includes(d.data))).join('');
  return cab + chave + carta + luas + rit + sentidos + dias;
}

export function montarEmail(rel) {
  const primeiro = (rel.pessoa.nome || '').trim().split(/\s+/)[0] || '';
  const titulo30 = rel.plano > 7;
  const nomeProduto = titulo30 ? 'O mês no seu mapa' : 'A semana no seu mapa';
  const n = rel.natal;
  const assunto = `${nomeProduto} · ${intervalo(rel.inicio, rel.fim)}`;
  const semanasHtml = rel.semanas.map((s, i) => semana(s, i, rel.semanas.length)).join('');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<title>${esc(assunto)}</title></head>
<body style="margin:0;padding:0;background:#FFFFFF">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFFFFF"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid ${C.linha};background:#FFFFFF">
  <tr><td style="padding:28px 32px 20px"><span style="font-family:${SERIF};font-size:28px;color:${C.tinta}">eu<i style="color:${C.ouro}">sou</i>odu</span></td></tr>
  <tr><td style="padding:24px 32px 32px;border-top:1px solid ${C.linha}">
    ${rotulo(nomeProduto)}
    <h1 style="margin:0 0 16px;font-family:${SERIF};font-weight:400;font-size:40px;line-height:1.08;color:${C.tinta}">${primeiro ? esc(primeiro) + ', o' : 'O'}s próximos ${rel.plano} dias no seu mapa</h1>
    <p style="margin:0 0 18px;font-family:${SERIF};font-size:22px;color:${C.ouro}">${esc(intervalo(rel.inicio, rel.fim))}</p>
    ${p(`Este relatório cruza os movimentos do céu nos próximos ${rel.plano} dias com o mapa de quem nasceu em ${rel.pessoa.cidade}, no dia ${rel.pessoa.data.split('-').reverse().join('/')}, às ${rel.pessoa.hora}. Cada trânsito foi calculado com efemérides astronômicas e lido pelas casas e pelos planetas desse mapa.`)}
    ${p(`Sol em ${n['Sol'].signo} na casa ${n['Sol'].casa}, Lua em ${n['Lua'].signo} na casa ${n['Lua'].casa}, Ascendente em ${n['Ascendente'].signo}.`, `color:${C.cinza};font-size:14px`)}
    ${p('O que vem a seguir é aconselhamento simbólico. Ele aponta tendências, tensões e convites, nunca destinos. Vale ler com respeito e com liberdade: cada decisão continua sendo pessoal e intransferível, e o mapa serve ao processo de quem o lê, não o contrário.', `font-family:${SERIF};font-style:italic;font-size:19px;line-height:1.45;color:${C.tinta}`)}
  </td></tr>
  ${semanasHtml}
  <tr><td style="padding:32px;background:#252421">
    <p style="margin:0 0 12px;font-family:${SERIF};font-style:italic;font-size:22px;line-height:1.35;color:#F2EFE2">O céu não decide nada. Ele só ilumina por onde a gente já está passando.</p>
    <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:#C9C4B4">Os horários estão em horário de Brasília. Dúvidas: falecom@eusouodu.com · <a href="https://eusouodu.com" style="color:#E4CF9F">eusouodu.com</a> · <a href="https://instagram.com/eusouodu" style="color:#E4CF9F">@eusouodu</a></p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  return { assunto, html };
}

// e-mail curto que acompanha o PDF
export function montarEmailCurto(rel) {
  const primeiro = (rel.pessoa.nome || '').trim().split(/\s+/)[0] || '';
  const nomeProduto = rel.plano > 7 ? 'O mês no seu mapa' : 'A semana no seu mapa';
  const assunto = `${nomeProduto} · ${intervalo(rel.inicio, rel.fim)}`;
  const s = rel.semanas[0];
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(assunto)}</title></head>
<body style="margin:0;padding:0;background:#FFFFFF">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid ${C.linha}">
  <tr><td style="padding:26px 30px 18px"><span style="font-family:${SERIF};font-size:26px;color:${C.tinta}">eu<i style="color:${C.ouro}">sou</i>odu</span></td></tr>
  <tr><td style="padding:24px 30px 30px;border-top:1px solid ${C.linha}">
    ${rotulo(nomeProduto)}
    <h1 style="margin:0 0 10px;font-family:${SERIF};font-weight:400;font-size:34px;line-height:1.1;color:${C.tinta}">${primeiro ? esc(primeiro) + ', o' : 'O'} seu relatório chegou</h1>
    <p style="margin:0 0 18px;font-family:${SERIF};font-size:20px;color:${C.ouro}">${esc(intervalo(rel.inicio, rel.fim))}</p>
    ${p('O relatório completo está no PDF em anexo: a chave do período, a carta do Tarot de Marselha, as fases da Lua no seu mapa, a cor, o incenso, o óleo essencial e a leitura de cada dia.')}
    ${s ? rotulo('O ritmo ' + (rel.semanas.length > 1 ? 'da primeira semana' : 'da semana')) + ritmo(s) : ''}
    ${s?.chave?.titulo ? `<p style="margin:18px 0 0;font-family:${SERIF};font-style:italic;font-size:21px;line-height:1.35;color:${C.tinta}">${esc(s.chave.titulo)}</p>` : ''}
  </td></tr>
  <tr><td style="padding:22px 30px;background:#252421">
    <p style="margin:0;font-family:${SANS};font-size:12.5px;line-height:1.6;color:#C9C4B4">Aconselhamento simbólico: tendências, nunca destinos. Dúvidas: falecom@eusouodu.com · <a href="https://eusouodu.com" style="color:#E4CF9F">eusouodu.com</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
  return { assunto, html };
}

export async function enviarEmail({ para, assunto, html, chave, anexos, copiaOculta }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.RESEND_API_KEY}`, ...(chave ? { 'Idempotency-Key': chave } : {}) },
    body: JSON.stringify({ from: process.env.FROM_EMAIL || 'Eduardo · eusouodu <leituras@eusouodu.com>', to: [para], reply_to: 'falecom@eusouodu.com', subject: assunto, html, ...(anexos ? { attachments: anexos } : {}), ...(copiaOculta ? { bcc: [copiaOculta] } : {}) }),
  });
  if (!r.ok) { const e = new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`); e.status = r.status; throw e; }
  return r.json();
}
