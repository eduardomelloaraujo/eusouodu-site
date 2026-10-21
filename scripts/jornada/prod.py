# Gera a versão de venda (jornada.eusouodu.com) a partir do template do protótipo.
import json, glob, re, shutil, os
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
REPO = os.path.abspath(HERE + '../..') + '/'
OUT = REPO + 'jornada/'
os.makedirs(OUT, exist_ok=True)

units = sorted([json.load(open(f)) for f in [HERE + 'aries.json'] + [f for f in glob.glob(REPO + 'lib/jornada/*.json') if os.path.basename(f) not in ('mapa.json', 'transitos.json')]], key=lambda u: u['sign'])
aries = units[0]
catalog = []
for u in units:
    c = {k: u[k] for k in ('sign', 'slug', 'name', 'subtitle', 'element', 'blurb')}
    if u['slug'] == 'aries':
        c['lessons'] = u['lessons']
    else:
        c['lessons'] = [{k: l[k] for k in ('id', 'kind', 'title', 'glyph', 'light', 'card', 'doneTitle', 'doneText')} | {'locked': True} for l in u['lessons']]
    catalog.append(c)

s = open(HERE + 'app.tpl.html').read()
css = open(HERE + 'css.css').read()
s = s.replace('<!--CSS-->', css)

def R(old, new, count=1):
    global s
    assert old in s, 'não achei: ' + old[:90]
    s = s.replace(old, new, count)

def RX(pat, new, flags=re.S):
    global s
    s2, n = re.subn(pat, lambda m: new, s, count=1, flags=flags)
    assert n == 1, 'regex não casou: ' + pat[:90]
    s = s2

# ---------- cabeça: PWA, biblioteca local ----------
R('<title>Jornada do Zodíaco</title>', '''<title>Jornada · astrologia, mitologia e filosofia</title>
<meta name="description" content="Aprender astrologia um passo por dia, a partir do próprio mapa natal. Signos, mitologia, planetas e filosofia, com o astrólogo Eduardo (@eusouodu).">
<meta name="theme-color" content="#05060A">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Jornada">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta property="og:title" content="Jornada · astrologia, mitologia e filosofia">
<meta property="og:description" content="Um passo por dia, a partir do próprio mapa natal.">
<meta property="og:image" content="https://jornada.eusouodu.com/og.png">''')
R('<meta name="claude:viewport-fit-sides" content="cover">', '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta charset="utf-8">')
R('<script src="https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js"></script>', '<script src="astronomy.browser.min.js"></script>')
# o skeleton do Artifact dava o reset; aqui ele vem junto
R('[hidden]{display:none!important}\n', '''[hidden]{display:none!important}
html{-webkit-text-size-adjust:100%}
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}
img{max-width:100%}
*{box-sizing:border-box}
.cres{display:grid;gap:8px;margin-top:12px}
.cres button{text-align:left;border:var(--borda);border-radius:14px;padding:12px 14px;background:var(--papel);font-weight:600;font-size:16px;box-shadow:2px 2px 0 var(--tinta)}
.cres button small{display:block;font-weight:500;color:var(--suave);font-size:12px}
.install{margin-top:20px;border:var(--borda);border-radius:18px;padding:14px;background:var(--ceu);box-shadow:3px 3px 0 var(--tinta);position:relative}
.install b{display:block;font-family:var(--display);font-weight:900;font-size:19px;margin-bottom:4px}
.install p{margin:0 0 10px;font-size:14px;font-weight:500;line-height:1.45}
.install .xx{position:absolute;top:8px;right:10px;background:none;border:0;font-size:20px;font-weight:800}
.footer{margin-top:34px;display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center;font-size:13px;font-weight:600}
.footer a,.footer button{color:var(--suave);background:none;border:0;padding:0;text-decoration:underline;text-underline-offset:3px;font:inherit}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:30;background:var(--tinta);color:var(--creme);border-radius:14px;padding:12px 16px;font-weight:700;font-size:14px;max-width:min(92vw,420px);text-align:center}
.lockline{font-size:13px;font-weight:600;color:var(--suave);text-align:center;margin:-6px 0 0}
''')

# ---------- conteúdo: Áries completo; o resto como vitrine até o plano liberar ----------
R('const UNITS = /*UNITS*/[];', 'let UNITS = ' + json.dumps(catalog, ensure_ascii=False) + ';')

# ---------- textos do protótipo ----------
R('<div class="brand">Jornada<small id="who">Protótipo · @eusouodu</small></div>', '<div class="brand">Jornada<small id="who">@eusouodu</small></div>')
RX(r'\n  <div class="prev">.*?</div>\n  <button class="edit" id="editData">Editar dados de nascimento</button>\n  <button class="reset" id="reset">Recomeçar protótipo</button>',
   '''
  <div id="installBox"></div>
  <nav class="footer"><button id="editData">Dados de nascimento</button><a href="termos.html">Termos de uso</a><a href="privacidade.html">Privacidade</a><a href="mailto:falecom@eusouodu.com">falecom@eusouodu.com</a><button id="logout">Sair desta conta</button></nav>''')
