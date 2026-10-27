// Leitura viva do mapa (eusouodu.com/leitura): o mapa natal clicável, em que cada planeta, ponto, aspecto e casa fala.
// Cálculo: lib/astro.mjs (Placidus). Texto-base: os textos da Jornada (lib/jornada/mapa.json e transitos.json).
// Voz: Claude escreve a fala em primeira pessoa a partir desses textos, e o ElevenLabs lê. Fala e áudio ficam guardados
// no Redis pela impressão digital do pedido, então o mesmo planeta no mesmo signo e casa só custa uma vez.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import A from './vendor/astronomy.cjs';
import { mapaNatal, longitude, casaDe, signo, grau, wrap360, wrap180, SIGNOS } from './astro.mjs';
import { redis, temBanco, criarToken, lerToken, SITE, enviarEmail } from './jornada.mjs';

export const PRECO = Number(process.env.LEITURA_PRECO || 147);
export const DIAS_ACESSO = 180;
const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const VOZ_PADRAO = process.env.LEITURA_VOZ || '7e2Mgb0ONX81HlM5CxC8'; // a voz do Mercúrio do /comece
// o elenco: cada planeta com a sua voz; nodos, Fortuna, ângulos, casas e aspectos ficam com o Mercúrio, o mensageiro
const ELENCO = {
  sol: 'NFmEzNOony1UsEJGXLth',     // Carlos: encorpada, autoridade calma
  lua: 'hgTbkcw2ddnzYh66cwCI',     // Aninha: feminina, íntima, acolhedora
  merc: '7e2Mgb0ONX81HlM5CxC8',    // Mercúrio do /comece: brincalhão, sorriso na voz
  venus: 'YD2yOZItFdFEh7WxPLnp',   // Juliana Gheno: feminina, profunda, aveludada
  marte: '1XPmm9g18ZjU6XomW1EE',   // Droneiro: firme, rouca, com garra
  jupiter: 'QyWUOLLpCqeUq1ZnuAup', // Leo Antonio: madura, calorosa
  saturno: '7iCLvASfMOr1mwIj7lBW', // Bruno Zulian: barítono grave, austero
  plutao: 'acdKA5HckGxoxxvy40dA',  // Nassif: muito grave, escura
  urano: 'Hxa5Lc2F6BMazHt6XRK8',    // criada no ElevenLabs: elétrica, nítida
  netuno: 'B2hs9FZUbdKQhq16tYkg',   // criada no ElevenLabs: sonhadora, de dentro da água
};
// velocidade de cada voz (1 = normal; o ElevenLabs aceita de 0,7 a 1,2): as vozes lentas andam um pouco mais, para ninguém se perder
const VELOCIDADE = { netuno: 1.2, saturno: 1.06, plutao: 1.06, lua: 1.04, venus: 1.04 };
const VOZES = (() => { try { return { ...ELENCO, ...JSON.parse(process.env.LEITURA_VOZES || '{}') }; } catch { return ELENCO; } })();
// o jeito de falar de cada um, para o texto combinar com a voz
const TOM = {
  sol: 'solene e calmo, frases que assentam, autoridade sem arrogância',
  lua: 'íntima, suave, perto do ouvido, com afeto e memória',
  merc: 'esperto e brincalhão, ritmo rápido, sorriso na voz, sem perder a precisão',
  venus: 'aveludada e lenta, com prazer em cada palavra, sensual sem vulgaridade',
  marte: 'firme e direto, frases curtas, com garra',
  jupiter: 'caloroso e generoso, um mestre que ri, frases largas',
  saturno: 'lento, grave e austero, frases curtas com pausas, nenhum floreio',
  urano: 'elétrico e nítido, com viradas inesperadas de frase',
  netuno: 'sonhadora e suave, imagens de água e névoa, mas com frases que andam: nada de arrastar',
  plutao: 'muito grave e lento, escuro, intenso, perguntas que descem fundo',
};
const MODELO_VOZ = process.env.LEITURA_MODELO_VOZ || 'eleven_multilingual_v2';
export const LIMITE_DIA = 80; // falas novas por pessoa por dia (as já guardadas não contam)

const ler = f => JSON.parse(readFileSync(new URL(`./jornada/${f}`, import.meta.url), 'utf8'));
let TX = null;
const textos = () => TX || (TX = { mapa: ler('mapa.json'), tr: ler('transitos.json') });

export const K = {
  user: e => 'leitura:u:' + String(e).toLowerCase(),
  pago: id => 'leitura:pago:' + id,
  fala: h => 'leitura:fala:' + h,
  uso: (e, dia) => `leitura:uso:${String(e).toLowerCase()}:${dia}`,
};

