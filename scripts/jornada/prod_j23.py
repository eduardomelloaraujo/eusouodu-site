# Etapa executada dentro de prod.py (usa s, R, RX, HERE): jornadas 2 e 3 completas.

R('/* ---------- motor da lição ---------- */', open(HERE + 'j23.js').read() + '\n/* ---------- motor da lição ---------- */')

# conteúdo pago das jornadas 2 e 3 chega junto com as subjornadas
R('''    UNITS = UNITS.map(u => bySlug[u.slug] || u);
    contentLoaded=true; renderIfHome();''', '''    UNITS = UNITS.map(u => bySlug[u.slug] || u);
    if(r.mapa && r.transitos) CT = {mapa:r.mapa, transitos:r.transitos};
    contentLoaded=true; renderIfHome();''')

# trilhas das jornadas 2 e 3
RX(r'function renderRoad\(body, list\)\{.*?\n\}\nfunction renderCards', r'''function renderRoad(body, list){
  const j = list===J2 ? 2 : 3, on = planActive();
  const box = document.createElement("div"); box.className="roadmap";
  list.forEach((it,i)=>{
    const b = document.createElement("button");
    let cls="open", st="Jogar", sub=it[1], go=null;
    if(i===0){
      const L=it[2];
      if(j===3){ const dd=S.daily===today(); cls=dd?"done":"open"; st=dd?"Feita hoje":"Jogar"; go=()=>{ if(!dd && L) startLesson(L); }; }
      else if(!L){ st="Completar"; go=()=>startOnb(true); }
      else { const dn=S.done.includes(L.id); cls=dn?"done":"open"; st=dn?"Feita":"Jogar"; go=()=>startLesson(L); }
    } else if(!on){
      cls="locked"; st="Com plano"; go=payModal;
    } else if(!CT){
      st="Abrir"; go=async()=>{ toast("Abrindo a lição…"); await loadContent(); const L=buildJ(j,i); if(L && !L.needTime) startLesson(L); else if(L && L.needTime) startOnb(true); else toast("A lição não carregou. Confira a internet e tente de novo."); };
    } else {
      const L=buildJ(j,i);
      if(!L){ cls="soon"; st="Indisponível"; }
      else if(L.needTime){ st="Completar"; sub="Precisa da hora de nascimento: toque para completar"; go=()=>startOnb(true); }
      else { const dn=S.done.includes(L.id); cls=dn?"done":"open"; st=dn?"Feita":"Jogar"; go=()=>startLesson(L); }
    }
    b.className = "road "+cls;
    b.innerHTML = `<span class="num">${i+1}</span><span><b>${esc(it[0])}</b><small>${esc(sub)}</small></span><span class="st">${cls==="locked"?lockIcon():""}${esc(st)}</span>`;
    b.onclick = () => { if(go) go(); };
    box.appendChild(b);
  });
  body.appendChild(box);
}
function renderCards''')
R('.road.soon{box-shadow:none;border-style:dashed;background:rgba(255,255,255,.55)}',
  '.road.soon{box-shadow:none;border-style:dashed;background:rgba(255,255,255,.55)}\n.road.locked{background:rgba(255,255,255,.7)} .road.locked .num{background:var(--lilas)}\n.road .st .lock{display:inline-block;width:11px;height:11px;margin-right:4px;vertical-align:-1px;position:static}\n.road .st .lock svg{width:11px;height:11px;fill:var(--tinta)}')

# textos que antes prometiam "em breve"
R("2:`<b>Encontrar no próprio mapa.</b> Aqui o símbolo vira espelho: cada lição usa o mapa natal de quem joga. A primeira já está aberta; as próximas chegam aos poucos.`,",
  "2:`<b>Encontrar no próprio mapa.</b> Aqui o símbolo vira espelho: doze lições montadas a partir do mapa natal de quem joga, do Ascendente à síntese. A primeira é grátis.`,")
R("3:`<b>Ler os trânsitos.</b> A energia astrológica de cada dia passando sobre o mapa. A lição do dia já está aberta; as próximas chegam aos poucos.`",
  "3:`<b>Ler os trânsitos.</b> O céu de verdade passando sobre o mapa: fases da Lua, retrogradações, eclipses, o retorno de Saturno, a revolução solar. A lição do dia é grátis e muda todo dia.`")
R('<li>As 12 subjornadas da linguagem, de Áries a Peixes: 60 lições</li><li>Todas as 36 cartas de mitologia e filosofia</li><li>Luas ilimitadas, sem pausa por erro</li><li>As novas lições do mapa natal e dos trânsitos assim que forem lançadas, sem custo extra</li>',
  '<li>As 12 subjornadas da linguagem, de Áries a Peixes: 60 lições</li><li>As 12 lições do próprio mapa natal</li><li>As 12 lições dos trânsitos, com o céu de verdade</li><li>Todas as 36 cartas de mitologia e filosofia</li><li>Luas ilimitadas, sem pausa por erro</li>')
R('Pronto: as doze subjornadas estão abertas.', 'Pronto: as três jornadas estão abertas.')