R('<p>Cada erro apaga uma lua. Elas voltam com o tempo. Assinantes praticam sem limite.</p>\n    <div style="height:14px"></div>\n    <button class="btn" id="refill">Recarregar luas (protótipo)</button>',
  '<p>Cada erro apaga uma lua, e uma lua volta a cada 4 horas. Com um plano ativo, as luas não acabam.</p>\n    <div style="height:14px"></div>\n    <button class="btn" id="refill">Ver os planos</button>\n    <button class="link" id="emptyBack">Voltar para a jornada</button>')
R('<p class="fine" style="margin-top:12px">No protótipo, este botão só simula o pagamento aprovado.</p>', '<p class="fine" style="margin-top:12px" id="payNote">O pagamento acontece na página segura do Mercado Pago. Depois, a Jornada abre de novo aqui, já liberada.</p>')
# planos: o que está pronto hoje, sem prometer o que ainda não existe
R('<li>As 12 subjornadas da linguagem, de Áries a Peixes</li><li>A jornada do mapa natal</li><li>A jornada dos trânsitos</li><li>Luas ilimitadas, sem pausa por erro</li><li>Todas as cartas de mitologia e filosofia</li>',
  '<li>As 12 subjornadas da linguagem, de Áries a Peixes: 60 lições</li><li>Todas as 36 cartas de mitologia e filosofia</li><li>Luas ilimitadas, sem pausa por erro</li><li>As novas lições do mapa natal e dos trânsitos assim que forem lançadas, sem custo extra</li>')
R('<p class="fine">Pagamentos processados pelo Mercado Pago. O valor cobrado é sempre o que aparece aqui, sem taxa extra.</p>',
  '<p class="fine">Pagamentos processados pelo Mercado Pago. O valor cobrado é sempre o que aparece aqui, sem taxa extra. Direito de arrependimento: até 7 dias depois da compra, o valor volta inteiro, é só escrever para falecom@eusouodu.com. Detalhes nos <a href="termos.html">Termos de uso</a>.</p>')
R('<div class="free"><b>Grátis, para sempre</b><p>A subjornada de Áries inteira e a lição do dia. Sem cadastro de cartão, sem prazo.</p></div>',
  '<div class="free"><b>Grátis, para sempre</b><p>A subjornada de Áries inteira, a lição do dia e a primeira lição do mapa natal. Sem cartão, sem prazo.</p></div>')
R("2:`<b>Encontrar no próprio mapa.</b> Aqui o símbolo vira espelho: cada lição usa o mapa natal de quem joga. No protótipo, um mapa de exemplo.`,",
  "2:`<b>Encontrar no próprio mapa.</b> Aqui o símbolo vira espelho: cada lição usa o mapa natal de quem joga. A primeira já está aberta; as próximas chegam aos poucos.`,")
R("3:`<b>Ler os trânsitos.</b> A energia astrológica de cada dia passando sobre o mapa. Conteúdo que se renova sempre.`", "3:`<b>Ler os trânsitos.</b> A energia astrológica de cada dia passando sobre o mapa. A lição do dia já está aberta; as próximas chegam aos poucos.`")

# ---------- cidades: todas do Brasil e do mundo (mesma lista da Música Astral) ----------
RX(r'const CITIES=\[.*?\n\];\nconst cityLabel = c => c\[0\]\+", "\+c\[1\];', r'''const ALIAS={"Lisbon":"Lisboa","New York City":"Nova York","London":"Londres","Rome":"Roma","Madrid":"Madri","Tokyo":"Tóquio","Munich":"Munique","Milan":"Milão","Geneva":"Genebra","Brussels":"Bruxelas","Vienna":"Viena","Berlin":"Berlim","Warsaw":"Varsóvia","Paris":"Paris","Buenos Aires":"Buenos Aires","Porto":"Porto"};
const norm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
let CITY=[], cityReady=null;
const REG=(()=>{try{return new Intl.DisplayNames(["pt-BR"],{type:"region"})}catch(e){return null}})();
function loadCities(){
  if(cityReady) return cityReady;
  cityReady=fetch("/musica/cidades.json").then(r=>r.json()).then(d=>{
    d.br.forEach(c=>CITY.push({label:c[0]+", "+c[1],n:norm(c[0]),lat:c[2],lon:c[3],tz:d.tz[c[4]],rank:1e9+(c[5]||0)}));
    d.w.forEach(c=>{const pt=ALIAS[c[0]];const country=REG?REG.of(c[1]):c[1];
      CITY.push({label:(pt||c[0])+(c[6]?", "+c[6]:"")+", "+country,n:norm(c[0])+(pt?" | "+norm(pt):""),lat:c[2],lon:c[3],tz:d.tz[c[4]],rank:c[5]+(pt?5e8:0)})});
    return CITY;
  }).catch(e=>{ cityReady=null; throw e; });
  return cityReady;
}
function searchCities(q){
  q=norm(q); if(q.length<2) return [];
  const out=[];
  for(const c of CITY){
    const parts=c.n.split(" | "); let sc=-1;
    for(const s of parts){ if(s===q) sc=c.rank>=1e5?4:3; else if(s.startsWith(q)) sc=Math.max(sc,3); else if((" "+s).includes(" "+q)) sc=Math.max(sc,2); }
    if(sc<0 && norm(c.label).startsWith(q)) sc=1;
    if(sc>=0) out.push([sc,c]);
  }
  out.sort((a,b)=>b[0]-a[0]||b[1].rank-a[1].rank||a[1].label.localeCompare(b[1].label));
  return out.slice(0,7).map(x=>x[1]);
}''')
R('  const c = CITIES.find(x=>cityLabel(x)===u.city);\n', '  const c = u.cityData;\n')
R('  const date = localToUTC(y,m,d,h,mi,c[4]);', '  const date = localToUTC(y,m,d,h,mi,c[3]);')
R('  const ramc = ((A.SiderealTime(date)*15 + c[3]) % 360 + 360) % 360;', '  const ramc = ((A.SiderealTime(date)*15 + c[2]) % 360 + 360) % 360;')
R('e = (23.4393 - 0.0130*T2)*Math.PI/180, rr = ramc*Math.PI/180, ph = c[2]*Math.PI/180;', 'e = (23.4393 - 0.0130*T2)*Math.PI/180, rr = ramc*Math.PI/180, ph = c[1]*Math.PI/180;')
R('  const c = CITIES.find(x=>cityLabel(x)===d.city); if(!c || !d.birth) return "";', '  const c = d.cityData; if(!c || !d.birth) return "";\n  const cn = String(c[0]).split(",")[0];')
R('const k = dstInfo(y,m,dd,h,mi,c[4]);', 'const k = dstInfo(y,m,dd,h,mi,c[3]);')
s = s.replace('${esc(c[0])} pulou uma hora', '${esc(cn)} pulou uma hora').replace('${esc(c[0])} estava no horário de verão', '${esc(cn)} estava no horário de verão').replace('${esc(c[0])} estava no horário padrão', '${esc(cn)} estava no horário padrão')

