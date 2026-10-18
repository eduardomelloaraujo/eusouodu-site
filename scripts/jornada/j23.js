/* ---------- jornadas 2 e 3: lições montadas a partir do mapa natal e do céu real ---------- */
// O texto vem do servidor (lib/jornada/mapa.json e transitos.json) para quem tem plano ativo.
let CT = null;
const PNX = Object.assign({}, PN, {urano:["Urano","Urano"], netuno:["Netuno","Netuno"], plutao:["Plutão","Plutão"]});
const PGL = {sol:"☉", lua:"☽", merc:"☿", venus:"♀", marte:"♂", jupiter:"♃", saturno:"♄", urano:"♅", netuno:"♆", plutao:"♇", asc:"AC"};
const KW = {sol:"a identidade", lua:"as emoções", merc:"o pensamento", venus:"o afeto", marte:"o desejo", jupiter:"a fé", saturno:"o limite", urano:"a ruptura", netuno:"o sonho", plutao:"a transformação"};
const ASP = [["conjuncao",0,"Conjunção","☌"],["sextil",60,"Sextil","⚹"],["quadratura",90,"Quadratura","□"],["trigono",120,"Trígono","△"],["oposicao",180,"Oposição","☍"]];
const ELN = {fogo:"Fogo", terra:"Terra", ar:"Ar", agua:"Água"};
const MODN = ["cardinal","fixo","mutavel"], MODL = {cardinal:"Cardinal", fixo:"Fixa", mutavel:"Mutável"};
const FASES = ["Lua nova","Lua crescente","Quarto crescente","Lua gibosa","Lua cheia","Lua disseminadora","Quarto minguante","Lua balsâmica"];
const HINT = "Uma frase basta. Sem certo nem errado.";
const BODY = {merc:"Mercury", venus:"Venus", marte:"Mars", jupiter:"Jupiter", saturno:"Saturn", urano:"Uranus", netuno:"Neptune", plutao:"Pluto"};
const norm360 = x => ((x%360)+360)%360;
const wrap180 = x => { x = norm360(x); return x>180 ? x-360 : x; };
const first = () => ((S.user&&S.user.name)||"").trim().split(" ")[0];
const others3 = (right, pool) => shuffle(pool.filter(x=>x!==right)).slice(0,3);
const signOpts = s => [SIGN_NAMES[s], ...others3(SIGN_NAMES[s], SIGN_NAMES)];
const houseOf = lon => ((signOf(lon)-signOf(S.chart.asc)+12)%12)+1;
const hasAsc = () => !!(S.chart && S.chart.hasAsc);
const fmtMY = d => d.toLocaleDateString("pt-BR",{month:"long", year:"numeric"});
const fmtDY = d => d.toLocaleDateString("pt-BR",{day:"numeric", month:"long", year:"numeric"});
const art = k => PNX[k][1];             // "o Sol", "a Lua", "Mercúrio", "o Vênus"
const Art = k => cap1(PNX[k][1]);
const nm = k => PNX[k][0];

function lonAt(k, date){
  const A = window.Astronomy;
  if(k==="sol") return A.SunPosition(date).elon;
  if(k==="lua") return A.EclipticGeoMoon(date).lon;
  return A.Ecliptic(A.GeoVector(A.Body[BODY[k]], date, true)).elon;
}
function birthDate(){
  const u=S.user, c=u&&u.cityData; if(!u||!c) return null;
  const [y,m,d]=u.birth.split("-").map(Number), [h,mi]=(u.unknownTime?"12:00":u.time).split(":").map(Number);
  return localToUTC(y,m,d,h,mi,c[3]);
}
function ascAt(date, lat, lon){
  const A=window.Astronomy;
  const ramc = norm360(A.SiderealTime(date)*15 + lon);
  const T2 = (date - Date.UTC(2000,0,1,12)) / (36525*864e5);
  const e=(23.4393-0.0130*T2)*Math.PI/180, rr=ramc*Math.PI/180, ph=lat*Math.PI/180;
  return norm360(Math.atan2(Math.cos(rr), -(Math.sin(rr)*Math.cos(e) + Math.tan(ph)*Math.sin(e)))*180/Math.PI);
}
function meanNode(date){ const T=(date - Date.UTC(2000,0,1,12))/(36525*864e5); return norm360(125.04452 - 1934.136261*T + 0.0020708*T*T); }
const isRetro = (k, date) => wrap180(lonAt(k, new Date(+date+864e5/2)) - lonAt(k, new Date(+date-864e5/2))) < 0;
// períodos retrógrados a partir de uma data, amostrando dia a dia
function retroPeriods(k, from, days){
  const out=[]; let cur=null, prev=lonAt(k,from);
  for(let i=1;i<=days;i++){
    const d=new Date(+from+i*864e5), l=lonAt(k,d), rx=wrap180(l-prev)<0; prev=l;
    if(rx && !cur) cur={start:d, lon:l};
    if(!rx && cur){ cur.end=d; out.push(cur); cur=null; if(out.length>=2) break; }
  }
  if(cur){ cur.end=null; out.push(cur); }
  return out;
}
function nextIngress(k, from, days){
  const s0=signOf(lonAt(k,from));
  for(let i=1;i<=days;i++){ const d=new Date(+from+i*864e5), s=signOf(lonAt(k,d)); if(s!==s0) return {date:d, sign:s}; }
  return null;
}
const houseTxt = lon => hasAsc() ? `, na casa ${houseOf(lon)} deste mapa` : "";
const posLine = k => `Neste mapa, ${art(k)} está em ${SIGN_NAMES[signOf(S.chart.pts[k])]}, a ${degOf(S.chart.pts[k])} graus${hasAsc()?`, na casa ${houseOf(S.chart.pts[k])}`:""}.`;
const T_ = (o, fb) => (o && o.title) || fb || "";
const B_ = o => (o && o.body) ? o.body.slice() : [];
function digStep(k){
  const s=signOf(S.chart.pts[k]), dg=dignity(k,s);
  const opts=[dg, ...shuffle(["Domicílio","Exaltação","Exílio","Queda","Nenhuma: ele é peregrino"].filter(x=>x!==dg)).slice(0,3)];
  return {type:"choice", q:`Para ${art(k)}, ${SIGN_NAMES[s]} é signo de:`, opts, a:0, explain:DIG_TXT[dg]};
}
function houseChoice(k){
  const h=houseOf(S.chart.pts[k]);
  return {type:"choice", chart:true, q:`E em qual casa ${art(k)} está neste mapa?`, opts:["Casa "+h, ...others3(h,[1,2,3,4,5,6,7,8,9,10,11,12]).map(n=>"Casa "+n)], a:0,
    explain:`A casa ${h} fala de ${HOUSES[h]}. É o terreno onde ${art(k)} trabalha.`};
}
const needTime = (id, title) => ({id, needTime:true, title});

