// Efemérides da semana (segunda a domingo, horário de Salvador, UTC-3)
// Uso: node scripts/efemerides.mjs [AAAA-MM-DD da segunda-feira]
// Sem data: usa a próxima segunda-feira a partir de agora.
import * as A from 'astronomy-engine';

const TZ = -3; // America/Bahia, sem horário de verão
const SIGNOS = ['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
const DIAS = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const NOMES = {Sun:'Sol',Moon:'Lua',Mercury:'Mercúrio',Venus:'Vênus',Mars:'Marte',Jupiter:'Júpiter',Saturn:'Saturno',Uranus:'Urano',Neptune:'Netuno',Pluto:'Plutão'};
const PESSOAIS = ['Sun','Mercury','Venus','Mars'];
const LENTOS = ['Jupiter','Saturn','Uranus','Neptune','Pluto'];
const ASPECTOS = [[0,'conjunção'],[60,'sextil'],[90,'quadratura'],[120,'trígono'],[180,'oposição']];
const FASES = ['Lua Nova','Lua Crescente','Lua Cheia','Lua Minguante'];

function longitude(body, date) {
  const t = A.MakeTime(date);
  if (body === 'Sun') return A.SunPosition(t).elon;
  if (body === 'Moon') return A.EclipticGeoMoon(t).lon;
  return A.Ecliptic(A.GeoVector(body, t, true)).elon;
}
const wrap360 = x => ((x % 360) + 360) % 360;
const wrap180 = x => { const y = wrap360(x); return y > 180 ? y - 360 : y; };
const signo = lon => SIGNOS[Math.floor(wrap360(lon) / 30)];
const grau = lon => { const g = wrap360(lon) % 30; return `${Math.floor(g)}°${String(Math.floor((g % 1) * 60)).padStart(2, '0')}'`; };
function local(date) {
  const d = new Date(date.getTime() + TZ * 3600e3);
  return { data: d.toISOString().slice(0, 10), hora: d.toISOString().slice(11, 16), dia: DIAS[d.getUTCDay()] };
}
function refinar(f, a, b) { // bisseção de raiz entre datas a e b
  let fa = f(a);
  for (let i = 0; i < 40; i++) {
    const m = new Date((a.getTime() + b.getTime()) / 2), fm = f(m);
    if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
  }
  return new Date((a.getTime() + b.getTime()) / 2);
}

// segunda-feira de referência
let arg = process.argv[2];
if (!arg) {
  const agoraLocal = new Date(Date.now() + TZ * 3600e3);
  const dow = agoraLocal.getUTCDay();
  const ate = ((8 - dow) % 7) || 7;
  arg = new Date(agoraLocal.getTime() + ate * 864e5).toISOString().slice(0, 10);
}
const inicio = new Date(`${arg}T00:00:00Z`); inicio.setUTCHours(-TZ);
const fim = new Date(inicio.getTime() + 7 * 864e5);
const PASSO = 2 * 3600e3;

// dias
const dias = [];
for (let i = 0; i < 7; i++) {
  const meioDia = new Date(inicio.getTime() + i * 864e5 + 12 * 3600e3);
  const ang = A.MoonPhase(A.MakeTime(meioDia));
  const lua = longitude('Moon', meioDia);
  const l = local(meioDia);
  dias.push({ data: l.data, dia: l.dia, fase: +(ang / 360).toFixed(4), iluminacao: +((1 - Math.cos(ang * Math.PI / 180)) / 2).toFixed(3), luaSigno: signo(lua) });
}

// fases principais dentro da semana
const fases = [];
let q = A.SearchMoonQuarter(A.MakeTime(inicio));
while (q.time.date < fim) {
  const lon = longitude('Moon', q.time.date);
  fases.push({ fase: FASES[q.quarter], ...local(q.time.date), signo: signo(lon), grau: grau(lon) });
  q = A.NextMoonQuarter(q);
}

// ingressos e estações
const corpos = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ingressos = [], estacoes = [];
for (const c of corpos) {
  for (let t = inicio.getTime(); t < fim.getTime(); t += PASSO) {
    const a = new Date(t), b = new Date(t + PASSO);
    const la = longitude(c, a), lb = longitude(c, b);
    if (Math.floor(la / 30) !== Math.floor(lb / 30)) {
      const lim = wrap180(lb - la) > 0 ? Math.floor(wrap360(lb) / 30) * 30 : Math.floor(wrap360(la) / 30) * 30;
      const quando = refinar(d => wrap180(longitude(c, d) - lim), a, b);
      ingressos.push({ planeta: NOMES[c], entra: signo(longitude(c, new Date(quando.getTime() + 60e3)) ), ...local(quando) });
    }
    if (c !== 'Sun' && c !== 'Moon') {
      const v = d => wrap180(longitude(c, new Date(d.getTime() + 3600e3)) - longitude(c, d));
      if ((v(a) < 0) !== (v(b) < 0)) {
        const quando = refinar(v, a, b);
        const lon = longitude(c, quando);
        estacoes.push({ planeta: NOMES[c], tipo: v(b) < 0 ? 'fica retrógrado' : 'volta a andar direto', signo: signo(lon), grau: grau(lon), ...local(quando) });
      }
    }
  }
}

// aspectos exatos entre planetas pessoais e com os lentos
const pares = [];
for (let i = 0; i < PESSOAIS.length; i++) {
  for (let j = i + 1; j < PESSOAIS.length; j++) pares.push([PESSOAIS[i], PESSOAIS[j]]);
  for (const l of LENTOS) pares.push([PESSOAIS[i], l]);
}
const aspectos = [];
for (const [p1, p2] of pares) {
  for (const [ang, nome] of ASPECTOS) {
    for (const sinal of ang === 0 || ang === 180 ? [1] : [1, -1]) {
      const f = d => wrap180(longitude(p1, d) - longitude(p2, d) - sinal * ang);
      for (let t = inicio.getTime(); t < fim.getTime(); t += PASSO) {
        const a = new Date(t), b = new Date(t + PASSO), fa = f(a), fb = f(b);
        if ((fa < 0) !== (fb < 0) && Math.abs(fa) < 10 && Math.abs(fb) < 10) {
          const quando = refinar(f, a, b);
          aspectos.push({ planetas: `${NOMES[p1]} e ${NOMES[p2]}`, aspecto: nome, signos: `${signo(longitude(p1, quando))} / ${signo(longitude(p2, quando))}`, ...local(quando) });
        }
      }
    }
  }
}

const posicoes = {};
for (const c of corpos) {
  const lon = longitude(c, inicio);
  const ret = c !== 'Sun' && c !== 'Moon' && wrap180(longitude(c, new Date(inicio.getTime() + 3600e3)) - lon) < 0;
  posicoes[NOMES[c]] = `${grau(lon)} de ${signo(lon)}${ret ? ' (retrógrado)' : ''}`;
}

const porData = (x, y) => (x.data + x.hora).localeCompare(y.data + y.hora);
console.log(JSON.stringify({
  semana: { inicio: local(inicio).data, fim: local(new Date(fim.getTime() - 1)).data, fuso: 'America/Bahia (UTC-3)' },
  posicoesNoInicio: posicoes,
  dias,
  fasesDaLua: fases,
  ingressos: ingressos.sort(porData),
  estacoes: estacoes.sort(porData),
  aspectosExatos: aspectos.sort(porData),
}, null, 2));
