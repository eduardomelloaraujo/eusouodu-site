(() => {
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  // Today's Moon in the HUD, same reckoning as the home page.
  const SINODICO = 29.530588853, LUA_NOVA = Date.UTC(2000, 0, 6, 18, 14);
  const f = ((((Date.now() - LUA_NOVA) / 864e5) % SINODICO + SINODICO) % SINODICO) / SINODICO;
  const fase = f < .03 || f > .97 ? "Lua nova" : f < .22 ? "Lua crescente" : f < .28 ? "Quarto crescente" : f < .47 ? "Crescente gibosa"
    : f < .53 ? "Lua cheia" : f < .72 ? "Minguante gibosa" : f < .78 ? "Quarto minguante" : "Lua minguante";
  const data = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
  $("hud-hoje").innerHTML = `Viagem guiada · <b>${data}</b> · ${fase}`;

  const PORTAS = [
    ["jornada", "A Jornada", "#8AB4FF"], ["musica", "Música Astral", "#FFB547"], ["espelho", "Espelho de duas", "#C9D6EE"], ["juri", "O Júri do céu", "#FF7A5C"],
    ["sonhos", "Sonhos no Mapa", "#C7A8FF"], ["semana", "A energia da semana", "#B9A6FF"], ["leituras", "Mitologia e livros", "#FF8FB8"], ["odisseia", "Odisseia", "#5FE0C5"], ["atendimento", "Com o Eduardo", "#FFE2A0"],
  ];

  // Arrival: eight doors orbiting today's Moon, like a planetarium console.
  const orb = $("orbitas");
  if (orb) {
    let s = "";
    [120, 170, 220, 270].forEach((r, i) => {
      s += `<circle cx="300" cy="300" r="${r}" fill="none" stroke="#F5F3EE" stroke-opacity="${.16 - i * .025}"/>`;
    });
    s += `<g class="giro" style="--t:240s">` + Array.from({ length: 72 }, (_, i) => {
      const a = i * 5 * Math.PI / 180, r1 = i % 6 ? 284 : 278, r2 = 292;
      return `<path d="M${300 + Math.cos(a) * r1} ${300 + Math.sin(a) * r1} L${300 + Math.cos(a) * r2} ${300 + Math.sin(a) * r2}" stroke="#F5F3EE" stroke-opacity="${i % 6 ? .18 : .4}"/>`;
    }).join("") + `</g>`;
    PORTAS.forEach(([, , cor], i) => {
      const r = [120, 170, 220, 270][i % 4], a = (i * 137.5) % 360;
      s += `<g class="giro" style="--t:${60 + (i % 4) * 30}s;animation-direction:${i % 2 ? "reverse" : "normal"}"><g transform="rotate(${a} 300 300)"><circle cx="${300 + r}" cy="300" r="${i < 4 ? 7 : 5}" fill="${cor}" style="filter:drop-shadow(0 0 8px ${cor})"/></g></g>`;
    });
    // the Moon at the centre, lit as seen from the southern hemisphere
    const R = 64, c = 300, crescente = f < .5, k = Math.cos(f * 2 * Math.PI), rx = Math.abs(k) * R;
    s += `<circle cx="${c}" cy="${c}" r="${R}" fill="#1B1D2A"/><path d="M${c} ${c - R} A${R} ${R} 0 0 ${crescente ? 0 : 1} ${c} ${c + R} A${rx} ${R} 0 0 ${(k > 0) === crescente ? 1 : 0} ${c} ${c - R}Z" fill="#F5F3EE"/>`;
    orb.innerHTML = s;
  }

  // Each door keeps the constellation it has on the home page.
  const seq = (n) => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
  const lua = (() => {
    const fora = Array.from({ length: 7 }, (_, i) => { const t = (105 + i * 25) * Math.PI / 180; return [200 + Math.cos(t) * 100, 120 + Math.sin(t) * 100]; });
    const dentro = [135, 180, 225].map((g) => { const t = g * Math.PI / 180; return [245 + Math.cos(t) * 80, 120 + Math.sin(t) * 80]; });
    return { pts: [...fora, ...dentro], arestas: [...seq(7), [0, 7], [7, 8], [8, 9], [9, 6]] };
  })();
  const FIGURAS = {
    jornada: { pts: [[20, 205], [85, 170], [140, 195], [200, 135], [255, 158], [305, 85], [380, 35]], arestas: seq(7) },
    musica: { pts: [[20, 120], [68, 62], [116, 120], [164, 178], [212, 120], [260, 62], [308, 120], [356, 178]], arestas: seq(8) },
    espelho: { pts: [[60, 40], [140, 80], [170, 150], [110, 205], [40, 140], [340, 40], [260, 80], [230, 150], [290, 205], [360, 140]], arestas: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 6], [6, 7], [7, 8], [8, 9], [9, 5], [2, 7]] },
    juri: { pts: [[200, 30], [200, 215], [70, 70], [330, 70], [30, 150], [110, 150], [290, 150], [370, 150], [150, 215], [250, 215]], arestas: [[0, 1], [2, 3], [2, 4], [2, 5], [4, 5], [3, 6], [3, 7], [6, 7], [8, 9]] },
    sonhos: { pts: [[200, 120], [200, 25], [267, 53], [295, 120], [267, 187], [200, 215], [133, 187], [105, 120], [133, 53]], arestas: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1], [0, 1], [0, 3], [0, 5], [0, 7]] },
    semana: lua,
    leituras: { pts: [[50, 60], [125, 42], [200, 70], [275, 42], [350, 60], [350, 192], [275, 174], [200, 205], [125, 174], [50, 192]], arestas: [...seq(10), [9, 0], [2, 7]] },
    odisseia: { pts: [[60, 160], [340, 160], [295, 212], [105, 212], [200, 160], [200, 25], [292, 135], [200, 135]], arestas: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7]] },
    atendimento: { pts: [[130, 85], [88, 145], [172, 145], [100, 212], [160, 212], [270, 85], [228, 145], [312, 145], [240, 212], [300, 212], [200, 40]], arestas: [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [6, 8], [7, 9], [0, 10], [10, 5]] },
  };
  document.querySelectorAll("svg[data-figura]").forEach((svg) => {
    const F = FIGURAS[svg.dataset.figura];
    svg.innerHTML = F.arestas.map(([u, v], k) => `<path pathLength="1" style="transition-delay:${.3 + k * .1}s" d="M${F.pts[u].join(" ")} L${F.pts[v].join(" ")}"/>`).join("")
      + F.pts.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${k % 3 ? 3.2 : 5}" style="transition-delay:${k * .06}s"/>`).join("");
  });

  // Telemetry: one dot per door, the one in view lit.
  const tele = $("telemetria"), texto = $("telemetria-texto");
  $("telemetria-pontos").innerHTML = PORTAS.map(([id, nome, cor]) => `<li data-id="${id}" style="--cor:${cor}"><a href="#${id}" aria-label="${nome}"></a></li>`).join("");
  const estacoes = [...document.querySelectorAll(".estacao")];
  if (!calma && "IntersectionObserver" in window) document.documentElement.classList.add("anima");

  function chegar(est) {
    const i = estacoes.indexOf(est), [, nome, cor] = PORTAS[i];
    estacoes.forEach((e, j) => { e.classList.toggle("aqui", j === i); if (j <= i) e.classList.add("passou"); });
    tele.querySelectorAll("li").forEach((li, j) => {
      li.classList.toggle("atual", j === i);
      j === i ? li.firstChild.setAttribute("aria-current", "location") : li.firstChild.removeAttribute("aria-current");
    });
    texto.textContent = `Porta ${String(i + 1).padStart(2, "0")} de ${String(PORTAS.length).padStart(2, "0")} · ${nome}`;
    document.documentElement.style.setProperty("--tom", cor);
  }
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && chegar(e.target)), { rootMargin: "-45% 0px -45% 0px" });
    estacoes.forEach((e) => obs.observe(e));
  } else estacoes.forEach((e) => e.classList.add("passou"));

  // The rail fills with the scroll, and the telemetry shows only during the journey.
  const viagem = $("viagem"), luz = $("trilho-luz");
  let pedido = false;
  function rolar() {
    pedido = false;
    const r = viagem.getBoundingClientRect(), h = innerHeight;
    const p = Math.min(1, Math.max(0, (h * .5 - r.top) / r.height));
    luz.style.setProperty("--p", p.toFixed(4));
    tele.classList.toggle("aberta", r.top < h * .5 && r.bottom > h * .5);
    if (r.top > h * .5) document.documentElement.style.setProperty("--tom", "#FFB547");
  }
  addEventListener("scroll", () => { if (!pedido) { pedido = true; requestAnimationFrame(rolar); } }, { passive: true });
  addEventListener("resize", rolar);
  rolar();

  // The compass: a wish becomes a starting door.
  const resposta = $("bussola-resposta");
  document.querySelectorAll(".intencoes button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".intencoes button").forEach((o) => o.setAttribute("aria-pressed", o === b));
    estacoes.forEach((e) => e.classList.toggle("escolhida", e.id === b.dataset.ir));
    const [, nome] = PORTAS.find(([id]) => id === b.dataset.ir);
    resposta.textContent = `Seu ponto de partida: ${nome}. Levando você até lá.`;
    $(b.dataset.ir).scrollIntoView({ behavior: calma ? "auto" : "smooth", block: "start" });
  }));
  document.querySelectorAll(".intencoes button").forEach((b) => b.setAttribute("aria-pressed", "false"));

  // A still sky, seeded so it is the same on every visit; it drifts a little with the scroll.
  const cv = $("ceu"), cx = cv.getContext("2d");
  let estrelas = [], w = 0, h = 0, dpr = 1;
  function montar() {
    dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let s = 20261022;
    const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    estrelas = Array.from({ length: Math.round(w * h / 5200) }, () => ({ x: rnd() * w, y: rnd() * h * 1.4, r: rnd() < .85 ? .5 + rnd() * .8 : 1.3 + rnd(), a: .25 + rnd() * .6, z: .15 + rnd() * .5 }));
  }
  function pintar() {
    cx.clearRect(0, 0, w, h);
    const y0 = calma ? 0 : scrollY;
    for (const e of estrelas) {
      const y = ((e.y - y0 * e.z * .25) % (h * 1.4) + h * 1.4) % (h * 1.4);
      if (y > h) continue;
      cx.globalAlpha = e.a; cx.fillStyle = "#F5F3EE";
      cx.beginPath(); cx.arc(e.x, y, e.r, 0, 6.283); cx.fill();
    }
  }
  montar(); pintar();
  addEventListener("resize", () => { montar(); pintar(); });
  if (!calma) addEventListener("scroll", () => requestAnimationFrame(pintar), { passive: true });
})();
