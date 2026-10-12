// Cálculos astrológicos do relatório "A semana no seu mapa"
// Zodíaco tropical, eclíptica da data, casas Placidus.
// cópia local da biblioteca Astronomy Engine (MIT), em CommonJS, para rodar igual na Vercel
import A from './vendor/astronomy.cjs';

export const SIGNOS = ['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
export const CORPOS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
export const NOMES = {Sun:'Sol',Moon:'Lua',Mercury:'Mercúrio',Venus:'Vênus',Mars:'Marte',Jupiter:'Júpiter',Saturn:'Saturno',Uranus:'Urano',Neptune:'Netuno',Pluto:'Plutão',ASC:'Ascendente',MC:'Meio do Céu'};
const PESSOAIS = ['Sun','Moon','Mercury','Venus','Mars'];
const ASPECTOS = [
  { ang: 0, nome: 'conjunção', tom: 0 },
  { ang: 60, nome: 'sextil', tom: 1 },
  { ang: 90, nome: 'quadratura', tom: -1 },
  { ang: 120, nome: 'trígono', tom: 1 },
  { ang: 180, nome: 'oposição', tom: -1 },
];
const DIAS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const FASES = ['Lua Nova','Lua Crescente','Lua Cheia','Lua Minguante'];
const RELATORIO_TZ = 'America/Sao_Paulo'; // horários do relatório em horário de Brasília

const rad = Math.PI / 180, deg = 180 / Math.PI;
export const wrap360 = x => ((x % 360) + 360) % 360;
export const wrap180 = x => { const y = wrap360(x); return y > 180 ? y - 360 : y; };
export const signo = lon => SIGNOS[Math.floor(wrap360(lon) / 30)];
export const grau = lon => { const g = wrap360(lon) % 30; return `${Math.floor(g)}°${String(Math.floor((g % 1) * 60)).padStart(2, '0')}'`; };

export function longitude(body, date) {
  const t = A.MakeTime(date);
  if (body === 'Sun') return A.SunPosition(t).elon;
  if (body === 'Moon') return A.EclipticGeoMoon(t).lon;
  return A.Ecliptic(A.GeoVector(body, t, true)).elon;
}
function retrogrado(body, date) {
  if (body === 'Sun' || body === 'Moon') return false;
  return wrap180(longitude(body, new Date(date.getTime() + 3600e3)) - longitude(body, date)) < 0;
}

// ---------- fuso horário: hora local de nascimento -> UTC ----------
function offsetMin(tz, date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(date).filter(x => x.type !== 'literal').map(x => [x.type, +x.value]));
  const comoUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((comoUTC - date.getTime()) / 60000);
}
export function localParaUTC(data, hora, tz) {
  const [y, m, d] = data.split('-').map(Number), [h, mi] = hora.split(':').map(Number);
  const ingenuo = Date.UTC(y, m - 1, d, h, mi);
  let utc = ingenuo - offsetMin(tz, new Date(ingenuo)) * 60000;
  utc = ingenuo - offsetMin(tz, new Date(utc)) * 60000;
  return new Date(utc);
}
export function partesLocais(date, tz = RELATORIO_TZ) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' })
    .formatToParts(date).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  const iso = `${p.year}-${p.month}-${p.day}`;
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday);
  return { data: iso, hora: `${p.hour}:${p.minute}`, dia: DIAS[dow], rotulo: `${DIAS[dow]}, ${+p.day} de ${MESES[+p.month - 1]}` };
}
export const rotuloData = iso => { const [y, m, d] = iso.split('-').map(Number); const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return `${DIAS[dow]}, ${d} de ${MESES[m - 1]}`; };
export const rotuloCurto = iso => { const [, m, d] = iso.split('-').map(Number); return `${d} de ${MESES[m - 1]}`; };
export const intervalo = (a, b) => a.slice(5, 7) === b.slice(5, 7) ? `${+a.slice(8)} a ${rotuloCurto(b)}` : `${rotuloCurto(a)} a ${rotuloCurto(b)}`;

