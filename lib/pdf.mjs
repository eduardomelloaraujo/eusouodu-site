// Relatório em PDF (A4), renderizado com Chromium no servidor
import { readFileSync } from 'node:fs';
import { intervalo } from './astro.mjs';

const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function fontes() {
  const f = (arq, fam, peso, estilo) => {
    const b = readFileSync(new URL(`./fontes/${arq}`, import.meta.url)).toString('base64');
    return `@font-face{font-family:'${fam}';font-weight:${peso};font-style:${estilo};src:url(data:font/woff2;base64,${b}) format('woff2')}`;
  };
  return [
    f('cormorant-garamond-latin-400-normal.woff2', 'CG', 400, 'normal'), f('cormorant-garamond-latin-400-italic.woff2', 'CG', 400, 'italic'),
    f('cormorant-garamond-latin-500-normal.woff2', 'CG', 500, 'normal'), f('cormorant-garamond-latin-500-italic.woff2', 'CG', 500, 'italic'),
    f('albert-sans-latin-300-normal.woff2', 'AS', 300, 'normal'), f('albert-sans-latin-400-normal.woff2', 'AS', 400, 'normal'), f('albert-sans-latin-500-normal.woff2', 'AS', 500, 'normal'),
  ].join('\n');
}

const ENERGIA = { fluida: ['Energia mais fluida', 'f'], mista: ['Energia mista', 'm'], desafiadora: ['Energia mais desafiadora', 'd'] };
const par = t => t ? String(t).split(/\n+/).map(x => `<p>${esc(x)}</p>`).join('') : '';

function semanaHtml(s, i, total) {
  const ESTRELA = '<svg class="st" viewBox="0 0 24 24" width="0.9em" height="0.9em" style="vertical-align:-0.1em;fill:currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
  const ritmo = s.dias.map(d => { const [, c] = ENERGIA[d.energia] || ENERGIA.mista; const top = s.melhores.includes(d.data); return `<div class="r ${c}${top ? ' top' : ''}"><span>${esc(d.rotulo.split(',')[0].slice(0, 3))}</span><b>${+d.data.slice(8)}</b>${top ? `<i>${ESTRELA}</i>` : ''}</div>`; }).join('');
  const luas = (s.lua || []).map((l, k) => { const f = (s.fases || [])[k]; return `<div class="lua"><h4>${esc(l.fase)}</h4>${f ? `<p class="meta">${esc(f.rotulo)}, ${esc(f.hora)} · ${esc(f.signo)} · casa ${esc(f.casaNatal)}</p>` : ''}${par(l.texto)}</div>`; }).join('');
  const hex = /^#[0-9a-f]{6}$/i.test(s.cor?.hex || '') ? s.cor.hex : '#9C7A44';
  const dias = s.dias.map(d => {
    const [rot, c] = ENERGIA[d.energia] || ENERGIA.mista; const top = s.melhores.includes(d.data);
    return `<section class="dia">
      <p class="sobre">${esc(d.rotulo)}</p>
      <h3>${esc(d.titulo || '')}</h3>
      <p class="tags"><span class="pill ${c}">${rot}</span>${top ? `<span class="estrela">${ESTRELA} dia de destaque</span>` : ''}<span class="meta">Lua em ${esc(d.lua?.signo)}, casa ${esc(d.lua?.casaNatal)}</span></p>
      ${par(d.texto)}
      <div class="tres">
        <div><h5>O que vale trabalhar</h5><p>${esc(d.trabalhar)}</p></div>
        <div><h5>Pontos fortes</h5><p>${esc(d.fortes)}</p></div>
        <div><h5>Pontos desafiadores</h5><p>${esc(d.desafios)}</p></div>
      </div>
    </section>`;
  }).join('');
  return `
  <section class="semana-capa">
    <p class="sobre">${total > 1 ? `Semana ${i + 1} de ${total}` : 'Os próximos sete dias'}</p>
    <h2>${esc(s.rotulo)}</h2>
    <div class="ritmo">${ritmo}</div>
    <p class="legenda"><span class="q f"></span>mais fluida <span class="q m"></span>mista <span class="q d"></span>mais desafiadora <span class="estrela">${ESTRELA}</span> dia de destaque</p>
  </section>
  <section class="bloco chave">
    <p class="sobre">${total > 1 ? 'A chave desta semana' : 'A chave central'}</p>
    <h2 class="t2">${esc(s.chave?.titulo || '')}</h2>
    ${par(s.chave?.texto)}
  </section>
  <section class="bloco carta">
    <div class="carta-img"><svg viewBox="0 0 60 96"><rect x=".5" y=".5" width="59" height="95" fill="#fff" stroke="#333230"/><rect x="5" y="5" width="50" height="86" fill="none" stroke="#9C7A44"/><circle cx="30" cy="40" r="11" fill="none" stroke="#9C7A44"/><path d="M18 74h24" stroke="#333230"/></svg></div>
    <div><p class="sobre">A carta da semana · Tarot de Marselha</p><h3>${esc(s.cartaNome)}</h3>${par(s.cartaLeitura)}</div>
  </section>
  ${luas ? `<section class="bloco"><p class="sobre">As fases da Lua</p>${luas}</section>` : ''}
  <section class="bloco sentidos">
    <div><p class="sobre">A cor</p><div class="cor"><span style="background:${hex}"></span><h3>${esc(s.cor?.nome)}</h3></div>${par(s.cor?.texto)}<p class="pergunta">${esc(s.cor?.pergunta)}</p></div>
    <div><p class="sobre">O incenso</p><h3>${esc(s.incenso?.nome)}</h3>${par(s.incenso?.texto)}<p class="pergunta">${esc(s.incenso?.pergunta)}</p></div>
    <div><p class="sobre">O óleo essencial</p><h3>${esc(s.oleo?.nome)}</h3>${par(s.oleo?.texto)}<p class="pergunta">${esc(s.oleo?.pergunta)}</p>${s.oleo?.cuidado ? `<p class="cuidado">Cuidado: ${esc(s.oleo.cuidado)}</p>` : ''}</div>
  </section>
  <p class="sobre dia-a-dia">Dia a dia</p>
  ${dias}`;
}