# passo da cidade com busca
RX(r'  if\(st==="city"\)\{.*?\n  \}\n  if\(st==="email"\)\{', r'''  if(st==="city"){
    box.innerHTML = `<h2>A cidade de nascimento</h2><p class="sub">O céu muda conforme o lugar de onde se olha. Vale qualquer cidade do Brasil e as maiores do mundo.</p><input class="field" id="f1" autocomplete="off" autocapitalize="words" placeholder="Comece a digitar" value="${esc(d.city||"")}"><div class="cres" id="cres"></div>${err}`;
    next.textContent="Continuar";
    let picked = d.cityData ? {label:d.city, lat:d.cityData[1], lon:d.cityData[2], tz:d.cityData[3]} : null;
    const f1=$("f1"), cres=$("cres");
    const draw=()=>{ const q=f1.value; if(picked && picked.label===q){ cres.innerHTML=""; return; }
      loadCities().then(()=>{ const r=searchCities(q); cres.innerHTML = r.map((c,i)=>`<button type="button" data-i="${i}">${esc(c.label.split(", ")[0])}<small>${esc(c.label.split(", ").slice(1).join(", "))}</small></button>`).join("");
        cres.querySelectorAll("button").forEach(b=>b.onclick=()=>{ picked=r[+b.dataset.i]; f1.value=picked.label; cres.innerHTML=""; oerr(""); }); })
      .catch(()=>oerr("A lista de cidades não carregou. Confira a internet e digite de novo.")); };
    f1.oninput=draw;
    next.onclick=()=>{ if(!picked || picked.label!==f1.value) return oerr("Toque na cidade certa na lista que aparece embaixo."); d.city=picked.label; d.cityData=[picked.label,picked.lat,picked.lon,picked.tz]; ob.step++; renderOnb(); };
  }
  if(st==="email"){''')

# entrada: o "Já tenho uma conta" de verdade
R("alt.onclick=()=>openModal(`<h3>Entrar sem senha</h3><p>Na versão final, aqui entra o e-mail e chega um link mágico. Um toque e a jornada abre no ponto onde parou, em qualquer celular.</p><button class=\"btn\" id=\"mClose\">Entendi</button>`);",
  "alt.onclick=loginModal;")
# e-mail: cria a conta antes de calcular
R('''    next.onclick=()=>{ const v=$("f1").value.trim(); if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)) return oerr("Confira o e-mail: falta algo como nome@email.com."); d.email=v; d.optin=$("f2").checked; ob.step++; renderOnb(); };''',
  '''    next.onclick=async()=>{ const v=$("f1").value.trim().toLowerCase(); if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)) return oerr("Confira o e-mail: falta algo como nome@email.com."); d.email=v; d.optin=$("f2").checked;
      next.disabled=true; next.textContent="Guardando…";
      try{
        const r = await api("entrar",{method:"POST", body:{email:v, perfil:perfilOut(d), progresso:progOut()}}, false);
        if(r.existe){ box.innerHTML=`<h2>Esse e-mail já tem uma jornada</h2><p class="sub">Para proteger o progresso de quem já começou, a entrada é pelo link que acabou de ir para ${esc(v)}. Abra o e-mail neste celular e toque em Abrir a jornada.</p><p class="ohint">Não chegou? Confira o spam ou a aba Promoções. O link vale por 48 horas.</p>`; next.disabled=false; next.textContent="Usar outro e-mail"; next.onclick=()=>renderOnb(); return; }
        setToken(r.sessao); applyServer(r);
        ob.step++; renderOnb();
      }catch(e){ next.disabled=false; next.textContent="Calcular o meu mapa"; oerr(e.message||"Não deu certo agora. Tente de novo."); }
    };''')
