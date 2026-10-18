/* ---------- página de captação (primeira tela de quem ainda não entrou) ---------- */
const PRECO_S = "R$ 9,90", PRECO_M = "R$ 29,90";
const ICO_SHARE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const ICO_PLUS = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const ICO_DOTS = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
const ICO_APPLE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8C7 7.3 5.5 8.2 4.7 9.7c-1.7 2.9-.4 7.3 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3-.8s1.8.8 3 .8c1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.7-4.1zM14.1 5.6c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" fill="currentColor"/></svg>`;
const ICO_DROID = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1v2.5a1.5 1.5 0 0 1-3 0V18h-2v2.5a1.5 1.5 0 0 1-3 0V18H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zm-3 1.5a1.5 1.5 0 0 1 3 0v5a1.5 1.5 0 0 1-3 0zm13 0a1.5 1.5 0 0 1 3 0v5a1.5 1.5 0 0 1-3 0zM7.2 8a4.9 4.9 0 0 1 9.6 0zM9.5 5.8a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2zm5 0a.6.6 0 1 0 0-1.2.6.6 0 0 0 0 1.2z" fill="currentColor"/></svg>`;
function landingHTML(){
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
  const site = /^jornada\./.test(location.hostname) ? location.host : "jornada.eusouodu.com";
  const fl = "♈♉♊♋♌♍♎♏♐♑♒♓☉☽☿♀♂♃♄".split("").map((c,i)=>`<i style="--x:${(i*53)%100}%;--d:${8+(i*7)%9}s;--w:${-(i*1.7)%9}s;--s:${14+(i*5)%16}px">${g(c)}</i>`).join("");
  return `<div class="lp">
  <div class="lp-sky" aria-hidden="true">${fl}</div>
  <section class="lp-hero">
    <div class="lp-kicker">@eusouodu apresenta</div>
    <div class="logo">Jornada</div>
    <div class="lp-wheel"><div class="spin">${wheelSVG(null,true)}</div><span class="lp-orbit"></span></div>
    <h1 class="tagline">Astrologia, mitologia e filosofia. Um passo por dia, a partir do próprio mapa.</h1>
    <p class="lp-lead">Lições curtas, como um jogo, para aprender a ler o céu e o próprio mapa natal. Escritas pelo astrólogo Eduardo, que trabalha com astrologia há mais de 10 anos.</p>
    <div class="chips"><span class="c1">24 lições de mapa e trânsitos</span><span class="c2">60 lições de signos</span><span class="c3">36 cartas</span></div>
    <button class="btn lp-cta" data-go="start">Começar grátis</button>
    <p class="lp-fine">Sem cartão. Áries inteira e a lição do dia são grátis para sempre.</p>
  </section>

  <section class="lp-sec rv">
    <div class="lp-eyebrow">Como funciona</div>
    <h2>Três minutos por dia. O mapa acende.</h2>
    <div class="lp-steps">
      <div class="lp-step s1"><b>1</b><div><h3>O mapa primeiro</h3><p>Data, hora e cidade de nascimento. O mapa natal é calculado na hora, com o horário de verão histórico de cada cidade já descontado.</p></div></div>
      <div class="lp-step s2"><b>2</b><div><h3>Uma lição por vez</h3><p>Explicação, pergunta, ligar pares, colocar em ordem e uma reflexão no fim. Errar custa uma lua. Acertar soma pontos e sequência.</p></div></div>
      <div class="lp-step s3"><b>3</b><div><h3>O céu se acende</h3><p>Cada signo e cada planeta aprendido acende na roda do mapa. A mitologia e as ideias viram cartas de coleção.</p></div></div>
    </div>
  </section>

  <section class="lp-sec rv">
    <div class="lp-eyebrow">Uma lição de verdade</div>
    <h2>Assim é jogar.</h2>
    <div class="lp-phone" aria-hidden="true">
      <div class="lp-bar"><i></i></div>
      <div class="lp-q">Em que signo o Vênus está em casa?</div>
      <div class="lp-opts"><span>Áries</span><span class="ok">Touro</span><span>Escorpião</span><span>Virgem</span></div>
      <div class="lp-sheet"><b>Isso!</b> O Vênus rege Touro e Libra: no corpo e no encontro, ele fala a própria língua.</div>
    </div>
  </section>

  <section class="lp-sec rv">
    <div class="lp-eyebrow">As três jornadas</div>
    <h2>Da linguagem ao próprio céu.</h2>
    <div class="lp-js">
      <div class="lp-j j1"><span class="n">1</span><h3>A linguagem</h3><p>Doze subjornadas, de Áries a Peixes. Em cada uma: o signo, a mitologia, o planeta regente, o deus por trás dele e uma ideia filosófica.</p><small>12 subjornadas · 60 lições</small></div>
      <div class="lp-j j2"><span class="n">2</span><h3>O próprio mapa</h3><p>O símbolo vira espelho. Ascendente, Sol, Lua, Mercúrio, o Vênus, Marte, os planetas lentos, as casas, os aspectos, os nodos e a síntese, montados a partir do mapa de quem joga.</p><small>12 lições personalizadas</small></div>
      <div class="lp-j j3"><span class="n">3</span><h3>Os trânsitos</h3><p>O céu de verdade passando sobre o mapa: as fases da Lua, Mercúrio retrógrado, os ciclos do Vênus, o retorno de Saturno, os eclipses, a revolução solar. E uma lição nova todo dia.</p><small>12 lições · 1 lição por dia</small></div>
    </div>
  </section>

  <section class="lp-sec rv" id="lpPrecos">
    <div class="lp-eyebrow">Planos</div>
    <h2>Começa grátis. Abre tudo quando quiser.</h2>
    <div class="lp-prices">
      <div class="lp-p free"><div class="pn">Grátis</div><div class="pv">R$ 0</div><p>Áries inteira, a primeira lição do mapa natal e a lição do dia. Sem cartão, sem prazo.</p></div>
      <div class="lp-p wk"><span class="tag">Por Pix</span><div class="pn">Passe semanal</div><div class="pv">${PRECO_S}<small> / 7 dias</small></div><p>Tudo aberto por uma semana. Não renova sozinho: nenhuma cobrança automática.</p></div>
      <div class="lp-p mo"><span class="tag">Melhor valor</span><div class="pn">Mensal</div><div class="pv">${PRECO_M}<small> / mês</small></div><p>Tudo aberto, todo mês, no cartão. Cancela em um toque, sem multa.</p></div>
    </div>
    <p class="lp-incl">Nos dois planos: as três jornadas inteiras, as 36 cartas de mitologia e filosofia e luas sem fim.</p>
  </section>

  <section class="lp-sec rv" id="lpInstalar">
    <div class="lp-eyebrow">No celular</div>
    <h2>Vira um app na tela de início.</h2>
    <p class="lp-sub">Sem loja de aplicativos, em poucos segundos. O ícone da Jornada fica junto dos outros apps e abre em tela cheia.</p>
    <div class="lp-tabs" role="tablist"><button role="tab" data-os="ios" class="${ios?"on":""}">${ICO_APPLE}iPhone</button><button role="tab" data-os="and" class="${ios?"":"on"}">${ICO_DROID}Android</button></div>
    <ol class="lp-inst" data-os="ios" ${ios?"":"hidden"}>
      <li><b>Abrir no Safari</b><span>Entrar em <em>${esc(site)}</em> pelo Safari, o navegador da bússola.</span></li>
      <li><b>Tocar em Compartilhar</b><span>O quadrado com a seta para cima <span class="ic">${ICO_SHARE}</span>, na barra de baixo.</span></li>
      <li><b>Adicionar à Tela de Início</b><span>Descer a lista, tocar em <span class="ic">${ICO_PLUS}</span> Adicionar à Tela de Início e depois em Adicionar.</span></li>
    </ol>
    <ol class="lp-inst" data-os="and" ${ios?"hidden":""}>
      <li><b>Abrir no Chrome</b><span>Entrar em <em>${esc(site)}</em> pelo Chrome.</span></li>
      <li><b>Tocar nos três pontinhos</b><span>O menu <span class="ic">${ICO_DOTS}</span>, no canto de cima.</span></li>
      <li><b>Instalar app</b><span>Tocar em Instalar app, ou Adicionar à tela inicial, e confirmar.</span></li>
      <li class="lp-now" id="lpNow" hidden><button class="btn small" id="lpInstall">Instalar agora</button></li>
    </ol>
  </section>

  <section class="lp-sec rv">
    <div class="lp-eyebrow">Dúvidas</div>
    <details class="lp-faq"><summary>Precisa saber astrologia?</summary><p>Não. A primeira jornada começa do zero, pelo grau zero da roda, e cada lição explica antes de perguntar.</p></details>
    <details class="lp-faq"><summary>E sem a hora de nascimento?</summary><p>Dá para começar sem ela e completar depois. Sem a hora, o Ascendente e as casas ficam de fora; o resto funciona inteiro.</p></details>
    <details class="lp-faq"><summary>Como é o pagamento?</summary><p>Pelo Mercado Pago: Pix no passe semanal, cartão no mensal. Até 7 dias depois da compra, o valor volta inteiro, é só escrever para falecom@eusouodu.com.</p></details>
    <details class="lp-faq"><summary>O progresso fica salvo?</summary><p>Fica na conta, ligado ao e-mail. Para abrir em outro celular, chega um link de entrada, sem senha.</p></details>
  </section>

  <section class="lp-end rv">
    <div class="spin small">${wheelSVG(null,true)}</div>
    <h2>O mapa já está no céu. Falta a gente ler.</h2>
    <button class="btn lp-cta" data-go="start">Calcular o meu mapa</button>
    <button class="link" data-go="login">Já tenho uma conta</button>
    <nav class="footer"><a href="termos.html">Termos de uso</a><a href="privacidade.html">Privacidade</a><a href="mailto:falecom@eusouodu.com">falecom@eusouodu.com</a><a href="https://instagram.com/eusouodu" target="_blank" rel="noopener">@eusouodu</a></nav>
  </section>
</div>`;
}
function landingWire(){
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{ if(b.dataset.go==="login") loginModal(); else { ob.step++; renderOnb(); } });
  document.querySelectorAll(".lp-tabs button").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".lp-tabs button").forEach(x=>x.classList.toggle("on", x===b));
    document.querySelectorAll(".lp-inst").forEach(o=>o.hidden = o.dataset.os!==b.dataset.os);
  });
  const now=$("lpNow"); if(now && typeof deferredPrompt!=="undefined" && deferredPrompt){ now.hidden=false; $("lpInstall").onclick=async()=>{ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; now.hidden=true; }; }
  const els=document.querySelectorAll(".lp .rv");
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold:.12});
    els.forEach(e=>io.observe(e));
  } else els.forEach(e=>e.classList.add("in"));
}
window.addEventListener("beforeinstallprompt", ()=>setTimeout(()=>{ const n=$("lpNow"); if(n && n.hidden && deferredPrompt){ n.hidden=false; $("lpInstall").onclick=async()=>{ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; n.hidden=true; }; } }, 0));
