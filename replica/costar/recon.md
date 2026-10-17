# Recon map: Co–Star Personalized Astrology (iOS e Android)

Escopo: o app inteiro, para virar o **orbe**, app próprio do eusouodu. Prioridade no loop diário (leitura do dia, faça e não faça, trânsitos, mapa). Depois vêm amigos e compatibilidade, perguntas e relatórios pagos.
Para: o eusouodu (astrologia, simbolismo e mitologia, em português), com a marca orbe já definida em `replica/brand.md`.
Data: 2026-10-17

## Como este mapa foi feito

Só fontes públicas, pela busca. A rede deste ambiente bloqueia o site do Co-Star e as lojas de apps, então **nenhuma tela foi vista diretamente.** Tudo vem das listagens nas lojas, do FAQ e da central de ajuda do Co-Star, de críticas de design e de resenhas. Os estados de cada tela estão como "não visto". Os nomes das abas mudam entre versões: o Co-Star está testando mover "Updates" da aba You para a tela inicial.

O passo de recon que mais vale agora: você usar o app no seu celular e salvar prints em `replica/costar/screens/` com o ID da tela no nome (`S07-hoje.png`). Se for assinar o Pro-Star para estudar, leia antes os termos de uso. Se proibirem usar a conta para criar produto concorrente, fique nas fontes públicas.

## Fontes

| # | fonte | URL | o que deu |
| --- | --- | --- | --- |
| 1 | App Store | https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561 | lista de recursos, preços (Pro-Star US$ 8.99/mês, Eros US$ 6.99, Your Year Ahead US$ 11.99, mapas avançados US$ 8.99), nota 4,8 com cerca de 205 mil avaliações |
| 2 | Google Play | https://play.google.com/store/apps/details?id=com.costarastrology | faça e não faça do dia, amigos a encontrar ou evitar, conselhos de longo prazo, Eros, teste de "Updates" na tela inicial |
| 3 | FAQ oficial | https://www.costarastrology.com/faq | só usam data, hora e local de nascimento; escolhem quais trânsitos mostrar pelo uso de cada pessoa; ajuda por email |
| 4 | central de ajuda: recursos | https://costarastrology.zendesk.com/hc/en-us/categories/13588108427149-App-features | lista de tópicos de ajuda |
| 5 | central de ajuda: conta | https://costarastrology.zendesk.com/hc/en-us/categories/13587328471053-Account-help | "não sei a hora em que nasci", notificações faltando, troca de telefone |
| 6 | crítica de design (2022) | https://ixd.prattsi.org/2022/02/design-critique-co-star-iphone-app/ | navegação no topo, mapa em tabela e em círculo, remover amigo deslizando |
| 7 | crítica de design (2024) | https://ixd.prattsi.org/2024/09/design-critique-co-star-ios-app/ | adicionar amigo pelos contatos ("quick add"), The Void para perguntas |
| 8 | fluxo de onboarding e paywall | https://screensdesign.com/apps/costar-personalized-astrology/ | ordem do cadastro: nascimento, telefone ou login social, permissão de contatos |
| 9 | Wikipedia | https://en.wikipedia.org/wiki/Co%E2%80%93Star | histórico da empresa |
| 10 | resenha Vice | https://www.vice.com/en/article/co-star-astrology-app-review/ | uso do faça e não faça no dia a dia |
| 11 | resenha whisper.day (2026) | https://blog.whisper.day/reviews/co-star-review-2026/ | grade de compatibilidade, "how you'll get along", falta de conversa |
| 12 | comparativo unstar (2026) | https://unstar.app/blog/co-star-sanctuary-pattern-nebula-stellium-astrology-apps-ranked-2026 | reclamações: paywall crescendo, 2 a 3 notificações por dia, travou num dia de Mercúrio retrógrado |
| 13 | análise de avaliações | https://kimola.com/reports/co-star-app-review-analysis-unveiling-user-insights-app-store-us-155484 | reclamações de paywall e de tom negativo (fonte automática, números não confiáveis) |

## Loop principal

Receber de manhã uma notificação com uma frase curta e certeira, abrir o app, ler o dia e o faça e não faça, e às vezes olhar como estão os amigos. É grátis, e é o que faz a pessoa voltar. O dinheiro vem do Pro-Star (perguntas, mapas de quem não tem o app, previsões) e de relatórios avulsos.

## Telas