/* ---------- os pontos do mapa ---------- */
export const PLANETAS = ['sol', 'lua', 'merc', 'venus', 'marte', 'jupiter', 'saturno', 'urano', 'netuno', 'plutao'];
const CORPO = { sol: 'Sun', lua: 'Moon', merc: 'Mercury', venus: 'Venus', marte: 'Mars', jupiter: 'Jupiter', saturno: 'Saturn', urano: 'Uranus', netuno: 'Neptune', plutao: 'Pluto' };
export const NOME = { sol: 'Sol', lua: 'Lua', merc: 'Mercúrio', venus: 'Vênus', marte: 'Marte', jupiter: 'Júpiter', saturno: 'Saturno', urano: 'Urano', netuno: 'Netuno', plutao: 'Plutão', nn: 'Nodo Norte', ns: 'Nodo Sul', fortuna: 'Roda da Fortuna', asc: 'Ascendente', mc: 'Meio do Céu', fc: 'Fundo do Céu', dc: 'Descendente' };
const ART = { sol: 'o Sol', lua: 'a Lua', merc: 'Mercúrio', venus: 'o Vênus', marte: 'Marte', jupiter: 'Júpiter', saturno: 'Saturno', urano: 'Urano', netuno: 'Netuno', plutao: 'Plutão', nn: 'o Nodo Norte', ns: 'o Nodo Sul', fortuna: 'a Roda da Fortuna', asc: 'o Ascendente', mc: 'o Meio do Céu', fc: 'o Fundo do Céu', dc: 'o Descendente' };
const KW = { sol: 'a identidade', lua: 'as emoções', merc: 'o pensamento', venus: 'o afeto', marte: 'o desejo', jupiter: 'a fé', saturno: 'o limite', urano: 'a ruptura', netuno: 'o sonho', plutao: 'a transformação' };
const ASPECTOS = [['conjuncao', 0, 'Conjunção', 8], ['sextil', 60, 'Sextil', 5], ['quadratura', 90, 'Quadratura', 7], ['trigono', 120, 'Trígono', 7], ['oposicao', 180, 'Oposição', 8]];
const ORBE_TRANSITO = { sol: 1.5, lua: 3, merc: 1.5, venus: 1.5, marte: 1.5, jupiter: 2, saturno: 2, urano: 1.5, netuno: 1.5, plutao: 1.5 };

// Nodo médio (a mesma fórmula da Jornada)
const nodoMedio = d => { const T = (d - Date.UTC(2000, 0, 1, 12)) / (36525 * 864e5); return wrap360(125.04452 - 1934.136261 * T + 0.0020708 * T * T); };
const retro = (k, d) => k !== 'sol' && k !== 'lua' && wrap180(longitude(CORPO[k], new Date(+d + 36e5)) - longitude(CORPO[k], d)) < 0;

function aspectos(pontos) {
  const out = [];
  for (let i = 0; i < pontos.length; i++) for (let j = i + 1; j < pontos.length; j++) {
    const [a, la] = pontos[i], [b, lb] = pontos[j];
    const d = Math.abs(wrap180(la - lb));
    for (const [t, ang, nome, orbe] of ASPECTOS) {
      const o = Math.abs(d - ang);
      if (o <= orbe) out.push({ id: `${a}-${b}-${t}`, a, b, t, nome, orbe: +o.toFixed(2) });
    }
  }
  return out.sort((x, y) => x.orbe - y.orbe);
}