// ---------- casas Placidus ----------
function obliquidade(date) {
  const T = (A.MakeTime(date).tt) / 36525;
  return 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
}
function eclipticaDeRA(ra, eps) { // ponto da eclíptica com essa ascensão reta
  return wrap360(Math.atan2(Math.sin(ra * rad), Math.cos(ra * rad) * Math.cos(eps * rad)) * deg);
}
export function casas(date, lat, lon) {
  const eps = obliquidade(date);
  const ramc = wrap360(A.SiderealTime(A.MakeTime(date)) * 15 + lon);
  const mc = eclipticaDeRA(ramc, eps);
  const asc = wrap360(Math.atan2(Math.cos(ramc * rad), -(Math.sin(ramc * rad) * Math.cos(eps * rad) + Math.tan(lat * rad) * Math.sin(eps * rad))) * deg);
  const phi = lat * rad;
  function cuspide(f, acima) {
    // acima: casas 11 e 12 (semiarco diurno); abaixo: casas 2 e 3 (semiarco noturno)
    let lam = eclipticaDeRA(acima ? ramc + 90 * f : ramc + 180 - 90 * f, eps);
    for (let i = 0; i < 30; i++) {
      const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lam * rad));
      let x = Math.tan(phi) * Math.tan(dec); x = Math.max(-1, Math.min(1, x));
      const ad = Math.asin(x) * deg;
      const ra = acima ? ramc + f * (90 + ad) : ramc + 180 - f * (90 - ad);
      const novo = eclipticaDeRA(ra, eps);
      if (Math.abs(wrap180(novo - lam)) < 1e-7) { lam = novo; break; }
      lam = novo;
    }
    return lam;
  }
  const c = new Array(12);
  c[0] = asc; c[9] = mc;
  c[10] = cuspide(1 / 3, true); c[11] = cuspide(2 / 3, true);
  c[1] = cuspide(2 / 3, false); c[2] = cuspide(1 / 3, false);
  c[3] = wrap360(mc + 180); c[4] = wrap360(c[10] + 180); c[5] = wrap360(c[11] + 180);
  c[6] = wrap360(asc + 180); c[7] = wrap360(c[1] + 180); c[8] = wrap360(c[2] + 180);
  return { cuspides: c, asc, mc };
}
export function casaDe(lon, cuspides) {
  for (let i = 0; i < 12; i++) {
    const a = cuspides[i], b = cuspides[(i + 1) % 12];
    const larg = wrap360(b - a);
    if (wrap360(lon - a) < larg) return i + 1;
  }
  return 1;
}

// ---------- mapa natal ----------
export function mapaNatal({ data, hora, tz, lat, lon }) {
  const utc = localParaUTC(data, hora, tz);
  const { cuspides, asc, mc } = casas(utc, lat, lon);
  const planetas = {};
  for (const c of CORPOS) {
    const l = longitude(c, utc);
    planetas[c] = { lon: l, signo: signo(l), grau: grau(l), casa: casaDe(l, cuspides), retro: retrogrado(c, utc) };
  }
  planetas.ASC = { lon: asc, signo: signo(asc), grau: grau(asc), casa: 1 };
  planetas.MC = { lon: mc, signo: signo(mc), grau: grau(mc), casa: 10 };
  return { utc, cuspides, planetas };
}

// ---------- trânsitos do período ----------
const ORBE = { Sun: 1.2, Moon: 0, Mercury: 1.2, Venus: 1.2, Mars: 1.2, Jupiter: 1, Saturn: 1, Uranus: 1, Neptune: 1, Pluto: 1 };
const PESO_TRANSITO = { Sun: 1, Moon: .6, Mercury: .8, Venus: .9, Mars: 1.1, Jupiter: 1.3, Saturn: 1.5, Uranus: 1.4, Neptune: 1.2, Pluto: 1.5 };
const PESO_NATAL = { Sun: 1.4, Moon: 1.4, Mercury: 1, Venus: 1, Mars: 1, Jupiter: .8, Saturn: .9, Uranus: .6, Neptune: .6, Pluto: .7, ASC: 1.3, MC: 1.2 };
function tomConjuncao(t) { // conjunções: benéficos fluem, maléficos pesam
  if (['Venus', 'Jupiter', 'Sun'].includes(t)) return 1;
  if (['Saturn', 'Mars', 'Pluto'].includes(t)) return -1;
  return 0;
}
function aspectoEntre(a, b) {
  const d = Math.abs(wrap180(a - b));
  for (const asp of ASPECTOS) { const orbe = Math.abs(d - asp.ang); if (orbe < 8) return { asp, orbe }; }
  return null;
}