R('<label class="check-row"><input type="checkbox" id="f2" ${d.optin!==false?"checked":""}><span>Quero receber a lição do dia por e-mail<small>Uma mensagem curta por dia, com a energia astrológica. Dá para sair quando quiser.</small></span></label>${err}\n      <p class="ohint">Os dados de nascimento servem só para calcular o mapa.</p>',
  '<label class="check-row"><input type="checkbox" id="f2" ${d.optin!==false?"checked":""}><span>Quero receber e-mails da Jornada<small>Novidades, lembretes e conteúdos do @eusouodu. Dá para sair quando quiser.</small></span></label>${err}\n      <p class="ohint">Os dados de nascimento servem só para calcular o mapa. Ao continuar, a gente concorda com os <a href="termos.html">Termos de uso</a> e a <a href="privacidade.html">Política de privacidade</a>.</p>')
# edição dos dados: pula o e-mail
R('    next.onclick=()=>{ const unk=$("f2").checked, v=$("f1").value; if(!unk && !v) return oerr("Escolha a hora ou marque que não sabe agora."); d.unknownTime=unk; d.time=unk?"":v; ob.step++; renderOnb(); };',
  '    next.onclick=()=>{ const unk=$("f2").checked, v=$("f1").value; if(!unk && !v) return oerr("Escolha a hora ou marque que não sabe agora."); d.unknownTime=unk; d.time=unk?"":v; ob.step += ob.edit ? 2 : 1; renderOnb(); };')
R('      S.user = {name:d.name, birth:d.birth, time:d.time, unknownTime:d.unknownTime, dst:d.dst, city:d.city, email:d.email, optin:d.optin};\n      S.chart = chart; save();',
  '      S.user = {name:d.name, birth:d.birth, time:d.time, unknownTime:d.unknownTime, city:d.city, cityData:d.cityData, email:d.email||(S.user&&S.user.email), optin:d.optin};\n      S.chart = chart; save();\n      if(ob.edit) api("sync",{method:"POST", body:{perfil:perfilOut(S.user)}}).catch(()=>{});')
R('function startOnb(edit){\n  ob = {step: edit?1:0, edit:!!edit, d: Object.assign({optin:true}, S.user||{})};',
  'function startOnb(edit){\n  ob = {step: edit?1:0, edit:!!edit, d: Object.assign({optin:true}, JSON.parse(JSON.stringify(S.user||{})))};')
R('$("oBack").onclick=()=>{ if(ob.step>0){ ob.step--; renderOnb(); } };', '$("oBack").onclick=()=>{ if(ob.step>0){ ob.step -= (ob.edit && OSTEPS[ob.step]==="calc") ? 2 : 1; renderOnb(); } };')

# ---------- estado: sem prévia, com luas que voltam e plano vindo do servidor ----------
R('const KEY = "jornada-proto-v2";', 'const KEY = "jornada-v1";')
R("diario:{}, j:1, preview:true, plan:null, user:null, chart:null});", "diario:{}, j:1, plan:null, user:null, chart:null, luasEm:0});")
R('function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }', 'function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} queueSync(); }')

# acesso
R('''function lessonOpen(ui, li){
  if(S.preview || planActive()) return true;
  if(ui>0) return false;
  return UNITS[0].lessons.slice(0,li).every(l=>S.done.includes(l.id));
}''', '''function lessonOpen(ui, li){
  if(ui>0 && !planActive()) return false;
  return UNITS[ui].lessons.slice(0,li).every(l=>S.done.includes(l.id));
}''')
R('  $("prevSw").classList.toggle("on", S.preview);\n', '  renderInstall();\n')
R("${(!S.preview&&!planActive()&&ui>0)?'<span class=\"paytag\">Assinantes</span>':''}", "${(!planActive()&&ui>0)?'<span class=\"paytag\">Com plano</span>':''}")
R("        else if(!S.preview && !planActive() && ui>0) payModal();", "        else if(!planActive() && ui>0) payModal();")
R('        if(done||open) startLesson(L);', '        if(done||open) openLesson(L);')
R('$("sLuas").textContent = S.luas;', '$("sLuas").textContent = planActive() ? "∞" : S.luas;')

# planos de verdade
RX(r'function planActive\(\)\{.*?\n\}\n', '''function planActive(){
  const p=S.plan; if(!p) return false;
  if(p.type==="semana") return Date.now() < p.until;
  if(p.type==="mes") return (p.status==="authorized" && !p.canceled) || Date.now() < p.until;
  return false;
}
''')
RX(r'\$\("payGo"\)\.onclick=\(\)=>\{.*?\n\};\n', '''$("payGo").onclick=async()=>{
  const b=$("payGo"); b.disabled=true; const t=b.textContent; b.textContent="Abrindo o Mercado Pago…";
  try{ const r = await api("checkout",{method:"POST", body:{plano:pending}}); location.href = r.url; }
  catch(e){ b.disabled=false; b.textContent=t; toast(e.message||"Não deu para abrir o pagamento agora."); }
};
''')
R('''box.innerHTML=`<div class="myplan"><div class="pname">Meu plano</div><b>Grátis</b><p>Áries e a lição do dia liberados.''', '''box.innerHTML=`<div class="myplan"><div class="pname">Meu plano</div><b>Grátis</b><p>Áries, a lição do dia e a primeira lição do mapa liberados.''')
R('''<button class="btn small plain" id="seePlans">Trocar para o mensal</button>''', '''<button class="btn small plain" id="seePlans">Ver o mensal</button>''')
R("  const until=new Date(S.plan.until);\n  if(S.plan.type===\"semana\"){", "  const until=new Date(S.plan.until);\n  if(S.plan.type===\"mes\" && S.plan.status===\"pending\"){\n    box.innerHTML=`<div class=\"myplan\"><div class=\"pname\">Meu plano</div><b>Assinatura sendo confirmada</b><p>O Mercado Pago ainda está confirmando o cartão. Assim que aprovar, a jornada inteira abre sozinha.</p></div>`; return;\n  }\n  if(S.plan.type===\"semana\"){")
R('''($("cYes").onclick=()=>{ S.plan.canceled=true; save(); $("modal").hidden=true; renderHome(); });''',
  '''($("cYes").onclick=async()=>{ const b=$("cYes"); b.disabled=true; b.textContent="Cancelando…"; try{ const r=await api("cancelar",{method:"POST"}); applyServer(r); $("modal").hidden=true; renderHome(); toast("Assinatura cancelada. Nenhuma cobrança nova vai acontecer."); }catch(e){ b.disabled=false; b.textContent="Cancelar assinatura"; toast(e.message||"Não deu para cancelar agora. Escreva para falecom@eusouodu.com."); } });''')
