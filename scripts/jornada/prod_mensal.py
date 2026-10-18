def RM(a,b): R(a.replace('R$ ','R$\xa0'), b.replace('R$ ','R$\xa0'))
# Etapa executada dentro de prod.py: o mensal vira passe de 30 dias, pago uma vez (Pix ou cartão), sem assinatura recorrente.
RM('''    <div class="pname">Assinatura mensal</div>
    <div class="price">R$ 29,90 <small>por mês</small></div>
    <p class="how">No cartão de crédito.</p>
    <ul class="facts">
      <li><i>✓</i><span>Libera tudo enquanto a assinatura estiver ativa.</span></li>
      <li><i>↻</i><span><b>Renova automaticamente</b> a cada mês, no mesmo dia, sempre R$ 29,90.</span></li>
      <li><i>✕</i><span>Cancela quando quiser, em Meu plano, sem multa. O acesso segue até o fim do mês já pago.</span></li>
      <li><i>✓</i><span>4 passes semanais custariam R$ 39,60. No mensal, R$ 29,90.</span></li>
    </ul>
    <button class="btn plain" data-plan="mes">Assinar por R$ 29,90 por mês</button>''','''    <div class="pname">Passe mensal</div>
    <div class="price">R$ 29,90 <small>por 30 dias</small></div>
    <p class="how">Pago uma vez, no Pix ou no cartão.</p>
    <ul class="facts">
      <li><i>✓</i><span>Libera tudo por 30 dias. No Pix, a liberação é na hora.</span></li>
      <li><i>✓</i><span><b>Não renova sozinho.</b> Nenhuma cobrança automática, nunca.</span></li>
      <li><i>✓</i><span>No último dia o app avisa. Quem quiser continuar paga outro passe.</span></li>
      <li><i>✓</i><span>4 passes semanais custariam R$ 39,60. No mensal, R$ 29,90.</span></li>
    </ul>
    <button class="btn plain" data-plan="mes">Pagar R$ 29,90 por 30 dias</button>''')
RM('''    <tr><td>Pagamento</td><td>Pix</td><td>Cartão de crédito</td></tr>
    <tr><td>Renova sozinho?</td><td>Não</td><td>Sim, todo mês</td></tr>
    <tr><td>Num mês</td><td>R$ 39,60 se renovar 4 vezes</td><td>R$ 29,90</td></tr>
    <tr><td>Para parar</td><td>Só não pagar de novo</td><td>Cancelar em Meu plano</td></tr>''','''    <tr><td>Pagamento</td><td>Pix</td><td>Pix ou cartão</td></tr>
    <tr><td>Renova sozinho?</td><td>Não</td><td>Não</td></tr>
    <tr><td>Num mês</td><td>R$ 39,60 se renovar 4 vezes</td><td>R$ 29,90</td></tr>
    <tr><td>Para parar</td><td>Só não pagar de novo</td><td>Só não pagar de novo</td></tr>''')
RM('''    const nx=new Date(now); nx.setMonth(nx.getMonth()+1);
    rows=[["Plano","Assinatura mensal"],["Cobrado hoje","R$ 29,90 no cartão"],["Próxima cobrança",fmtD(nx)+": R$ 29,90"],["Renovação","Automática, todo mês no mesmo dia"],["Para cancelar","Meu plano, a qualquer momento, sem multa"]];''','''    const until=new Date(now.getTime()+30*864e5);
    rows=[["Plano","Passe mensal"],["Pago hoje","R$ 29,90 no Pix ou no cartão"],["Acesso liberado até",fmtDT(until)],["Cobranças automáticas","Nenhuma"],["Depois disso","Volta para a versão grátis, sem perder o progresso"]];''')
RM('''$("payGo").textContent = pending==="semana" ? "Pagar R$ 9,90 no Pix" : "Assinar por R$ 29,90 por mês";''','''$("payGo").textContent = pending==="semana" ? "Pagar R$ 9,90 no Pix" : "Pagar R$ 29,90";''')
RM('o passe semanal custa R$ 9,90 por Pix e o mensal, R$ 29,90 no cartão.','o passe semanal custa R$ 9,90 por Pix e o mensal, R$ 29,90 por 30 dias, no Pix ou no cartão.')
RM('''<b>Passe semanal ativo</b><p>Acesso liberado até ${esc(fmtDT(until))}. Não renova sozinho: nenhuma cobrança vai acontecer.</p><div class="acts"><button class="btn small plain" id="seePlans">Ver o mensal</button></div>''',
  '''<b>${S.plan.dias===30?"Passe mensal ativo":"Passe semanal ativo"}</b><p>Acesso liberado até ${esc(fmtDT(until))}. Não renova sozinho: nenhuma cobrança vai acontecer.</p>${S.plan.dias===30?"":`<div class="acts"><button class="btn small plain" id="seePlans">Ver o mensal</button></div>`}''')
RM('''  if(pago==="semana" || pago==="pendente" || pago==="mes"){
    toast(pago==="mes" ? "Confirmando a assinatura…" : "Confirmando o Pix…");''','''  if(pago==="semana" || pago==="passe" || pago==="pendente" || pago==="mes"){
    toast(pago==="mes" ? "Confirmando a assinatura…" : "Confirmando o pagamento…");''')
