# Etapa executada dentro de prod.py (usa s, R, RX, HERE): página de captação no lugar da tela de abertura.
R('/* ---------- motor da lição ---------- */', open(HERE + 'landing.js').read() + '\n/* ---------- motor da lição ---------- */')
R('[hidden]{display:none!important}\n', '[hidden]{display:none!important}\n' + open(HERE + 'landing.css').read() + '\n')
RX(r'  if\(st==="intro"\)\{.*?\n  \}\n  if\(st==="name"\)\{', r'''  if(st==="intro"){
    box.innerHTML = landingHTML();
    next.textContent="Começar grátis"; alt.hidden=false; alt.textContent="Já tenho uma conta";
    alt.onclick=loginModal;
    next.onclick=()=>{ ob.step++; renderOnb(); };
    landingWire();
  }
  if(st==="name"){''')
R('  const st = OSTEPS[ob.step], d=ob.d, box=$("ostage");', '  const st = OSTEPS[ob.step], d=ob.d, box=$("ostage");\n  $("onb").classList.toggle("landing", st==="intro"); if(st!=="intro") window.scrollTo(0,0);')
