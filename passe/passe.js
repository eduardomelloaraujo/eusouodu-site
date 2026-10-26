// Passe do céu: página de venda para quem não entrou, central para quem tem o passe.
(function () {
  const $ = id => document.getElementById(id);
  const API = '/api/jornada?a=';
  const guardar = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  const ler = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const quando = ms => new Date(ms).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long' });
  const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // o link do e-mail chega com a sessão no fim do endereço
  const m = location.hash.match(/(?:^#|&)s=([^&]+)/);
  if (m) { guardar('passe-s', decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + location.search); }
  let sessao = ler('passe-s');

  const venda = $('venda'), central = $('central');
  function mostrar(c) { venda.hidden = c; central.hidden = !c; $('jaSou').hidden = c; }

  const pago = new URLSearchParams(location.search).get('pago');
  const aviso = (el, t) => { el.textContent = t; el.hidden = !t; };
  if (pago === '1') aviso($('avisoVenda'), 'Pagamento recebido. O link da sua central chegou no seu e-mail. Se não aparecer em alguns minutos, olhe o spam ou peça outro em "Já sou assinante".');
  if (pago === 'pendente') aviso($('avisoVenda'), 'O pagamento ainda está sendo confirmado. Quando o Mercado Pago aprovar, o link da sua central chega no seu e-mail.');
  if (pago === 'falhou') aviso($('avisoVenda'), 'O pagamento não foi concluído. Dá para tentar de novo logo abaixo.');

  async function post(acao, corpo, url) {
    const r = await fetch(url || API + acao, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    return { r, j };
  }

  async function assinar(email, bt, erro) {
    erro.textContent = '';
    if (!okEmail(email)) return erro.textContent = 'Confira o e-mail: falta algo como nome@email.com.';
    const txt = bt.textContent; bt.disabled = true; bt.textContent = 'Abrindo o pagamento…';
    try {
      const { r, j } = await post('passe-assinar', { email });
      if (!r.ok || !j.url) throw new Error(j.erro || 'Não foi possível abrir o pagamento agora.');
      location.href = j.url;
    } catch (e) { erro.textContent = e.message; bt.disabled = false; bt.textContent = txt; }
  }

  /* ---------- venda ---------- */
  $('fAssinar').addEventListener('submit', e => { e.preventDefault(); assinar($('emailAssinar').value.trim(), $('bAssinar'), $('eAssinar')); });
  $('subir').addEventListener('click', e => { e.preventDefault(); $('fAssinar').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('emailAssinar').focus({ preventScroll: true }); });
  $('jaSou').addEventListener('click', () => { $('fEntrar').hidden = false; $('fEntrar').scrollIntoView({ behavior: 'smooth', block: 'center' }); $('emailEntrar').focus({ preventScroll: true }); });
  $('fEntrar').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('emailEntrar').value.trim(), bt = $('bEntrar'), erro = $('eEntrar');
    erro.textContent = '';
    if (!okEmail(email)) return erro.textContent = 'Confira o e-mail: falta algo como nome@email.com.';
    bt.disabled = true;
    const { r, j } = await post('passe-link', { email }).catch(() => ({ r: {}, j: {} }));
    bt.disabled = false;
    erro.textContent = r.ok ? `Se ${email} tem o passe, o link para entrar acabou de chegar lá. Ele vale por 48 horas.` : (j.erro || 'Não deu para enviar agora. Tente de novo.');
  });

  /* ---------- central ---------- */
  let estado = null, escolha = null;
  async function carregar() {
    if (!sessao) return mostrar(false);
    const r = await fetch(API + 'passe', { headers: { authorization: 'Bearer ' + sessao } }).catch(() => null);
    if (!r || r.status === 401) { guardar('passe-s', null); sessao = null; return mostrar(false); }
    estado = await r.json();
    if (!estado.ativo) {
      // conta sem passe (ou passe vencido): volta para a venda com o e-mail pronto
      $('emailAssinar').value = estado.email;
      if (!pago) aviso($('avisoVenda'), estado.until ? `O seu passe terminou em ${quando(estado.until)}. Para abrir tudo de novo, é só renovar.` : 'Esta conta ainda não tem o passe.');
      return mostrar(false);
    }
    desenhar();
    mostrar(true);
  }

  function desenhar() {
    const e = estado, nome = (e.nome || '').split(/\s+/)[0];
    $('oi').textContent = nome ? `Oi, ${nome}. Tudo aberto.` : 'Tudo aberto.';
    $('ate').textContent = 'vale até ' + quando(e.until);
    // o cupom da Odisseia só vem do servidor para quem tem o passe ativo
    if (e.cupom) { $('cupom').textContent = e.cupom; $('cupomLink').href = 'https://pay.hotmart.com/T107852297P?offDiscount=' + encodeURIComponent(e.cupom); }
    $('quem').textContent = e.email;
    const s = e.usos && e.usos.sonhos, j = e.usos && e.usos.juri;
    if (s) $('usoSonhos').textContent = `${s.usados} de ${s.limite} sonhos usados neste passe`;
    if (j) $('usoJuri').textContent = j.usados ? `${j.usados} de ${j.limite} julgamentos hoje` : `Até ${j.limite} julgamentos por dia`;
    // cada app abre já sabendo do passe; a Jornada entende a mesma sessão
    document.querySelectorAll('a[data-app]').forEach(a => {
      const u = new URL(a.href);
      if (u.hostname === 'eusouodu.com' && u.pathname.startsWith('/musica')) return;
      u.hash = (u.hostname.startsWith('jornada.') ? 's=' : 'passe=') + encodeURIComponent(sessao);
      a.href = u.toString();
    });
    relatorio();
  }

  function relatorio() {
    const rel = estado.relatorio || {};
    if (rel.usado) {
      $('rel').classList.add('usado');
      $('relTexto').textContent = `Enviado para ${estado.email}${rel.em ? ' em ' + quando(rel.em) : ''}. O próximo relatório libera quando você renovar o passe${estado.until ? ', a partir de ' + quando(estado.until) : ''}.`;
      $('fRel').innerHTML = '<button class="botao" type="button" disabled>Já emitido neste passe</button>';
      return;
    }
    const p = estado.perfil;
    if (p && p.birth && p.time && !p.unknownTime && Array.isArray(p.city)) {
      escolha = { rotulo: p.city[0], lat: p.city[1], lon: p.city[2], tz: p.city[3] };
      $('nome').value = p.nome || ''; $('data').value = p.birth; $('hora').value = p.time; $('cidade').value = p.city[0];
      $('dadosRel').hidden = true;
      $('dadosProntos').hidden = false;
      $('dadosProntos').innerHTML = `Para o mapa de ${p.nome || 'quem assina'}: ${p.birth.split('-').reverse().join('/')}, ${p.time}, ${p.city[0]}.<button class="link" type="button" id="trocarDados">Usar outros dados</button>`;
      $('trocarDados').onclick = () => { $('dadosRel').hidden = false; $('dadosProntos').hidden = true; };
    } else if (estado.nome) $('nome').value = estado.nome;
  }

  // busca de cidade (a mesma do relatório avulso)
  const cidade = $('cidade'), box = $('sugestoes');
  let t = null;
  const fechar = () => { box.hidden = true; box.innerHTML = ''; };
  cidade.addEventListener('input', () => {
    escolha = null; clearTimeout(t);
    const q = cidade.value.trim(); if (q.length < 3) return fechar();
    t = setTimeout(async () => {
      try {
        const j = await (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=7&language=pt&format=json&name=' + encodeURIComponent(q))).json();
        const res = j.results || [];
        box.innerHTML = res.length ? res.map((c, i) => `<button type="button" data-i="${i}">${c.name}<small> · ${[c.admin1, c.country].filter(Boolean).join(', ')}</small></button>`).join('') : '<button type="button" disabled>Nenhuma cidade encontrada</button>';
        box.hidden = false;
        box.querySelectorAll('button[data-i]').forEach(b => b.addEventListener('click', () => {
          const c = res[+b.dataset.i];
          escolha = { rotulo: [c.name, c.admin1, c.country].filter(Boolean).join(', '), lat: c.latitude, lon: c.longitude, tz: c.timezone };
          cidade.value = escolha.rotulo; fechar();
        }));
      } catch (e) { $('eRel').textContent = 'Não foi possível buscar a cidade agora. Tente de novo.'; }
    }, 300);
  });
  document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== cidade) fechar(); });

  $('fRel').addEventListener('submit', async e => {
    e.preventDefault();
    const erro = $('eRel'), bt = $('relBotao');
    erro.textContent = '';
    const d = { t: sessao, nome: $('nome').value.trim(), data: $('data').value, hora: $('hora').value };
    if (d.nome.length < 2) return erro.textContent = 'Informe o nome.';
    if (!d.data) return erro.textContent = 'Informe a data de nascimento.';
    if (!d.hora) return erro.textContent = 'Informe a hora de nascimento. O relatório precisa dela para as casas.';
    if (!escolha) return erro.textContent = 'Escolha a cidade de nascimento na lista que aparece ao digitar.';
    if (!$('aceite').checked) return erro.textContent = 'Marque a caixa de aceite para continuar.';
    bt.disabled = true; bt.textContent = 'Emitindo…';
    const { r, j } = await post(null, { ...d, cidade: escolha.rotulo, lat: escolha.lat, lon: escolha.lon, tz: escolha.tz }, '/api/mapa-cortesia').catch(() => ({ r: {}, j: {} }));
    if (r.ok || r.status === 409) { estado.relatorio = { usado: true, em: r.ok ? Date.now() : j.em }; return relatorio(); }
    erro.textContent = j.erro || 'Não deu para emitir agora. Tente de novo em instantes.';
    bt.disabled = false; bt.textContent = 'Emitir meu relatório do mês';
  });

  $('renovar').addEventListener('click', () => assinar(estado.email, $('renovar'), $('eRenovar')));
  $('sair').addEventListener('click', () => { guardar('passe-s', null); sessao = null; estado = null; mostrar(false); scrollTo(0, 0); });

  carregar();
})();