| ID | tela | como chegar | para que serve | componentes | estados vistos |
| --- | --- | --- | --- | --- | --- |
| S01 | Boas-vindas | primeira abertura | apresentar e começar | marca, botão começar, entrar | não visto |
| S02 | Data de nascimento | S01 | primeiro dado do mapa | seletor de data | não visto |
| S03 | Hora de nascimento | S02 | hora para casas e ascendente | seletor de hora, "não sei" | não visto |
| S04 | Local de nascimento | S03 | cidade e fuso | busca de cidade | não visto |
| S05 | Telefone ou login social | S04 | criar a conta | campo de telefone, código SMS, botões sociais | não visto |
| S06 | Encontrar amigos | S05 | crescer a rede | pedido de acesso aos contatos, lista para adicionar | não visto |
| S07 | Hoje (início) | aba principal | a leitura do dia | frase de abertura, texto do dia, 3 faça e 3 não faça, trânsitos do dia | não visto |
| S08 | Detalhe do dia | toque em S07 | trânsitos ativos explicados, áreas da vida, longo prazo | lista de trânsitos, categorias | não visto |
| S09 | Meu mapa | aba You / Chart | mapa natal | alternador tabela / círculo, tabela de planetas | não visto |
| S10 | Detalhe de planeta ou casa | toque em S09 | explicar um posicionamento | título, texto, signo e casa | não visto |
| S11 | Amigos | aba Friends | lista de amigos e as leituras deles | lista, deslizar para remover, botão adicionar | não visto |
| S12 | Adicionar amigo | S11 | adicionar por contatos, busca ou à mão | quick add, busca, formulário de nascimento (pago para quem não tem o app) | não visto |
| S13 | Amigo e compatibilidade | toque em S11 | como vocês se dão | grade por categorias, texto "como vocês se dão", leitura do dia do amigo | não visto |
| S14 | Perguntar às estrelas (Void) | menu ou S07 | pergunta livre, resposta personalizada | campo de pergunta, resposta, histórico | não visto |
| S15 | Pro-Star e loja | ao tocar num recurso pago | vender assinatura e avulsos | benefícios, mensal, anual, itens avulsos | não visto |
| S16 | Relatório | compra em S15 | ler o ano à frente ou relatório de relação | capítulos, texto longo | não visto |
| S17 | Casal (Eros) | S13 ou S15 | conselhos para situações do dia a dia do casal | situações, respostas | não visto |
| S18 | Ajustes e conta | perfil | notificações, telefone, dados de nascimento, apagar conta | lista de opções | não visto |
| S19 | Notificação push | fora do app | trazer de volta todo dia | frase curta, abre em S07 | não visto |

## Fluxos

```
F01 Pessoa nova chega à primeira leitura
    S01 -> S02 -> S03 -> S04 -> S05 -> S06 -> S07
    cliques no caminho feliz: cerca de 10 (estimado, inclui código SMS e permissões)
    bordas: não sabe a hora; cidade pequena sem resultado; SMS não chega; recusa os contatos

F02 Volta diária
    S19 notificação -> S07 -> S08
    cliques: 1 a 2
    bordas: notificações desligadas; dia virando em outro fuso; app lento no dia de um evento grande (resenha cita travamento)

F03 Entender o próprio mapa
    S09 -> S10
    cliques: 2
    bordas: sem hora de nascimento (sem casas); alternar tabela e círculo

F04 Adicionar amigo e ver compatibilidade
    S11 -> S12 -> S13
    cliques: 3 a 4
    bordas: amigo não tem o app (pago); amigo sem hora de nascimento; pedido de amizade não aceito

F05 Fazer uma pergunta
    S14 -> S15 (sem assinatura) ou resposta
    cliques: 2
    bordas: pergunta sobre saúde, morte ou crise (precisa de resposta segura); limite de perguntas

F06 Comprar um relatório
    S15 -> pagamento -> S16
    cliques: 3
    bordas: compra falha; restaurar compra em outro aparelho
```

Número a bater: do zero à primeira leitura, cerca de 10 cliques. Quem volta, 1.

## Componentes