export function montarPdfHtml(rel) {
  const primeiro = (rel.pessoa.nome || '').trim().split(/\s+/)[0] || '';
  const produto = rel.plano > 7 ? 'O mês no seu mapa' : 'A semana no seu mapa';
  const n = rel.natal, data = rel.pessoa.data.split('-').reverse().join('/');
  const planetas = ['Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão'].filter(k => n[k]).map(k => `<tr><td>${k}</td><td>${esc(n[k].grau || '')} ${esc(n[k].signo)}</td><td>casa ${esc(n[k].casa)}</td></tr>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
${fontes()}
@page{size:A4;margin:22mm 20mm 20mm}
@page:first{margin:0}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:'AS',Helvetica,Arial,sans-serif;font-weight:300;font-size:10.5pt;line-height:1.62;color:#333230}
h1,h2,h3,h4{font-family:'CG',Georgia,serif;font-weight:400;margin:0;line-height:1.1}
p{margin:0 0 9pt}
.sobre{font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;font-weight:500;color:#6F6B62;margin-bottom:8pt}
.meta{font-size:8.5pt;color:#6F6B62}
.capa{height:297mm;padding:30mm 24mm 22mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;position:relative;overflow:hidden}
.capa .marca{font-family:'CG';font-size:22pt}.capa .marca i,.ouro{color:#9C7A44}
.capa h1{font-size:46pt;line-height:1.02;margin:10pt 0 12pt}
.capa h1 em{color:#9C7A44}
.capa .periodo{font-family:'CG';font-style:italic;font-size:20pt;color:#9C7A44}
.capa .orbita{position:absolute;right:-75mm;top:118mm;width:150mm;opacity:.9}
.capa .aviso{font-family:'CG';font-style:italic;font-size:14pt;line-height:1.4;max-width:120mm;border-top:1px solid #E4E1D8;padding-top:12pt}
.natal{width:100%;border-collapse:collapse;font-size:9pt;margin-top:6pt}
.natal td{padding:3pt 0;border-bottom:1px solid #EFECE4}
.natal td:first-child{font-family:'CG';font-size:12pt}
.colunas{display:flex;gap:16mm;align-items:flex-end}
.colunas>div{flex:1}
.semana-capa{page-break-before:always;padding-top:4mm}
.semana-capa h2{font-size:32pt;margin-bottom:14pt}
.ritmo{display:flex;gap:4pt;margin-bottom:6pt}
.r{flex:1;text-align:center;padding:7pt 0 6pt;font-size:8pt;line-height:1.25;border:1px solid transparent}
.r b{display:block;font-size:12pt;font-weight:500}.r i{font-style:normal;color:#9C7A44;display:block}
.f{background:#EDF2EA;color:#4F6F4B}.m{background:#F4F0E4;color:#7A6A45}.d{background:#F6EAE6;color:#8E4E3F}
.top{border-color:#9C7A44}
.legenda{font-size:8pt;color:#6F6B62}.q{display:inline-block;width:8pt;height:8pt;margin:0 3pt 0 8pt;vertical-align:-1pt}.legenda .q:first-child{margin-left:0}
.estrela{color:#9C7A44;font-size:8.5pt;margin:0 8pt}
.bloco{border-top:1px solid #E4E1D8;padding-top:12pt;margin-top:16pt;page-break-inside:avoid}
.chave{background:#F6F5F1;border:none;padding:16pt 18pt 8pt;margin-top:18pt}
.t2{font-size:22pt;margin-bottom:10pt}
.bloco h3{font-size:17pt;margin-bottom:7pt}
.carta{display:flex;gap:14pt}.carta-img svg{width:30mm}
.lua h4{font-size:15pt;margin-bottom:2pt}.lua{margin-bottom:8pt}
.sentidos{display:flex;gap:10mm}.sentidos>div{flex:1}
.cor{display:flex;align-items:center;gap:8pt;margin-bottom:6pt}.cor span{width:18pt;height:18pt;border:1px solid #E4E1D8;display:inline-block}.cor h3{margin:0}
.pergunta{font-family:'CG';font-style:italic;font-size:12.5pt;line-height:1.35;color:#9C7A44}
.cuidado{font-size:8pt;color:#6F6B62}
.dia-a-dia{margin-top:20pt;page-break-before:always}
.dia{border-top:1px solid #E4E1D8;padding:12pt 0 4pt;page-break-inside:avoid}
.dia h3{font-size:19pt;margin-bottom:6pt}
.tags{display:flex;align-items:center;flex-wrap:wrap;gap:4pt;margin-bottom:8pt}
.pill{font-size:8pt;padding:2pt 7pt}
.tres{display:flex;gap:7mm;margin-top:4pt}.tres>div{flex:1}
.tres h5{font-family:'AS';font-weight:500;font-size:8.5pt;margin:0 0 3pt}.tres p{font-size:9.5pt}
.fim{page-break-before:always;height:240mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:14pt}
.fim h2{font-size:26pt;max-width:120mm;font-style:italic}
</style></head><body>
<section class="capa">
  <svg class="orbita" viewBox="0 0 200 200"><g fill="none" stroke="#C9B48A" stroke-width=".5"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="70"/><ellipse cx="100" cy="100" rx="96" ry="30" transform="rotate(-18 100 100)"/><ellipse cx="100" cy="100" rx="96" ry="30" transform="rotate(62 100 100)"/></g><circle cx="100" cy="100" r="9" fill="#D9BC80"/><circle cx="8" cy="118" r="3" fill="#B08A48"/></svg>
  <div class="marca">eu<i>sou</i>odu</div>
  <div>
    <p class="sobre">${esc(produto)}</p>
    <h1>${primeiro ? esc(primeiro) + ',<br>' : ''}os próximos ${rel.plano} dias<br><em>no seu mapa</em></h1>
    <p class="periodo">${esc(intervalo(rel.inicio, rel.fim))}</p>
  </div>
  <div class="colunas">
    <div><p class="sobre">O mapa natal</p><p class="meta">${esc(rel.pessoa.cidade)}, ${data}, ${esc(rel.pessoa.hora)}</p>
      <table class="natal">${planetas}<tr><td>Ascendente</td><td>${esc(n['Ascendente']?.grau || '')} ${esc(n['Ascendente']?.signo)}</td><td></td></tr><tr><td>Meio do Céu</td><td>${esc(n['Meio do Céu']?.grau || '')} ${esc(n['Meio do Céu']?.signo)}</td><td></td></tr></table></div>
    <div><p class="aviso">Aconselhamento simbólico. Aponta tendências, tensões e convites, nunca destinos. Cada decisão continua sendo pessoal e intransferível.</p></div>
  </div>
</section>
${rel.semanas.map((s, i) => semanaHtml(s, i, rel.semanas.length)).join('')}
<section class="fim">
  <div class="marca" style="font-family:'CG';font-size:22pt">eu<i class="ouro">sou</i>odu</div>
  <h2>O céu não decide nada. Ele só ilumina por onde a gente já está passando.</h2>
  <p class="meta">Trânsitos calculados com efemérides astronômicas, zodíaco tropical, casas Placidus. Horários em horário de Brasília.<br>falecom@eusouodu.com · eusouodu.com · @eusouodu</p>
</section>
</body></html>`;
}

export async function gerarPdf(html) {
  const puppeteer = (await import('puppeteer-core')).default;
  let executablePath = process.env.CHROME_PATH, args = ['--no-sandbox'];
  if (!executablePath) {
    // na Vercel (Node 22) o pacote não reconhece o ambiente e não extrai as bibliotecas; isso força o modo certo
    if (!process.env.AWS_LAMBDA_JS_RUNTIME) process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs22.x';
    const chromium = (await import('@sparticuz/chromium')).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }
  const browser = await puppeteer.launch({ executablePath, args, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return Buffer.from(await page.pdf({
      format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;font-size:7px;color:#9a958a;font-family:Helvetica,Arial;padding:0 20mm;display:flex;justify-content:space-between"><span>eusouodu.com</span><span><span class="pageNumber"></span></span></div>',
    }));
  } finally { await browser.close(); }
}