// O mapa inteiro, pronto para desenhar a roda e para montar cada fala
export function calcular(p, agora = new Date()) {
  const n = mapaNatal(p);
  const { cuspides, utc } = n, P = n.planetas;
  const ponto = (lon, extra) => ({ lon: +lon.toFixed(4), signo: signo(lon), grau: grau(lon), casa: casaDe(lon, cuspides), ...extra });
  const pts = {};
  for (const k of PLANETAS) pts[k] = ponto(P[CORPO[k]].lon, { retro: P[CORPO[k]].retro });
  const nn = nodoMedio(utc);
  pts.nn = ponto(nn); pts.ns = ponto(wrap360(nn + 180));
  // Roda da Fortuna: de dia (Sol acima do horizonte, casas 7 a 12) Asc + Lua − Sol; de noite, Asc + Sol − Lua
  const dia = pts.sol.casa >= 7;
  pts.fortuna = ponto(wrap360(P.ASC.lon + (dia ? 1 : -1) * (pts.lua.lon - pts.sol.lon)), { diurno: dia });
  pts.asc = ponto(cuspides[0]); pts.dc = ponto(cuspides[6]); pts.mc = ponto(cuspides[9]); pts.fc = ponto(cuspides[3]);

  const asp = aspectos([...PLANETAS, 'asc', 'mc'].map(k => [k, pts[k].lon])).filter(x => !(x.a === 'asc' && x.b === 'mc'));

  // o céu de agora passando por este mapa
  const ceu = {};
  for (const k of PLANETAS) {
    const lon = longitude(CORPO[k], agora);
    const toques = [];
    for (const alvo of [...PLANETAS, 'asc', 'mc', 'nn', 'fortuna']) {
      const d = Math.abs(wrap180(lon - pts[alvo].lon));
      for (const [t, ang, nome] of ASPECTOS) if (Math.abs(d - ang) <= ORBE_TRANSITO[k]) toques.push({ alvo, t, nome, orbe: +Math.abs(d - ang).toFixed(2) });
    }
    ceu[k] = { lon: +lon.toFixed(4), signo: signo(lon), grau: grau(lon), casa: casaDe(lon, cuspides), retro: retro(k, agora), toques: toques.sort((x, y) => x.orbe - y.orbe) };
  }
  return { cuspides: cuspides.map(c => +c.toFixed(4)), pts, asp, ceu, dia: agora.toISOString().slice(0, 10) };
}

/* ---------- os textos-base de cada item ---------- */
const si = s => SIGNOS.indexOf(s);
const pegar = (col, i) => col && (Array.isArray(col) ? col[i] : col[String(i)]);
// o título de cada bloco vem marcado com "## " para a página mostrar como subtítulo
const corpo = x => x ? [(x.title || x.name) && '## ' + (x.title || x.name), ...(x.body || [])].filter(Boolean) : [];
const fonte = k => { const m = textos().mapa; return ['urano', 'netuno', 'plutao'].includes(k) ? m.lentos[k] : m[k]; };
const TR_CASAS = { marte: 'marte', jupiter: 'jupiter', saturno: 'saturno' };

