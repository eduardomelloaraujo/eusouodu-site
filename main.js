(() => {
  const NS = "http://www.w3.org/2000/svg";
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Moon phase from a known new moon (2000-01-06 18:14 UTC); good to within a few hours.
  const SINODICO = 29.530588853;
  const LUA_NOVA = Date.UTC(2000, 0, 6, 18, 14);
  const idadeLua = (data) => (((data - LUA_NOVA) / 864e5) % SINODICO + SINODICO) % SINODICO;

  const nomeFase = (idade) => {
    const f = idade / SINODICO;
    if (f < .03 || f > .97) return "Lua nova";
    if (f < .22) return "Lua crescente";
    if (f < .28) return "Quarto crescente";
    if (f < .47) return "Crescente gibosa";
    if (f < .53) return "Lua cheia";
    if (f < .72) return "Minguante gibosa";
    if (f < .78) return "Quarto minguante";
    return "Lua minguante";
  };

  // Draws the lit part as seen from the southern hemisphere: waxing light on the left.
  function desenharLua(svg, idade) {
    const r = 18, c = 20;
    const f = idade / SINODICO;
    const crescente = f < .5;
    const k = Math.cos(f * 2 * Math.PI);        // 1 new, -1 full
    const rx = Math.abs(k) * r;
    const ladoLuz = crescente ? 0 : 1;           // sweep for the outer limb
    const terminador = (k > 0) === crescente ? 1 : 0;
    svg.innerHTML = "";
    const fundo = document.createElementNS(NS, "circle");
    fundo.setAttribute("cx", c); fundo.setAttribute("cy", c); fundo.setAttribute("r", r);
    fundo.setAttribute("fill", "#1B1D2A");
    svg.append(fundo);
    const luz = document.createElementNS(NS, "path");
    luz.setAttribute("d", `M${c} ${c - r} A${r} ${r} 0 0 ${ladoLuz} ${c} ${c + r} A${rx} ${r} 0 0 ${terminador} ${c} ${c - r}Z`);
    luz.setAttribute("fill", "#F5F3EE");
    svg.append(luz);
  }

  const hoje = new Date();
  const svgHoje = document.getElementById("lua-grande");
  if (svgHoje) {
    const idade = idadeLua(hoje);
    desenharLua(svgHoje, idade);
    svgHoje.setAttribute("aria-label", `A Lua de hoje, ${nomeFase(idade).toLowerCase()}`);
    const data = hoje.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    document.getElementById("hoje-texto").textContent = `O céu de hoje · ${data} · ${nomeFase(idade)}`;
  }

  // The tab icon is today's Moon too: every other icon link goes, or Chrome keeps the fixed crescent. Safari still falls back to /favicon.ico.
  const icone = document.createElementNS(NS, "svg");
  desenharLua(icone, idadeLua(hoje));
  const favicon = Object.assign(document.createElement("link"), { rel: "icon", type: "image/svg+xml" });
  favicon.href = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="${NS}" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#05060A"/><g transform="translate(2 2) scale(.9)">${icone.innerHTML}<circle cx="20" cy="20" r="18" fill="none" stroke="#F5F3EE" stroke-opacity=".18" stroke-width=".6"/></g></svg>`);
  document.querySelectorAll('link[rel="icon"]').forEach((l) => l.remove());
  document.head.append(favicon);

  // The week comes from semana.json and only shows while it covers today (Bahia time), never a past week.
  const hojeBA = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const esc = (t) => String(t).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  if (document.getElementById("semana-luas")) fetch("/semana.json?t=" + Date.now(), { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((s) => {
    if (!s || !s.titulo || s.inicio > hojeBA || s.fim < hojeBA) return;
    document.getElementById("semana-t").textContent = s.rotuloDatas + ".";
    document.getElementById("semana-titulo").textContent = s.titulo;
    document.getElementById("semana-corpo").innerHTML = s.paragrafos.map((p) => `<p>${esc(p)}</p>`).join("");
    if (s.instagram) document.getElementById("semana-insta").href = s.instagram;
    const faixa = document.getElementById("semana-luas");
    for (const d of s.dias) {
      const el = document.createElement("div");
      el.className = "dia" + (d.data === hojeBA ? " hoje-dia" : "");
      el.title = `Lua em ${d.luaSigno}`;
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 40 40");
      svg.setAttribute("aria-hidden", "true");
      desenharLua(svg, d.fase * SINODICO);
      const nome = document.createElement("span");
      nome.textContent = d.dia.slice(0, 3);
      const num = document.createElement("strong");
      num.textContent = +d.data.slice(8);
      el.append(nome, svg, num);
      faixa.append(el);
    }
    for (const id of ["semana-luas", "semana-nota", "semana-leitura"]) document.getElementById(id).hidden = false;
  }).catch(() => {});

  // Música Astral: the chart as a record.
  const disco = document.getElementById("disco-svg");
  if (disco) {
    let s = `<circle cx="200" cy="200" r="198" fill="#0D0E14"/>`;
    for (let r = 190; r > 96; r -= 4) s += `<circle cx="200" cy="200" r="${r}" fill="none" stroke="rgba(245,243,238,${r % 12 ? .05 : .1})"/>`;
    s += `<circle cx="200" cy="200" r="92" fill="#FFB547"/>`;
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      s += `<line x1="${200 + Math.cos(t) * 54}" y1="${200 + Math.sin(t) * 54}" x2="${200 + Math.cos(t) * 88}" y2="${200 + Math.sin(t) * 88}" stroke="#05060A" stroke-opacity=".5"/>`;
    }
    s += `<circle cx="200" cy="200" r="54" fill="none" stroke="#05060A" stroke-opacity=".5"/>`;
    s += `<path d="M200 150 L243 225 L157 225Z" fill="none" stroke="#05060A" stroke-width="1.5"/>`;
    s += `<circle cx="200" cy="200" r="6" fill="#05060A"/>`;
    s += `<path d="M120 60 A160 160 0 0 1 300 70" fill="none" stroke="rgba(245,243,238,.35)" stroke-width="10" stroke-linecap="round" opacity=".25"/>`;
    disco.innerHTML = s;
    const caixa = disco.parentElement;
    new IntersectionObserver(([e]) => caixa.classList.toggle("tocando", e.isIntersecting)).observe(caixa);
  }

  const corDe = (el) => getComputedStyle(el).getPropertyValue("--cor").trim();

  // Odisseia: the twelve islands around the wheel, Ithaca at the Ascendant.
  const roda = document.getElementById("roda");
  if (roda) {
    let s = `<circle cx="300" cy="300" r="250" fill="none" stroke="rgba(245,243,238,.14)"/>`;
    s += `<circle cx="300" cy="300" r="180" fill="none" stroke="rgba(245,243,238,.08)"/>`;
    for (let i = 0; i < 12; i++) {
      const t = Math.PI - (i / 12) * Math.PI * 2;
      const x = 300 + Math.cos(t) * 250, y = 300 + Math.sin(t) * 250;
      const tx = 300 + Math.cos(t) * 212, ty = 300 + Math.sin(t) * 212;
      s += `<circle cx="${x}" cy="${y}" r="${i === 0 ? 9 : 5}" fill="${i === 0 ? corDe(roda) : "#F5F3EE"}"/>`;
      s += `<text x="${tx}" y="${ty}" fill="#8E8C9C" font-size="16" font-family="Schibsted Grotesk" text-anchor="middle" dominant-baseline="central">${i + 1}</text>`;
    }
    s += `<text x="300" y="292" fill="#F5F3EE" font-size="44" font-weight="600" font-family="Schibsted Grotesk" text-anchor="middle" letter-spacing="-1.5">Ítaca</text>`;
    s += `<text x="300" y="330" fill="#8E8C9C" font-size="16" font-family="Schibsted Grotesk" text-anchor="middle">uma volta pelo zodíaco</text>`;
    roda.innerHTML = s;
  }

  // Espelho de duas: two wheels facing each other across a mirror, with the threads between them.
  const espelho = document.getElementById("espelho-svg");
  if (espelho) {
    const polar = (cx, r, g) => [cx + Math.cos(g * Math.PI / 180) * r, 200 + Math.sin(g * Math.PI / 180) * r];
    const rodaE = (cx) => `<g class="roda-e" style="stroke:var(--cor)" fill="none" stroke-opacity=".5"><circle cx="${cx}" cy="200" r="118"/><circle cx="${cx}" cy="200" r="92" stroke-opacity=".3"/>`
      + Array.from({ length: 12 }, (_, i) => { const [x1, y1] = polar(cx, 92, i * 30), [x2, y2] = polar(cx, 118, i * 30); return `<path d="M${x1} ${y1} L${x2} ${y2}"/>`; }).join("") + "</g>";
    const angA = [40, 95, 140, 195, 235, 280, 320];
    const A = angA.map((g) => polar(150, 64, g)), B = angA.map((g) => polar(290, 64, 180 - g));
    const fios = [[0, 0, 1], [2, 3, 1], [5, 5, 1], [3, 1, 1], [1, 4, 0], [6, 2, 0]];
    let s = `<defs><linearGradient id="vidro" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="370"><stop offset="0" stop-color="#C9D6EE" stop-opacity="0"/><stop offset=".5" stop-color="#C9D6EE" stop-opacity=".7"/><stop offset="1" stop-color="#C9D6EE" stop-opacity="0"/></linearGradient></defs>`;
    s += rodaE(150) + rodaE(290);
    s += `<path d="M220 30 L220 370" stroke="url(#vidro)" stroke-width="1.5"/>`;
    s += fios.map(([a, b, une], k) => `<path class="fio" pathLength="1" style="--d:${.6 + k * .18}s" d="M${A[a].join(" ")} Q220 ${200 + (k % 2 ? -1 : 1) * (30 + k * 12)} ${B[b].join(" ")}" fill="none" stroke="${une ? "#C9D6EE" : "#FF8FB8"}" stroke-width="1.3" ${une ? "" : 'stroke-dasharray="4 5"'} stroke-opacity=".85"/>`).join("");
    s += A.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#F5F3EE"/>`).join("") + B.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" style="fill:var(--cor);filter:drop-shadow(0 0 6px var(--cor))"/>`).join("");
    s += `<text x="150" y="352" fill="#8E8C9C" font-size="15" font-family="Schibsted Grotesk" text-anchor="middle">você</text><text x="290" y="352" fill="#8E8C9C" font-size="15" font-family="Schibsted Grotesk" text-anchor="middle">a outra pessoa</text>`;
    espelho.innerHTML = s;
  }

  // O Júri do céu: six planets in a half circle vote three to three; the tie is the visitor's to break.
  const tribunal = document.getElementById("tribunal-svg");
  if (tribunal) {
    const glifos = ["☉", "☽", "☿", "♀", "♂", "♃"], votos = [1, 0, 0, 1, 1, 0];
    const COR_VOTO = ["#8AB4FF", "#FFB547"];      // contra, a favor: the Júri app's own colours
    let s = `<path d="M40 300 A180 180 0 0 1 400 300" fill="none" style="stroke:var(--cor)" stroke-opacity=".35"/><path d="M40 300 L400 300" stroke="#F5F3EE" stroke-opacity=".12"/>`;
    const lugares = glifos.map((_, i) => { const t = (195 + i * 30) * Math.PI / 180; return [220 + Math.cos(t) * 180, 300 + Math.sin(t) * 180]; });
    s += lugares.map(([x, y], i) => `<path d="M${x} ${y} L220 262" stroke="${COR_VOTO[votos[i]]}" stroke-opacity=".28"/>`).join("");
    s += lugares.map(([x, y], i) => `<g class="assento" style="--d:${.2 + i * .12}s"><circle cx="${x}" cy="${y}" r="24" fill="#05060A" stroke="${COR_VOTO[votos[i]]}" stroke-width="1.5"/><text x="${x}" y="${y + 7}" fill="#F5F3EE" font-size="21" text-anchor="middle">${glifos[i]}︎</text></g>`).join("");
    s += `<text x="220" y="215" fill="#F5F3EE" font-size="46" font-weight="600" font-family="Schibsted Grotesk" text-anchor="middle" letter-spacing="-1.5">3 a 3</text>`;
    s += `<path class="minerva" d="M220 246 L225 257 L236 262 L225 267 L220 278 L215 267 L204 262 L215 257Z" style="fill:var(--cor);filter:drop-shadow(0 0 8px var(--cor))"/>`;
    s += `<text x="220" y="332" fill="#8E8C9C" font-size="15" font-family="Schibsted Grotesk" text-anchor="middle"><tspan fill="#FFB547">3 a favor</tspan> · <tspan fill="#8AB4FF">3 contra</tspan></text>`;
    s += `<text x="220" y="358" fill="#8E8C9C" font-size="16" font-family="Schibsted Grotesk" text-anchor="middle">o voto de Minerva é seu</text>`;
    tribunal.innerHTML = s;
  }

  // Each product is a place in the sky: a constellation drawn in stars, with its own name.
  const seq = (n) => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
  const lua = (() => {
    const fora = Array.from({ length: 7 }, (_, i) => { const t = (105 + i * 25) * Math.PI / 180; return [200 + Math.cos(t) * 100, 120 + Math.sin(t) * 100]; });
    const dentro = [135, 180, 225].map((g) => { const t = g * Math.PI / 180; return [245 + Math.cos(t) * 80, 120 + Math.sin(t) * 80]; });
    return { pts: [...fora, ...dentro], arestas: [...seq(7), [0, 7], [7, 8], [8, 9], [9, 6]] };
  })();
  const LUGARES = {
    jornada: { nome: "A Jornada", figura: "A Trilha", pts: [[20, 205], [85, 170], [140, 195], [200, 135], [255, 158], [305, 85], [380, 35]], arestas: seq(7) },
    musica: { nome: "Música Astral", figura: "A Onda", pts: [[20, 120], [68, 62], [116, 120], [164, 178], [212, 120], [260, 62], [308, 120], [356, 178]], arestas: seq(8) },
    semana: { nome: "A energia da semana", figura: "A Lua", ...lua },
    espelho: { nome: "Espelho de duas", figura: "O Espelho", pts: [[60, 40], [140, 80], [170, 150], [110, 205], [40, 140], [340, 40], [260, 80], [230, 150], [290, 205], [360, 140]], arestas: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 6], [6, 7], [7, 8], [8, 9], [9, 5], [2, 7]] },
    juri: { nome: "O Júri do céu", figura: "A Balança", pts: [[200, 30], [200, 215], [70, 70], [330, 70], [30, 150], [110, 150], [290, 150], [370, 150], [150, 215], [250, 215]], arestas: [[0, 1], [2, 3], [2, 4], [2, 5], [4, 5], [3, 6], [3, 7], [6, 7], [8, 9]] },
    sonhos: { nome: "Sonhos no Mapa", figura: "A Mandala", pts: [[200, 120], [200, 25], [267, 53], [295, 120], [267, 187], [200, 215], [133, 187], [105, 120], [133, 53]], arestas: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1], [0, 1], [0, 3], [0, 5], [0, 7]] },
    leituras: { nome: "Leituras", figura: "O Livro", pts: [[50, 60], [125, 42], [200, 70], [275, 42], [350, 60], [350, 192], [275, 174], [200, 205], [125, 174], [50, 192]], arestas: [...seq(10), [9, 0], [2, 7]] },
    odisseia: { nome: "Odisseia", figura: "O Navio", pts: [[60, 160], [340, 160], [295, 212], [105, 212], [200, 160], [200, 25], [292, 135], [200, 135]], arestas: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7]] },
    atendimento: { nome: "Com o Eduardo", figura: "O Encontro", pts: [[130, 85], [88, 145], [172, 145], [100, 212], [160, 212], [270, 85], [228, 145], [312, 145], [240, 212], [300, 212], [200, 40]], arestas: [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [6, 8], [7, 9], [0, 10], [10, 5]] },
  };
  const cenas = [...document.querySelectorAll("main > section.cena[data-tom]")];
  const passagens = cenas.map((sec, i) => {
    const L = LUGARES[sec.dataset.tom];
    const div = document.createElement("div");
    div.className = "passagem";
    div.dataset.tom = sec.dataset.tom;
    div.setAttribute("aria-hidden", "true");
    div.innerHTML = `<div class="figura"><svg viewBox="0 0 400 240">`
      + L.arestas.map(([u, v], k) => `<path pathLength="1" style="transition-delay:${.5 + k * .12}s" d="M${L.pts[u].join(" ")} L${L.pts[v].join(" ")}"/>`).join("")
      + L.pts.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${k % 3 ? 3.2 : 5}" style="transition-delay:${k * .07}s"/>`).join("")
      + `</svg><p class="placa"><span>Constelação ${i + 1} de ${cenas.length}</span>${L.figura}</p></div>`;
    sec.before(div);
    return div;
  });

  // The galaxy map: a dot for every place, the one in view lit up.
  const mapa = document.createElement("nav");
  mapa.className = "galaxia";
  mapa.setAttribute("aria-label", "Onde você está no site");
  mapa.innerHTML = `<ol>${cenas.map((sec) => `<li data-tom="${sec.dataset.tom}"><a href="#${sec.id}" aria-label="${LUGARES[sec.dataset.tom].nome}"></a></li>`).join("")}</ol><span class="aqui"></span>`;
  document.body.append(mapa);
  const aqui = mapa.querySelector(".aqui");
  let lugar = null;
  function chegar(tom) {
    lugar = tom;
    mapa.classList.toggle("aberta", !!tom);
    mapa.querySelectorAll("li").forEach((li) => {
      const a = li.firstChild, sim = li.dataset.tom === tom;
      li.classList.toggle("atual", sim);
      sim ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current");
    });
    if (tom) { aqui.textContent = LUGARES[tom].nome; aqui.dataset.tom = tom; }
  }

  // Entrances, and the sky's glow takes the colour of the section in view.
  if ("IntersectionObserver" in window) {
    if (!calma) {
      document.documentElement.classList.add("anima");
      document.querySelectorAll(".guia h2, .guia .lead, .portas li, .cena .gigante, .cena .selo, .cena .lead, .trilha li, .precos div, .lista, .leitura, .oferta, .produto, .disco, .roda, .espelho-arte, .tribunal-arte, .sonhos-arte, .semana, blockquote")
        .forEach((el) => {
          el.classList.add("revelar");
          const irmaos = [...el.parentElement.children].filter((c) => c.tagName === el.tagName);
          if (irmaos.length > 1) el.style.setProperty("--atraso", `${irmaos.indexOf(el) * .09}s`);
        });
    }
    const ver = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visivel"); ver.unobserve(e.target); }
    }), { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll(".revelar, .passagem").forEach((el) => ver.observe(el));

    const nebulosa = document.getElementById("nebulosa");
    const tom = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      nebulosa.style.setProperty("--tom", e.target.dataset.tom ? corDe(e.target) : "#FFB547");
      chegar(e.target.dataset.tom || null);
    }), { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll("main > section, .passagem").forEach((el) => tom.observe(el));
  }

  // The dome: a starfield that turns with time and scroll around a pole below the horizon.
  const ceu = document.getElementById("ceu");
  if (!ceu) return;
  const ctx = ceu.getContext("2d");
  let w, h, dpr, estrelas = [], cadentes = [], proxima = performance.now() + 3000;
  // Mostly white, with the real colours of blue, yellow, orange and red stars.
  const CORES = ["#F5F3EE", "#F5F3EE", "#F5F3EE", "#F5F3EE", "#F5F3EE", "#BFD4FF", "#8AB4FF", "#FFE2A0", "#FFB547", "#FF8FB8", "#B9A6FF", "#7FE8D2"];
  let semente = 7;
  const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  function montar() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    ceu.width = w * dpr; ceu.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    semente = 7; estrelas = [];
    // Stars fill only the ring that can ever cross the screen as it turns around the pole below.
    const r0 = h * .35, r1 = Math.hypot(w / 2, h * 1.35);
    const n = Math.round(Math.min(3200, (Math.PI * (r1 * r1 - r0 * r0)) / 1400));
    for (let i = 0; i < n; i++) {
      const brilho = rnd();
      estrelas.push({
        a: rnd() * Math.PI * 2, r: Math.sqrt(rnd() * (r1 * r1 - r0 * r0) + r0 * r0),
        t: brilho > .985 ? 2.2 : brilho > .9 ? 1.4 : .9, o: .4 + rnd() * .55, p: rnd() * 6,
        c: CORES[Math.floor(rnd() * CORES.length)],
        z: .75 + rnd() * .5,          // depth: near stars turn faster with scroll
        v: .5 + rnd(),                // own twinkle speed
        k: i % 3 === 0,               // one star in three takes the colour of the place
      });
    }
  }
  // Every place has its own sky; the values glide from one place to the next.
  const CALMO = { fluxo: 0, pulso: 0, onda: 0, po: 0, tam: 1, ritmo: 1 };
  const CEUS = {
    jornada: { fluxo: 1 },                  // the stars walk
    musica: { pulso: 1 },                   // the sky beats
    semana: { ritmo: .35, tam: 1.1 },       // slow, like the Moon
    espelho: { ritmo: .6, tam: 1.15 },      // a held breath, mirrored
    juri: { ritmo: .25, pulso: .35 },       // the court in session: slow, with a low heartbeat
    leituras: { po: 1, tam: 1.3 },          // closer stars and falling dust
    odisseia: { onda: 1 },                  // the sea
    atendimento: { ritmo: .3 },             // quiet
  };
  const P = { ...CALMO };
  const CORES_LUGAR = Object.fromEntries(passagens.map((d) => [d.dataset.tom, corDe(d)]));
  const tinta = { cor: null, m: 0 };
  const po = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: .00003 + Math.random() * .00006, f: Math.random() * 6, c: Math.random() < .5 ? "#FFB547" : "#FF8FB8", t: .6 + Math.random() * 1.2 }));
  // The crossing: strongest just above each constellation, gone by the time it is drawn.
  function dobra() {
    let k = 0;
    for (const d of passagens) {
      const r = d.getBoundingClientRect();
      const x = Math.abs(r.top + r.height * .08 - h / 2) / (h * .5);
      if (x < 1) k = Math.max(k, (1 - x * x) ** 2);
    }
    return k;
  }
  let giro = 0, alvo = 0, inicio = performance.now(), ultimo = inicio, fluxo = 0, piscar = 0;
  function quadro(agora) {
    const dt = Math.min(50, agora - ultimo); ultimo = agora;
    alvo = scrollY / 2600;
    giro += (alvo - giro) * .08;
    const quer = { ...CALMO, ...(lugar && CEUS[lugar]) };
    for (const k in P) P[k] = calma ? quer[k] : P[k] + (quer[k] - P[k]) * .035;
    const corLugar = lugar ? CORES_LUGAR[lugar] : null;
    if (tinta.cor !== corLugar) { tinta.m -= calma ? 1 : .04; if (tinta.m <= 0) { tinta.m = 0; tinta.cor = corLugar; } }
    else if (tinta.cor) tinta.m = Math.min(1, tinta.m + (calma ? 1 : .02));
    const deriva = calma ? 0 : (agora - inicio) / 240000;
    if (!calma) { fluxo += dt * P.fluxo / 30000; piscar += dt * P.ritmo; }
    const k = calma ? 0 : dobra();
    const batida = calma ? 0 : P.pulso * (1 - ((agora % 625) / 625)) ** 3;
    ctx.clearRect(0, 0, w, h);
    const px = w / 2, py = h * 1.35, cx = w / 2, cy = h / 2;
    ctx.lineCap = "round";
    for (const e of estrelas) {
      const ang = e.a + deriva + fluxo * e.z + giro * e.z;
      let x = px + Math.cos(ang) * e.r, y = py + Math.sin(ang) * e.r;
      if (P.onda > .01) y += Math.sin(x / 140 + agora / 1400) * 12 * P.onda;
      if (x < -8 || x > w + 8 || y < -8 || y > h + 8) continue;
      const pisca = calma ? 1 : .55 + .45 * Math.sin((piscar / 700) * e.v + e.p);
      const brilho = e.o * pisca * (1 - .4 * P.pulso + .7 * batida);
      const tam = e.t * P.tam;
      const tingida = e.k && tinta.m > 0;
      if (k > .01) {
        // warp: every star stretches away from the centre of the screen
        const dx = (x - cx) * k * .32, dy = (y - cy) * k * .32;
        ctx.globalAlpha = Math.min(1, brilho * (1 + k));
        ctx.strokeStyle = tingida && tinta.m > .5 ? tinta.cor : e.c;
        ctx.lineWidth = tam * 1.3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
        continue;
      }
      ctx.globalAlpha = brilho * (tingida ? 1 - tinta.m : 1);
      ctx.fillStyle = e.c;
      ctx.beginPath(); ctx.arc(x, y, tam, 0, 7); ctx.fill();
      if (tingida) {
        ctx.globalAlpha = brilho * tinta.m;
        ctx.fillStyle = tinta.cor;
        ctx.beginPath(); ctx.arc(x, y, tam, 0, 7); ctx.fill();
      }
      if (e.t > 2) {
        // the brightest stars sparkle with a small cross
        const l = 4 + 6 * pisca;
        ctx.globalAlpha = brilho * .5;
        ctx.fillRect(x - l, y - .5, l * 2, 1);
        ctx.fillRect(x - .5, y - l, 1, l * 2);
      }
    }
    if (P.po > .01) {
      for (const g of po) {
        g.y += g.v * dt; if (g.y > 1.02) { g.y = -.02; g.x = Math.random(); }
        ctx.globalAlpha = .7 * P.po * (.5 + .5 * Math.sin(agora / 900 + g.f));
        ctx.fillStyle = g.c;
        ctx.beginPath(); ctx.arc(g.x * w + Math.sin(agora / 2000 + g.f) * 14, g.y * h, g.t, 0, 7); ctx.fill();
      }
    }
    if (!calma) {
      if (agora > proxima) {
        const ang = Math.PI * (.12 + Math.random() * .16) * (Math.random() < .5 ? 1 : -1);
        const vel = (w + h) / 900;
        cadentes.push({ x: w * (.15 + Math.random() * .7), y: h * Math.random() * .45, vx: Math.cos(ang) * vel * (ang > 0 ? 1 : -1), vy: Math.abs(Math.sin(ang)) * vel, ini: agora });
        proxima = agora + 5000 + Math.random() * 9000;
      }
      cadentes = cadentes.filter((c) => agora - c.ini < 1100);
      for (const c of cadentes) {
        const t = agora - c.ini, vida = Math.sin((t / 1100) * Math.PI);
        const x = c.x + c.vx * t, y = c.y + c.vy * t;
        const g = ctx.createLinearGradient(x, y, x - c.vx * 160, y - c.vy * 160);
        g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = vida; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - c.vx * 160, y - c.vy * 160); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (!calma || Math.abs(alvo - giro) > 1e-4) requestAnimationFrame(quadro);
    else parado = true;
  }
  let parado = false;
  montar();
  requestAnimationFrame(quadro);
  addEventListener("resize", () => { montar(); if (parado) { parado = false; requestAnimationFrame(quadro); } });
  if (calma) addEventListener("scroll", () => { if (parado) { parado = false; requestAnimationFrame(quadro); } }, { passive: true });
})();
