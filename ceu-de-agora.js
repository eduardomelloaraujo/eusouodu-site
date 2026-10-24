// O céu de agora: os planetas onde estão neste segundo, em 3D, vistos da Terra no centro.
// Carregado sob demanda pelo index.html quando a seção se aproxima; espera window.Astronomy já carregado.
import * as THREE from "./vendor/three.module.min.js";
import { CSS2DRenderer, CSS2DObject } from "./vendor/CSS2DRenderer.js";

// glifos desenhados em traço único (grade 24×24), para não depender da fonte de cada celular
const G = {
  sol: '<circle cx="12" cy="12" r="8.5"/><circle class="p" cx="12" cy="12" r="1.6"/>',
  lua: '<path d="M14 3.5A8.5 8.5 0 1 0 14 20.5A11 11 0 0 1 14 3.5Z"/>',
  mercurio: '<path d="M8.5 2a3.5 3.5 0 0 0 7 0"/><circle cx="12" cy="10" r="4"/><path d="M12 14v7.5M9 18.5h6"/>',
  venus: '<circle cx="12" cy="8.5" r="5.5"/><path d="M12 14v8M8.5 18.5h7"/>',
  marte: '<circle cx="10" cy="14" r="5.5"/><path d="M14 10l6-6M15 4h5v5"/>',
  jupiter: '<path d="M5 7a4 4 0 1 1 6.5 3.1L5 16h14M15 3v18"/>',
  saturno: '<path d="M8 3v15M5 6h6M8 12a4 4 0 0 1 8 0c0 3-3 4-3 6.5 0 1.5 1 2.5 2.5 2.5"/>',
  urano: '<path d="M6 3v10M18 3v10M6 8h12M12 3v13.5"/><circle cx="12" cy="19" r="2.5"/>',
  netuno: '<path d="M5 4v4a7 7 0 0 0 14 0V4M12 3v19M8.5 18h7"/>',
  plutao: '<path d="M6 5.5a6 6 0 0 0 12 0"/><circle cx="12" cy="5.5" r="2.5"/><path d="M12 11.5v10.5M8.5 18h7"/>',
  aries: '<path d="M12 21V9C12 5 9.5 3 7 3S3 5 3 7.5 4.5 11 6 11M12 9c0-4 2.5-6 5-6s4 2 4 4.5-1.5 3.5-3 3.5"/>',
  touro: '<circle cx="12" cy="15" r="5.5"/><path d="M4 3c0 4 3.5 6.5 8 6.5S20 7 20 3"/>',
  gemeos: '<path d="M5 3.5c4 1.5 10 1.5 14 0M5 20.5c4-1.5 10-1.5 14 0M9 4.6v14.8M15 4.6v14.8"/>',
  cancer: '<path d="M4.5 9.5C6.5 6 9 4.5 12 4.5s6 1 8 3"/><circle cx="7" cy="10" r="2.5"/><path d="M19.5 14.5c-2 3.5-4.5 5-7.5 5s-6-1-8-3"/><circle cx="17" cy="14" r="2.5"/>',
  leao: '<circle cx="6.5" cy="15" r="3"/><path d="M9.5 15C9.5 10 8 8.5 8 6.5a4 4 0 0 1 8 0c0 4-3.5 7-3.5 11 0 2 1.5 3.5 3.5 3.5s3-1.2 3-2.5"/>',
  virgem: '<path d="M3 6c1.5 0 2.5 1 2.5 3v12M5.5 9c0-2 1-3 2.5-3s2.5 1 2.5 3v12M10.5 9c0-2 1-3 2.5-3s2.5 1 2.5 3v9c0 2 1.5 3 3.5 3M15.5 14c2.5 0 5 1 5 3.5S18.5 21 15.5 21"/>',
  libra: '<path d="M3 20h18M3 15.5h5a4 4 0 1 1 6 0h7"/>',
  escorpiao: '<path d="M3 6c1.5 0 2.5 1 2.5 3v12M5.5 9c0-2 1-3 2.5-3s2.5 1 2.5 3v12M10.5 9c0-2 1-3 2.5-3s2.5 1 2.5 3v9c0 1.2.8 2 2 2h3.5M18.5 17.5 21 20l-2.5 2.5"/>',
  sagitario: '<path d="M4 20 20 4M12 4h8v8M7 11l6 6"/>',
  capricornio: '<path d="M3 5c1.5 0 2.5 1.5 3 4l2.5 10L12 6c.6-2 3-2 3.5 0l1 7"/><circle cx="17.5" cy="16" r="3"/><path d="M14.5 16c-.8 3-2.5 5-5 5"/>',
  aquario: '<path d="M3 10l3-3 3 3 3-3 3 3 3-3 3 3M3 17l3-3 3 3 3-3 3 3 3-3 3 3"/>',
  peixes: '<path d="M5 3c3.5 2.5 3.5 15.5 0 18M19 3c-3.5 2.5-3.5 15.5 0 18M6.8 12h10.4"/>',
};
const svg = (nome) => `<svg class="g" viewBox="0 0 24 24" aria-hidden="true">${G[nome]}</svg>`;