/* ----- jornada 2 ----- */
function j2Planet(k, id, nextName){
  const c=CT.mapa[k], P=S.chart.pts[k], s=signOf(P), sg=c.signs[s];
  const steps=[
    {type:"teach", chart:true, eyebrow:`O mapa de ${first()}`, title:c.intro.title, body:c.intro.body},
    Object.assign({type:"match"}, c.match),
    {type:"choice", chart:true, q:`Em que signo está ${art(k)} neste mapa?`, opts:signOpts(s), a:0, explain:c.signQ.explain},
    {type:"teach", glyph:SIGNS[s], eyebrow:`${nm(k)} em ${SIGN_NAMES[s]} · ${degOf(P)} graus`, title:sg.title, body:sg.body},
    digStep(k)
  ];
  if(hasAsc()){ const h=houseOf(P), hc=c.houses[h-1]; steps.push(houseChoice(k), {type:"teach", glyph:PGL[k], eyebrow:`Casa ${h}`, title:hc.title, body:hc.body}); }
  steps.push({type:"reflect", q:sg.q, hint:HINT});
  return {id, kind:"No mapa", title:nm(k), glyph:PGL[k], light:"planet:"+k, card:null,
    doneTitle:`${Art(k)} acendeu no mapa`,
    doneText:`${posLine(k)} ${nextName?`Próxima parada: ${nextName}.`:""}`.trim(), steps};
}
function j2JupSat(id){
  const M=CT.mapa, steps=[{type:"teach", glyph:"♃", eyebrow:"Júpiter e Saturno", title:M.par.title, body:M.par.body}, Object.assign({type:"choice", a:0}, M.ciclos)];
  for(const k of ["jupiter","saturno"]){
    const c=M[k], P=S.chart.pts[k], s=signOf(P), sg=c.signs[s];
    steps.push({type:"teach", glyph:PGL[k], eyebrow:nm(k), title:c.intro.title, body:c.intro.body});
    const body=[posLine(k), ...sg.body]; if(hasAsc()) body.push(...c.houses[houseOf(P)-1].body);
    steps.push({type:"teach", glyph:SIGNS[s], eyebrow:`${nm(k)} em ${SIGN_NAMES[s]}`, title:sg.title, body}, digStep(k));
  }
  steps.push({type:"reflect", q:M.saturno.signs[signOf(S.chart.pts.saturno)].q, hint:HINT});
  return {id, kind:"No mapa", title:"Júpiter e Saturno", glyph:"♃", light:"planet:jupiter", card:null,
    doneTitle:"O que expande e o que dá forma", doneText:`Júpiter em ${SIGN_NAMES[signOf(S.chart.pts.jupiter)]}, Saturno em ${SIGN_NAMES[signOf(S.chart.pts.saturno)]}. Próxima parada: os planetas de geração.`, steps};
}
function j2Lentos(id){
  const c=CT.mapa.lentos, steps=[{type:"teach", glyph:"♅", eyebrow:"Os planetas de geração", title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice)];
  steps.push({type:"choice", chart:true, q:"Em que signo está Plutão neste mapa?", opts:signOpts(signOf(S.chart.pts.plutao)), a:0,
    explain:"Plutão leva de 12 a 30 anos em cada signo. Quem nasceu perto do mesmo ano divide esse Plutão: o signo fala da geração, a casa fala de cada um."});
  for(const k of ["urano","netuno","plutao"]){
    const P=S.chart.pts[k], s=signOf(P), sg=(c[k].signs||{})[String(s)];
    const body=[posLine(k), ...(sg?sg.body:B_(c[k].intro))]; if(hasAsc()) body.push(...c[k].houses[houseOf(P)-1].body);
    steps.push({type:"teach", glyph:PGL[k], eyebrow:`${nm(k)} em ${SIGN_NAMES[s]}`, title:sg?sg.title:T_(c[k].intro), body});
  }
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"No mapa", title:"Urano, Netuno e Plutão", glyph:"♇", light:"planet:plutao", card:null,
    doneTitle:"A geração e a pessoa", doneText:"O que é de todo mundo, morando numa casa só deste mapa. Próxima parada: as doze casas.", steps};
}
function j2Casas(id){
  if(!hasAsc()) return needTime(id, "As doze casas");
  const c=CT.mapa.casas, ks=["sol","lua","merc","venus","marte","jupiter","saturno","urano","netuno","plutao"];
  const occ={}; ks.forEach(k=>{ const h=houseOf(S.chart.pts[k]); (occ[h]=occ[h]||[]).push(k); });
  const rank=h=>(occ[h]||[]).length*10 + ((occ[h]||[]).some(k=>k==="sol"||k==="lua")?1:0);
  const hs=[1,2,3,4,5,6,7,8,9,10,11,12], top=hs.slice().sort((a,b)=>rank(b)-rank(a))[0], hc=c.houses[top-1];
  const empty=hs.filter(h=>!occ[h]);
  const lista=occ[top].map(art); const listaTxt = lista.length>1 ? lista.slice(0,-1).join(", ")+" e "+lista.at(-1) : lista[0];
  const steps=[
    {type:"teach", chart:true, eyebrow:`O mapa de ${first()}`, title:c.intro.title, body:c.intro.body},
    {type:"teach", glyph:"✛", eyebrow:"Os ângulos", title:c.angulos.title, body:c.angulos.body},
    Object.assign({type:"order"}, c.order),
    {type:"choice", chart:true, q:"Qual casa reúne mais planetas neste mapa?", opts:["Casa "+top, ...others3(top, hs.filter(h=>rank(h)<rank(top))).map(n=>"Casa "+n)], a:0,
     explain:`Na casa ${top} estão ${listaTxt}. É ali que este mapa concentra a vida.`},
    {type:"teach", glyph:String(top), eyebrow:`Casa ${top} · ${occ[top].length} ${occ[top].length>1?"planetas":"planeta"}`, title:cap1(hc.name), body:hc.body},
  ];
  if(empty.length) steps.push({type:"teach", glyph:"◯", eyebrow:"As casas vazias", title:c.vazia.title, body:[`Neste mapa, ${empty.length} ${empty.length>1?"casas estão vazias":"casa está vazia"}: ${empty.length>1?empty.slice(0,-1).join(", ")+" e "+empty.at(-1):empty[0]}.`, ...c.vazia.body]});
  steps.push({type:"reflect", q:hc.q, hint:HINT});
  return {id, kind:"No mapa", title:"As doze casas", glyph:"✛", light:null, card:null, doneTitle:"Os cenários do mapa", doneText:`A casa ${top} é a mais cheia deste mapa. Próxima parada: os aspectos.`, steps};
}
function aspectsBetween(A, B, orbs){
  const out=[];
  for(const [ka,la] of A) for(const [kb,lb] of B){
    if(ka===kb) continue;
    const d=Math.abs(wrap180(la-lb));
    for(const [t,ang,name,gl] of ASP){ const orb=Math.abs(d-ang), lim=orbs[t]; if(orb<=lim) out.push({a:ka, b:kb, t, name, gl, orb, ang}); }
  }
  return out.sort((x,y)=>x.orb-y.orb);
}
function j2Aspectos(id){
  const c=CT.mapa.aspectos, P=S.chart.pts;
  const pess=["sol","lua","merc","venus","marte","jupiter","saturno"], all=pess.concat(["urano","netuno","plutao"]);
  const seen=new Set(), asp=[];
  aspectsBetween(pess.map(k=>[k,P[k]]), all.map(k=>[k,P[k]]), {conjuncao:6, sextil:4, quadratura:6, trigono:6, oposicao:6}).forEach(x=>{
    const key=[x.a,x.b].sort().join("|"); if(seen.has(key)) return; seen.add(key); asp.push(x); });
  const fill = (x) => c.tipos[x.t].combo.replaceAll("{A}",art(x.a)).replaceAll("{B}",art(x.b)).replaceAll("{a}",KW[x.a]).replaceAll("{b}",KW[x.b]);
  const steps=[{type:"teach", chart:true, eyebrow:"As conversas do mapa", title:c.intro.title, body:c.intro.body}, Object.assign({type:"match"}, c.match)];
  const names=ASP.map(a=>a[2]);
  asp.slice(0,2).forEach((x,i)=>{
    const tp=c.tipos[x.t], orb=Math.round(x.orb*10)/10;
    if(i===0) steps.push({type:"choice", chart:true, q:`Qual aspecto liga ${art(x.a)} e ${art(x.b)} neste mapa?`, opts:[x.name, ...others3(x.name,names)], a:0,
      explain:`${Art(x.a)} e ${art(x.b)} estão a ${Math.round(Math.abs(wrap180(P[x.a]-P[x.b])))} graus um do outro, perto dos ${x.ang} graus de ${x.t==='conjuncao'?'uma':'um'} ${x.name.toLowerCase()}.`});
    steps.push({type:"teach", glyph:x.gl, eyebrow:`${x.name} · ${orb.toString().replace(".",",")} ${orb===1?"grau":"graus"} de folga`, title:`${Art(x.a)} e ${art(x.b)}`, body:[...tp.body, fill(x)]});
  });
  if(!asp.length) steps.push({type:"teach", glyph:"◯", eyebrow:"Neste mapa", title:c.nenhum.title, body:c.nenhum.body});
  steps.push({type:"reflect", q:asp.length?c.tipos[asp[0].t].q:c.tipos.conjuncao.q, hint:HINT});
  return {id, kind:"No mapa", title:"Os aspectos", glyph:"△", light:null, card:null, doneTitle:"As conversas entre os planetas",
    doneText:asp.length?`O aspecto mais exato deste mapa: ${art(asp[0].a)} e ${art(asp[0].b)} em ${asp[0].name.toLowerCase()}. Próxima parada: os nodos lunares.`:"Próxima parada: os nodos lunares.", steps};
}
function j2Nodos(id){
  const c=CT.mapa.nodos, bd=birthDate(); if(!bd) return null;
  const N=meanNode(bd), s=signOf(N), op=(s+6)%12, ex=c.eixos[s];
  const steps=[
    {type:"teach", glyph:"☊", eyebrow:"Os nodos lunares", title:c.intro.title, body:c.intro.body},
    {type:"choice", q:"Em que signo está o Nodo Norte neste mapa?", opts:signOpts(s), a:0, explain:`No nascimento, o Nodo Norte estava em ${SIGN_NAMES[s]}, a ${degOf(N)} graus. Ele leva cerca de um ano e meio em cada signo, caminhando ao contrário da ordem dos signos.`},
    {type:"choice", q:`Com o Nodo Norte em ${SIGN_NAMES[s]}, onde fica o Nodo Sul?`, opts:signOpts(op), a:0, explain:"Os dois nodos são sempre opostos: são as duas pontas da mesma linha, a cabeça e a cauda do dragão."},
    {type:"teach", glyph:"☊", eyebrow:`Nodo Norte em ${SIGN_NAMES[s]}`, title:ex.title, body:ex.body}
  ];
  if(hasAsc()){ const h=houseOf(N); steps.push({type:"teach", glyph:"☋", eyebrow:`Casa ${h}`, title:c.houses[h-1].title, body:c.houses[h-1].body}); }
  steps.push({type:"reflect", q:ex.q, hint:HINT});
  return {id, kind:"No mapa", title:"Os nodos lunares", glyph:"☊", light:null, card:null, doneTitle:"A cabeça e a cauda do dragão", doneText:`Nodo Norte em ${SIGN_NAMES[s]}, Nodo Sul em ${SIGN_NAMES[op]}. Próxima parada: a síntese.`, steps};
}
function j2Sintese(id){
  const c=CT.mapa.sintese, P=S.chart.pts, w={sol:2,lua:2,merc:1,venus:1,marte:1,jupiter:1,saturno:1};
  const el={fogo:0,terra:0,ar:0,agua:0}, md={cardinal:0,fixo:0,mutavel:0};
  const add=(lon,n)=>{ const s=signOf(lon); el[SIGN_EL[s]]+=n; md[MODN[s%3]]+=n; };
  for(const k in w) add(P[k], w[k]); if(hasAsc()) add(S.chart.asc, 2);
  const els=Object.keys(el).sort((a,b)=>el[b]-el[a]), mds=Object.keys(md).sort((a,b)=>md[b]-md[a]);
  const dom=els[0], low=els[3], mdom=mds[0];
  const trio=`Sol em ${SIGN_NAMES[signOf(P.sol)]}, Lua em ${SIGN_NAMES[signOf(P.lua)]}${hasAsc()?`, Ascendente em ${SIGN_NAMES[signOf(S.chart.asc)]}`:""}.`;
  const steps=[
    {type:"teach", chart:true, eyebrow:`O mapa de ${first()}`, title:c.intro.title, body:[...c.intro.body, `Neste mapa: ${trio}`]},
    {type:"choice", q:"Qual elemento predomina neste mapa?", opts:[ELN[dom], ...Object.values(ELN).filter(x=>x!==ELN[dom])], a:0,
     explain:`Contando Sol, Lua${hasAsc()?" e Ascendente com peso dois":" com peso dois"} e os outros planetas pessoais, ${ELN[dom].toLowerCase()} soma ${el[dom]} pontos neste mapa.`},
    {type:"teach", glyph:"△", eyebrow:`Muito ${ELN[dom].toLowerCase()}`, title:c.elementos[dom].muito.title, body:c.elementos[dom].muito.body}
  ];
  if(el[low] <= 2) steps.push({type:"teach", glyph:"▽", eyebrow:`Pouco ${ELN[low].toLowerCase()}`, title:c.elementos[low].pouco.title, body:c.elementos[low].pouco.body});
  steps.push({type:"choice", q:"E qual modalidade predomina?", opts:[MODL[mdom], ...Object.values(MODL).filter(x=>x!==MODL[mdom]), "Nenhuma: todas empatam"], a:0,
    explain:"Cardinal começa, fixo sustenta, mutável transforma. É o jeito como este mapa se move no tempo."},
    {type:"teach", glyph:"◯", eyebrow:`Modalidade ${MODL[mdom].toLowerCase()}`, title:c.modos[mdom].title, body:c.modos[mdom].body},
    {type:"teach", chart:true, eyebrow:"A síntese", title:c.fim.title, body:c.fim.body},
    {type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"No mapa", title:"A síntese", glyph:"✦", light:null, card:null, doneTitle:"O mapa inteiro como uma história", doneText:"A segunda jornada termina aqui. A terceira coloca este mapa em movimento: a energia astrológica de cada dia passando sobre ele.", steps};
}

/* ----- jornada 3 ----- */
const NOW = () => new Date();
function j3Lua(id){
  const c=CT.transitos.lua, A=window.Astronomy, now=NOW();
  const ph=A.MoonPhase(now), fi=Math.floor(norm360(ph)/45), ill=Math.round(A.Illumination(A.Body.Moon, now).phase_fraction*100);
  const nn=A.SearchMoonPhase(0, now, 40).date, nf=A.SearchMoonPhase(180, now, 40).date;
  const where = d => { const l=lonAt("lua", d); return `em ${SIGN_NAMES[signOf(l)]}${houseTxt(l)}`; };
  const steps=[
    {type:"teach", glyph:"☽", eyebrow:"A Lua e suas fases", title:c.intro.title, body:c.intro.body},
    Object.assign({type:"order"}, c.order),
    {type:"teach", glyph:"☽", eyebrow:"Hoje · "+fmtD(now), title:c.fases[fi].title||FASES[fi], body:[`Fase de hoje: ${FASES[fi]}, com ${ill}% do disco iluminado.`, ...c.fases[fi].body, `A próxima Lua nova é em ${fmtD(nn)}, ${where(nn)}. A próxima Lua cheia, em ${fmtD(nf)}, ${where(nf)}.`]}
  ];
  const bd=birthDate();
  if(bd){ const ni=Math.floor(norm360(A.MoonPhase(bd))/45);
    steps.push({type:"choice", q:`Em que fase estava a Lua no nascimento de ${first()}?`, opts:[FASES[ni], ...others3(FASES[ni],FASES)], a:0, explain:"A fase natal mostra a conversa entre o Sol e a Lua no instante do nascimento: o quanto a luz já tinha crescido ou minguado."},
      {type:"teach", glyph:"☽", eyebrow:`No nascimento · ${FASES[ni]}`, title:c.natal[ni].title, body:c.natal[ni].body}); }
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"A Lua e suas fases", glyph:"☽", light:null, card:null, doneTitle:"O ritmo da Lua", doneText:`Próxima Lua nova: ${fmtD(nn)}. Próxima Lua cheia: ${fmtD(nf)}.`, steps};
}
function rxLine(k, nomeTxt){
  const now=NOW(), dias={merc:400, venus:620, marte:820}[k];
  const per=retroPeriods(k, new Date(+now-1*864e5), dias);
  if(isRetro(k, now)){ const p=per[0]; return {agora:true, txt:`${nomeTxt} está retrógrado agora, em ${SIGN_NAMES[signOf(lonAt(k,now))]}${houseTxt(lonAt(k,now))}${p&&p.end?`, até por volta de ${fmtD(p.end)}`:""}.`}; }
  const p=per[0]; if(!p) return {txt:""};
  return {txt:`O próximo ${nomeTxt.replace(/^O /,"")} retrógrado começa por volta de ${fmtDY(p.start)}, em ${SIGN_NAMES[signOf(p.lon)]}${houseTxt(p.lon)}${p.end?`, e termina por volta de ${fmtD(p.end)}`:""}.`, p};
}
function j3Mercurio(id){
  const c=CT.transitos.mercurio, r=rxLine("merc","Mercúrio"), bd=birthDate();
  const steps=[{type:"teach", glyph:"☿", eyebrow:"Mercúrio retrógrado", title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice),
    {type:"teach", glyph:"☿", eyebrow:r.agora?"Agora":"O próximo", title:c.periodo.title, body:[r.txt, ...c.periodo.body].filter(Boolean)}];
  if(bd){ const rx=isRetro("merc", bd), o=rx?c.natal_rx:c.natal_direto;
    steps.push({type:"choice", q:`No nascimento de ${first()}, Mercúrio estava:`, opts:rx?["Retrógrado","Direto","Estacionado no Sol","Fora do zodíaco"]:["Direto","Retrógrado","Estacionado no Sol","Fora do zodíaco"], a:0, explain:"Nascer com Mercúrio retrógrado acontece com cerca de uma em cada cinco pessoas. Muda o caminho do pensamento, não a inteligência."},
      {type:"teach", glyph:"☿", eyebrow:"No nascimento", title:o.title, body:o.body}); }
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"Mercúrio retrógrado", glyph:"☿", light:null, card:null, doneTitle:"A ilusão de ótica de Hermes", doneText:r.txt||"Mercúrio fica retrógrado cerca de três vezes por ano.", steps};
}
function j3Venus(id){
  const c=CT.transitos.venus, A=window.Astronomy, bd=birthDate(), now=NOW();
  const steps=[{type:"teach", glyph:"♀", eyebrow:"Os ciclos do Vênus", title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice)];
  if(bd){ const e=A.Elongation(A.Body.Venus, bd), m=e.visibility==="morning";
    steps.push({type:"choice", q:`No nascimento de ${first()}, o Vênus era:`, opts:m?["Estrela da manhã","Estrela da tarde"]:["Estrela da tarde","Estrela da manhã"], a:0, explain:m?"O Vênus estava a oeste do Sol: nascia antes dele e brilhava na madrugada.":"O Vênus estava a leste do Sol: aparecia depois do pôr do Sol, no começo da noite."},
      {type:"teach", glyph:"♀", eyebrow:"No nascimento", title:(m?c.manha:c.tarde).title, body:(m?c.manha:c.tarde).body}); }
  const en=A.Elongation(A.Body.Venus, now), r=rxLine("venus","O Vênus");
  steps.push({type:"teach", glyph:"♀", eyebrow:"Agora · "+fmtD(now), title:c.rx.title, body:[`Hoje o Vênus está em ${SIGN_NAMES[signOf(lonAt("venus",now))]}${houseTxt(lonAt("venus",now))} e aparece como estrela da ${en.visibility==="morning"?"manhã":"tarde"}.`, r.txt, ...c.rx.body].filter(Boolean)},
    {type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"Os ciclos do Vênus", glyph:"♀", light:null, card:null, doneTitle:"Estrela da manhã, estrela da tarde", doneText:r.txt||"", steps};
}
function j3Lento(k, id, title, glyph, dias){
  const c=CT.transitos[k], now=NOW(), l=lonAt(k,now), s=signOf(l), ing=nextIngress(k, now, dias);
  const line=`Hoje ${art(k)} está em ${SIGN_NAMES[s]}${houseTxt(l)}${isRetro(k,now)?", em movimento retrógrado":""}.${ing?` Entra em ${SIGN_NAMES[ing.sign]} por volta de ${fmtDY(ing.date)}.`:""}`;
  const steps=[{type:"teach", glyph, eyebrow:title, title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice)];
  if(hasAsc()){ const h=houseOf(l), hc=c.houses[h-1];
    steps.push({type:"choice", chart:true, q:`Por qual casa deste mapa ${art(k)} passa agora?`, opts:["Casa "+h, ...others3(h,[1,2,3,4,5,6,7,8,9,10,11,12]).map(n=>"Casa "+n)], a:0, explain:`Com Ascendente em ${SIGN_NAMES[signOf(S.chart.asc)]}, ${SIGN_NAMES[s]} é a casa ${h}: ${HOUSES[h]}.`},
      {type:"teach", glyph, eyebrow:`Agora · casa ${h}`, title:hc.title, body:[line, ...hc.body]});
    steps.push({type:"reflect", q:hc.q||c.q, hint:HINT});
  } else {
    steps.push({type:"teach", glyph, eyebrow:"Agora", title:`${Art(k)} em ${SIGN_NAMES[s]}`, body:[line, "Com a hora de nascimento, esta lição mostra a casa do mapa por onde ele passa. Dá para completar em Dados de nascimento, no fim da tela inicial."]},
      {type:"reflect", q:c.q||(c.houses[0]&&c.houses[0].q), hint:HINT});
  }
  return {id, kind:"Trânsitos", title, glyph, light:null, card:null, doneTitle:title, doneText:line, steps};
}
function saturnReturns(bd){
  const nat=lonAt("saturno", bd), out=[];
  for(const [a,b] of [[26,33],[55,62]]){
    let prev=null;
    for(let t=+bd+a*365.25*864e5; t<+bd+b*365.25*864e5; t+=3*864e5){
      const d=wrap180(lonAt("saturno", new Date(t))-nat);
      if(prev!==null && prev<0 && d>=0 && Math.abs(d)<20){ out.push(new Date(t)); break; }
      prev=d;
    }
  }
  return out;
}
function j3Saturno(id){
  const c=CT.transitos.saturno, bd=birthDate(), now=NOW(), l=lonAt("saturno",now);
  const steps=[{type:"teach", glyph:"♄", eyebrow:"O retorno de Saturno", title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice)];
  let done="";
  if(bd){
    const rs=saturnReturns(bd), age=d=>Math.floor((d-bd)/(365.25*864e5));
    const near=rs.find(d=>Math.abs(d-now)<1.3*365.25*864e5), fut=rs.find(d=>d>now);
    const st = near ? "durante" : (fut && rs.indexOf(fut)===0) ? "antes" : "depois";
    const ref = near || fut || rs[0];
    const line = ref ? (st==="durante" ? `O retorno de Saturno deste mapa está acontecendo agora: o Saturno do céu ${ref<now?"voltou":"volta"} ao grau do nascimento por volta de ${fmtMY(ref)}, aos ${age(ref)} anos.`
      : st==="antes" ? `O primeiro retorno de Saturno deste mapa acontece por volta de ${fmtMY(ref)}, aos ${age(ref)} anos.`
      : `O primeiro retorno de Saturno deste mapa aconteceu por volta de ${fmtMY(rs[0])}, aos ${age(rs[0])} anos.${fut?` O segundo vem por volta de ${fmtMY(fut)}.`:""}`) : "";
    steps.push({type:"teach", glyph:"♄", eyebrow:{antes:"Antes do retorno",durante:"Durante o retorno",depois:"Depois do retorno"}[st], title:c[st].title, body:[line, ...c[st].body].filter(Boolean)});
    done=line;
  }
  if(hasAsc()){ const h=houseOf(l); steps.push({type:"teach", glyph:"♄", eyebrow:`Agora · casa ${h}`, title:c.houses[h-1].title, body:[`Hoje Saturno está em ${SIGN_NAMES[signOf(l)]}, na casa ${h} deste mapa.`, ...c.houses[h-1].body]}); }
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"O retorno de Saturno", glyph:"♄", light:null, card:null, doneTitle:"A travessia de Cronos", doneText:done, steps};
}
function j3Lentos(id){
  const c=CT.transitos.lentos, now=NOW();
  const steps=[{type:"teach", glyph:"♅", eyebrow:"Os lentos", title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice)];
  for(const k of ["urano","netuno","plutao"]){
    const l=lonAt(k,now), s=signOf(l), line=`Hoje ${art(k)} está em ${SIGN_NAMES[s]}${houseTxt(l)}${isRetro(k,now)?", em movimento retrógrado":""}.`;
    if(hasAsc()){ const o=c[k][houseOf(l)-1]; steps.push({type:"teach", glyph:PGL[k], eyebrow:`${nm(k)} · casa ${houseOf(l)}`, title:o.title, body:[line, ...o.body]}); }
    else steps.push({type:"teach", glyph:PGL[k], eyebrow:nm(k), title:`${Art(k)} em ${SIGN_NAMES[s]}`, body:[line]});
  }
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"Os lentos", glyph:"♇", light:null, card:null, doneTitle:"O terreno que muda devagar", doneText:"Urano, Netuno e Plutão passam anos na mesma casa do mapa.", steps};
}
function nextEclipses(from){
  const A=window.Astronomy;
  const so=A.SearchGlobalSolarEclipse(from), lu=A.SearchLunarEclipse(from);
  const kindS={total:"total", annular:"anular", partial:"parcial", hybrid:"híbrido"}, kindL={total:"total", partial:"parcial", penumbral:"penumbral"};
  const sd=so.peak.date, ld=lu.peak.date;
  return {solar:{date:sd, lon:lonAt("sol",sd), kind:kindS[so.kind]||so.kind}, lunar:{date:ld, lon:lonAt("lua",ld), kind:kindL[lu.kind]||lu.kind}};
}
function j3Eclipses(id){
  const c=CT.transitos.eclipses, E=nextEclipses(NOW());
  const ls = e => `${fmtDY(e.date)}, em ${SIGN_NAMES[signOf(e.lon)]}${houseTxt(e.lon)}`;
  const steps=[{type:"teach", glyph:"☊", eyebrow:"Eclipses", title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice),
    {type:"teach", glyph:"☉", eyebrow:`Próximo eclipse solar · ${E.solar.kind}`, title:c.solar.title, body:[`O próximo eclipse do Sol acontece em ${ls(E.solar)}.`, ...c.solar.body]},
    {type:"teach", glyph:"☽", eyebrow:`Próximo eclipse lunar · ${E.lunar.kind}`, title:c.lunar.title, body:[`O próximo eclipse da Lua acontece em ${ls(E.lunar)}.`, ...c.lunar.body]}];
  if(hasAsc()){ const h=houseOf(E.solar.lon); steps.push({type:"teach", glyph:"✦", eyebrow:`Casa ${h} deste mapa`, title:c.houses[h-1].title, body:c.houses[h-1].body}); }
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"Eclipses", glyph:"☊", light:null, card:null, doneTitle:"Os portais do semestre", doneText:`Próximo eclipse solar: ${fmtDY(E.solar.date)}. Próximo lunar: ${fmtDY(E.lunar.date)}.`, steps};
}
function solarReturn(){
  const A=window.Astronomy, bd=birthDate(); if(!bd) return null;
  const nat=S.chart.pts.sol, now=NOW();
  const t=A.SearchSunLongitude(nat, new Date(+now-20*864e5), 400); if(!t) return null;
  const d=t.date, c=S.user.cityData;
  return {date:d, asc: hasAsc() ? ascAt(d, c[1], c[2]) : null, past: d<now};
}
function j3Revolucao(id){
  const c=CT.transitos.revolucao, sr=solarReturn();
  const steps=[{type:"teach", glyph:"☉", eyebrow:"A revolução solar", title:c.intro.title, body:c.intro.body}, Object.assign({type:"choice", a:0}, c.choice)];
  if(sr){
    const hr=sr.date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit", timeZone:S.user.cityData[3]});
    steps.push({type:"teach", glyph:"☉", eyebrow:sr.past?"A revolução deste ano":"A próxima revolução", title:`${fmtDY(sr.date)}, às ${hr}`, body:[`É o instante em que o Sol ${sr.past?"voltou":"volta"} exatamente ao grau em que estava no nascimento de ${first()}: ${SIGN_NAMES[signOf(S.chart.pts.sol)]}, ${degOf(S.chart.pts.sol)} graus. O horário é o da cidade de nascimento.`]});
    if(sr.asc!==null){ const s=signOf(sr.asc), o=c.asc[s];
      steps.push({type:"choice", q:"Calculada para a cidade de nascimento, em que signo está o Ascendente dessa revolução solar?", opts:signOpts(s), a:0, explain:"O Ascendente da revolução solar muda todo ano, porque o Sol volta ao mesmo grau, mas a Terra está girada de outro jeito."},
        {type:"teach", glyph:SIGNS[s], eyebrow:`Ascendente da revolução em ${SIGN_NAMES[s]}`, title:o.title, body:o.body}); }
  }
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"A revolução solar", glyph:"☉", light:null, card:null, doneTitle:"O mapa do aniversário", doneText:sr?`Revolução solar: ${fmtDY(sr.date)}.`:"", steps};
}
function transitAspects(now){
  const P=S.chart.pts, nat=["sol","lua","merc","venus","marte"].map(k=>[k,P[k]]); if(hasAsc()) nat.push(["asc",S.chart.asc]);
  const tr=["marte","jupiter","saturno","urano","netuno","plutao"].map(k=>[k,lonAt(k,now)]);
  const out=[];
  for(const [kt,lt] of tr) for(const [kn,ln] of nat){
    const d=Math.abs(wrap180(lt-ln)), lim=kt==="marte"?2:3;
    for(const [t,ang,name,gl] of ASP){ if(t==="sextil" && kt!=="marte" && kt!=="jupiter") continue; const orb=Math.abs(d-ang); if(orb<=lim) out.push({t:kt, n:kn, asp:t, name, gl, orb, w:orb - ({plutao:1.5,netuno:1.2,urano:1.2,saturno:1,jupiter:.5,marte:0}[kt])}); }
  }
  return out.sort((a,b)=>a.w-b.w);
}
const aCon = n => n.startsWith("o ") ? "ao "+n.slice(2) : n.startsWith("a ") ? "à "+n.slice(2) : "a "+n;
const natName = k => k==="asc" ? "o Ascendente" : art(k);
function j3Transitos(id){
  const c=CT.transitos.transitos, now=NOW(), tr=transitAspects(now);
  const steps=[{type:"teach", chart:true, eyebrow:"Trânsitos no próprio mapa", title:c.intro.title, body:c.intro.body}, Object.assign({type:"match"}, c.match)];
  const top=[]; for(const x of tr){ if(top.length>=3) break; if(!top.some(y=>y.t===x.t)) top.push(x); }
  top.forEach((x,i)=>{
    const orb=Math.round(x.orb*10)/10;
    if(i===0) steps.push({type:"choice", q:`Agora, ${art(x.t)} em trânsito faz ${x.name.toLowerCase()} com qual ponto deste mapa?`, opts:[cap1(natName(x.n)), ...others3(cap1(natName(x.n)), ["O Sol","A Lua","Mercúrio","O Vênus","Marte","O Ascendente"])], a:0,
      explain:`${Art(x.t)} do céu de hoje está a ${orb.toString().replace(".",",")} grau do aspecto exato com ${natName(x.n)} do nascimento.`});
    steps.push({type:"teach", glyph:PGL[x.t], eyebrow:`${x.name} · ${orb.toString().replace(".",",")} de folga`, title:`${Art(x.t)} ${({conjuncao:"sobre",sextil:"em sextil com",quadratura:"em quadratura com",trigono:"em trígono com",oposicao:"em oposição"})[x.asp]}${x.asp==="oposicao"?" "+aCon(natName(x.n)):" "+natName(x.n)}`, body:[c.tons[x.t], c.aspectos[x.asp]]});
  });
  if(!top.length) steps.push({type:"teach", glyph:"◯", eyebrow:"Agora", title:c.nenhum.title, body:c.nenhum.body});
  steps.push({type:"reflect", q:c.q, hint:HINT});
  return {id, kind:"Trânsitos", title:"Trânsitos no próprio mapa", glyph:"✦", light:null, card:null, doneTitle:"O tempo tocando o mapa",
    doneText: top.length ? `O trânsito mais forte agora: ${art(top[0].t)} ${({conjuncao:"em conjunção com",sextil:"em sextil com",quadratura:"em quadratura com",trigono:"em trígono com",oposicao:"em oposição"})[top[0].asp]} ${top[0].asp==="oposicao"?aCon(natName(top[0].n)):natName(top[0].n)}.` : "Nenhum trânsito lento está exato neste momento.", steps};
}
function j3Ano(id){
  const c=CT.transitos.ano, now=NOW(), in12=new Date(+now+365*864e5);
  const ju=lonAt("jupiter",now), ju2=lonAt("jupiter",in12), sa=lonAt("saturno",now), E=nextEclipses(now), sr=solarReturn();
  const lines=[
    `Júpiter: hoje em ${SIGN_NAMES[signOf(ju)]}${houseTxt(ju)}; daqui a um ano, em ${SIGN_NAMES[signOf(ju2)]}${houseTxt(ju2)}.`,
    `Saturno: em ${SIGN_NAMES[signOf(sa)]}${houseTxt(sa)}.`,
    `Eclipses: o próximo solar em ${fmtD(E.solar.date)}, em ${SIGN_NAMES[signOf(E.solar.lon)]}; o próximo lunar em ${fmtD(E.lunar.date)}, em ${SIGN_NAMES[signOf(E.lunar.lon)]}.`
  ];
  if(sr) lines.push(`Revolução solar: ${fmtDY(sr.date)}${sr.asc!==null?`, com Ascendente em ${SIGN_NAMES[signOf(sr.asc)]}`:""}.`);
  const steps=[{type:"teach", glyph:"✦", eyebrow:"O ano astrológico", title:c.intro.title, body:c.intro.body},
    {type:"teach", chart:true, eyebrow:`O ano de ${first()}`, title:"As camadas dos próximos meses", body:lines},
    {type:"choice", q:"Qual destes planetas leva cerca de um ano em cada signo?", opts:["Júpiter","Saturno","Marte","Plutão"], a:0, explain:"Júpiter dá a volta no zodíaco em cerca de 12 anos: um signo por ano, uma casa do mapa por ano. Por isso ele é a régua do ano."},
    {type:"teach", glyph:"✦", eyebrow:"As três jornadas", title:c.fim.title, body:c.fim.body},
    {type:"reflect", q:c.q, hint:HINT}];
  return {id, kind:"Trânsitos", title:"O ano astrológico", glyph:"✦", light:null, card:null, doneTitle:"As três jornadas completas", doneText:"A linguagem, o próprio mapa e o tempo passando por ele. A lição do dia continua todo dia.", steps};
}

