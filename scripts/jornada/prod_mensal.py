# Etapa executada dentro de prod.py: mensal recorrente no cartão digitado dentro da Jornada (Card Payment Brick do
# Mercado Pago, assinatura já autorizada na hora) e, como alternativa, o passe de 30 dias no Pix.
def RM(a,b): R(a.replace('R$ ','R$\xa0'), b.replace('R$ ','R$\xa0'))

RM('''    <button class="btn plain" data-plan="mes">Assinar por R$ 29,90 por mês</button>''',
   '''    <button class="btn plain" data-plan="mes">Assinar por R$ 29,90 por mês</button>
    <button class="link pix30" data-plan="mes30">Prefere Pix? 30 dias por R$ 29,90, sem renovação</button>''')
R('<div class="summary" id="sumBox"></div>', '<div class="summary" id="sumBox"></div>\n  <div id="cardBrick" hidden></div>')
R('.summary .row:last-child{border-bottom:0}', '.summary .row:last-child{border-bottom:0}\n.pix30{display:block;margin:12px auto 0;font-size:14px;text-align:center}\n#cardBrick{margin:0 0 8px}\n#cardBrick .brick-msg{font-size:14px;color:var(--ink2,#5A4B6E);text-align:center;padding:14px 0}')
R('''function applyServer(r){
  if(!r) return;''', '''let MPK=null;
function applyServer(r){
  if(!r) return;
  if(r.mpPublic) MPK=r.mpPublic;''')
RM('''  pending=b.dataset.plan; const now=new Date();
  let rows;
  if(pending==="semana"){''', '''  pending=b.dataset.plan; const now=new Date();
  if(pending==="mes" && !MPK) pending="mes30"; // sem a chave pública do Mercado Pago, o mensal vai pelo Pix
  let rows;
  if(pending==="mes30"){
    const until=new Date(now.getTime()+30*864e5);
    rows=[["Plano","Passe mensal no Pix"],["Pago hoje","R$ 29,90 no Pix"],["Acesso liberado até",fmtDT(until)],["Cobranças automáticas","Nenhuma"],["Depois disso","Volta para a versão grátis, sem perder o progresso"]];
  } else if(pending==="semana"){''')
RM('''["Cobrado hoje","R$ 29,90 no cartão"]''', '''["Cobrado agora","R$ 29,90 no cartão de crédito"]''')
RM('''  $("payGo").textContent = pending==="semana" ? "Pagar R$ 9,90 no Pix" : "Assinar por R$ 29,90 por mês";
  show("confirm");''', '''  $("payGo").textContent = pending==="semana" ? "Pagar R$ 9,90 no Pix" : pending==="mes30" ? "Pagar R$ 29,90 no Pix" : "Assinar por R$ 29,90 por mês";
  show("confirm");
  const cartao = pending==="mes";
  $("payGo").hidden = cartao; $("payNote").textContent = cartao ? "O cartão é processado pelo Mercado Pago, com segurança. A Jornada não vê nem guarda o número. Libera na hora." : "O pagamento acontece na página segura do Mercado Pago. Depois, a Jornada abre de novo aqui, já liberada.";
  if(cartao) montarCartao(); else { $("cardBrick").hidden=true; }''')