const SIGNOS = [["Áries", "aries"], ["Touro", "touro"], ["Gêmeos", "gemeos"], ["Câncer", "cancer"], ["Leão", "leao"], ["Virgem", "virgem"],
  ["Libra", "libra"], ["Escorpião", "escorpiao"], ["Sagitário", "sagitario"], ["Capricórnio", "capricornio"], ["Aquário", "aquario"], ["Peixes", "peixes"]];
// ordem geocêntrica clássica: cada um ganha sua própria órbita, assim conjunções não se sobrepõem
// rastro: quanto do caminho recente aparece atrás do planeta, em dias; tom: intensidade da luz projetada
const PLANETAS = [
  { nome: "Lua", corpo: "Moon", g: "lua", raio: .34, tom: .95, rastro: 1 },
  { nome: "Mercúrio", corpo: "Mercury", g: "mercurio", raio: .18, tom: .72, rastro: 6 },
  { nome: "Vênus", corpo: "Venus", g: "venus", raio: .26, tom: .92, rastro: 10 },
  { nome: "Sol", corpo: "Sun", g: "sol", raio: .62, tom: 1, rastro: 10 },
  { nome: "Marte", corpo: "Mars", g: "marte", raio: .22, tom: .7, rastro: 20 },
  { nome: "Júpiter", corpo: "Jupiter", g: "jupiter", raio: .48, tom: .85, rastro: 40 },
  { nome: "Saturno", corpo: "Saturn", g: "saturno", raio: .42, tom: .8, rastro: 60 },
  { nome: "Urano", corpo: "Uranus", g: "urano", raio: .3, tom: .62, rastro: 120 },
  { nome: "Netuno", corpo: "Neptune", g: "netuno", raio: .3, tom: .55, rastro: 120 },
  { nome: "Plutão", corpo: "Pluto", g: "plutao", raio: .16, tom: .5, rastro: 120 },
];
const ASPECTOS = [ // ângulo, orbe, tenso?
  { ang: 60, orbe: 5, tenso: false }, { ang: 90, orbe: 7, tenso: true },
  { ang: 120, orbe: 7, tenso: false }, { ang: 180, orbe: 8, tenso: true },
];
const ORBITA = (i) => 2.6 + i * 1.15;
const ZODIACO = ORBITA(PLANETAS.length) + .6;
const FAIXA = 1.5; // largura da faixa dos signos
const VOLTA_S = 120;
const PONTOS_RASTRO = 40;
const FOV = 36;

const Astronomy = window.Astronomy;
const longitude = (corpo, data) => Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body[corpo], data, true)).elon;
const noAnel = (lon, r, y = 0) => new THREE.Vector3(Math.cos(lon * Math.PI / 180) * r, y, -Math.sin(lon * Math.PI / 180) * r);
const grauMin = (lon) => { const g = lon % 30; return `${Math.floor(g)}°${String(Math.floor((g % 1) * 60)).padStart(2, "0")}'`; };
const sep = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

// as quatro fases principais são instantes; dou a cada uma uma janela de ±7,5° (cerca de meio dia), o resto é intermediário
const nomeFase = (f) => f < 7.5 || f >= 352.5 ? "Lua nova" : f < 82.5 ? "Lua crescente" : f < 97.5 ? "Quarto crescente"
  : f < 172.5 ? "Gibosa crescente" : f < 187.5 ? "Lua cheia" : f < 262.5 ? "Gibosa minguante" : f < 277.5 ? "Quarto minguante" : "Lua minguante";