const J2B = [null,
  id=>j2Planet("sol",id,"a Lua"), id=>j2Planet("lua",id,"Mercúrio"), id=>j2Planet("merc",id,"o Vênus"), id=>j2Planet("venus",id,"Marte"), id=>j2Planet("marte",id,"Júpiter e Saturno"),
  j2JupSat, j2Lentos, j2Casas, j2Aspectos, j2Nodos, j2Sintese];
const J3B = [null, j3Lua, j3Mercurio, j3Venus, id=>j3Lento("marte",id,"Marte em trânsito","♂",200), id=>j3Lento("jupiter",id,"Júpiter, um ano por signo","♃",500), j3Saturno, j3Lentos, j3Eclipses, j3Revolucao, j3Transitos, j3Ano];
const buildCache = {};
function buildJ(j, i){
  const id=(j===2?"mapa-":"tr-")+(i+1);
  if(!CT || !S.chart) return null;
  const key=id+"|"+today()+"|"+(S.user&&S.user.birth)+(S.user&&S.user.time)+(S.user&&S.user.city);
  if(buildCache[key]) return buildCache[key];
  try{ const L=(j===2?J2B:J3B)[i](id); if(L && !L.needTime) L.steps.forEach(s=>{ if(s.type==="choice" && s.opts) s.opts=s.opts.filter((x,k,a)=>a.indexOf(x)===k); }); buildCache[key]=L; return L; }
  catch(e){ console.error("jornada", id, e); return null; }
}