R('''$("pBack").onclick=()=>{ show("home"); renderHome(); };''', '''let brickCtl=null;
function sdkMP(){ return window.MercadoPago ? Promise.resolve() : new Promise((ok,no)=>{ const sc=document.createElement("script"); sc.src="https://sdk.mercadopago.com/js/v2"; sc.onload=ok; sc.onerror=no; document.head.appendChild(sc); }); }
async function montarCartao(){
  const box=$("cardBrick"); box.hidden=false; box.innerHTML='<div class="brick-msg">Abrindo o formulário do cartão…</div>';
  try{
    await sdkMP();
    if(brickCtl){ try{ brickCtl.unmount(); }catch(e){} brickCtl=null; }
    box.innerHTML='<div id="cardBrickIn"></div>';
    const mp=new MercadoPago(MPK,{locale:"pt-BR"});
    brickCtl = await mp.bricks().create("cardPayment","cardBrickIn",{
      initialization:{ amount: 29.9, payer:{ email: (S.user&&S.user.email)||"" } },
      customization:{ paymentMethods:{ types:{ excluded:["debit_card","prepaid_card"] }, maxInstallments:1 }, visual:{ texts:{ formSubmit:"Assinar por R$ 29,90 por mês" }, style:{ customVariables:{ baseColor:"#FF4FAE", borderRadiusLarge:"16px" } } } },
      callbacks:{
        onReady(){},
        onError(e){ console.error("cartao", e); },
        onSubmit:(d)=>new Promise((ok,no)=>{
          api("assinar",{method:"POST", body:{ token:d.token, payment_method_id:d.payment_method_id, issuer_id:d.issuer_id, identification:d.payer&&d.payer.identification, email:d.payer&&d.payer.email }})
            .then(async r=>{ applyServer(r); ok(); try{ brickCtl.unmount(); }catch(e){} brickCtl=null; await loadContent(); show("home"); renderHome(); toast(r.semRecorrencia ? "Pagamento aprovado: as três jornadas estão abertas por 30 dias. No fim, a Jornada avisa para renovar." : "Assinatura ativa: as três jornadas estão abertas."); })
            .catch(e=>{ toast(e.message||"O cartão não foi aceito. Tente outro cartão de crédito."); no(); });
        })
      }
    });
  }catch(e){ console.error(e); box.innerHTML='<div class="brick-msg">O formulário do cartão não abriu. Confira a internet ou pague 30 dias no Pix.</div>'; }
}
$("pBack").onclick=()=>{ show("home"); renderHome(); };''')
R('''$("cBack").onclick=()=>show("plans");''', '''$("cBack").onclick=()=>{ if(brickCtl){ try{ brickCtl.unmount(); }catch(e){} brickCtl=null; } $("cardBrick").hidden=true; show("plans"); };''')
RM('o passe semanal custa R$ 9,90 por Pix e o mensal, R$ 29,90 no cartão.','o passe semanal custa R$ 9,90 no Pix e o mensal, R$ 29,90 por mês no cartão (ou 30 dias no Pix).')
R('''<b>Passe semanal ativo</b><p>Acesso liberado até ${esc(fmtDT(until))}. Não renova sozinho: nenhuma cobrança vai acontecer.</p><div class="acts"><button class="btn small plain" id="seePlans">Ver o mensal</button></div>''',
  '''<b>${S.plan.dias===30?"Passe mensal ativo":"Passe semanal ativo"}</b><p>Acesso liberado até ${esc(fmtDT(until))}. Não renova sozinho: nenhuma cobrança vai acontecer.</p><div class="acts"><button class="btn small plain" id="seePlans">Ver o mensal</button></div>''')
R('''  if(pago==="semana" || pago==="pendente" || pago==="mes"){
    toast(pago==="mes" ? "Confirmando a assinatura…" : "Confirmando o Pix…");''','''  if(pago==="semana" || pago==="passe" || pago==="pendente" || pago==="mes"){
    toast(pago==="mes" ? "Confirmando a assinatura…" : "Confirmando o pagamento…");''')

# cartão: compra de 30 dias (a recorrência automática do Mercado Pago está desligada por enquanto)
RM('<div class="pname">Assinatura mensal</div>', '<div class="pname">Mensal no cartão</div>')
RM('<div class="price">R$ 29,90 <small>por mês</small></div>\n    <p class="how">No cartão de crédito.</p>', '<div class="price">R$ 29,90 <small>por 30 dias</small></div>\n    <p class="how">No cartão de crédito, digitado aqui mesmo. Libera na hora.</p>')
RM('<li><i>✓</i><span>Libera tudo enquanto a assinatura estiver ativa.</span></li>\n      <li><i>↻</i><span><b>Renova automaticamente</b> a cada mês, no mesmo dia, sempre R$ 29,90.</span></li>\n      <li><i>✕</i><span>Cancela quando quiser, em Meu plano, sem multa. O acesso segue até o fim do mês já pago.</span></li>',
   '<li><i>✓</i><span>Libera tudo por 30 dias, na hora da compra.</span></li>\n      <li><i>↻</i><span>No fim dos 30 dias a Jornada avisa, e renovar leva um toque.</span></li>\n      <li><i>✓</i><span>Nenhuma cobrança surpresa: nada é cobrado sem a pessoa pedir.</span></li>')
RM('<button class="btn plain" data-plan="mes">Assinar por R$ 29,90 por mês</button>', '<button class="btn plain" data-plan="mes">Pagar R$ 29,90 no cartão</button>')
RM('rows=[["Plano","Assinatura mensal"],["Cobrado agora","R$ 29,90 no cartão de crédito"],["Próxima cobrança",fmtD(nx)+": R$ 29,90"],["Renovação","Automática, todo mês no mesmo dia"],["Para cancelar","Meu plano, a qualquer momento, sem multa"]];',
   'rows=[["Plano","Mensal no cartão"],["Cobrado agora","R$ 29,90 no cartão de crédito"],["Acesso liberado até",fmtDT(new Date(now.getTime()+30*864e5))],["Cobranças automáticas","Nenhuma"],["Depois disso","A Jornada avisa para renovar"]];')
R('formSubmit:"Assinar por R$ 29,90 por mês"', 'formSubmit:"Pagar R$ 29,90"')
RM('<tr><td>Renova sozinho?</td><td>Não</td><td>Sim, todo mês</td></tr>', '<tr><td>Renova sozinho?</td><td>Não</td><td>Não, a Jornada avisa</td></tr>')
RM('<tr><td>Para parar</td><td>Só não pagar de novo</td><td>Cancelar em Meu plano</td></tr>', '<tr><td>Para parar</td><td>Só não pagar de novo</td><td>Só não pagar de novo</td></tr>')