/* ---------- grau, decanato, dignidade, filosofia e livros ---------- */
const SIG = ['aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem', 'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes'];
const REGENTE = ['marte', 'venus', 'merc', 'lua', 'sol', 'merc', 'venus', 'marte', 'jupiter', 'saturno', 'saturno', 'jupiter']; // regentes tradicionais
const CALDEUS = ['marte', 'sol', 'venus', 'merc', 'lua', 'saturno', 'jupiter']; // ordem das faces, começando em Áries 0°
const EXALTA = { sol: 0, lua: 1, merc: 5, venus: 11, marte: 9, jupiter: 3, saturno: 6 };
const MODERNO = { urano: 10, netuno: 11, plutao: 7 };
function dignidade(id, s) {
  if (REGENTE[s] === id || MODERNO[id] === s) return 'domicílio: o planeta está em casa, age com recursos próprios';
  if (EXALTA[id] === s) return 'exaltação: o planeta é recebido como hóspede de honra';
  if (REGENTE[(s + 6) % 12] === id || MODERNO[id] === (s + 6) % 12) return 'exílio: o planeta está longe de casa e precisa aprender outra língua';
  if (EXALTA[id] === (s + 6) % 12) return 'queda: o planeta perde o pedestal e trabalha por baixo';
  return null;
}
const por = a => a.startsWith('o ') ? 'pelo ' + a.slice(2) : a.startsWith('a ') ? 'pela ' + a.slice(2) : 'por ' + a;
export function grauDe(lon, id) {
  const l = wrap360(lon), s = Math.floor(l / 30), g = Math.floor(l % 30), d = Math.floor((l % 30) / 10);
  const face = CALDEUS[Math.floor(l / 10) % 7], tri = (s + 4 * d) % 12;
  return {
    grau: g, minuto: Math.floor((l % 1) * 60), decanato: d + 1,
    face: ART[face], // regente do decanato pela tradição das faces (caldeia)
    triplicidade: `${SIGNOS[tri]}, regido ${por(ART[REGENTE[tri]])}`, // decanato pelo elemento
    critico: g === 0 ? 'grau zero: o começo do signo, energia de quem acabou de chegar' : g === 29 ? 'grau 29, o anarético: o fim do signo, uma maestria que pede despedida' : null,
    dignidade: CORPO[id] && !['urano', 'netuno', 'plutao'].includes(id) || MODERNO[id] != null ? dignidade(id, s) : null,
  };
}
// shortcut: lista curada à mão; obras reais, sem edição específica. Para ampliar, acrescentar aqui.
const LER = {
  sol: { filo: 'Heráclito e o fogo que se transforma sem se apagar; o "torna-te quem tu és" de Píndaro, retomado por Nietzsche', livros: [['O herói de mil faces', 'Joseph Campbell'], ['O eu e o inconsciente', 'C. G. Jung']] },
  lua: { filo: 'Bachelard e a imaginação material da água; a memória do corpo antes da palavra', livros: [['A água e os sonhos', 'Gaston Bachelard'], ['Mulheres que correm com os lobos', 'Clarissa Pinkola Estés']] },
  merc: { filo: 'O Fedro de Platão, sobre a escrita e a memória; Hermes como o deus das passagens e da interpretação', livros: [['Fedro', 'Platão'], ['As núpcias de Cadmo e Harmonia', 'Roberto Calasso']] },
  venus: { filo: 'O Banquete de Platão: Eros como filho da falta e do recurso; a beleza como caminho', livros: [['O Banquete', 'Platão'], ['A arte de amar', 'Erich Fromm']] },
  marte: { filo: 'Simone Weil lendo a Ilíada como o poema da força: quem usa a força também é usado por ela', livros: [['Ilíada', 'Homero'], ['A Ilíada ou o poema da força', 'Simone Weil']] },
  jupiter: { filo: 'A justa medida de Aristóteles: a virtude como meio entre dois excessos; o sentido como horizonte', livros: [['Ética a Nicômaco', 'Aristóteles'], ['O sagrado e o profano', 'Mircea Eliade']] },
  saturno: { filo: 'Os estoicos: distinguir o que depende de nós do que não depende; o tempo como matéria da vida', livros: [['Sobre a brevidade da vida', 'Sêneca'], ['Meditações', 'Marco Aurélio']] },
  urano: { filo: 'Prometeu, que roubou o fogo e pagou por ele; a liberdade como responsabilidade', livros: [['Prometeu acorrentado', 'Ésquilo'], ['Cosmos e psique', 'Richard Tarnas']] },
  netuno: { filo: 'O devaneio em Bachelard; a dissolução do eu nos místicos e nos poetas', livros: [['Livro do desassossego', 'Fernando Pessoa'], ['A poética do devaneio', 'Gaston Bachelard']] },
  plutao: { filo: 'A descida ao mundo de baixo: Perséfone, Orfeu, Dante; o que precisa morrer para algo nascer', livros: [['A divina comédia: Inferno', 'Dante Alighieri'], ['Hino homérico a Deméter', 'tradição grega']] },
  nn: { filo: 'O eterno retorno e a chance de sair do círculo; o destino como direção, não como sentença', livros: [['O mito do eterno retorno', 'Mircea Eliade'], ['A astrologia do destino', 'Liz Greene']] },
  ns: { filo: 'O que já se sabe de cor; a tentação do conhecido em Kierkegaard, que pedia o salto', livros: [['O mito do eterno retorno', 'Mircea Eliade'], ['A astrologia do destino', 'Liz Greene']] },
  fortuna: { filo: 'Boécio na prisão, diante da roda que sobe e desce: o que é nosso quando a sorte gira', livros: [['A consolação da filosofia', 'Boécio']] },
  angulo: { filo: 'A cruz do horizonte e do meridiano: o instante em que o céu encontra a terra', livros: [['As doze casas', 'Howard Sasportas'], ['O herói de mil faces', 'Joseph Campbell']] },
  casa: { filo: 'As casas como os lugares da vida: o céu descido ao chão de cada dia', livros: [['As doze casas', 'Howard Sasportas']] },
  aspecto: { filo: 'Heráclito: a harmonia nasce dos opostos, como a do arco e da lira', livros: [['Fragmentos', 'Heráclito'], ['Cosmos e psique', 'Richard Tarnas']] },
};
const SIGNO_LER = { // um livro por signo, para quem quer ir pelo mito do signo
  aries: ['Os argonautas', 'Apolônio de Rodes'], touro: ['As metamorfoses', 'Ovídio'], gemeos: ['Fedro', 'Platão'], cancer: ['A poética do espaço', 'Gaston Bachelard'],
  leao: ['Assim falou Zaratustra', 'Friedrich Nietzsche'], virgem: ['Os trabalhos e os dias', 'Hesíodo'], libra: ['A República', 'Platão'], escorpiao: ['Édipo rei', 'Sófocles'],
  sagitario: ['Odisseia', 'Homero'], capricornio: ['A consolação da filosofia', 'Boécio'], aquario: ['Prometeu acorrentado', 'Ésquilo'], peixes: ['Livro do desassossego', 'Fernando Pessoa'],
};
const livros = (k, signo) => {
  const l = [...(LER[k] || { livros: [] }).livros];
  const sl = signo && SIGNO_LER[SIG[si(signo)]];
  if (sl && !l.some(x => x[0] === sl[0])) l.push(sl);
  return l.map(([titulo, autor]) => ({ titulo, autor }));
};
const rotDec = gi => `${gi.grau}° · ${gi.decanato}º decanato`;