export function transitosPeriodo(natal, inicioISO, dias) {
  // inicioISO: primeiro dia do período (data em horário de Brasília)
  const meiaNoite = localParaUTC(inicioISO, '00:00', RELATORIO_TZ);
  const fim = new Date(meiaNoite.getTime() + dias * 864e5);
  const { cuspides, planetas: nat } = natal;
  const alvos = [...CORPOS, 'ASC', 'MC'];
  const listaDias = [];

  for (let i = 0; i < dias; i++) {
    const ini = new Date(meiaNoite.getTime() + i * 864e5), meio = new Date(ini.getTime() + 12 * 3600e3), fimDia = new Date(ini.getTime() + 864e5);
    const loc = partesLocais(meio);
    const eventos = [];
    let pontos = 0;
    // posições do dia
    const posicoes = {};
    for (const c of CORPOS) { const l = longitude(c, meio); posicoes[c] = { signo: signo(l), grau: grau(l), casaNatal: casaDe(l, cuspides), retro: retrogrado(c, meio) }; }
    // aspectos de trânsito a pontos natais
    for (const t of CORPOS) {
      for (const n of alvos) {
        if (t === 'Moon') {
          // a Lua: aspecto exato que acontece dentro do dia
          const f = (d, ang, s) => wrap180(longitude('Moon', d) - nat[n].lon - s * ang);
          for (const asp of ASPECTOS) for (const s of asp.ang % 180 ? [1, -1] : [1]) {
            if ((f(ini, asp.ang, s) < 0) !== (f(fimDia, asp.ang, s) < 0) && Math.abs(f(ini, asp.ang, s)) < 20) {
              const tom = asp.ang === 0 ? tomConjuncao('Moon') || (['Saturn', 'Mars', 'Pluto'].includes(n) ? -1 : ['Venus', 'Jupiter'].includes(n) ? 1 : 0) : asp.tom;
              eventos.push({ tipo: 'aspecto', transito: 'Lua', natal: NOMES[n], aspecto: asp.nome, tom, exato: true, orbe: 0 });
              pontos += tom * .6 * PESO_NATAL[n];
            }
          }
          continue;
        }
        const r = aspectoEntre(longitude(t, meio), nat[n].lon);
        if (!r || r.orbe > ORBE[t]) continue;
        // é exato hoje? (a separação cruza o valor exato entre o início e o fim do dia)
        const g = d => Math.abs(wrap180(longitude(t, d) - nat[n].lon)) - r.asp.ang;
        const exato = (g(ini) < 0) !== (g(fimDia) < 0);
        const aplicando = Math.abs(g(fimDia)) < Math.abs(g(ini));
        let tom = r.asp.ang === 0 ? tomConjuncao(t) || (['Saturn', 'Mars', 'Pluto'].includes(n) ? -1 : ['Venus', 'Jupiter'].includes(n) ? 1 : 0) : r.asp.tom;
        const peso = PESO_TRANSITO[t] * PESO_NATAL[n] * (1.3 - r.orbe / Math.max(ORBE[t], .5) * .6) * (exato ? 1.3 : 1);
        pontos += tom * peso;
        eventos.push({ tipo: 'aspecto', transito: NOMES[t], natal: NOMES[n], aspecto: r.asp.nome, tom, exato, aplicando, orbe: +r.orbe.toFixed(2) });
      }
    }
    // mudança de casa natal e de signo durante o dia
    for (const c of CORPOS) {
      const a = longitude(c, ini), b = longitude(c, fimDia);
      if (casaDe(a, cuspides) !== casaDe(b, cuspides)) eventos.push({ tipo: 'casa', planeta: NOMES[c], entraNaCasa: casaDe(b, cuspides) });
      if (Math.floor(a / 30) !== Math.floor(b / 30)) eventos.push({ tipo: 'signo', planeta: NOMES[c], entraEm: signo(b) });
      if (c !== 'Sun' && c !== 'Moon' && retrogrado(c, ini) !== retrogrado(c, fimDia)) {
        eventos.push({ tipo: 'estacao', planeta: NOMES[c], movimento: retrogrado(c, fimDia) ? 'fica retrógrado' : 'volta a andar direto', signo: signo(b), casaNatal: casaDe(b, cuspides) });
        pontos -= .6;
      }
    }
    listaDias.push({ data: loc.data, rotulo: loc.rotulo, dia: loc.dia, lua: { signo: posicoes.Moon.signo, casaNatal: posicoes.Moon.casaNatal, fase: +(A.MoonPhase(A.MakeTime(meio)) / 360).toFixed(3) }, posicoes, eventos, pontos: +pontos.toFixed(2) });
  }

  // fases principais da Lua no período
  const fases = [];
  let q = A.SearchMoonQuarter(A.MakeTime(meiaNoite));
  while (q.time.date < fim) {
    const l = longitude('Moon', q.time.date), loc = partesLocais(q.time.date);
    fases.push({ fase: FASES[q.quarter], data: loc.data, hora: loc.hora, rotulo: loc.rotulo, signo: signo(l), grau: grau(l), casaNatal: casaDe(l, cuspides) });
    const dia = listaDias.find(d => d.data === loc.data);
    if (dia) dia.eventos.unshift({ tipo: 'lunacao', fase: FASES[q.quarter], hora: loc.hora, signo: signo(l), casaNatal: casaDe(l, cuspides) });
    q = A.NextMoonQuarter(q);
  }

  // classificação dos dias pela pontuação relativa
  const vals = listaDias.map(d => d.pontos).sort((a, b) => a - b);
  const quantil = p => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const alto = Math.max(quantil(.7), .5), baixo = Math.min(quantil(.3), -.5);
  for (const d of listaDias) d.energia = d.pontos >= alto ? 'fluida' : d.pontos <= baixo ? 'desafiadora' : 'mista';

  // posição dos lentos no início (pano de fundo)
  const fundo = {};
  for (const c of CORPOS) {
    const l = longitude(c, meiaNoite);
    fundo[NOMES[c]] = { signo: signo(l), grau: grau(l), casaNatal: casaDe(l, cuspides), retro: retrogrado(c, meiaNoite) };
  }
  return { dias: listaDias, fases, fundo };
}