| componente | variantes | estados | usado em |
| --- | --- | --- | --- |
| Frase do dia | destaque, notificação | | S07, S19 |
| Lista faça / não faça | 3 + 3 | | S07 |
| Linha de trânsito | por planeta, harmônico, tenso | exato hoje, ativo | S07, S08 |
| Mapa em círculo | natal, sinastria | sem hora | S09, S13 |
| Tabela do mapa | | linha selecionada | S09 |
| Grade de compatibilidade | por categoria | | S13 |
| Item de amigo | com leitura do dia | deslizar para remover | S11 |
| Seletores de data, hora e cidade | | vazio, "não sei", sem resultado | S02 a S04, S12 |
| Campo de pergunta | | digitando, carregando, resposta, limite atingido | S14 |
| Paywall | mensal, anual, avulso | | S15 |
| Navegação principal | Hoje, Mapa, Amigos, Perguntar | ativa | todas |

## Modelo de dados inferido

```
Usuario         id, telefone ou email, login social, criado_em
                evidência: S05, FAQ (troca de telefone)
                confiança: alta

Nascimento      usuario_id, data, hora (pode faltar), cidade, lat, lon, fuso_iana
                evidência: S02 a S04, FAQ ("só temos data, local e hora")
                confiança: alta

LeituraDoDia    usuario_id, data, frase, texto, faca[3], nao_faca[3], transitos[], areas{}
                evidência: S07, S08, lojas
                confiança: alta que existe; campos de "áreas" são palpite

Amizade         usuario_a, usuario_b, status (pendente | aceita), criado_em
                evidência: S11 a S13
                confiança: alta

PessoaManual    dono_id, nome, nascimento (para quem não tem o app)
                evidência: recurso pago "mapa de quem não tem o app"
                confiança: média

Compatibilidade par, categorias{nome: nota}, texto
                evidência: S13, resenhas
                confiança: média (calculada; pode não ser guardada)

Pergunta        usuario_id, texto, resposta, criada_em
                evidência: S14
                confiança: alta

Compra          usuario_id, produto (assinatura | relatorio_ano | casal | mapas), loja, status, renova_em
                evidência: S15, App Store
                confiança: alta

EventoDeUso     usuario_id, tipo, alvo, quando
                evidência: FAQ diz que escolhem os trânsitos pelo uso
                confiança: média
```

Relações: Usuario 1-1 Nascimento, Usuario 1-n LeituraDoDia, Usuario n-n Usuario (Amizade), Usuario 1-n PessoaManual, Usuario 1-n Pergunta, Usuario 1-n Compra.

## O que o eusouodu já tem

- `lib/astro.mjs`: mapa natal, casas, trânsitos dia a dia com tom e classificação do dia, fases da Lua.
- `musica/cidades.json`: base para a busca de cidade.
- `lib/email.mjs`: envio de email (serve para login por link e para a leitura diária).
- O site já vende relatórios (`/mapa`), então já existe checkout e webhook de pagamento.
- A marca orbe (`replica/brand/orbe/`).

## Matriz de funcionalidades

Ver `features.csv`. Must: 13, should: 10, could: 4, skip: 4.

## Fora do escopo (não pode ou não deve ser clonado)

- **Os textos do Co-Star**: as frases do dia, as interpretações, o faça e não faça. São conteúdo deles. O orbe escreve os seus, na voz do eusouodu.
- **O tom provocador e as notificações irônicas.** É a identidade deles, e resenhas citam que esse tom pesa para quem tem ansiedade. O orbe pode ser o contrário.
- **O nome, a logo e a estética preto e branco.** A marca é o orbe.
- **A rede de usuários.** Os amigos de cada pessoa só existem no seu app à medida que ela convida.

## Tamanho

Telas 19, fluxos 6, entidades 9.

Partes difíceis:
1. **O texto de cada dia para cada pessoa.** O Co-Star gera milhões de leituras diárias. No orbe dá para combinar textos escritos por você (por trânsito) com IA que monta o dia na sua voz. Isso precisa de custo controlado, revisão e regras de segurança para perguntas sobre saúde e crise.
2. **Amigos e contatos.** Pedir os contatos do celular é dado sensível pela LGPD. Precisa de consentimento claro e de comparar só versões cifradas dos números.
3. **Notificação diária e cobrança.** Num app nativo isso exige push e compra pela Apple e pelo Google (que ficam com 15 a 30%). Num web app dá para usar web push ou email e cobrar por Pix ou cartão, como o site já faz.

Tamanho: **L** (um trimestre) para o app completo. **M** (algumas semanas) para começar com o loop diário (S01 a S10, S18, S19 por email) como web app no eusouodu.com, aproveitando o motor que já existe. Amigos, perguntas e relatórios entram depois, nessa ordem. App nativo nas lojas soma mais algumas semanas.