// devolve o item com o grau, o decanato, a filosofia e os livros juntos
export function item(m, id) {
  const it = itemBase(m, id);
  if (!it) return null;
  const tipo = PLANETAS.includes(id) || ['nn', 'ns', 'fortuna'].includes(id) ? id : ['asc', 'mc', 'fc', 'dc'].includes(id) ? 'angulo' : id.startsWith('casa') ? 'casa' : 'aspecto';
  const lon = m.pts[id] ? m.pts[id].lon : tipo === 'casa' ? m.cuspides[+id.slice(4) - 1] : null;
  const gi = lon == null ? null : grauDe(lon, id);
  it.grau = gi;
  it.filosofia = (LER[tipo] || {}).filo;
  it.livros = livros(tipo, lon == null ? null : signo(lon));
  if (gi) it.sub = it.sub.replace(/^\d+°\d+'/, rotDec(gi));
  it.natal = { ...it.natal, grauDetalhe: gi, filosofia: it.filosofia, livros: it.livros.map(l => `${l.titulo}, de ${l.autor}`) };
  return it;
}

function itemBase(m, id) {
  const { pts, asp, ceu } = m, T = textos();
  const ord = h => `casa ${h}`;
  if (PLANETAS.includes(id)) {
    const p = pts[id], f = fonte(id);
    const sg = pegar(f.signs, si(p.signo)), cs = pegar(f.houses, p.casa - 1);
    const meus = asp.filter(x => x.a === id || x.b === id).slice(0, 4).map(x => `${x.nome.toLowerCase()} com ${ART[x.a === id ? x.b : x.a]}`);
    const c = ceu[id];
    const trCasa = TR_CASAS[id] ? pegar(T.tr[id].houses, c.casa - 1) : ['urano', 'netuno', 'plutao'].includes(id) ? pegar(T.tr.lentos[id], c.casa - 1) : null;
    return {
      titulo: `${NOME[id]} em ${p.signo}`, sub: `${p.grau} · ${ord(p.casa)}${p.retro ? ' · retrógrado' : ''}`,
      base: [...corpo(sg), ...corpo(cs)], pergunta: sg && sg.q,
      natal: { quem: ART[id], tema: KW[id], signo: p.signo, grau: p.grau, casa: p.casa, retro: p.retro, aspectos: meus },
      transito: {
        quem: ART[id], signoHoje: c.signo, grauHoje: c.grau, casaHoje: c.casa, retroHoje: c.retro,
        toques: c.toques.slice(0, 5).map(x => `${x.nome.toLowerCase()} ao ${NOME[x.alvo]} natal (${x.orbe}° de folga)`),
        baseCasa: corpo(trCasa),
      },
    };
  }
  if (id === 'nn' || id === 'ns') {
    const N = T.mapa.nodos, nn = pts.nn, eixo = pegar(N.eixos, si(nn.signo)), cs = pegar(N.houses, nn.casa - 1), p = pts[id];
    return {
      titulo: `${NOME[id]} em ${p.signo}`, sub: `${p.grau} · ${ord(p.casa)}`, base: [...corpo(eixo), ...corpo(cs)], pergunta: eixo && eixo.q,
      natal: { quem: ART[id], tema: id === 'nn' ? 'o caminho que puxa para a frente' : 'o talento pronto, o lugar conhecido', signo: p.signo, grau: p.grau, casa: p.casa, eixo: `Nodo Norte em ${nn.signo} na casa ${nn.casa}, Nodo Sul em ${pts.ns.signo} na casa ${pts.ns.casa}` },
      transito: null,
    };
  }
  if (id === 'fortuna') {
    const p = pts.fortuna, cs = pegar(T.mapa.casas.houses, p.casa - 1);
    return {
      titulo: `Roda da Fortuna em ${p.signo}`, sub: `${p.grau} · ${ord(p.casa)} · mapa ${p.diurno ? 'diurno' : 'noturno'}`,
      base: [`A Roda da Fortuna é um ponto calculado, não um astro: a distância entre o Sol e a Lua, contada a partir do Ascendente. Os antigos liam ali onde o corpo e a sorte se encontram, o lugar em que a vida flui com menos esforço.`, ...corpo(cs)],
      natal: { quem: ART.fortuna, tema: 'onde o corpo e a sorte se encontram', signo: p.signo, grau: p.grau, casa: p.casa, regente: `mapa ${p.diurno ? 'diurno' : 'noturno'}` },
      transito: null,
    };
  }
  if (['asc', 'mc', 'fc', 'dc'].includes(id)) {
    const p = pts[id], casa = { asc: 1, fc: 4, dc: 7, mc: 10 }[id], cs = pegar(T.mapa.casas.houses, casa - 1);
    const dentro = PLANETAS.filter(k => Math.abs(wrap180(pts[k].lon - p.lon)) <= 6).map(k => ART[k]);
    return {
      titulo: `${NOME[id]} em ${p.signo}`, sub: `${p.grau} · começo da casa ${casa}`, base: [...corpo(T.mapa.casas.angulos), ...corpo(cs)], pergunta: cs && cs.q,
      natal: { quem: ART[id], tema: { asc: 'o corpo e o jeito de chegar', fc: 'a raiz, a família, a origem', dc: 'o outro, o par, o espelho', mc: 'a obra, o mundo, a vocação' }[id], signo: p.signo, grau: p.grau, casa, planetasJunto: dentro },
      transito: { quem: ART[id], passando: PLANETAS.filter(k => Math.abs(wrap180(ceu[k].lon - p.lon)) <= 3).map(k => `${ART[k]} em trânsito (${ceu[k].signo})`) },
    };
  }
  let mh = /^casa(\d{1,2})$/.exec(id);
  if (mh) {
    const h = +mh[1], cs = pegar(T.mapa.casas.houses, h - 1), cusp = m.cuspides[h - 1];
    const dentro = PLANETAS.filter(k => pts[k].casa === h);
    return {
      titulo: `Casa ${h}`, sub: `${cs ? cs.name : ''} · começa em ${signo(cusp)}`, base: [...corpo(cs), ...(dentro.length ? [] : corpo(T.mapa.casas.vazia))], pergunta: cs && cs.q,
      natal: { quem: `a casa ${h}`, tema: cs && cs.name, signoNaCuspide: signo(cusp), grau: grau(cusp), planetasDentro: dentro.map(k => `${ART[k]} em ${pts[k].signo}`) },
      transito: { quem: `a casa ${h}`, passando: PLANETAS.filter(k => ceu[k].casa === h).map(k => `${ART[k]} em trânsito (${ceu[k].signo}${ceu[k].retro ? ', retrógrado' : ''})`) },
    };
  }
  const x = asp.find(a => a.id === id);
  if (x) {
    const tp = T.mapa.aspectos.tipos[x.t];
    const kw = k => KW[k] || { asc: 'o corpo e o jeito de chegar', mc: 'a obra e o mundo' }[k];
    const combo = tp.combo.replaceAll('{A}', ART[x.a]).replaceAll('{B}', ART[x.b]).replaceAll('{a}', kw(x.a)).replaceAll('{b}', kw(x.b));
    return {
      titulo: `${NOME[x.a]} ${tp.glyph} ${NOME[x.b]}`, sub: `${x.nome} · ${x.orbe.toString().replace('.', ',')}° de folga`, base: [...(tp.body || []), combo], pergunta: tp.q,
      natal: { quem: `${ART[x.a]} e ${ART[x.b]}, juntos`, tema: `${kw(x.a)} e ${kw(x.b)}`, aspecto: x.nome, orbe: x.orbe, a: `${ART[x.a]} em ${pts[x.a].signo}, casa ${pts[x.a].casa}`, b: `${ART[x.b]} em ${pts[x.b].signo}, casa ${pts[x.b].casa}` },
      transito: null,
    };
  }
  return null;
}

// a lista do que existe neste mapa (para os botões da página)
export function indice(m) {
  return {
    planetas: PLANETAS, pontos: ['nn', 'ns', 'fortuna', 'asc', 'mc', 'fc', 'dc'],
    casas: Array.from({ length: 12 }, (_, i) => 'casa' + (i + 1)),
    aspectos: m.asp.filter(x => ['quadratura', 'trigono', 'sextil', 'oposicao', 'conjuncao'].includes(x.t)).map(x => x.id),
  };
}

/* ---------- a fala ---------- */
const VOZ_TEXTO = `Você escreve a fala de um ponto do mapa astral que se apresenta, em voz alta, para a pessoa dona do mapa. Quem fala é o próprio planeta, ponto, aspecto ou casa, em primeira pessoa ("eu sou o seu Vênus..."), no estilo do Eduardo (@eusouodu), astrólogo e terapeuta brasileiro.
Regras:
- Português do Brasil, para ser ouvido: frases curtas, naturais, sem listas, sem títulos, sem símbolos, sem graus com minutos (diga "a 14 graus de Touro" ou só "em Touro").
- Fale com a pessoa de modo próximo. Pode dizer "você" com moderação e usar "a gente". Nunca "tu".
- Comece se apresentando: quem eu sou, onde eu estou (signo, grau e casa), e o que isso quer dizer na vida concreta.
- Quando houver grau: diga o grau e o decanato e o que eles acrescentam (o primeiro decanato é o signo mais puro; o segundo e o terceiro ganham o tom do signo do mesmo elemento indicado em "triplicidade"; o regente da face dá outra cor). Se houver dignidade ou grau crítico, explique em uma frase.
- Traga um mito com começo, meio e fim curto, e uma ideia filosófica (use o campo "filosofia"), ligados à vida da pessoa, sem aula.
- Antes da pergunta final, indique UM livro da lista "livros", com título e autor, dizendo em meia frase por que ele conversa com este ponto. Nunca indique livro fora da lista.
- Vênus é sempre masculino: "o seu Vênus", "Vênus retrógrado".
- Retrógrado é movimento aparente visto da Terra; nunca "andar para trás".
- Proibido: travessão, "a pergunta é", começar frase com "Existe", linguagem de coaching, promessas, previsões certas. Fale de tendências e convites.
- Use SOMENTE os dados e os textos-base fornecidos. Não invente posições, aspectos nem datas.
- Termine com uma pergunta aberta, curta.
- Siga o campo "jeitoDeFalar" quando houver: cada planeta tem a sua personalidade.
- Tamanho: entre 130 e 180 palavras (cerca de um minuto falado), para a pessoa ouvir até o fim. Tom sério, calmo, grave; nada de entusiasmo de propaganda. Responda só com a fala.`;

const VOZ_TRANSITO = VOZ_TEXTO.replace('Comece se apresentando: quem eu sou, onde eu estou (signo, grau e casa), e o que isso quer dizer na vida concreta.', 'Fale do momento: por onde eu estou passando agora no céu, em que casa do mapa da pessoa isso cai e quais pontos do mapa eu estou tocando, e o que isso pede nestas semanas.').replace('entre 130 e 180 palavras (cerca de um minuto falado)', 'entre 80 e 120 palavras (menos de um minuto)').replace(/\n- Quando houver grau[\s\S]*?Nunca indique livro fora da lista\./, '');

const hash = o => createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 32);