// divide o período em semanas de até 7 dias e marca os melhores dias de cada uma
export function semanas(periodo) {
  const out = [], grupos = [];
  for (let i = 0; i < periodo.dias.length; i += 7) grupos.push(periodo.dias.slice(i, i + 7));
  // sobra curta (ex.: 2 dias no fim de 30) entra na última semana
  if (grupos.length > 1 && grupos[grupos.length - 1].length < 4) { const r = grupos.pop(); grupos[grupos.length - 1].push(...r); }
  for (const ds of grupos) {
    const ord = [...ds].sort((a, b) => b.pontos - a.pontos);
    const melhores = ord.filter(d => d.energia === 'fluida').slice(0, 2).map(d => d.data);
    if (!melhores.length) melhores.push(ord[0].data);
    out.push({
      inicio: ds[0].data, fim: ds[ds.length - 1].data,
      rotulo: intervalo(ds[0].data, ds[ds.length - 1].data),
      dias: ds, melhores,
      fases: periodo.fases.filter(f => f.data >= ds[0].data && f.data <= ds[ds.length - 1].data),
    });
  }
  return out;
}

// resumo do mapa natal em texto curto, para o prompt
export function resumoNatal(natal) {
  return Object.entries(natal.planetas).map(([k, p]) => `${NOMES[k]} a ${p.grau} de ${p.signo}${k === 'ASC' || k === 'MC' ? '' : `, casa ${p.casa}`}${p.retro ? ' (retrógrado)' : ''}`).join('; ');
}