// Lua desenhada como vista do hemisfério sul: a crescente acende pela esquerda
function luaSvg(fase, k) {
  const esquerda = fase < 180, rx = (10 * Math.abs(1 - 2 * k)).toFixed(2);
  const s1 = esquerda ? 0 : 1, s2 = esquerda === (k < .5) ? 1 : 0;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="var(--lua-sombra)"/>`
    + `<path d="M12 2A10 10 0 0 ${s1} 12 22A${rx} 10 0 0 ${s2} 12 2Z" fill="var(--luz)"/></svg>`;
}
console.assert(Math.floor(longitude("Sun", new Date("2026-10-24T12:00:00Z")) / 30) === 7, "Sol fora de Escorpião em 24/10/2026");
console.assert(nomeFase(163) === "Gibosa crescente" && nomeFase(180) === "Lua cheia", "nomeFase");

// cena
const palco = document.getElementById("ceu-agora-palco");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
palco.appendChild(renderer.domElement);
const rotulos = new CSS2DRenderer();
Object.assign(rotulos.domElement.style, { position: "absolute", inset: 0 });
palco.appendChild(rotulos.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 400);
const LUZ = 0xF5F3EE, SOL = 0xFFB547;

const material = (op) => new THREE.LineBasicMaterial({ color: LUZ, transparent: true, opacity: op, depthWrite: false });
const linha = (pontos, op) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pontos), material(op));
const circulo = (r, op, y = 0) => linha(Array.from({ length: 361 }, (_, i) => noAnel(i, r, y)), op);
const rotulo = (html, classe) => {
  const div = document.createElement("div");
  // o transform do div é do CSS2DRenderer; deslocamentos nossos vão no span de dentro
  div.className = "rot " + classe; div.innerHTML = `<span>${html}</span>`;
  const obj = new CSS2DObject(div); scene.add(obj); return obj;
};

// faixa do zodíaco: um disco quase invisível, as bordas, a régua de graus (1°, 5°, 10°) e as divisões dos signos
const disco = new THREE.Mesh(new THREE.RingGeometry(ZODIACO, ZODIACO + FAIXA, 180, 1),
  new THREE.MeshBasicMaterial({ color: LUZ, transparent: true, opacity: .025, side: THREE.DoubleSide, depthWrite: false }));
disco.rotation.x = -Math.PI / 2;
scene.add(disco, circulo(ZODIACO, .34), circulo(ZODIACO + FAIXA, .18));
const regua = [];
for (let g = 0; g < 360; g++) {
  const tam = g % 30 === 0 ? FAIXA : g % 10 === 0 ? .34 : g % 5 === 0 ? .22 : .1;
  regua.push(noAnel(g, ZODIACO), noAnel(g, ZODIACO + tam));
}
scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(regua), material(.3)));
SIGNOS.forEach(([, g], s) => rotulo(svg(g), "signo").position.copy(noAnel(s * 30 + 15, ZODIACO + FAIXA * .58)));

// a Terra no centro, de onde o céu é visto
scene.add(new THREE.Mesh(new THREE.SphereGeometry(.13, 24, 16), new THREE.MeshBasicMaterial({ color: LUZ })));
scene.add(circulo(.4, .2));
scene.add(new THREE.AmbientLight(LUZ, .2));

const brilho = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,181,71,.85)"); grad.addColorStop(.28, "rgba(255,181,71,.22)"); grad.addColorStop(1, "rgba(255,181,71,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

// faixas de Júpiter e Saturno em tons de branco
const faixas = (tom) => {
  const c = document.createElement("canvas"); c.width = 4; c.height = 64;
  const g = c.getContext("2d"), base = new THREE.Color(LUZ).multiplyScalar(tom);
  for (let y = 0; y < 64; y++) {
    const k = .8 + .2 * Math.sin(y * .9) * Math.sin(y * .23);
    g.fillStyle = `#${base.clone().multiplyScalar(k).getHexString()}`; g.fillRect(0, y, 4, 1);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

const objetos = PLANETAS.map((p, i) => {
  const r = ORBITA(i), ehSol = p.corpo === "Sun";
  scene.add(circulo(r, .07));
  const grupo = new THREE.Group(); scene.add(grupo);
  const cor = new THREE.Color(LUZ).multiplyScalar(p.tom);
  const temFaixa = p.corpo === "Jupiter" || p.corpo === "Saturn";
  const esfera = new THREE.Mesh(new THREE.SphereGeometry(p.raio, 48, 32), ehSol
    ? new THREE.MeshBasicMaterial({ color: SOL })
    : new THREE.MeshStandardMaterial(temFaixa ? { map: faixas(p.tom), roughness: .9 } : { color: cor, roughness: .85 }));
  grupo.add(esfera);
  if (p.corpo === "Saturn") {
    const anel = new THREE.Mesh(new THREE.RingGeometry(p.raio * 1.4, p.raio * 2.25, 72),
      new THREE.MeshStandardMaterial({ color: cor, side: THREE.DoubleSide, transparent: true, opacity: .5, roughness: 1 }));
    anel.rotation.x = -Math.PI / 2 + .45;
    grupo.add(anel);
  }
  let luz = null;
  if (ehSol) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilho, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(4.4); grupo.add(s);
    luz = new THREE.PointLight(SOL, 60, 0, 1.4); scene.add(luz);
  }
  // rastro: o caminho recente, apagando em direção ao passado; no retrógrado ele aponta para a frente do planeta
  const geoRastro = new THREE.BufferGeometry();
  geoRastro.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PONTOS_RASTRO * 3), 3));
  const cores = new Float32Array(PONTOS_RASTRO * 3), c = new THREE.Color(ehSol ? SOL : LUZ);
  for (let k = 0; k < PONTOS_RASTRO; k++) c.clone().multiplyScalar((k / (PONTOS_RASTRO - 1)) ** 1.8 * .75).toArray(cores, k * 3);
  geoRastro.setAttribute("color", new THREE.BufferAttribute(cores, 3));
  scene.add(new THREE.Line(geoRastro, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));
  // fio até o zodíaco e um ponto marcando o grau exato na régua
  const fio = linha([new THREE.Vector3(), new THREE.Vector3()], .12); scene.add(fio);
  const marca = new THREE.Mesh(new THREE.CircleGeometry(.07, 16), new THREE.MeshBasicMaterial({ color: ehSol ? SOL : LUZ, side: THREE.DoubleSide }));
  marca.rotation.x = -Math.PI / 2; scene.add(marca);
  const etiqueta = rotulo(svg(p.g), "planeta" + (ehSol ? " sol" : ""));
  return { ...p, r, grupo, esfera, luz, geoRastro, fio, marca, etiqueta };
});

