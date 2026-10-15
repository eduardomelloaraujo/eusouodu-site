/* Música Astral: o motor. Calcula o mapa, o trânsito do dia e escolhe as músicas.
   O mesmo arquivo roda na página e no servidor (envio dos e-mails), para a música ser a mesma nos dois. */
let CAT=[];
function setCatalogo(c){CAT=c}
const cap=s=>s[0].toUpperCase()+s.slice(1);
const SG=[["Áries","♈︎"],["Touro","♉︎"],["Gêmeos","♊︎"],["Câncer","♋︎"],["Leão","♌︎"],["Virgem","♍︎"],["Libra","♎︎"],["Escorpião","♏︎"],["Sagitário","♐︎"],["Capricórnio","♑︎"],["Aquário","♒︎"],["Peixes","♓︎"]];
const signOf=l=>SG[Math.floor(((l%360)+360)%360/30)][0];
const PLANETS=[["Sol","☉︎","Sun","o"],["Lua","☽︎","Moon","a"],["Mercúrio","☿︎","Mercury","o"],["Vênus","♀︎","Venus","o"],["Marte","♂︎","Mars","o"],["Júpiter","♃︎","Jupiter","o"],["Saturno","♄︎","Saturn","o"]];
function tzOff(t,tz){const p={};new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}).formatToParts(new Date(t)).forEach(x=>p[x.type]=x.value);return Date.UTC(+p.year,p.month-1,+p.day,+p.hour,+p.minute,+p.second)-t}
function toUTC(y,m,d,h,mi,tz){const g=Date.UTC(y,m-1,d,h,mi);let u=g-tzOff(g,tz);u=g-tzOff(u,tz);return new Date(u)}
function lon(body,date){
  if(body==="Sun")return Astronomy.SunPosition(date).elon;
  if(body==="Moon")return Astronomy.EclipticGeoMoon(date).lon;
  return Astronomy.Ecliptic(Astronomy.GeoVector(body,date,true)).elon;
}
function ascOf(date,lat,lo){const gst=Astronomy.SiderealTime(date);const r=((gst*15+lo)%360)*Math.PI/180;const e=23.4392911*Math.PI/180,f=lat*Math.PI/180;return (Math.atan2(Math.cos(r),-(Math.sin(r)*Math.cos(e)+Math.tan(f)*Math.sin(e)))*180/Math.PI+360)%360}
function hash(s){let h=2166136261;for(const c of s){h^=c.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}
function pick(list,seed){return list.length?list[hash(seed)%list.length]:null}
function songFor(sign,planet,seed){
  let c=CAT.filter(s=>s[0]===sign&&s[3]===planet);
  if(!c.length)c=CAT.filter(s=>s[0]===sign);
  return pick(c,seed);
}
const ASPS=[[0,8,"conj"],[180,7,"opos"],[90,6,"quad"],[120,6,"trig"],[60,4,"sext"]];
const WEIGHT={Sol:1.1,Lua:1,Mercúrio:1.1,Vênus:1.2,Marte:1.2,Júpiter:1.25,Saturno:1.25};
const MEAN={Sol:"a vontade",Lua:"o que a gente sente",Mercúrio:"a palavra e o pensamento",Vênus:"o afeto e o desejo",Marte:"o impulso",Júpiter:"a vontade de crescer e de dar sentido",Saturno:"o tempo e o limite"};
const NATAL={Sol:["o","Sol","quem a gente é"],Lua:["a","Lua","o que a gente precisa para se sentir em casa"],Asc:["o","Ascendente","o jeito de chegar no mundo"]};
function todayTransit(ch,seed,now){
  now=now||new Date();const tp={};PLANETS.forEach(([n,,b])=>tp[n]=lon(b,now));
  const pts={Sol:ch.p.Sol,Lua:ch.p.Lua};if(ch.asc!=null)pts.Asc=ch.asc;
  let best=null;
  PLANETS.forEach(([n])=>Object.entries(pts).forEach(([k,l])=>{
    const d=Math.abs(((tp[n]-l+540)%360)-180);
    ASPS.forEach(([a,orb,code])=>{const diff=Math.abs(d-a);if(diff<=orb){const sc=(1-diff/orb)*WEIGHT[n];if(!best||sc>best.sc)best={n,k,code,sc,diff}}});
  }));
  if(!best)best={n:"Lua",k:"Sol",code:"none",diff:null};
  best.sign=signOf(tp[best.n]);
  return best;
}
const emP=m=>m.startsWith("o ")?"no "+m.slice(2):"em "+m;
const aP=m=>m.startsWith("o ")?"ao "+m.slice(2):"a "+m;
function art(n){return n==="Lua"?"a":"o"}
function em(g){return g==="a"?"na":"no"}
function readingFor(t){
  const [g,name,mean]=NATAL[t.k];const P=`${cap(art(t.n))} ${t.n} em ${t.sign}`;
  const tgt=`${g} ${name}`;
  const l1={conj:`${P} encosta ${em(g)} ${name} do mapa.`,opos:`${P} fica de frente para ${tgt} do mapa.`,quad:`${P} tensiona ${tgt} do mapa.`,trig:`${P} flui com ${tgt} do mapa.`,sext:`${P} abre uma porta para ${tgt} do mapa.`,none:`${P} atravessa o dia sem grandes encontros com o mapa.`}[t.code];
  const l2={conj:`${cap(MEAN[t.n])} se mistura com ${mean}, e a música de hoje nasce desse encontro.`,
    opos:`${cap(MEAN[t.n])} aparece do lado de fora, no outro, e espelha ${mean}.`,
    quad:`${cap(MEAN[t.n])} pede ajuste ${emP(mean)}. O atrito também é movimento.`,
    trig:`${cap(MEAN[t.n])} conversa fácil com ${mean}. Dia de deixar ir.`,
    sext:`${cap(MEAN[t.n])} oferece uma chance ${aP(mean)}, se a gente topar.`,
    none:`O dia pede escuta. A música vem da Lua, que muda de signo a cada dois dias e meio.`}[t.code];
  return [l1,l2];
}

function chartFrom(v){
  const [y,m,dd]=v.d.split("-").map(Number);if(!y||y<1900)return null;
  const tz=v.city?v.city[3]:"America/Sao_Paulo";
  const [h,mi]=v.t?v.t.split(":").map(Number):[12,0];
  const date=toUTC(y,m,dd,h,mi,tz);
  const p={};PLANETS.forEach(([n,,b])=>p[n]=lon(b,date));
  const asc=(v.t&&v.city)?ascOf(date,v.city[1],v.city[2]):null;
  return {p,asc,exact:!!v.t,date};
}
/* O dia vale pelo horário de Brasília, e o trânsito é lido ao meio-dia desse dia. */
function diaLocal(d){const p={};new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d||new Date()).forEach(x=>p[x.type]=x.value);return p.year+"-"+p.month+"-"+p.day}
function momentoDoDia(iso){return new Date(iso+"T15:00:00Z")}
function discoDoDia(v,ch,iso){
  const seed=v.nome+"|"+v.d+"|"+v.t;
  const sol=signOf(ch.p.Sol),lua=signOf(ch.p.Lua),asc=ch.asc!=null?signOf(ch.asc):null;
  const A=[["☉︎","Sol em "+sol,songFor(sol,"Sol",seed+"A1")||songFor(sol,"",seed+"A1")],["☽︎","Lua em "+lua,songFor(lua,"Lua",seed+"A2")]];
  if(asc)A.push(["↑","Ascendente em "+asc,songFor(asc,"",seed+"A3")]);
  const t=todayTransit(ch,seed,momentoDoDia(iso));
  const B=songFor(t.sign,t.n,seed+iso)||songFor(t.sign,"",seed+iso);
  const [l1,l2]=readingFor(t);
  return {seed,sol,lua,asc,A,t,B,l1,l2};
}
globalThis.MusicaMotor={setCatalogo,chartFrom,diaLocal,momentoDoDia,discoDoDia,signOf,PLANETS,SG};
