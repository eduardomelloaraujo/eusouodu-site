// eusouodu app: cálculos do dia.
// Céu do dia (para todos) e trânsitos no mapa natal (curtos e longos, com início, exato e fim).
// Usa o mesmo motor do relatório (lib/astro.mjs): zodíaco tropical, horário de Brasília.
import A from './vendor/astronomy.cjs';
import { CORPOS, NOMES, longitude, signo, grau, wrap180, wrap360, localParaUTC, partesLocais, rotuloData, rotuloCurto, transitosPeriodo } from './astro.mjs';

const TZ = 'America/Sao_Paulo';
const ASPECTOS = [
  { ang: 0, nome: 'conjunção' }, { ang: 60, nome: 'sextil' }, { ang: 90, nome: 'quadratura' },
  { ang: 120, nome: 'trígono' }, { ang: 180, nome: 'oposição' },
];
const RAPIDOS = ['Sun', 'Mercury', 'Venus', 'Mars'];
const LENTOS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ORBE_CURTO = 1.2, ORBE_LONGO = 1.5;

const retro = (c, d) => c !== 'Sun' && c !== 'Moon' && wrap180(longitude(c, new Date(d.getTime() + 3600e3)) - longitude(c, d)) < 0;
const sep = (a, b) => Math.abs(wrap180(a - b));
// distância com sinal até o ponto exato do aspecto; o ramo (+ang ou -ang) é fixado pelo instante de referência
function ramo(a, b, ang) { return Math.abs(wrap180(a - b - ang)) <= Math.abs(wrap180(a - b + ang)) ? ang : -ang; }
const comSinal = (a, b, r) => wrap180(a - b - r);
const hora = d => partesLocais(d, TZ).hora;

function faseLua(d) {
  const f = A.MoonPhase(A.MakeTime(d)); // 0 nova, 90 crescente, 180 cheia, 270 minguante
  const nome = f < 22.5 || f >= 337.5 ? 'Lua Nova' : f < 67.5 ? 'Lua Crescente côncava' : f < 112.5 ? 'Quarto Crescente'
    : f < 157.5 ? 'Lua Crescente gibosa' : f < 202.5 ? 'Lua Cheia' : f < 247.5 ? 'Lua Disseminadora'
    : f < 292.5 ? 'Quarto Minguante' : 'Lua Balsâmica';
  const luz = Math.round(A.Illumination('Moon', A.MakeTime(d)).phase_fraction * 100);
  return { nome, angulo: +f.toFixed(1), luz, crescendo: f < 180 };
}

// instante em que f(d) cruza zero entre a e b (busca binária)
function cruzamento(f, a, b) {
  let fa = f(a);
  for (let i = 0; i < 40; i++) {
    const m = new Date((a.getTime() + b.getTime()) / 2), fm = f(m);
    if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m;
  }
  return new Date((a.getTime() + b.getTime()) / 2);
}

// ---------- céu do dia: igual para todo mundo ----------
export function ceuDoDia(iso) {
  const ini = localParaUTC(iso, '00:00', TZ), fim = new Date(ini.getTime() + 864e5), meio = new Date(ini.getTime() + 12 * 3600e3);
  const planetas = CORPOS.map(c => {
    const l = longitude(c, meio);
    return { id: c, nome: NOMES[c], signo: signo(l), grau: grau(l), lon: +l.toFixed(3), retro: retro(c, meio) };
  });
  const eventos = [];
  // ingressos e estações
  for (const c of CORPOS) {
    const a = longitude(c, ini), b = longitude(c, fim);
    if (Math.floor(wrap360(a) / 30) !== Math.floor(wrap360(b) / 30)) {
      const alvo = Math.floor(wrap360(b) / 30) * 30 + (retro(c, meio) ? 30 : 0);
      const t = cruzamento(d => wrap180(longitude(c, d) - alvo), ini, fim);
      eventos.push({ tipo: 'ingresso', planeta: NOMES[c], signo: signo(b), hora: hora(t) });
    }
    if (c !== 'Sun' && c !== 'Moon' && retro(c, ini) !== retro(c, fim))
      eventos.push({ tipo: 'estacao', planeta: NOMES[c], movimento: retro(c, fim) ? 'fica retrógrado' : 'retoma o movimento direto', signo: signo(b) });
  }
  // aspectos exatos hoje entre os planetas do céu
  for (let i = 0; i < CORPOS.length; i++) for (let j = i + 1; j < CORPOS.length; j++) {
    const p = CORPOS[i], q = CORPOS[j];
    for (const asp of ASPECTOS) {
      const r = ramo(longitude(p, meio), longitude(q, meio), asp.ang);
      const g = d => comSinal(longitude(p, d), longitude(q, d), r);
      const a = g(ini), b = g(fim);
      if ((a < 0) !== (b < 0) && Math.abs(a) < 15 && Math.abs(b) < 15) {
        const t = cruzamento(g, ini, fim);
        eventos.push({ tipo: 'aspecto', de: NOMES[p], para: NOMES[q], aspecto: asp.nome, hora: hora(t), lua: p === 'Moon' || q === 'Moon' });
      }
    }
  }
  // lunação exata hoje
  let q = A.SearchMoonQuarter(A.MakeTime(ini));
  if (q.time.date < fim) eventos.unshift({ tipo: 'lunacao', fase: ['Lua Nova', 'Quarto Crescente', 'Lua Cheia', 'Quarto Minguante'][q.quarter], hora: hora(q.time.date), signo: signo(longitude('Moon', q.time.date)) });
  // a lunação já diz o encontro Sol e Lua
  if (eventos.some(e => e.tipo === 'lunacao')) for (let i = eventos.length - 1; i >= 0; i--) if (eventos[i].de === 'Sol' && eventos[i].para === 'Lua') eventos.splice(i, 1);
  eventos.sort((x, y) => (x.hora || '99').localeCompare(y.hora || '99'));
  return { data: iso, rotulo: rotuloData(iso), lua: { ...faseLua(meio), signo: planetas[1].signo }, planetas, eventos };
}