// teia de aspectos, flutuando abaixo das órbitas como num mapa
const Y_TEIA = -1;
const teia = { tenso: new THREE.LineSegments(new THREE.BufferGeometry(), material(.4)), leve: new THREE.LineSegments(new THREE.BufferGeometry(), material(.15)) };
scene.add(teia.tenso, teia.leve, circulo(ZODIACO - .2, .08, Y_TEIA));

// atualiza tudo para um instante; roda a cada segundo enquanto a seção está na tela
const lista = document.getElementById("ceu-agora-posicoes"), dataEl = document.getElementById("ceu-agora-data"), luaEl = document.getElementById("ceu-agora-lua");
lista.innerHTML = objetos.map((o) => `<li class="${o.corpo === "Sun" ? "sol" : ""}"><span class="ic">${svg(o.g)}</span><span class="nome">${o.nome}</span><span class="onde"></span><span class="retro"></span></li>`).join("");
const linhas = [...lista.children];
function atualizar(agora) {
  const ontem = new Date(agora - 864e5);
  for (const o of objetos) {
    o.lon = longitude(o.corpo, agora);
    // retrógrado: ilusão de ótica vista da Terra, quando a longitude diminui de um dia para o outro
    o.retro = o.corpo !== "Sun" && o.corpo !== "Moon" && ((o.lon - longitude(o.corpo, ontem) + 540) % 360) - 180 < 0;
    const pos = noAnel(o.lon, o.r);
    o.grupo.position.copy(pos);
    o.luz?.position.copy(pos);
    o.etiqueta.position.copy(pos).add(new THREE.Vector3(0, o.raio + .15, 0));
    o.fio.geometry.setFromPoints([noAnel(o.lon, o.r + o.raio + .12), noAnel(o.lon, ZODIACO)]);
    o.marca.position.copy(noAnel(o.lon, ZODIACO, .01));
    const arr = o.geoRastro.attributes.position.array;
    for (let k = 0; k < PONTOS_RASTRO; k++) {
      const t = new Date(+agora - (1 - k / (PONTOS_RASTRO - 1)) * o.rastro * 864e5);
      noAnel(longitude(o.corpo, t), o.r).toArray(arr, k * 3);
    }
    o.geoRastro.attributes.position.needsUpdate = true;
  }
  const tensos = [], leves = [];
  for (let a = 0; a < objetos.length; a++) for (let b = a + 1; b < objetos.length; b++) {
    const asp = ASPECTOS.find((x) => Math.abs(sep(objetos[a].lon, objetos[b].lon) - x.ang) <= x.orbe);
    if (asp) (asp.tenso ? tensos : leves).push(noAnel(objetos[a].lon, ZODIACO - .2, Y_TEIA), noAnel(objetos[b].lon, ZODIACO - .2, Y_TEIA));
  }
  teia.tenso.geometry.setFromPoints(tensos);
  teia.leve.geometry.setFromPoints(leves);

  dataEl.textContent = agora.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) + ", " + agora.toLocaleTimeString("pt-BR");
  const fase = Astronomy.MoonPhase(agora), ilum = Astronomy.Illumination(Astronomy.Body.Moon, agora).phase_fraction;
  luaEl.innerHTML = `${luaSvg(fase, ilum)}<span><b>${nomeFase(fase)}</b>, ${Math.round(ilum * 100)}% iluminada</span>`;
  objetos.forEach((o, i) => {
    linhas[i].querySelector(".onde").textContent = `${SIGNOS[Math.floor(o.lon / 30)][0]} ${grauMin(o.lon)}`;
    linhas[i].querySelector(".retro").textContent = o.retro ? "retrógrado" : "";
  });
}
atualizar(new Date());