R('<b>Assinatura mensal ativa</b><p>Próxima cobrança em ${esc(fmtD(until))}: R$ 29,90 no cartão. Renova sozinha todo mês.</p>',
  '<b>Assinatura mensal ativa</b><p>Renova sozinha todo mês, no cartão, sempre R$ 29,90. Próxima cobrança por volta de ${esc(fmtD(new Date(S.plan.until-2*864e5)))}.</p>')
R('O acesso continua até ${esc(fmtD(until))}, o fim do mês já pago.', 'O acesso continua até o fim do mês já pago.')
R('''    box.innerHTML=`<div class="myplan on-semana">''', '''    box.innerHTML=`<div class="myplan on-semana">''')

R('''$("prevSw").onclick = () => { S.preview=!S.preview; save(); renderHome(); };
$("reset").onclick = () => { const p=S.preview; S = fresh(); S.preview=p; save(); startOnb(false); };
$("editData").onclick = () => startOnb(true);''', '''$("editData").onclick = () => startOnb(true);
$("logout").onclick = () => openModal(`<h3>Sair desta conta?</h3><p>O progresso fica guardado na conta. Para voltar, é só pedir o link de entrada com o mesmo e-mail.</p><div style="display:grid;gap:10px"><button class="btn" id="lgYes">Sair</button><button class="btn plain" id="mClose">Ficar</button></div>`) || ($("lgYes").onclick=()=>{ setToken(null); try{localStorage.removeItem(KEY)}catch(e){} location.replace(location.pathname); });''')

# lições: luas, conteúdo pago, lição do dia
R('function startLesson(lesson){\n  if(S.luas<=0){ show("empty"); return; }', 'function startLesson(lesson){\n  regenLuas();\n  if(!planActive() && S.luas<=0){ show("empty"); return; }')
R('  stats.wrong++; S.luas=Math.max(0,S.luas-1); save(); $("lLuas").textContent=S.luas;', '  stats.wrong++; if(!planActive()){ if(S.luas>=5) S.luasEm=Date.now(); S.luas=Math.max(0,S.luas-1); } save(); $("lLuas").textContent=planActive()?"∞":S.luas;')
R('  $("lLuas").textContent = S.luas;', '  $("lLuas").textContent = planActive() ? "∞" : S.luas;')
R('btn.onclick = () => { if(S.luas<=0 && kind==="bad"){ hideSheet(); show("empty"); } else next(); };', 'btn.onclick = () => { if(!planActive() && S.luas<=0 && kind==="bad"){ hideSheet(); show("empty"); } else next(); };')
R('$("refill").onclick = () => { S.luas=5; save(); show("home"); renderHome(); };', '$("refill").onclick = () => payModal();\n$("emptyBack").onclick = () => { show("home"); renderHome(); };')
R('$("daily").onclick = () => { if(S.daily!==today()) startLesson(DAILY); };', '$("daily").onclick = () => { if(S.daily!==today()){ const d=buildDaily(); if(d) startLesson(d); } };')
R('  ["A energia astrológica do dia","Uma lição relâmpago por dia, ligada aos trânsitos reais", DAILY],', '  ["A energia astrológica do dia","Uma lição relâmpago por dia, ligada à Lua de hoje no próprio mapa", null],')
R('  const m1 = buildMapa1(); J2[0][2] = m1;', '  J3[0][2] = buildDaily();\n  const m1 = buildMapa1(); J2[0][2] = m1;')
R('<h3>O Sol em Libra encara Áries</h3>', '<h3 id="dailyTitle">A Lua de hoje</h3>')
R("  $(\"dailySub\").textContent = dDone ? \"Feita hoje · volta amanhã\" : \"Lição relâmpago · 3 passos\";", "  $(\"dailySub\").textContent = dDone ? \"Feita hoje · volta amanhã\" : \"Lição relâmpago · 4 passos\";\n  { const dl=buildDaily(); if(dl) $(\"dailyTitle\").textContent = dl.title; }")

