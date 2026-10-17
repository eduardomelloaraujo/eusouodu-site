# Recon map: TimePassages Astrology (iOS e Android)

Escopo: horóscopo diário a partir dos trânsitos pessoais e o céu do dia (fase da Lua, Lua fora de curso, retrogradações). Fora: mapas de outras pessoas, compatibilidade, progressões, arco solar, retorno solar.
Para: o eusouodu (astrologia, simbolismo e mitologia, em português). Versão diária e pessoal da "energia astrológica da semana", ligada ao produto "A semana no seu mapa" (R$ 37 / R$ 97).
Data: 2026-10-17

## Como este mapa foi feito

Só fontes públicas. A rede deste ambiente bloqueia o astrograph.com e as lojas de apps, então tudo veio de resultados de busca que citam essas páginas. Não houve acesso a conta, telas ou código do app.

Isso significa: **nenhuma tela foi vista diretamente.** Os nomes de abas e o conteúdo das telas vêm da página oficial do app, das notas de versão e de resenhas. Os estados de cada tela (vazio, carregando, erro) estão marcados como "não visto". O próximo passo de recon que mais vale a pena é você abrir o app no seu celular e salvar prints em `replica/screens/` com o ID da tela no nome (`S05-horoscopo-diario.png`).

Termos de uso: se você assinar o Pro para estudar, leia os termos do TimePassages antes. Se proibirem usar a conta para criar produto concorrente, fique nas fontes públicas.

## Fontes

| # | fonte | URL | o que deu |
| --- | --- | --- | --- |
| 1 | página oficial do app | https://astrograph.com/timepassages/mobile | aba Current, horóscopo diário com trânsitos categorizados, Pro a US$ 7.99/mês ou US$ 59.99/ano |
| 2 | artigo "Transits" do site | https://astrograph.com/learning-astrology/transits | roda dupla de trânsitos, abas Planets e Aspects, curto e longo prazo |
| 3 | artigo "Transit Duration" | https://www.astrograph.com/learning-astrology/aspects/transit-duration/ | duração como faixa de datas: entra no orbe, exato, sai do orbe |
| 4 | página de software (notas da 3.1) | https://astrograph.com/astrology-software | ciclo da Lua de Nova a Nova, horário mais preciso no horóscopo diário |
| 5 | App Store | https://apps.apple.com/us/app/timepassages-astrology/id488946918 | pitch, preços, nota 4,8 com cerca de 43 mil avaliações |
| 6 | Google Play | https://play.google.com/store/apps/details?id=com.astrograph.timepassages | listagem Android |
| 7 | suporte: ler o mapa no app | https://support.astrograph.com/support/solutions/articles/66000530354-how-to-read-a-natal-birth-chart-in-the-mobile-app | mapa natal em Profile > My Chart |
| 8 | manual do desktop | https://support.astrograph.com/support/solutions/articles/66000476614-desktop-manual-timepassages | definição de orbe (vale para o desktop, pode diferir no app) |
| 9 | resenha Bustle | https://www.bustle.com/life/timepassages-astrology-app-review | nota 3,5/5; elogia horóscopo diário, critica interface básica |
| 10 | resenhas agregadas | https://grand-screen.com/apps/timepassages-astrology/reviews/ | lentidão fora do Wi-Fi, textos repetitivos, revisão fraca |

## Loop principal

Abrir o app de manhã e ler quais trânsitos estão tocando o seu mapa hoje, quanto tempo cada um dura e o que significa. É o que está no plano grátis e o que traz a pessoa de volta todo dia. O dinheiro vem do Pro, que libera as previsões (roda dupla, progressões, outros dias e mapas).

## Telas