// ---------- janela de um trânsito: quando entra em orbe, quando fica exato, quando sai ----------
function janela(t, alvoLon, ang, ref, orbe, passo, limite) {
  const dist = d => Math.abs(sep(longitude(t, d), alvoLon) - ang);
  const dia = n => new Date(ref.getTime() + n * passo * 864e5);
  let a = 0, b = 0;
  while (a > -limite && dist(dia(a - 1)) <= orbe) a--;
  while (b < limite && dist(dia(b + 1)) <= orbe) b++;
  // exatos dentro da janela (lentos podem ter até três passagens por causa da retrogradação)
  const exatos = [];
  const r = ramo(longitude(t, ref), alvoLon, ang);
  for (let n = a; n < b; n++) {
    const s = d => comSinal(longitude(t, d), alvoLon, r);
    const x = s(dia(n)), y = s(dia(n + 1));
    if ((x < 0) !== (y < 0) || Math.abs(x) < 1e-4) exatos.push(partesLocais(cruzamento(s, dia(n), dia(n + 1)), TZ).data);
  }
  return { inicio: partesLocais(dia(a), TZ).data, fim: partesLocais(dia(b), TZ).data, exatos: [...new Set(exatos)], aberto: a <= -limite || b >= limite };
}

function aspectosAtivos(natal, meio, corpos, orbe) {
  const alvos = [...CORPOS, 'ASC', 'MC'], out = [];
  for (const t of corpos) for (const n of alvos) {
    const d = sep(longitude(t, meio), natal.planetas[n].lon);
    for (const asp of ASPECTOS) if (Math.abs(d - asp.ang) <= orbe) out.push({ t, n, asp, orbe: Math.abs(d - asp.ang) });
  }
  return out;
}

const peso = { Sun: 1.4, Moon: 1.4, ASC: 1.3, MC: 1.2, Mercury: 1, Venus: 1, Mars: 1, Jupiter: .8, Saturn: .9, Uranus: .6, Neptune: .6, Pluto: .7 };

// ---------- trânsitos no mapa natal ----------
export function transitosNoMapa(natal, iso) {
  const meio = new Date(localParaUTC(iso, '00:00', TZ).getTime() + 12 * 3600e3);
  const dia = transitosPeriodo(natal, iso, 1).dias[0];
  const fmt = (x, j) => ({
    transito: NOMES[x.t], natal: NOMES[x.n], aspecto: x.asp.nome, orbe: +x.orbe.toFixed(2),
    casa: natal.planetas[x.n].casa, retro: retro(x.t, meio),
    inicio: j.inicio, fim: j.fim, exatos: j.exatos,
    exatoHoje: j.exatos.includes(iso), rotulo: `${rotuloCurto(j.inicio)} a ${rotuloCurto(j.fim)}`,
  });
  const curtos = aspectosAtivos(natal, meio, RAPIDOS, ORBE_CURTO)
    .map(x => fmt(x, janela(x.t, natal.planetas[x.n].lon, x.asp.ang, meio, ORBE_CURTO, 1, 40)))
    .sort((a, b) => (b.exatoHoje - a.exatoHoje) || (peso[Object.keys(NOMES).find(k => NOMES[k] === b.natal)] - peso[Object.keys(NOMES).find(k => NOMES[k] === a.natal)]) || a.orbe - b.orbe);
  const longos = aspectosAtivos(natal, meio, LENTOS, ORBE_LONGO)
    .map(x => fmt(x, janela(x.t, natal.planetas[x.n].lon, x.asp.ang, meio, ORBE_LONGO, 2, 400)))
    .sort((a, b) => a.orbe - b.orbe);
  const lua = dia.eventos.filter(e => e.tipo === 'aspecto' && e.transito === 'Lua')
    .map(e => ({ transito: 'Lua', natal: e.natal, aspecto: e.aspecto }));
  return {
    data: iso, energia: dia.energia, pontos: dia.pontos,
    lua: { signo: dia.lua.signo, casaNatal: dia.lua.casaNatal },
    curtos, longos, lua_aspectos: lua,
    mudancas: dia.eventos.filter(e => e.tipo === 'casa' || e.tipo === 'estacao' || e.tipo === 'lunacao'),
  };
}
