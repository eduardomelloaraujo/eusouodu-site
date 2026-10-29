// O seu mapa fala: a roda do mapa natal em que cada planeta, ponto, aspecto e casa explica a si mesmo em voz alta.
(function () {
  const $ = id => document.getElementById(id);
  // a mesma página em inglês (/reading): o idioma vem do <html lang>
  const EN = document.documentElement.lang === 'en';
  const L = (pt, en) => EN ? en : pt;
  const API = '/api/leitura?' + (EN ? 'lang=en&' : '') + 'a=';
  const CHAVE = EN ? 'reading-s' : 'leitura-s';
  const UF = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  const guardar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const lerLocal = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = '︎'; // força o símbolo como texto (sem virar emoji no iPhone)
  const GLIFO = { sol: '☉', lua: '☽', merc: '☿', venus: '♀', marte: '♂', jupiter: '♃', saturno: '♄', urano: '♅', netuno: '♆', plutao: '♇', nn: '☊', ns: '☋', fortuna: '⊗', asc: 'AC', mc: 'MC', fc: 'FC', dc: 'DC' };
  const SIGNOS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const ELEM = ['#FF8A5B', '#A8D88E', '#9DB8FF', '#6FD3E0']; // fogo, terra, ar, água
  const PCOR = { sol: '#FFC75A', lua: '#E6E9F2', merc: '#7FE0D0', venus: '#FF9EC4', marte: '#FF6B5A', jupiter: '#FFB06A', saturno: '#D9C49A', urano: '#7FD8FF', netuno: '#7FA8FF', plutao: '#C08AFF', nn: '#B9A6FF', ns: '#9A93B8', fortuna: '#FFE2A0', asc: '#FFE2A0', mc: '#FFE2A0', fc: '#FFE2A0', dc: '#FFE2A0' };
  const COR_ASP = { conjuncao: '#FFE2A0', sextil: '#8AB4FF', trigono: '#7FE8A8', quadratura: '#FF7A6B', oposicao: '#FF9A5C' };
  const GLIFO_ASP = { conjuncao: '☌', sextil: '⚹', quadratura: '□', trigono: '△', oposicao: '☍' };
  const NOME_CURTO = EN ? { sol: 'Sun', lua: 'Moon', merc: 'Mercury', venus: 'Venus', marte: 'Mars', jupiter: 'Jupiter', saturno: 'Saturn', urano: 'Uranus', netuno: 'Neptune', plutao: 'Pluto', nn: 'North Node', ns: 'South Node', fortuna: 'Part of Fortune', asc: 'Ascendant', mc: 'Midheaven', fc: 'Imum Coeli', dc: 'Descendant' } : { sol: 'Sol', lua: 'Lua', merc: 'Mercúrio', venus: 'Vênus', marte: 'Marte', jupiter: 'Júpiter', saturno: 'Saturno', urano: 'Urano', netuno: 'Netuno', plutao: 'Plutão', nn: 'Nodo Norte', ns: 'Nodo Sul', fortuna: 'Roda da Fortuna', asc: 'Ascendente', mc: 'Meio do Céu', fc: 'Fundo do Céu', dc: 'Descendente' };

  // o zodíaco gigante que gira devagar atrás da entrada
  (function fundo() {
    const svg = $('zodiacoFundo'); if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg', p = (a, r) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];
    let h = '<circle r="300" fill="none" stroke="rgba(245,243,238,.10)"/><circle r="250" fill="none" stroke="rgba(245,243,238,.10)"/><circle r="120" fill="none" stroke="rgba(245,243,238,.06)"/>';
    let ticks = '';
    for (let d = 0; d < 360; d += 2) { const l = d % 30 === 0 ? 50 : d % 10 === 0 ? 12 : 6, [a, b] = p(d, 300), [c, e] = p(d, 300 - l); ticks += `M${a.toFixed(1)},${b.toFixed(1)}L${c.toFixed(1)},${e.toFixed(1)}`; }
    h += `<path d="${ticks}" stroke="rgba(245,243,238,.16)" stroke-width=".8"/>`;
    for (let i = 0; i < 12; i++) { const [x, y] = p(i * 30 + 15, 275); h += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${ELEM[i % 4]}" fill-opacity=".55" font-size="22" text-anchor="middle" dominant-baseline="central">${SIGNOS[i]}${T}</text>`; }
    for (let i = 0; i < 6; i++) { const [a, b] = p(i * 30, 250), [c, e] = p(i * 30 + 180, 250); h += `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="rgba(245,243,238,.05)"/>`; }
    svg.setAttribute('viewBox', '-310 -310 620 620'); svg.innerHTML = h;
  })();

  let S = null;          // { mapa, indice, textos, preco?, pessoa? }
  let pessoa = null;     // dados de nascimento (amostra grátis)
  let sessao = null, atual = null;

  /* ---------- entrada ---------- */
  const m = location.hash.match(/(?:^#|&)s=([^&]+)/);
  if (m) { guardar(CHAVE, decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + location.search); }
  sessao = lerLocal(CHAVE);
  const pago = new URLSearchParams(location.search).get('pago');
  const avisar = t => { $('avisoEntrada').textContent = t; $('avisoEntrada').hidden = !t; };
  if (pago === '1') avisar(L('Pagamento recebido. O link do seu mapa completo chegou no seu e-mail. Se não aparecer em alguns minutos, olhe o spam ou peça de novo em "Já comprei".', 'Payment received. The link to your full chart is in your e-mail. If it does not show up in a few minutes, check spam or ask again under "I already bought".'));
  if (pago === 'pendente') avisar(L('O pagamento ainda está sendo confirmado. Quando o Mercado Pago aprovar, o link chega no seu e-mail.', 'Your payment is still being confirmed. When it is approved, the link arrives in your e-mail.'));
  if (pago === 'falhou') avisar(L('O pagamento não foi concluído. Os dados continuam aqui, é só tentar de novo.', 'The payment was not completed. Your details are still here, just try again.'));

  // cidade: a mesma busca do /mapa
  let escolha = null, t = null;
  const cidade = $('cidade'), box = $('sugestoes');
  const fechar = () => { box.hidden = true; box.innerHTML = ''; };
  cidade.addEventListener('input', () => {
    escolha = null; $('cidadeOk').textContent = L('A cidade define o fuso e a posição exata das casas.', 'The city sets the time zone and the exact position of the houses.');
    clearTimeout(t); let q = cidade.value.trim(), filtro = '';
    // em inglês, "Springfield, OR" ou "Springfield, Oregon" filtra pelo estado (ou país): há dezenas de cidades com o mesmo nome
    if (EN && q.includes(',')) { [q, filtro] = q.split(/,(.*)/).map(x => (x || '').trim()); filtro = (UF[filtro.toUpperCase()] || filtro).toLowerCase(); }
    if (q.length < 3) return fechar();
    t = setTimeout(async () => {
      try {
        const j = await (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=' + (filtro ? 100 : 7) + '&language=' + (EN ? 'en' : 'pt') + '&format=json&name=' + encodeURIComponent(q))).json();
        let res = j.results || [];
        if (filtro) res = res.filter(c => [c.admin1, c.country, c.country_code].some(v => v && v.toLowerCase().startsWith(filtro))).slice(0, 10);
        if (!res.length) { box.innerHTML = L('<button type="button" disabled>Nenhuma cidade encontrada</button>', '<button type="button" disabled>No city found</button>'); box.hidden = false; return; }
        box.innerHTML = res.map((c, i) => `<button type="button" data-i="${i}">${esc(c.name)}<small> · ${esc([c.admin1, c.country].filter(Boolean).join(', '))}</small></button>`).join('');
        box.hidden = false;
        box.querySelectorAll('button[data-i]').forEach(b => b.addEventListener('click', () => {
          const c = res[+b.dataset.i];
          escolha = { rotulo: [c.name, c.admin1, c.country].filter(Boolean).join(', '), lat: c.latitude, lon: c.longitude, tz: c.timezone };
          cidade.value = escolha.rotulo; $('cidadeOk').textContent = L('Cidade escolhida: ', 'City chosen: ') + escolha.rotulo; fechar();
        }));
      } catch (e) { $('cidadeOk').textContent = L('Não foi possível buscar a cidade agora. Tente de novo.', 'Could not search for the city right now. Try again.'); }
    }, 300);
  });
  document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== cidade) fechar(); });
  cidade.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { const b = box.querySelector('button[data-i]'); if (b) { e.preventDefault(); b.focus(); } } if (e.key === 'Escape') fechar(); });
  box.addEventListener('keydown', e => { const bs = [...box.querySelectorAll('button[data-i]')], i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown' && bs[i + 1]) { e.preventDefault(); bs[i + 1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); (bs[i - 1] || cidade).focus(); } if (e.key === 'Escape') { fechar(); cidade.focus(); } });

  try { const sv = JSON.parse(sessionStorage.getItem('leitura-form') || 'null'); if (sv) { for (const k of ['nome', 'data', 'hora']) $(k).value = sv[k] || ''; if (sv.escolha) { escolha = sv.escolha; cidade.value = escolha.rotulo; $('cidadeOk').textContent = L('Cidade escolhida: ', 'City chosen: ') + escolha.rotulo; } } } catch (e) {}

  async function post(acao, corpo) {
    const r = await fetch(API + acao, { method: 'POST', headers: { 'content-type': 'application/json', ...(sessao ? { authorization: 'Bearer ' + sessao } : {}) }, body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.erro || L('Algo falhou. Tente de novo.', 'Something went wrong. Try again.')); e.status = r.status; throw e; }
    return j;
  }

  $('fMapa').addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('eMapa'); erro.textContent = '';
    const d = { nome: $('nome').value.trim(), data: $('data').value, hora: $('hora').value };
    if (d.nome.length < 2) return erro.textContent = L('Informe o nome.', 'Enter your name.');
    if (!d.data) return erro.textContent = L('Informe a data de nascimento.', 'Enter the date of birth.');
    if (!d.hora) return erro.textContent = L('Informe a hora de nascimento. Sem ela não dá para calcular as casas.', 'Enter the time of birth. Without it the houses cannot be calculated.');
    if (!escolha) return erro.textContent = L('Escolha a cidade de nascimento na lista que aparece ao digitar.', 'Choose the city of birth from the list that appears as you type.');
    try { sessionStorage.setItem('leitura-form', JSON.stringify({ ...d, escolha })); } catch (e) {}
    const bt = $('bMapa'); bt.disabled = true; bt.textContent = L('Calculando o céu…', 'Calculating the sky…');
    try {
      pessoa = { ...d, cidade: escolha.rotulo, lat: escolha.lat, lon: escolha.lon, tz: escolha.tz };
      S = await post('mapa', pessoa);
      abrir();
    } catch (err) { erro.textContent = err.message; }
    bt.disabled = false; bt.textContent = L('Abrir o meu mapa', 'Open my chart');
  });

  $('jaComprei').addEventListener('click', () => { $('fLink').hidden = false; $('emailLink').focus(); });
  $('fLink').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('emailLink').value.trim(), erro = $('eLink');
    if (!okEmail(email)) return erro.textContent = L('Confira o e-mail.', 'Check the e-mail.');
    $('bLink').disabled = true;
    try { await post('link', { email }); erro.textContent = L(`Se ${email} tem a leitura ativa, o link acabou de chegar lá.`, `If ${email} has an active reading, the link just arrived there.`); } catch (err) { erro.textContent = err.message; }
    $('bLink').disabled = false;
  });

  async function entrarComSessao() {
    const r = await fetch(API + 'meu', { headers: { authorization: 'Bearer ' + sessao } }).catch(() => null);
    if (!r || r.status === 401) { guardar(CHAVE, null); sessao = null; if (r) avisar(L('O acesso terminou ou o link não vale mais. Peça um novo em "Já comprei".', 'Your access has ended or the link is no longer valid. Ask for a new one under "I already bought".')); return; }
    S = await r.json();
    abrir();
  }

  /* ---------- a roda ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, at, pai) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); if (pai) pai.appendChild(n); return n; };
  let asc = 0;
  // ascendente à esquerda, longitudes crescendo no sentido anti-horário
  const xy = (lon, r) => { const a = (lon - asc) * Math.PI / 180; return [-r * Math.cos(a), r * Math.sin(a)]; };
  const arco = (l1, l2, r1, r2) => {
    const larg = ((l2 - l1) % 360 + 360) % 360, g = larg > 180 ? 1 : 0;
    const [a, b] = xy(l1, r2), [c, d] = xy(l2, r2), [e, f] = xy(l2, r1), [g2, h] = xy(l1, r1);
    return `M${a},${b} A${r2},${r2} 0 ${g} 0 ${c},${d} L${e},${f} A${r1},${r1} 0 ${g} 1 ${g2},${h} Z`;
  };

  function desenhar() {
    const svg = $('roda'), M = S.mapa; svg.innerHTML = '';
    asc = M.pts.asc.lon;
    const defs = el('defs', {}, svg);
    defs.innerHTML = `
      <radialGradient id="gFundo"><stop offset="0" stop-color="#1A1630"/><stop offset=".55" stop-color="#0C0D1A"/><stop offset="1" stop-color="#06070C"/></radialGradient>
      <radialGradient id="gMiolo"><stop offset="0" stop-color="#B9A6FF" stop-opacity=".22"/><stop offset="1" stop-color="#B9A6FF" stop-opacity="0"/></radialGradient>
      <filter id="brilho" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="brilhoFraco" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    const camada = n => el('g', { class: 'camada ' + n }, svg);
    const cFundo = camada('c-fundo'), cZod = camada('c-zod'), cCasas = camada('c-casas'), cLinhas = camada('c-linhas'), cAsp = camada('c-asp'), cAstros = camada('c-astros');

    // o disco do céu
    el('circle', { r: 300, fill: 'url(#gFundo)' }, cFundo);
    el('circle', { r: 118, fill: 'url(#gMiolo)' }, cFundo);
    for (const r of [300, 284, 246, 120]) el('circle', { r, fill: 'none', stroke: r === 246 || r === 284 ? 'rgba(245,243,238,.22)' : 'rgba(245,243,238,.12)' }, cFundo);
    // régua dos graus: um traço por grau, maior a cada 5° e a cada 10°
    let reg = '';
    for (let d = 0; d < 360; d++) { const l = d % 10 === 0 ? 9 : d % 5 === 0 ? 6 : 3, [x1, y1] = xy(d, 284), [x2, y2] = xy(d, 284 - l); reg += `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`; }
    el('path', { d: reg, stroke: 'rgba(245,243,238,.28)', 'stroke-width': .7 }, cFundo);

    // signos: faixa externa, na cor do elemento
    for (let i = 0; i < 12; i++) {
      const g = el('g', { class: 'signo' }, cZod), cor = ELEM[i % 4];
      el('path', { d: arco(i * 30, i * 30 + 30, 284, 300), fill: cor, 'fill-opacity': .1 }, g);
      const [a, b] = xy(i * 30, 246), [c, d] = xy(i * 30, 300);
      el('line', { x1: a, y1: b, x2: c, y2: d, stroke: 'rgba(245,243,238,.18)' }, g);
      const [x, y] = xy(i * 30 + 15, 265);
      el('text', { x, y, fill: cor, filter: 'url(#brilhoFraco)' }, g).textContent = SIGNOS[i] + T;
    }

    // casas
    const C = M.cuspides;
    for (let h = 0; h < 12; h++) {
      const id = 'casa' + (h + 1), g = el('g', { class: 'alvo casa', tabindex: 0, role: 'button', 'data-id': id, 'aria-label': S.textos[id].titulo }, cCasas);
      el('path', { d: arco(C[h], C[(h + 1) % 12], 120, 246), 'fill-opacity': h % 2 ? .0 : .025, fill: '#F5F3EE' }, g);
      const meio = C[h] + (((C[(h + 1) % 12] - C[h]) % 360 + 360) % 360) / 2, [x, y] = xy(meio, 132);
      el('text', { x, y }, g).textContent = h + 1;
      if (h % 3) { const [x1, y1] = xy(C[h], 120), [x2, y2] = xy(C[h], 246); el('line', { x1, y1, x2, y2, stroke: 'rgba(245,243,238,.16)', 'pointer-events': 'none' }, cCasas); }
    }

    // a cruz do mapa: horizonte (AC–DC) e meridiano (MC–FC) atravessam o céu inteiro
    const eixo = (l1, l2, cls) => { const [x1, y1] = xy(l1, 300), [x2, y2] = xy(l2, 300); el('line', { class: 'eixo ' + cls, x1, y1, x2, y2 }, cLinhas); };
    eixo(M.pts.asc.lon, M.pts.dc.lon, 'horizonte'); eixo(M.pts.mc.lon, M.pts.fc.lon, 'meridiano');
    // o raio do Sol: do centro até o Sol, como o ponteiro de um relógio de sol
    { const [x, y] = xy(M.pts.sol.lon, 246); el('line', { class: 'raio-sol', x1: 0, y1: 0, x2: x, y2: y }, cLinhas); }
    el('line', { class: 'raio-ativo', id: 'raio', x1: 0, y1: 0, x2: 0, y2: 0 }, cLinhas);

    // aspectos
    for (const id of S.indice.aspectos) {
      const [a, b, tp] = id.split('-');
      if (tp === 'conjuncao') continue; // a conjunção é um encontro no mesmo lugar: aparece nas fichas
      const g = el('g', { class: 'alvo aspecto', tabindex: 0, role: 'button', 'data-id': id, 'data-a': a, 'data-b': b, 'aria-label': S.textos[id].titulo }, cAsp);
      const [x1, y1] = xy(M.pts[a].lon, 118), [x2, y2] = xy(M.pts[b].lon, 118), len = Math.hypot(x2 - x1, y2 - y1);
      el('line', { class: 'ver', x1, y1, x2, y2, stroke: COR_ASP[tp], 'stroke-dasharray': tp === 'sextil' ? '3 5' : `${len} ${len}`, style: `--len:${len}` }, g);
      el('line', { class: 'toque', x1, y1, x2, y2 }, g);
    }

    // o medalhão do centro: quem foi tocado aparece aqui, e pulsa com a voz
    const mi = el('g', { id: 'miolo', 'pointer-events': 'none' }, cAsp);
    el('circle', { class: 'm-halo', r: 62, filter: 'url(#brilho)' }, mi);
    el('circle', { class: 'm-disco', r: 46 }, mi);
    el('circle', { class: 'm-aro', r: 52 }, mi);
    el('text', { class: 'm-glifo', id: 'mGlifo', y: -7 }, mi);
    el('text', { class: 'm-rot', id: 'mRot', y: 25 }, mi);
    // planetas e pontos, abertos em leque quando se amontoam
    const ids = [...S.indice.planetas, 'nn', 'ns', 'fortuna'];
    const MIN = 10, pos = ids.map(id => ({ id, lon: M.pts[id].lon })).sort((p, q) => p.lon - q.lon);
    // começa a volta no maior vão, para nenhum grupo ficar partido no 0° de Áries
    let corte = 0, vao = -1;
    pos.forEach((p, i) => { const q = pos[(i + 1) % pos.length], d = ((q.lon - p.lon) % 360 + 360) % 360; if (d > vao) { vao = d; corte = (i + 1) % pos.length; } });
    const fila = [...pos.slice(corte), ...pos.slice(0, corte)];
    let base = fila[0].lon; fila.forEach(p => { while (p.lon < base) p.lon += 360; base = p.lon; p.v = p.lon; });
    // grupos apertados se abrem em leque, centrados na posição média; repete até ninguém encostar
    for (let k = 0; k < 20; k++) {
      let mexeu = false, i = 0;
      while (i < fila.length) {
        // quem já está em leque (vão igual a MIN) continua no mesmo grupo
        let j = i, aperta = false;
        while (j + 1 < fila.length && fila[j + 1].v - fila[j].v < MIN + 1e-6) { if (fila[j + 1].v - fila[j].v < MIN - 1e-6) aperta = true; j++; }
        if (aperta) {
          const meio = fila.slice(i, j + 1).reduce((s, p) => s + p.lon, 0) / (j - i + 1);
          for (let n = i; n <= j; n++) fila[n].v = meio + (n - i - (j - i) / 2) * MIN;
          mexeu = true;
        }
        i = j + 1;
      }
      if (!mexeu) break;
    }
    fila.forEach((p, n) => {
      const cor = PCOR[p.id], [tx, ty] = xy(p.lon, 246), [tx2, ty2] = xy(p.lon, 234);
      el('line', { x1: tx, y1: ty, x2: tx2, y2: ty2, stroke: cor, 'stroke-width': 1.4, 'pointer-events': 'none' }, cAstros);
      el('circle', { cx: tx, cy: ty, r: 1.8, fill: cor, 'pointer-events': 'none' }, cAstros);
      const [x, y] = xy(p.v, 206), tx3 = S.textos[p.id], gi = tx3.grau;
      const g = el('g', { class: 'alvo astro' + (tx3.fechado ? ' fechado' : ''), tabindex: 0, role: 'button', 'data-id': p.id, 'aria-label': tx3.titulo + (tx3.fechado ? L(', fechado', ', locked') : ''), style: `--pc:${cor};--atraso:${(n * 45)}ms` }, cAstros);
      el('circle', { class: 'halo', cx: x, cy: y, r: 24, filter: 'url(#brilho)' }, g);
      el('circle', { class: 'fundo', cx: x, cy: y, r: 16 }, g);
      el('text', { x, y, class: 'glifo' }, g).textContent = GLIFO[p.id] + T;
      const [gx, gy] = xy(p.v, 176);
      el('text', { x: gx, y: gy, class: 'grau' }, g).textContent = Math.floor(M.pts[p.id].lon % 30) + '°' + (M.pts[p.id].retro ? ' ℞' : '');
    });
    // os quatro ângulos nas pontas da cruz
    for (const id of ['asc', 'mc', 'fc', 'dc']) {
      const [x, y] = xy(M.pts[id].lon, 312);
      const g = el('g', { class: 'alvo astro angulo' + (S.textos[id].fechado ? ' fechado' : ''), tabindex: 0, role: 'button', 'data-id': id, 'aria-label': S.textos[id].titulo, style: '--pc:#FFE2A0' }, cAstros);
      el('circle', { class: 'halo', cx: x, cy: y, r: 20, filter: 'url(#brilho)' }, g);
      el('circle', { class: 'fundo', cx: x, cy: y, r: 15 }, g);
      el('text', { x, y, class: 'glifo sigla' }, g).textContent = GLIFO[id];
    }
    svg.classList.remove('entrou'); void svg.getBoundingClientRect(); svg.classList.add('entrou');
    svg.querySelectorAll('.alvo').forEach(g => {
      g.addEventListener('click', () => escolher(g.dataset.id, true));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(g.dataset.id, true); } });
    });
  }

  // o ponto escolhido ganha um raio do centro, e só as linhas dele ficam acesas
  function destacar(id) {
    const svg = $('roda'), M = S.mapa, raio = $('raio');
    const lon = M.pts[id] ? M.pts[id].lon : null;
    if (lon != null) { const [x, y] = xy(lon, 246); raio.setAttribute('x2', x); raio.setAttribute('y2', y); raio.style.stroke = PCOR[id] || '#FFE2A0'; raio.style.opacity = 1; }
    else raio.style.opacity = 0;
    const tp = id.split('-')[2], tx = S.textos[id];
    // medalhão
    $('miolo').style.setProperty('--mc', PCOR[id] || PCOR[id.split('-')[0]] || '#B9A6FF');
    $('mGlifo').textContent = id.startsWith('casa') ? id.slice(4) : tp ? GLIFO_ASP[tp] + T : GLIFO[id].length < 2 ? GLIFO[id] + T : GLIFO[id];
    $('mGlifo').classList.toggle('sigla', /^(asc|mc|fc|dc)$/.test(id) || id.startsWith('casa'));
    $('mRot').textContent = tx && tx.grau ? `${tx.grau.grau}°${String(tx.grau.minuto).padStart(2, '0')}'` : tp ? tx.sub.split(' · ')[0] : '';
    svg.classList.toggle('foco', !!(lon != null && !id.startsWith('casa')) || !!tp);
    svg.querySelectorAll('.aspecto').forEach(g => g.classList.toggle('ligado', g.dataset.id === id || g.dataset.a === id || g.dataset.b === id));
  }

  function fichas() {
    const I = S.indice, grupos = [
      [L('Planetas', 'Planets'), I.planetas], [L('Pontos e ângulos', 'Points and angles'), I.pontos],
      [L('Aspectos', 'Aspects'), I.aspectos], [L('Casas', 'Houses'), I.casas],
    ];
    const rot = id => {
      if (id.startsWith('casa')) return L('Casa ', 'House ') + id.slice(4);
      if (NOME_CURTO[id]) return GLIFO[id].length < 2 ? GLIFO[id] + T + ' ' + NOME_CURTO[id] : NOME_CURTO[id];
      const [a, b, tp] = id.split('-'); return `${NOME_CURTO[a]} ${GLIFO_ASP[tp]}${T} ${NOME_CURTO[b]}`;
    };
    $('grupos').innerHTML = grupos.map(([n, ids]) => `<div class="grupo"><p>${n}</p><div class="fichas">${ids.map(id => `<button type="button" class="ficha${S.textos[id].fechado ? ' fechado' : ''}" data-id="${id}">${esc(rot(id))}</button>`).join('')}</div></div>`).join('');
    $('grupos').querySelectorAll('.ficha').forEach(b => b.addEventListener('click', () => escolher(b.dataset.id, true)));
  }

  function abrir() {
    $('entrada').hidden = true; $('leitura').hidden = false;
    const p = S.pessoa || pessoa || {};
    const nome = String(p.nome || '').split(/\s+/)[0];
    $('titulo').innerHTML = nome ? L(`O mapa de <b>${esc(nome)}</b>`, `<b>${esc(nome)}</b>’s chart`) : L('O seu <b>mapa</b>', 'Your <b>chart</b>');
    const [y, mo, d] = String(p.data || '').split('-');
    $('dados').textContent = [d && (EN ? `${mo}/${d}/${y}` : `${d}/${mo}/${y}`), p.hora, p.cidade].filter(Boolean).join(' · ') + (p.until ? L(' · acesso até ', ' · access until ') + new Date(p.until).toLocaleDateString(L('pt-BR', 'en-US'), { day: 'numeric', month: 'long', year: 'numeric' }) : '');
    if (S.preco) $('preco').textContent = EN ? '$' + S.preco : 'R$ ' + String(S.preco).replace('.', ',');
    desenhar(); fichas();
    escolher('sol', false);
    $('roda').classList.remove('foco'); // na abertura, todas as linhas aparecem
    window.scrollTo({ top: 0 });
  }

  /* ---------- o palco: quem foi tocado fala ---------- */
  function escolher(id, rolar) {
    parar();
    atual = id;
    const tx = S.textos[id];
    if (tx.traduzir) {
      tx.traduzir = false;
      post('texto', { id, ...(sessao ? {} : pessoa) }).then(t => { Object.assign(tx, t); if (atual === id) escolher(id, false); }).catch(() => { tx.traduzir = true; });
    }
    document.querySelectorAll('.ativo').forEach(n => n.classList.remove('ativo'));
    document.querySelectorAll(`[data-id="${id}"]`).forEach(n => n.classList.add('ativo'));
    const tp = id.split('-')[2];
    $('orbe').textContent = id.startsWith('casa') ? id.slice(4) : tp ? GLIFO_ASP[tp] + T : GLIFO[id].length < 2 ? GLIFO[id] + T : GLIFO[id];
    $('orbe').style.fontSize = /^(AC|MC|FC|DC)$/.test($('orbe').textContent) || id.startsWith('casa') ? '26px' : '';
    $('pTitulo').textContent = tx.titulo; $('pSub').textContent = tx.sub;
    $('legenda').hidden = true;
    $('trava').hidden = !tx.fechado; $('acoes').hidden = !!tx.fechado;
    $('bTransito').hidden = !tx.temTransito;
    $('base').innerHTML = tx.fechado ? '' : (tx.base || []).map(l => l.startsWith('## ') ? `<h3>${esc(l.slice(3))}</h3>` : `<p>${esc(l)}</p>`).join('') + (tx.pergunta ? `<p class="q">${esc(tx.pergunta)}</p>` : '');
    $('base').scrollTop = 0;
    // a cor do palco é a do planeta tocado
    $('palco').style.setProperty('--cor', PCOR[id] || PCOR[(id.split('-')[0])] || '#B9A6FF');
    const gi = tx.grau;
    $('ficha-grau').hidden = !gi || !!tx.fechado;
    if (gi) $('ficha-grau').innerHTML = `<div class="g-num">${gi.grau}<span>°${String(gi.minuto).padStart(2, '0')}'</span></div>
      <dl><div><dt>${L('Decanato', 'Decan')}</dt><dd>${gi.decanato}${L('º de 3', ' of 3')}</dd></div><div><dt>Face</dt><dd>${esc(gi.face)}</dd></div><div><dt>${L('Tom do elemento', 'Element tone')}</dt><dd>${esc(gi.triplicidade)}</dd></div>
      ${gi.dignidade ? `<div class="larga"><dt>${L('Dignidade', 'Dignity')}</dt><dd>${esc(gi.dignidade)}</dd></div>` : ''}${gi.critico ? `<div class="larga"><dt>${L('Grau crítico', 'Critical degree')}</dt><dd>${esc(gi.critico)}</dd></div>` : ''}</dl>`;
    $('ficha-filo').hidden = !tx.filosofia || !!tx.fechado;
    $('ficha-filo').innerHTML = tx.filosofia ? `<p class="rot">${L('Filosofia e mito', 'Philosophy and myth')}</p><p>${esc(tx.filosofia)}</p>` : '';
    $('ficha-livros').hidden = !(tx.livros && tx.livros.length) || !!tx.fechado;
    $('ficha-livros').innerHTML = tx.livros ? `<p class="rot">${L('Para ler', 'To read')}</p><ul>${tx.livros.map(l => `<li><b>${esc(l.titulo)}</b><span>${esc(l.autor)}</span></li>`).join('')}</ul>` : '';
    destacar(id);
    rotuloFaixa();
    if (rolar && window.innerWidth <= 920) $('palco').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  let audio = null, ctx = null, raf = 0, falando = false;
  // o volume da voz faz pulsar o orbe do palco e o medalhão no centro da roda
  function vol(v) { const x = v.toFixed(3); $('orbe').style.setProperty('--vol', x); const m = $('miolo'); if (m) m.style.setProperty('--vol', x); } // só no miolo: na roda inteira o Safari recalculava tudo a cada quadro
  const mmss = t => isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : '';
  function estado(e, tipo) {
    $('acoes').dataset.estado = e || '';
    $('acoes').dataset.tipo = tipo || '';
    $('bOuvir').setAttribute('aria-label', e === 'tocando' ? L('Parar', 'Stop') : L('Ouvir', 'Listen'));
    $('bTransito').disabled = e === 'carregando';
    if (!e) { $('barra').style.width = '0%'; $('tempo').textContent = ''; }
  }
  function parar() {
    falando = false;
    if (audio) { audio.pause(); audio = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
    cancelAnimationFrame(raf); vol(0);
    estado('');
  }

  async function ouvir(tipo) {
    const id = atual; parar();
    estado('carregando', tipo);
    $('faixaRot').textContent = tipo === 'transito' ? L('Buscando o céu de agora…', 'Reading the sky right now…') : L('Chamando a voz…', 'Calling the voice…');
    // o pedido de áudio precisa sair do toque para o iPhone deixar tocar
    if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    if (ctx && ctx.state === 'suspended') ctx.resume();
    let f;
    try { f = await post('falar', { id, tipo, ...(sessao ? {} : pessoa) }); }
    catch (e) {
      estado(''); rotuloFaixa();
      if (e.status === 402) { $('trava').hidden = false; $('acoes').hidden = true; $('bTransito').hidden = true; }
      $('legenda').hidden = false; $('legenda').textContent = e.message; return;
    }
    if (atual !== id) return;
    $('legenda').hidden = false; $('legenda').textContent = f.texto;
    $('faixaRot').textContent = tipo === 'transito' ? L('O céu de agora', 'The sky right now') : rotuloFala();
    falando = true; estado('tocando', tipo);
    if (f.audio) {
      audio = new Audio('data:audio/mpeg;base64,' + f.audio);
      let an = null, buf = null;
      if (ctx) {
        try {
          const src = ctx.createMediaElementSource(audio); an = ctx.createAnalyser(); an.fftSize = 256;
          src.connect(an); an.connect(ctx.destination); buf = new Uint8Array(an.frequencyBinCount);
        } catch (e) { an = null; }
      }
      const loop = () => {
        if (!falando || !audio) return;
        if (an) { an.getByteTimeDomainData(buf); let s = 0; for (const b of buf) s += ((b - 128) / 128) ** 2; vol(Math.min(1, Math.sqrt(s / buf.length) * 4)); }
        if (audio.duration) { $('barra').style.width = (audio.currentTime / audio.duration * 100).toFixed(2) + '%'; $('tempo').textContent = `${mmss(audio.currentTime)} / ${mmss(audio.duration)}`; }
        raf = requestAnimationFrame(loop);
      };
      audio.onended = () => { parar(); rotuloFaixa(); };
      audio.play().then(loop).catch(() => { parar(); rotuloFaixa(); });
    } else {
      // sem a voz do servidor: a voz do próprio aparelho, com o orbe pulsando nas palavras
      const u = new SpeechSynthesisUtterance(f.texto); u.lang = L('pt-BR', 'en-US'); u.rate = 1.02;
      const v = speechSynthesis.getVoices().find(x => (EN ? /en[-_]US/i : /pt[-_]BR/i).test(x.lang)); if (v) u.voice = v;
      u.onboundary = () => { vol(.9); setTimeout(() => vol(.15), 120); };
      u.onend = () => { parar(); rotuloFaixa(); };
      speechSynthesis.speak(u);
    }
  }
  const rotuloFala = () => { const t = S && S.textos[atual]; return t ? (EN ? `${t.titulo.split(' in ')[0]} speaks` : `${t.titulo.split(' em ')[0]} fala`) : L('Ouvir', 'Listen'); };
  function rotuloFaixa() { const n = rotuloFala().replace(/ (fala|speaks)$/, ''); $('faixaRot').textContent = /^(Casa|House)|☌|⚹|□|△|☍|Conjunction|Sextile|Square|Trine|Opposition/.test(n) ? L(`Ouvir: ${n}`, `Listen: ${n}`) : L(`Ouvir: ${n} se apresenta`, `Listen: ${n} introduces itself`); }
  $('bOuvir').addEventListener('click', () => $('acoes').dataset.estado === 'tocando' ? (parar(), rotuloFaixa()) : ouvir('natal'));
  $('bTransito').addEventListener('click', () => $('acoes').dataset.estado === 'tocando' && $('acoes').dataset.tipo === 'transito' ? (parar(), rotuloFaixa()) : ouvir('transito'));

  /* ---------- compra ---------- */
  $('fComprar').addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('eComprar'), email = $('email').value.trim(); erro.textContent = '';
    if (!okEmail(email)) return erro.textContent = L('Confira o e-mail.', 'Check the e-mail.');
    if (!$('aceite').checked) return erro.textContent = L('Marque a caixa de aceite para continuar.', 'Tick the consent box to continue.');
    if (!pessoa) return erro.textContent = L('Recarregue a página e preencha os dados de nascimento.', 'Reload the page and fill in your birth details.');
    const bt = $('bComprar'); bt.disabled = true; bt.textContent = L('Abrindo o pagamento…', 'Opening checkout…');
    try { location.href = (await post('checkout', { ...pessoa, email })).url; }
    catch (err) { erro.textContent = err.message; bt.disabled = false; bt.textContent = L('Abrir o mapa inteiro', 'Open the whole chart'); }
  });

  if (sessao) entrarComSessao();
})();