| ID | tela | como chegar | para que serve | componentes | estados vistos |
| --- | --- | --- | --- | --- | --- |
| S01 | Dados de nascimento | primeira abertura | data, hora e local para montar o mapa | campo de data, campo de hora, busca de cidade, botão salvar | não visto |
| S02 | Meu mapa (perfil) | aba Profile > My Chart | mapa natal do usuário | roda do mapa, lista de planetas com signo e casa, aspectos | não visto |
| S03 | Céu de agora | aba Current | snapshot astrológico do momento | roda do céu atual, Sol e Lua com signo, selo de Mercúrio retrógrado, indicador de Lua fora de curso, fase da Lua | não visto |
| S04 | Ciclo da Lua | dentro de S03 | linha do tempo de Lua Nova a Lua Nova | linha do tempo de fases, marcador de hoje | não visto (novo na 3.1) |
| S05 | Horóscopo diário | botão Current Transits | trânsitos pessoais de hoje, agrupados, com impacto geral | resumo do impacto, grupos curto prazo e longo prazo, linha de trânsito (planeta, aspecto, ponto natal) | não visto |
| S06 | Detalhe do trânsito | toque num trânsito em S05 | o que o trânsito significa e quando age | título com glifos, texto de interpretação, orbe atual, faixa de datas entra / exato / sai | não visto |
| S07 | Roda dupla de trânsitos (Pro) | de S05 ou do menu de mapas | natal por dentro, trânsitos por fora | roda dupla, aba Planets (casa natal de cada trânsito), aba Aspects (curto e longo prazo) | não visto |
| S08 | Assinatura Pro | ao tocar num recurso Pro | vender o Pro | lista de benefícios, opção mensal e anual, compra avulsa de mapa por US$ 0,99 | não visto |
| S09 | Aprender / glossário | aba Learn ou perfil | termos, signos, planetas, casas, aspectos | lista, busca, artigo | não visto |
| S10 | Ajustes | aba Settings | preferências | lista de opções, cor do ícone | não visto |

## Fluxos

```
F01 Pessoa nova lê o horóscopo do dia
    S01 dados de nascimento -> S05 horóscopo diário
    cliques no caminho feliz: cerca de 6 (data, hora, cidade, salvar, abrir o diário) — estimado, não contado
    bordas: não sabe a hora de nascimento; cidade com horário de verão antigo; fuso de nascimento diferente do atual

F02 Entender um trânsito
    S05 -> S06
    cliques: 1
    bordas: planeta retrógrado com três datas exatas; trânsito da Lua que dura horas; trânsito que entra ou sai do orbe hoje

F03 Ver o céu de hoje
    S03 céu de agora -> S04 ciclo da Lua
    cliques: 1 a 2
    bordas: Lua fora de curso começando ou terminando hoje; troca de signo da Lua de madrugada no fuso do usuário

F04 Ver os trânsitos na roda dupla
    S05 -> S07 (Pro) ou S08 assinatura
    cliques: 1 a 3
    bordas: usuário grátis bate no paywall; tela pequena com roda dupla ilegível

F05 Voltar no dia seguinte
    abrir o app -> S05 já com os trânsitos do novo dia
    cliques: 1
    bordas: virada do dia no fuso do usuário, não no fuso do servidor
```

Número a bater: do zero até ler o primeiro trânsito, cerca de 7 cliques. Quem volta, 1.

## Componentes

| componente | variantes | estados | usado em |
| --- | --- | --- | --- |
| Roda do mapa | simples, dupla | carregando, preenchida, sem hora (sem casas) | S02, S03, S07 |
| Linha de trânsito | curto prazo, longo prazo; harmônico, tenso, neutro | normal, exato hoje, entrando, saindo | S05, S07 |
| Selo de impacto do dia | fluido, misto, desafiador | | S05 |
| Barra de duração do trânsito | | antes do exato, no exato, depois | S06 |
| Indicador de Lua fora de curso | ativo, inativo, começa às hh:mm | | S03 |
| Selo de retrógrado | por planeta | | S03, S07 |
| Fase da Lua | ícone, linha do tempo | | S03, S04 |
| Busca de cidade | | vazia, resultados, nenhum resultado | S01 |
| Paywall | mensal, anual, avulso | | S08 |
| Barra de abas | Current, Charts, Learn, Profile, Settings | ativa | todas |

## Modelo de dados inferido

