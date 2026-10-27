// O seu mapa fala: a roda do mapa natal em que cada planeta, ponto, aspecto e casa explica a si mesmo em voz alta.
(function () {
  const $ = id => document.getElementById(id);
  const API = '/api/leitura?a=';
  const guardar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const lerLocal = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const T = '︎'; // força o símbolo como texto (sem virar emoji no iPhone)
  const GLIFO = { sol: '☉', lua: '☽', merc: '☿', venus: '♀', marte: '♂', jupiter: '♃', saturno: '♄', urano: '♅', netuno: '♆', plutao: '♇', nn: '☊', ns: '☋', fortuna: '⊗', asc: 'AC', mc: 'MC', fc: 'FC', dc: 'DC' };
  const SIGNOS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const ELEM = ['#FF8A5B', '#A8D88E', '#9DB8FF', '#6FD3E0']; // fogo, terra, ar, água
  const COR_ASP = { conjuncao: '#FFE2A0', sextil: '#8AB4FF', trigono: '#7FE8A8', quadratura: '#FF7A6B', oposicao: '#FF9A5C' };
  const GLIFO_ASP = { conjuncao: '☌', sextil: '⚹', quadratura: '□', trigono: '△', oposicao: '☍' };
  const NOME_CURTO = { sol: 'Sol', lua: 'Lua', merc: 'Mercúrio', venus: 'Vênus', marte: 'Marte', jupiter: 'Júpiter', saturno: 'Saturno', urano: 'Urano', netuno: 'Netuno', plutao: 'Plutão', nn: 'Nodo Norte', ns: 'Nodo Sul', fortuna: 'Roda da Fortuna', asc: 'Ascendente', mc: 'Meio do Céu', fc: 'Fundo do Céu', dc: 'Descendente' };

  let S = null;          // { mapa, indice, textos, preco?, pessoa? }
  let pessoa = null;     // dados de nascimento (amostra grátis)
  let sessao = null, atual = null;

  /* ---------- entrada ---------- */
  const m = location.hash.match(/(?:^#|&)s=([^&]+)/);
  if (m) { guardar('leitura-s', decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + location.search); }
  sessao = lerLocal('leitura-s');
  const pago = new URLSearchParams(location.search).get('pago');
  const avisar = t => { $('avisoEntrada').textContent = t; $('avisoEntrada').hidden = !t; };
  if (pago === '1') avisar('Pagamento recebido. O link do seu mapa completo chegou no seu e-mail. Se não aparecer em alguns minutos, olhe o spam ou peça de novo em "Já comprei".');
  if (pago === 'pendente') avisar('O pagamento ainda está sendo confirmado. Quando o Mercado Pago aprovar, o link chega no seu e-mail.');
  if (pago === 'falhou') avisar('O pagamento não foi concluído. Os dados continuam aqui, é só tentar de novo.');

  // cidade: a mesma busca do /mapa
  let escolha = null, t = null;
  const cidade = $('cidade'), box = $('sugestoes');
  const fechar = () => { box.hidden = true; box.innerHTML = ''; };
  cidade.addEventListener('input', () => {
    escolha = null; $('cidadeOk').textContent = 'A cidade define o fuso e a posição exata das casas.';
    clearTimeout(t); const q = cidade.value.trim(); if (q.length < 3) return fechar();
    t = setTimeout(async () => {
      try {
        const j = await (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=7&language=pt&format=json&name=' + encodeURIComponent(q))).json();
        const res = j.results || [];
        if (!res.length) { box.innerHTML = '<button type="button" disabled>Nenhuma cidade encontrada</button>'; box.hidden = false; return; }
        box.innerHTML = res.map((c, i) => `<button type="button" data-i="${i}">${esc(c.name)}<small> · ${esc([c.admin1, c.country].filter(Boolean).join(', '))}</small></button>`).join('');
        box.hidden = false;
        box.querySelectorAll('button[data-i]').forEach(b => b.addEventListener('click', () => {
          const c = res[+b.dataset.i];
          escolha = { rotulo: [c.name, c.admin1, c.country].filter(Boolean).join(', '), lat: c.latitude, lon: c.longitude, tz: c.timezone };
          cidade.value = escolha.rotulo; $('cidadeOk').textContent = 'Cidade escolhida: ' + escolha.rotulo; fechar();
        }));
      } catch (e) { $('cidadeOk').textContent = 'Não foi possível buscar a cidade agora. Tente de novo.'; }
    }, 300);
  });
  document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== cidade) fechar(); });
  cidade.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { const b = box.querySelector('button[data-i]'); if (b) { e.preventDefault(); b.focus(); } } if (e.key === 'Escape') fechar(); });
  box.addEventListener('keydown', e => { const bs = [...box.querySelectorAll('button[data-i]')], i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown' && bs[i + 1]) { e.preventDefault(); bs[i + 1].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); (bs[i - 1] || cidade).focus(); } if (e.key === 'Escape') { fechar(); cidade.focus(); } });

  try { const sv = JSON.parse(sessionStorage.getItem('leitura-form') || 'null'); if (sv) { for (const k of ['nome', 'data', 'hora']) $(k).value = sv[k] || ''; if (sv.escolha) { escolha = sv.escolha; cidade.value = escolha.rotulo; $('cidadeOk').textContent = 'Cidade escolhida: ' + escolha.rotulo; } } } catch (e) {}

  async function post(acao, corpo) {
    const r = await fetch(API + acao, { method: 'POST', headers: { 'content-type': 'application/json', ...(sessao ? { authorization: 'Bearer ' + sessao } : {}) }, body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.erro || 'Algo falhou. Tente de novo.'); e.status = r.status; throw e; }
    return j;
  }

  $('fMapa').addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('eMapa'); erro.textContent = '';
    const d = { nome: $('nome').value.trim(), data: $('data').value, hora: $('hora').value };
    if (d.nome.length < 2) return erro.textContent = 'Informe o nome.';
    if (!d.data) return erro.textContent = 'Informe a data de nascimento.';
    if (!d.hora) return erro.textContent = 'Informe a hora de nascimento. Sem ela não dá para calcular as casas.';
    if (!escolha) return erro.textContent = 'Escolha a cidade de nascimento na lista que aparece ao digitar.';
    try { sessionStorage.setItem('leitura-form', JSON.stringify({ ...d, escolha })); } catch (e) {}
    const bt = $('bMapa'); bt.disabled = true; bt.textContent = 'Calculando o céu…';
    try {
      pessoa = { ...d, cidade: escolha.rotulo, lat: escolha.lat, lon: escolha.lon, tz: escolha.tz };
      S = await post('mapa', pessoa);
      abrir();
    } catch (err) { erro.textContent = err.message; }
    bt.disabled = false; bt.textContent = 'Abrir o meu mapa';
  });

  $('jaComprei').addEventListener('click', () => { $('fLink').hidden = false; $('emailLink').focus(); });
  $('fLink').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('emailLink').value.trim(), erro = $('eLink');
    if (!okEmail(email)) return erro.textContent = 'Confira o e-mail.';
    $('bLink').disabled = true;
    try { await post('link', { email }); erro.textContent = `Se ${email} tem a leitura ativa, o link acabou de chegar lá.`; } catch (err) { erro.textContent = err.message; }
    $('bLink').disabled = false;
  });

  async function entrarComSessao() {
    const r = await fetch(API + 'meu', { headers: { authorization: 'Bearer ' + sessao } }).catch(() => null);
    if (!r || r.status === 401) { guardar('leitura-s', null); sessao = null; if (r) avisar('O acesso terminou ou o link não vale mais. Peça um novo em "Já comprei".'); return; }
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
    el('circle', { r: 292, fill: 'none', stroke: 'var(--linha)' }, svg);
    el('circle', { r: 252, fill: 'none', stroke: 'var(--linha)' }, svg);
    el('circle', { r: 120, fill: 'none', stroke: 'var(--linha)' }, svg);
    // signos
    for (let i = 0; i < 12; i++) {
      const g = el('g', { class: 'signo' }, svg);
      el('path', { d: arco(i * 30, i * 30 + 30, 252, 292), fill: ELEM[i % 4], 'fill-opacity': .07, stroke: 'var(--linha)' }, g);
      const [x, y] = xy(i * 30 + 15, 272);
      el('text', { x, y, fill: ELEM[i % 4] }, g).textContent = SIGNOS[i] + T;
    }
    // casas
    const C = M.cuspides;
    for (let h = 0; h < 12; h++) {
      const id = 'casa' + (h + 1), g = el('g', { class: 'alvo casa', tabindex: 0, role: 'button', 'data-id': id, 'aria-label': S.textos[id].titulo }, svg);
      el('path', { d: arco(C[h], C[(h + 1) % 12], 120, 252) }, g);
      const meio = C[h] + (((C[(h + 1) % 12] - C[h]) % 360 + 360) % 360) / 2, [x, y] = xy(meio, 134);
      el('text', { x, y }, g).textContent = h + 1;
      const angular = h % 3 === 0, [x1, y1] = xy(C[h], 120), [x2, y2] = xy(C[h], angular ? 300 : 252);
      el('line', { x1, y1, x2, y2, stroke: angular ? 'var(--luz-2)' : 'var(--linha)', 'stroke-width': angular ? 1.4 : 1, 'pointer-events': 'none' }, svg);
    }
    // aspectos
    const gA = el('g', {}, svg);
    for (const id of S.indice.aspectos) {
      const [a, b, tp] = id.split('-');
      if (tp === 'conjuncao') continue; // a conjunção é um encontro no mesmo lugar: aparece nas fichas
      const g = el('g', { class: 'alvo aspecto', tabindex: 0, role: 'button', 'data-id': id, 'aria-label': S.textos[id].titulo }, gA);
      const [x1, y1] = xy(M.pts[a].lon, 118), [x2, y2] = xy(M.pts[b].lon, 118);
      el('line', { class: 'ver', x1, y1, x2, y2, stroke: COR_ASP[tp], 'stroke-dasharray': tp === 'sextil' ? '4 4' : 'none' }, g);
      el('line', { class: 'toque', x1, y1, x2, y2 }, g);
    }
    // planetas e pontos, afastados quando se amontoam
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
    for (const p of pos) {
      const [tx, ty] = xy(p.lon, 252), [tx2, ty2] = xy(p.lon, 240);
      el('line', { x1: tx, y1: ty, x2: tx2, y2: ty2, stroke: 'var(--luz-2)', 'pointer-events': 'none' }, svg);
      const [x, y] = xy(p.v, 214), tx3 = S.textos[p.id];
      const g = el('g', { class: 'alvo astro' + (tx3.fechado ? ' fechado' : ''), tabindex: 0, role: 'button', 'data-id': p.id, 'aria-label': tx3.titulo + (tx3.fechado ? ', fechado' : '') }, svg);
      el('circle', { class: 'halo', cx: x, cy: y, r: 26 }, g);
      el('circle', { class: 'fundo', cx: x, cy: y, r: 17 }, g);
      el('text', { x, y }, g).textContent = GLIFO[p.id] + T;
      if (M.pts[p.id].retro) el('text', { x: x + 15, y: y + 13, style: 'font-size:10px;fill:var(--luz-3)' }, g).textContent = 'R';
    }
    // ângulos
    for (const id of ['asc', 'mc', 'fc', 'dc']) {
      const [x, y] = xy(M.pts[id].lon, 316 - 14);
      const g = el('g', { class: 'alvo astro' + (S.textos[id].fechado ? ' fechado' : ''), tabindex: 0, role: 'button', 'data-id': id, 'aria-label': S.textos[id].titulo }, svg);
      el('circle', { class: 'halo', cx: x * .97, cy: y * .97, r: 20 }, g);
      el('circle', { class: 'fundo', cx: x * .97, cy: y * .97, r: 14 }, g);
      el('text', { x: x * .97, y: y * .97, style: 'font-size:11px;font-weight:600' }, g).textContent = GLIFO[id];
    }
    svg.querySelectorAll('.alvo').forEach(g => {
      g.addEventListener('click', () => escolher(g.dataset.id, true));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(g.dataset.id, true); } });
    });
  }

  function fichas() {
    const I = S.indice, grupos = [
      ['Planetas', I.planetas], ['Pontos e ângulos', I.pontos],
      ['Aspectos', I.aspectos], ['Casas', I.casas],
    ];
    const rot = id => {
      if (id.startsWith('casa')) return 'Casa ' + id.slice(4);
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
    $('titulo').textContent = nome ? `O mapa de ${nome}` : 'O seu mapa';
    const [y, mo, d] = String(p.data || '').split('-');
    $('dados').textContent = [d && `${d}/${mo}/${y}`, p.hora, p.cidade].filter(Boolean).join(' · ') + (p.until ? ` · acesso até ${new Date(p.until).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}` : '');
    if (S.preco) $('preco').textContent = 'R$ ' + String(S.preco).replace('.', ',');
    desenhar(); fichas();
    escolher('sol', false);
    window.scrollTo({ top: 0 });
  }

  /* ---------- o palco: quem foi tocado fala ---------- */
  function escolher(id, rolar) {
    parar();
    atual = id;
    const tx = S.textos[id];
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
    if (rolar && window.innerWidth <= 920) $('palco').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  let audio = null, ctx = null, raf = 0, falando = false;
  function vol(v) { $('orbe').style.setProperty('--vol', v.toFixed(3)); }
  function parar() {
    falando = false;
    if (audio) { audio.pause(); audio = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
    cancelAnimationFrame(raf); vol(0);
    $('bParar').hidden = true; $('bOuvir').disabled = false; $('bTransito').disabled = false;
    $('bOuvir').textContent = 'Ouvir';
  }

  async function ouvir(tipo) {
    const id = atual; parar();
    const bt = tipo === 'transito' ? $('bTransito') : $('bOuvir');
    $('bOuvir').disabled = $('bTransito').disabled = true;
    const txtOriginal = bt.textContent; bt.textContent = 'Chamando…';
    // o pedido de áudio precisa sair do toque para o iPhone deixar tocar
    if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    if (ctx && ctx.state === 'suspended') ctx.resume();
    let f;
    try { f = await post('falar', { id, tipo, ...(sessao ? {} : pessoa) }); }
    catch (e) {
      bt.textContent = txtOriginal; $('bOuvir').disabled = $('bTransito').disabled = false;
      if (e.status === 402) { $('trava').hidden = false; $('acoes').hidden = true; }
      $('legenda').hidden = false; $('legenda').textContent = e.message; return;
    }
    bt.textContent = txtOriginal;
    if (atual !== id) return;
    $('legenda').hidden = false; $('legenda').textContent = f.texto;
    $('bParar').hidden = false; falando = true;
    if (f.audio) {
      audio = new Audio('data:audio/mpeg;base64,' + f.audio);
      if (ctx) {
        try {
          const src = ctx.createMediaElementSource(audio), an = ctx.createAnalyser(); an.fftSize = 256;
          src.connect(an); an.connect(ctx.destination);
          const buf = new Uint8Array(an.frequencyBinCount);
          const loop = () => { an.getByteTimeDomainData(buf); let s = 0; for (const b of buf) s += ((b - 128) / 128) ** 2; vol(Math.min(1, Math.sqrt(s / buf.length) * 4)); if (falando) raf = requestAnimationFrame(loop); };
          loop();
        } catch (e) {}
      }
      audio.onended = parar;
      audio.play().catch(() => parar());
    } else {
      // sem a voz do servidor: a voz do próprio aparelho, com o orbe pulsando nas palavras
      const u = new SpeechSynthesisUtterance(f.texto); u.lang = 'pt-BR'; u.rate = 1.02;
      const v = speechSynthesis.getVoices().find(x => /pt[-_]BR/i.test(x.lang)); if (v) u.voice = v;
      u.onboundary = () => { vol(.9); setTimeout(() => vol(.15), 120); };
      u.onend = parar;
      speechSynthesis.speak(u);
    }
  }
  $('bOuvir').addEventListener('click', () => ouvir('natal'));
  $('bTransito').addEventListener('click', () => ouvir('transito'));
  $('bParar').addEventListener('click', parar);

  /* ---------- compra ---------- */
  $('fComprar').addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('eComprar'), email = $('email').value.trim(); erro.textContent = '';
    if (!okEmail(email)) return erro.textContent = 'Confira o e-mail.';
    if (!$('aceite').checked) return erro.textContent = 'Marque a caixa de aceite para continuar.';
    if (!pessoa) return erro.textContent = 'Recarregue a página e preencha os dados de nascimento.';
    const bt = $('bComprar'); bt.disabled = true; bt.textContent = 'Abrindo o pagamento…';
    try { location.href = (await post('checkout', { ...pessoa, email })).url; }
    catch (err) { erro.textContent = err.message; bt.disabled = false; bt.textContent = 'Abrir o mapa inteiro'; }
  });

  if (sessao) entrarComSessao();
})();