// distância da câmera calculada para o anel caber na largura, do celular em pé ao monitor largo
let dist = 30;
function ajustar() {
  const w = palco.clientWidth, h = palco.clientHeight;
  renderer.setSize(w, h); rotulos.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const tanH = Math.tan(FOV * Math.PI / 360) * camera.aspect;
  dist = Math.max(ZODIACO * 2.3, (ZODIACO + FAIXA + .6) / (tanH * .95));
}
new ResizeObserver(ajustar).observe(palco);

// glifos que se encostam na tela sobem um acima do outro, de baixo para cima
const TAM_GLIFO = 22;
function desencostar() {
  const w = palco.clientWidth, h = palco.clientHeight;
  const pts = objetos.map((o) => {
    const v = o.etiqueta.position.clone().project(camera);
    return { o, x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, dy: 0 };
  }).sort((a, b) => b.y - a.y);
  pts.forEach((p, i) => {
    for (let j = 0; j < i; j++) {
      const q = pts[j];
      if (Math.abs(p.x - q.x) < TAM_GLIFO && Math.abs(p.y + p.dy - (q.y + q.dy)) < TAM_GLIFO) p.dy = Math.min(p.dy, q.y + q.dy - TAM_GLIFO - p.y);
    }
    const dy = Math.round(-14 + p.dy);
    if (p.o.dy !== dy) { p.o.dy = dy; p.o.etiqueta.element.firstChild.style.transform = `translateY(${dy}px)`; }
  });
}

const parado = matchMedia("(prefers-reduced-motion: reduce)").matches;
const relogio = new THREE.Clock();
function quadro() {
  const t = relogio.getElapsedTime();
  const a = parado ? .6 : (t / VOLTA_S) * Math.PI * 2;
  camera.position.set(Math.cos(a) * dist * .86, dist * .5, Math.sin(a) * dist * .86);
  camera.lookAt(0, -3, 0); // mira abaixo do centro para o anel subir no quadro e não sobrar vazio em cima
  if (!parado) objetos.forEach((o) => { o.esfera.rotation.y = t * .2; });
  desencostar();
  renderer.render(scene, camera);
  rotulos.render(scene, camera);
}

// fora da tela, a cena e o relógio param, para não gastar bateria
let pulso = null;
new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !pulso) {
    atualizar(new Date());
    pulso = setInterval(() => atualizar(new Date()), 1000);
    renderer.setAnimationLoop(quadro);
  } else if (!e.isIntersecting && pulso) {
    clearInterval(pulso); pulso = null;
    renderer.setAnimationLoop(null);
  }
}).observe(palco);