```
Perfil        id, nome, data_nasc, hora_nasc (pode faltar), cidade, lat, lon, fuso_iana
              evidência: S01, plano grátis inclui o mapa natal
              confiança: alta

MapaNatal     perfil_id, planetas[{corpo, longitude, signo, casa, retro}], cuspides[12], asc, mc
              evidência: S02; é calculado, não precisa ser guardado
              confiança: alta

Transito      corpo_transito, ponto_natal, aspecto, orbe_atual, aplicando (bool),
              entra_orbe (data), exatos (lista de datas), sai_orbe (data),
              prazo (curto | longo), tom (harmônico | tenso | neutro)
              evidência: S05, S06, fontes 2 e 3
              confiança: média (campos de duração confirmados; nomes e regra de corte do prazo são palpite)

Interpretacao chave (corpo_transito + aspecto + ponto_natal), titulo, texto
              evidência: resenhas citam texto por trânsito; uma diz que faltam interpretações de asteroides e nodos
              confiança: alta que existe; o conteúdo é do original e não entra no clone

CeuDoDia      data, posicoes[], fase_lua, lua_fora_de_curso {inicio, fim}, retrogrados[]
              evidência: S03, S04
              confiança: alta; calculado, não guardado

Assinatura    usuario_id, plano (gratis | pro_mensal | pro_anual), status, renova_em
              evidência: S08, fonte 1
              confiança: alta
```

Relações: Usuário 1-n Perfil (o dele e de outros, no original), Perfil 1-1 MapaNatal, MapaNatal + data -> n Transito, Transito n-1 Interpretacao, Usuário 1-1 Assinatura.

## O que o eusouodu já tem

Muito do motor já existe em `lib/astro.mjs`:

- `mapaNatal()` calcula planetas, casas, ASC e MC.
- `transitosPeriodo()` gera, dia a dia, os aspectos de trânsito ao natal com orbe, se está exato no dia e se está aplicando, o tom de cada um, ingressos em signo e casa, estações retrógradas, lunações, e já classifica o dia em fluido, misto ou desafiador.
- `musica/cidades.json` serve de base para a busca de cidade.
- `lib/email.mjs` já envia emails.

O que falta no motor: a janela de cada trânsito (data em que entra no orbe, datas exatas e data em que sai), a divisão em curto e longo prazo, e o cálculo da Lua fora de curso.

## Matriz de funcionalidades

Ver `features.csv`. Must: 11, should: 8, could: 5, skip: 4.

## Fora do escopo (não pode ou não deve ser clonado)

- **Os textos de interpretação do TimePassages.** São conteúdo deles. O clone precisa de uma biblioteca própria, escrita na voz do eusouodu. É o maior trabalho do projeto e também o que vai diferenciar o produto.
- O nome, a marca, os ícones e a arte da roda do mapa.
- O Atlas ACS, que é uma base licenciada. Usar base aberta de cidades e fusos IANA.
- O software de desktop, que é outro produto.
- As avaliações e a base de usuários deles.

## Tamanho

Telas 10 (6 na fatia must), fluxos 5, entidades 6 (3 calculadas).

Partes difíceis:
1. **A biblioteca de interpretações.** São 10 planetas em trânsito, 12 pontos natais e 5 aspectos: cerca de 600 combinações. Dá para começar pelos planetas lentos (Júpiter a Plutão) e pela Lua e o Sol, e escrever o resto aos poucos.
2. **A janela de cada trânsito.** É preciso achar a entrada e a saída do orbe e todas as datas exatas, incluindo as três passagens de um planeta retrógrado.
3. **Conta, assinatura e o dia certo no fuso de cada pessoa.** O site hoje vende relatórios avulsos. Um diário pede login, perfil salvo, cobrança recorrente e lembrete diário.

Tamanho: **M** (algumas semanas) como web app dentro do eusouodu.com, porque o motor já existe. Seria L como app nativo de loja. A conta não inclui escrever as 600 interpretações. Isso é trabalho de redação contínuo, não de código.