# ---------- código novo: servidor, sincronização, lição do dia, instalação ----------
NOVO = r'''
/* ---------- servidor ---------- */
const TK="jornada-sessao";
let TOKEN=null; try{ TOKEN=localStorage.getItem(TK); }catch(e){}
function setToken(t){ TOKEN=t; try{ t ? localStorage.setItem(TK,t) : localStorage.removeItem(TK); }catch(e){} }
async function api(a, {method="GET", body=null, query=""}={}, auth=true){
  const r = await fetch(`/api/jornada?a=${a}${query}`, {method, headers:{"content-type":"application/json", ...(auth&&TOKEN?{authorization:"Bearer "+TOKEN}:{})}, body: body?JSON.stringify(body):undefined});
  let j={}; try{ j=await r.json(); }catch(e){}
  if(r.status===401 && auth){ setToken(null); }
  if(!r.ok){ const e=new Error(j.erro||"Não deu certo agora. Tente de novo."); e.status=r.status; throw e; }
  return j;
}
const perfilOut = u => ({name:u.name, birth:u.birth, time:u.time||"", unknownTime:!!u.unknownTime, city:u.cityData, optin:u.optin!==false});
const progOut = () => ({done:S.done, lit:S.lit, cards:S.cards, xp:S.xp, streak:S.streak, last:S.last, daily:S.daily, luas:S.luas, luasEm:S.luasEm, diario:S.diario});
const uni = (a,b) => [...new Set([...(a||[]),...(b||[])])];
function applyServer(r){
  if(!r) return;
  if(r.plano !== undefined) S.plan = r.plano;
  if(r.perfil && r.perfil.city){
    const p=r.perfil;
    S.user = {name:p.nome, birth:p.birth, time:p.time, unknownTime:p.unknownTime, city:p.city[0], cityData:p.city, email:r.email, optin:p.optin};
    try{ S.chart = computeChart(S.user); }catch(e){}
  }
  const g=r.progresso;
  if(g){
    S.done=uni(S.done,g.done); S.lit=uni(S.lit,g.lit); S.cards=uni(S.cards,g.cards);
    S.xp=Math.max(S.xp||0,g.xp||0);
    if((g.last||"")>(S.last||"")){ S.streak=g.streak; S.last=g.last; } else S.streak=Math.max(S.streak||0, (g.last===S.last?g.streak:0)||0);
    if((g.daily||"")>(S.daily||"")) S.daily=g.daily;
    S.diario=Object.assign({}, g.diario||{}, S.diario||{});
  }
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){}
}
let syncT=null;
function queueSync(){ if(!TOKEN) return; clearTimeout(syncT); syncT=setTimeout(()=>{ api("sync",{method:"POST", body:{progresso:progOut()}}).then(r=>{ if(r.plano!==undefined){ const was=planActive(); S.plan=r.plano; if(was!==planActive()) renderIfHome(); } }).catch(()=>{}); }, 1500); }
function renderIfHome(){ if(!$("home").hidden) renderHome(); }
let contentLoaded=false;
async function loadContent(){
  if(contentLoaded || !planActive() || !TOKEN) return;
  try{
    const r = await api("conteudo");
    const bySlug = Object.fromEntries(r.unidades.map(u=>[u.slug,u]));
    UNITS = UNITS.map(u => bySlug[u.slug] || u);
    contentLoaded=true; renderIfHome();
  }catch(e){ if(e.status===402){ S.plan=S.plan&&{...S.plan, ativo:false}; } }
}
async function openLesson(L){
  if(!L.locked) return startLesson(L);
  if(!planActive()) return payModal();
  toast("Abrindo a lição…");
  await loadContent();
  const fresh = UNITS.flatMap(u=>u.lessons).find(x=>x.id===L.id);
  if(fresh && !fresh.locked) startLesson(fresh); else toast("A lição não carregou. Confira a internet e tente de novo.");
}
function regenLuas(){
  if(planActive()){ return; }
  const STEP=4*3600e3; S.luasEm=S.luasEm||Date.now();
  while(S.luas<5 && Date.now()-S.luasEm>=STEP){ S.luas++; S.luasEm+=STEP; }
  if(S.luas>=5) S.luasEm=0;
}
let toastT=null;
function toast(t){ let el=$("toastEl"); if(!el){ el=document.createElement("div"); el.id="toastEl"; el.className="toast"; document.body.appendChild(el); } el.textContent=t; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>el.hidden=true, 4200); }
function loginModal(){
  openModal(`<h3>Entrar sem senha</h3><p>Escreva o e-mail da jornada. Chega um link: um toque e ela abre no ponto onde parou.</p><input class="field" id="lgMail" type="email" inputmode="email" autocomplete="email" placeholder="nome@email.com"><p class="oerr" id="lgErr"></p><div style="display:grid;gap:10px;margin-top:6px"><button class="btn" id="lgSend">Mandar o link</button><button class="btn plain" id="mClose">Voltar</button></div>`);
  $("lgSend").onclick=async()=>{ const v=$("lgMail").value.trim().toLowerCase(); if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){ $("lgErr").textContent="Confira o e-mail."; return; }
    $("lgSend").disabled=true; try{ await api("pedir-link",{method:"POST", body:{email:v}}, false); $("mbox").innerHTML=`<h3>Confira o e-mail</h3><p>Se ${esc(v)} tiver uma jornada, o link chega em instantes. Abra neste celular. Vale por 48 horas. Olhe também o spam e a aba Promoções.</p><button class="btn" id="mClose">Entendi</button>`; $("mClose").onclick=()=>$("modal").hidden=true; }
    catch(e){ $("lgSend").disabled=false; $("lgErr").textContent=e.message; } };
}

/* ---------- lição do dia: a Lua de hoje no próprio mapa ---------- */
const ELEM_NAMES=["fogo","terra","ar","água"];
const MOON_DAY=["A emoção pede movimento e pressa. O que estava parado quer começar, nem que seja por um gesto pequeno.","A emoção pede corpo e calma. Comida boa, um lugar conhecido, o tempo devagar: a Lua em Touro se acalma no que é concreto.","A emoção quer conversa. O que não for dito fica girando; o que for dito ganha forma.","A Lua está em casa. O dia pede abrigo, memória e cuidado com quem é nosso.","A emoção quer ser vista. O dia favorece criar, brincar e dizer em voz alta o que a gente sente.","A emoção se organiza nas pequenas tarefas. Arrumar uma gaveta também arruma alguma coisa por dentro.","A emoção procura o outro. O dia pede acordo, beleza e escuta, sem perder a própria medida.","A emoção desce fundo. O que estava escondido sobe, e o dia pede coragem para olhar sem fugir.","A emoção quer horizonte. Uma ideia nova, um livro, um caminho diferente: o dia pede sentido.","A emoção se contém e trabalha. O dia favorece compromisso, estrutura e paciência com o tempo.","A emoção ganha distância para enxergar melhor. O dia pede liberdade e conversa com o coletivo.","A emoção se dissolve nas bordas. O dia pede sonho, música, silêncio e compaixão, também com a gente mesmo."];
const MOON_Q=["O que a gente quer começar hoje, mesmo sem saber onde vai dar?","O que faz o nosso corpo se sentir em casa?","Que conversa pode destravar o dia?","De quem a gente precisa cuidar hoje, inclusive de si?","O que a gente sente e ainda não mostrou?","Que pequeno gesto organizaria o dia?","Em que relação a gente precisa reencontrar a medida?","O que pede para ser olhado de frente?","Que pergunta grande anda acompanhando a gente?","Que compromisso merece mais paciência?","Do que a gente precisa se afastar para ver melhor?","O que a gente sente que não cabe em palavras?"];
let dailyCache=null;
function buildDaily(){
  const key=today()+(S.chart&&S.chart.hasAsc?"a":"");
  if(dailyCache && dailyCache.k===key) return dailyCache.v;
  let ml, sl;
  try{ const now=new Date(); ml=window.Astronomy.EclipticGeoMoon(now).lon; sl=window.Astronomy.SunPosition(now).elon; }catch(e){ return null; }
  const ms=signOf(ml), ss=signOf(sl), el=["fogo","terra","ar","água"][ms%4];
  const dataTxt=new Date().toLocaleDateString("pt-BR",{day:"numeric",month:"long"});
  const steps=[
    {type:"teach", glyph:SIGNS[ms], eyebrow:"Energia astrológica do dia · "+dataTxt, title:"A Lua em "+SIGN_NAMES[ms],
     body:[`Hoje a Lua atravessa ${SIGN_NAMES[ms]}, e o Sol segue em ${SIGN_NAMES[ss]}. A Lua muda de signo a cada dois dias e meio: é o planeta que dá o clima emocional do dia.`, MOON_DAY[ms]]},
    {type:"choice", q:`${SIGN_NAMES[ms]} é um signo de qual elemento?`, opts:[cap1(el), ...ELEM_NAMES.filter(x=>x!==el).map(cap1)], a:0,
     explain:`A Lua em signo de ${el} dá esse tom ao dia: ${({"fogo":"entusiasmo e impulso","terra":"concretude e corpo","ar":"ideias e conversa","água":"sentimento e memória"})[el]}.`}
  ];
  if(S.chart && S.chart.hasAsc){
    const h=((ms-signOf(S.chart.asc)+12)%12)+1;
    const others=shuffle([1,2,3,4,5,6,7,8,9,10,11,12].filter(n=>n!==h)).slice(0,3);
    steps.push({type:"choice", q:`No mapa de ${(S.user.name||"").split(" ")[0]}, por qual casa a Lua passa hoje?`, opts:["Casa "+h, ...others.map(n=>"Casa "+n)], a:0,
      explain:`Com Ascendente em ${SIGN_NAMES[signOf(S.chart.asc)]}, ${SIGN_NAMES[ms]} cai na casa ${h}: ${HOUSES[h]}. É ali que a emoção do dia pede atenção.`});
  } else {
    steps.push({type:"teach", glyph:"☽", eyebrow:"No próprio mapa", title:"A casa da Lua de hoje", body:["Com a hora de nascimento, a lição do dia mostra em qual casa do mapa a Lua está passando.","Dá para completar em Dados de nascimento, no fim da tela inicial."]});
  }
  steps.push({type:"reflect", q:MOON_Q[ms], hint:"Uma linha basta."});
  const v={id:"hoje", kind:"Hoje", title:"A Lua em "+SIGN_NAMES[ms], glyph:SIGNS[ms], light:null, card:null, doneTitle:"Lição do dia feita", doneText:"Amanhã a lição muda com a Lua.", steps};
  dailyCache={k:key, v}; return v;
}

/* ---------- instalar na tela de início ---------- */
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); deferredPrompt=e; renderIfHome(); });
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
function renderInstall(){
  const box=$("installBox"); if(!box) return;
  let hide=false; try{ hide = localStorage.getItem("jornada-install-x")==="1"; }catch(e){}
  if(standalone() || hide){ box.innerHTML=""; return; }
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  box.innerHTML = `<div class="install"><button class="xx" id="insX" aria-label="Fechar">×</button><b>A Jornada na tela de início</b>${ios
    ? `<p>No Safari, toque no botão Compartilhar, o quadrado com a seta para cima, e depois em Adicionar à Tela de Início. A Jornada abre como um app, em tela cheia.</p>`
    : deferredPrompt ? `<p>Um toque e ela fica junto dos outros apps, com ícone próprio.</p><button class="btn small" id="insGo">Instalar</button>` : `<p>No menu do navegador, os três pontinhos, toque em Instalar app ou Adicionar à tela inicial.</p>`}</div>`;
  $("insX").onclick=()=>{ try{ localStorage.setItem("jornada-install-x","1"); }catch(e){} box.innerHTML=""; };
  const go=$("insGo"); if(go) go.onclick=async()=>{ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; renderInstall(); };
}
if("serviceWorker" in navigator) window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
'''
R('/* ---------- motor da lição ---------- */', NOVO + '\n/* ---------- motor da lição ---------- */')