async function claude(sistema, usuario) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELO, max_tokens: 900, system: sistema, messages: [{ role: 'user', content: usuario }] }),
  });
  if (!r.ok) throw new Error(`IA ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.content.map(c => c.text || '').join('').trim().replace(/\s*—\s*/g, ', ');
}

async function sintetizar(texto, voz, velocidade = 1) {
  if (!process.env.ELEVENLABS_API_KEY) return null; // sem chave, a página lê com a voz do próprio aparelho
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_22050_32`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    body: JSON.stringify({ text: texto, model_id: MODELO_VOZ, language_code: 'pt', voice_settings: { speed: velocidade } }),
  });
  if (!r.ok) { console.error('voz', r.status, (await r.text()).slice(0, 200)); return null; }
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}

// tipo: 'natal' (guardado de vez, igual para todo mundo com o mesmo posicionamento) ou 'transito' (muda com o céu)
export async function falar(m, id, tipo) {
  const it = item(m, id);
  if (!it) throw new Error('Este ponto não existe neste mapa.');
  let dados = tipo === 'transito' ? it.transito : it.natal;
  if (!dados) throw new Error('Este ponto não tem trânsito para ler.');
  const voz = VOZES[id] || VOZ_PADRAO;
  if (TOM[id]) dados = { ...dados, jeitoDeFalar: TOM[id] };
  const pedido = { v: 3, tipo, id, dados, base: tipo === 'natal' ? it.base : (dados.baseCasa || []), voz, velocidade: VELOCIDADE[id] || 1, modelo: MODELO_VOZ };
  const chave = K.fala(hash(pedido));
  if (temBanco()) {
    const guardada = await redis('GET', chave).catch(() => null);
    if (guardada) return { ...JSON.parse(guardada), guardada: true };
  }
  let texto;
  try {
    texto = await claude(tipo === 'transito' ? VOZ_TRANSITO : VOZ_TEXTO,
      `Dados de ${dados.quem}:\n${JSON.stringify({ ...dados, baseCasa: undefined }, null, 1)}\n\nTextos-base do Eduardo (use como fonte e reescreva como fala, sem copiar inteiro):\n${pedido.base.join('\n')}${tipo === 'transito' ? `\n\nHoje é ${m.dia}.` : ''}`);
  } catch (e) {
    console.error('fala', id, e.message);
    // sem IA, a fala é o próprio texto-base
    return { texto: tipo === 'natal' ? it.base.filter(l => !l.startsWith('## ')).slice(0, 2).join(' ') : `Agora estou em ${dados.signoHoje || 'trânsito'}.`, audio: null, provisoria: true };
  }
  const audio = await sintetizar(texto, voz, VELOCIDADE[id] || 1);
  const out = { texto, audio };
  if (temBanco() && audio) await redis('SET', chave, JSON.stringify(out), 'EX', tipo === 'natal' ? 400 * 86400 : 7 * 86400).catch(e => console.error('guardar fala', e.message));
  return out;
}

