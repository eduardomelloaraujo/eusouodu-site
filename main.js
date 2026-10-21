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

  // Passages: between two sections, a constellation fading from one product's colour to the next.
  const cenas = [...document.querySelectorAll("main > section.cena[data-tom]")];
  cenas.forEach((sec, i) => {
    const de = i ? corDe(cenas[i - 1]) : "#F5F3EE", para = corDe(sec);
    let sem = (i + 3) * 7919;
    const r = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
    const pts = Array.from({ length: 6 }, (_, k) => [40 + k * 184, 18 + r() * 84]);
    const div = document.createElement("div");
    div.className = "passagem";
    div.setAttribute("aria-hidden", "true");
    div.innerHTML = `<svg viewBox="0 0 1000 120"><defs><linearGradient id="pg${i}" gradientUnits="userSpaceOnUse" x1="0" x2="1000"><stop offset="0" stop-color="${de}"/><stop offset="1" stop-color="${para}"/></linearGradient></defs>`
      + `<path pathLength="1" stroke="url(#pg${i})" stroke-opacity=".6" d="M${pts.map((p) => p.join(" ")).join(" L")}"/>`
      + pts.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${k % 3 ? 3 : 4.5}" fill="${k < 3 ? de : para}" style="transition-delay:${.3 + k * .3}s"/>`).join("")
      + `</svg>`;
    sec.before(div);
  });

  // Entrances, and the sky's glow takes the colour of the section in view.
  if ("IntersectionObserver" in window) {
    if (!calma) {
      document.documentElement.classList.add("anima");
      document.querySelectorAll(".guia h2, .guia .lead, .portas li, .cena .gigante, .cena .selo, .cena .lead, .trilha li, .precos div, .lista, .leitura, .oferta, .produto, .disco, .roda, .semana, blockquote")
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
      if (e.isIntersecting) nebulosa.style.setProperty("--tom", e.target.dataset.tom ? corDe(e.target) : "#FFB547");
    }), { rootMargin: "-45% 0px -45% 0px" });
    document.querySelectorAll("main > section").forEach((el) => tom.observe(el));
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
      });
    }
  }
  let giro = 0, alvo = 0, inicio = performance.now();
  function quadro(agora) {
    alvo = scrollY / 2600;
    giro += (alvo - giro) * .08;
    const deriva = calma ? 0 : (agora - inicio) / 240000;
    ctx.clearRect(0, 0, w, h);
    const px = w / 2, py = h * 1.35;
    for (const e of estrelas) {
      const ang = e.a + deriva + giro * e.z;
      const x = px + Math.cos(ang) * e.r, y = py + Math.sin(ang) * e.r;
      if (x < -8 || x > w + 8 || y < -8 || y > h + 8) continue;
      const pisca = calma ? 1 : .55 + .45 * Math.sin((agora / 700) * e.v + e.p);
      ctx.globalAlpha = e.o * pisca;
      ctx.fillStyle = e.c;
      ctx.beginPath(); ctx.arc(x, y, e.t, 0, 7); ctx.fill();
      if (e.t > 2) {
        // the brightest stars sparkle with a small cross
        const l = 4 + 6 * pisca;
        ctx.globalAlpha = e.o * pisca * .5;
        ctx.fillRect(x - l, y - .5, l * 2, 1);
        ctx.fillRect(x - .5, y - l, 1, l * 2);
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