# ---------- início ----------
R('if(S.user && S.chart){ show("home"); renderHome(); } else startOnb(false);', r'''(async function boot(){
  const h = new URLSearchParams(location.hash.slice(1));
  if(h.get("s")){ setToken(h.get("s")); history.replaceState(null,"",location.pathname+location.search); }
  const q = new URLSearchParams(location.search);
  const pago = q.get("pago"), pa = q.get("preapproval_id");
  if(pago) history.replaceState(null,"",location.pathname);
  regenLuas();
  if(S.user && S.chart){ show("home"); renderHome(); }
  if(TOKEN){
    try{
      const r = await api("sync",{query: pa?`&preapproval_id=${encodeURIComponent(pa)}`:""});
      applyServer(r);
      if(!S.chart){ startOnb(false); return; }
      show("home"); renderHome(); loadContent();
    }catch(e){ if(!S.user) startOnb(false); }
  } else if(!S.user){ startOnb(false); return; }
  if(location.hash==="#planos"){ history.replaceState(null,"",location.pathname); payModal(); }
  if(pago==="falhou") toast("O pagamento não foi concluído. Nada foi cobrado.");
  if(pago==="semana" || pago==="pendente" || pago==="mes"){
    toast(pago==="mes" ? "Confirmando a assinatura…" : "Confirmando o Pix…");
    const done = () => pago==="mes" ? (S.plan && S.plan.type==="mes" && S.plan.status==="authorized") : planActive();
    for(let i=0;i<20 && !done();i++){ await new Promise(r=>setTimeout(r,3000)); try{ applyServer(await api("sync",{query: pa?`&preapproval_id=${encodeURIComponent(pa)}`:""})); }catch(e){} }
    if(done()){ await loadContent(); renderHome(); toast(pago==="mes" ? "Assinatura confirmada: a jornada inteira está aberta." : "Pronto: as doze subjornadas estão abertas."); }
    else toast("O pagamento ainda está sendo confirmado. Assim que cair, a jornada libera sozinha.");
  }
})();''')