/* ---------- acesso ---------- */
export const tokenAcesso = (email, ate) => criarToken(email, 'lv', Math.max(1, (ate - Date.now()) / 864e5));
export const emailDoToken = tk => lerToken(tk, 'lv');
export const linkAcesso = u => `${SITE}/leitura/#s=${encodeURIComponent(tokenAcesso(u.email, u.until))}`;

export async function lerUser(email) { const r = await redis('GET', K.user(email)); return r ? JSON.parse(r) : null; }
export async function salvarUser(u) { await redis('SET', K.user(u.email), JSON.stringify(u)); }

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataBR = ms => new Date(ms).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' });
export function emailAcesso(u, novo) {
  const nome = String(u.nome || '').split(/\s+/)[0];
  return {
    assunto: novo ? 'O seu mapa está aberto e falando' : 'Link para abrir o seu mapa',
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#05060A;padding:28px 12px;font-family:Helvetica,Arial,sans-serif;color:#F5F3EE">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;border:1px solid #2A2C3A;border-radius:22px"><tr><td style="padding:30px">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#B9A6FF">Leitura viva do mapa</p>
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.15">${esc(nome ? nome + ', o' : 'O')} seu mapa está aberto</h1>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#B9B7C4">${novo ? 'Pagamento confirmado. ' : ''}Cada planeta, ponto, aspecto e casa do seu mapa fala quando você toca nele. O acesso vale até <b style="color:#F5F3EE">${dataBR(u.until)}</b>.</p>
<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#B9B7C4">O botão abaixo abre o mapa neste aparelho, sem senha. Guarde este e-mail: ele é a sua chave até o fim do acesso.</p>
<a href="${linkAcesso(u)}" style="display:inline-block;background:#F5F3EE;color:#05060A;font-weight:700;font-size:16px;text-decoration:none;padding:14px 24px;border-radius:999px">Abrir o meu mapa</a>
<p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#8E8C9C">Aconselhamento simbólico. Cada decisão é sua. Dúvidas: falecom@eusouodu.com</p>
</td></tr></table></body></html>`,
  };
}

export async function processarPagamento(id) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
  if (!r.ok) throw new Error(`MP pagamento ${id}: ${r.status}`);
  const pg = await r.json(), md = pg.metadata || {};
  if (md.produto !== 'leitura') return { ignorado: 'outro produto' };
  if (pg.status !== 'approved') return { ignorado: pg.status };
  if (await redis('SET', K.pago(id), '1', 'NX', 'EX', 400 * 86400) !== 'OK') return { jaProcessado: true };
  const email = String(md.email).toLowerCase(), antes = await lerUser(email);
  const base = Math.max(Date.now(), antes && antes.until > Date.now() && antes.data === md.data && antes.hora === md.hora ? antes.until : 0);
  const u = { email, nome: md.nome, data: md.data, hora: md.hora, cidade: md.cidade, tz: md.tz, lat: Number(md.lat), lon: Number(md.lon), until: base + DIAS_ACESSO * 864e5, pagamentos: [...((antes && antes.pagamentos) || []), id] };
  await salvarUser(u);
  const { assunto, html } = emailAcesso(u, true);
  await enviarEmail({ para: email, assunto, html, chave: `leitura-${id}`, copiaOculta: process.env.REGISTRO_EMAIL || 'falecom@eusouodu.com' });
  return { ativo: email, ate: u.until };
}