exec(open(HERE + 'prod_j23.py').read())
exec(open(HERE + 'prod_landing.py').read())
exec(open(HERE + 'prod_mensal.py').read())

# confere que nada do protótipo ficou
for ruim in ['prevSw', 'preview', 'protótipo', 'Protótipo', 'simula o pagamento', 'Recarregar luas']:
    assert ruim not in s, 'sobrou: ' + ruim
# caminhos absolutos: no jornada.eusouodu.com só "/" é reescrito para a pasta /jornada
for a, b in [('href="manifest.webmanifest"', 'href="/jornada/manifest.webmanifest"'), ('href="icon-192.png"', 'href="/jornada/icon-192.png"'),
             ('href="apple-touch-icon.png"', 'href="/jornada/apple-touch-icon.png"'), ('src="astronomy.browser.min.js"', 'src="/jornada/astronomy.browser.min.js"'),
             ('href="termos.html"', 'href="/jornada/termos.html"'), ('href="privacidade.html"', 'href="/jornada/privacidade.html"'),
             ('https://jornada.eusouodu.com/og.png', 'https://jornada.eusouodu.com/jornada/og.png')]:
    assert a in s, a
    s = s.replace(a, b)
R('if("serviceWorker" in navigator) window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));',
  'if("serviceWorker" in navigator && /^jornada\\./.test(location.hostname)) window.addEventListener("load", ()=>navigator.serviceWorker.register("/jornada/sw.js",{scope:"/"}).catch(()=>{}));')
s = s.replace('<span class="sun">☉&#xFE0E;</span>', '<span class="sun">☽&#xFE0E;</span>')
# tema planetário (o mesmo céu do eusouodu.com) por último, por cima de todo o resto
_i = s.rindex('</style>') + len('</style>')
s = s[:_i] + '\n<style>\n' + open(HERE + 'planetario.css').read() + '</style>' + s[_i:]
open(OUT + "index.html", "w").write(s)
print('ok', len(s))
