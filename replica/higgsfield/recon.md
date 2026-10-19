# Recon map: Higgsfield AI (web, iOS)

Escopo: o estúdio de geração de imagem e vídeo, recortado para o que o eusouodu usa: imagens no estilo da marca, imagem virando vídeo com movimento de câmera, formato vertical para Reels, e o seu rosto como personagem consistente.
Para: uso interno do eusouodu (conteúdo de astrologia, simbolismo e mitologia). Não é um produto para vender a terceiros.
Data: 2026-10-19

## Primeiro, o que "de graça" quer dizer aqui

O Higgsfield não tem um motor de vídeo próprio que dê para recriar. O que ele vende é:

1. **Uma interface boa com presets**: cerca de 70 movimentos de câmera e estilos de imagem prontos.
2. **Acesso revendido a modelos pagos**: Veo (Google), Kling, Seedance, Wan, Nano Banana. O usuário paga créditos ao Higgsfield, e o Higgsfield paga a cada empresa.
3. **Modelos próprios**: o Soul (imagem) e o Soul ID (personagem a partir de fotos).

O item 1 se clona. O item 2 não fica grátis: Veo e Kling só existem pagando a quem os fez. O item 3 é deles e não se copia, mas existem modelos abertos equivalentes.

Gerar vídeo exige uma placa de vídeo (GPU) forte. Os caminhos reais:

| caminho | custo | o que precisa |
| --- | --- | --- |
| A. sua própria GPU | só a energia elétrica | placa NVIDIA com 16 a 24 GB (ex.: RTX 4090, 5090). Com 8 a 12 GB roda só o mais leve, devagar |
| B. GPU alugada por hora | paga só quando gera | conta num serviço de GPU; cada vídeo de 5 s custa centavos a poucos reais, conforme o modelo |
| C. APIs pagas, sem o Higgsfield no meio | por geração | você já tem Runway e ElevenLabs conectados nesta sessão |

Sem venda a terceiros, o app não precisa de créditos nem de cobrança: é um painel só seu.

### O computador do eusouodu: um iMac

iMac não tem placa NVIDIA. O que decide é o chip (menu Apple > Sobre este Mac):

- **Chip Intel**: não serve para gerar imagem nem vídeo. Fica o caminho B ou C.
- **Chip Apple (M1 a M4)**: a memória é compartilhada com o processador, e o iMac vai até 24 a 32 GB.
  - **Imagem: funciona bem.** Modelos como FLUX schnell e SDXL rodam em programas gratuitos para Mac (Draw Things, DiffusionBee, ComfyUI). Leva de segundos a cerca de um minuto por imagem.
  - **Vídeo: funciona, mas devagar.** Modelos leves (Wan 2.2 de 5B, LTX) rodam em Mac com 16 GB ou mais. Um clipe de poucos segundos pode levar de vários minutos a mais de meia hora, e com 8 GB não vale a pena.

Caminho recomendado para o eusouodu: **imagens no iMac (de graça)** e **vídeos por GPU alugada ou serviço pago** só quando precisar, para os Reels que forem ao ar.

As regras continuam valendo: nada de burlar créditos, paywall ou login do Higgsfield, e nada de usar a API interna deles.

## Como este mapa foi feito

Só fontes públicas, pela busca. A rede deste ambiente bloqueia o site do Higgsfield, então **nenhuma tela foi vista diretamente.** Os estados estão como "não visto". Os preços variam muito entre as fontes: confira em higgsfield.ai/pricing.

## Fontes

| # | fonte | URL | o que deu |
| --- | --- | --- | --- |
| 1 | guia Cinema Studio e Soul ID | https://www.frankx.ai/guides/higgsfield-ai-video-guide | Cinema Studio combina até 3 movimentos; Soul ID; vários modelos |
| 2 | guia de prompts e presets | https://cropupai.com/blog/higgsfield-ai-prompting-guide/ | presets do Soul (Y2K, rua, nostalgia), Soul ID |
| 3 | resenha dynalord (2026) | https://dynalord.com/blog/higgsfield-review | cerca de 70 presets: dolly, grua, órbita, bullet time, crash zoom |
| 4 | resenha pollo.ai | https://pollo.ai/hub/higgsfield-ai-review | bom em câmera, não melhor que Kling e Runway no geral |
| 5 | resenha creatify | https://creatify.ai/review/higgsfield-ai | recursos e custos |
| 6 | resenha makerstack (2026) | https://makerstack.co/reviews/higgsfield-review/ | nota e preço de entrada |
| 7 | preços explicados (Krea) | https://www.krea.ai/blog/higgsfield-pricing-explained-2026-unlimited-credits-and-real-monthly-costs | Starter US$ 19 (270 créditos), Plus US$ 59, Ultra US$ 129; grátis com 0 créditos |
| 8 | preços e armadilhas (krater) | https://krater.ai/blog/higgsfield-pricing | créditos que expiram |
| 9 | modelos no Segmind | https://www.segmind.com/models/all/higgsfield | modelos do Higgsfield acessíveis por API de terceiros |
| 10 | GPU para Wan, Hunyuan, LTX | https://www.spheron.network/blog/ai-video-generation-gpu-guide/ | memória de vídeo por modelo |
| 11 | comparativo de modelos abertos | https://www.aimagicx.com/blog/open-source-ai-video-models-comparison-2026 | Wan 2.2, HunyuanVideo 1.5, LTX |
| 12 | modelos abertos (LTX) | https://ltx.io/blog/best-open-source-video-generation-models | licença do LTX: grátis abaixo de US$ 10 mi de receita |

## Loop principal

Escolher um preset, escrever ou ajustar o prompt, opcionalmente subir uma imagem, gerar, esperar na fila e baixar o vídeo vertical pronto para postar.

## Telas

| ID | tela | como chegar | para que serve | componentes | estados vistos |
| --- | --- | --- | --- | --- | --- |
| S01 | Início / explorar presets | página inicial | escolher por onde começar | grade de presets com vídeo de exemplo | não visto |
| S02 | Criar imagem | menu Image | texto para imagem com estilo | campo de prompt, seletor de preset, proporção, quantidade, botão gerar | não visto |
| S03 | Criar vídeo | menu Video | imagem ou texto para vídeo | upload de imagem, prompt, seletor de modelo, seletor de movimento, duração, proporção | não visto |
| S04 | Escolher movimento de câmera | dentro de S03 | ver e escolher o movimento | grade com prévia em loop, busca | não visto |
| S05 | Cinema Studio | menu | combinar até 3 movimentos | linha do tempo, camadas de movimento | não visto |
| S06 | Criar personagem (Soul ID) | menu Character | treinar seu rosto | upload de várias fotos, progresso do treino | não visto |
| S07 | Editar imagem (inpaint) | a partir de uma imagem | trocar uma parte | pincel de máscara, prompt | não visto |
| S08 | Lipsync | menu | boca acompanhando um áudio | upload de vídeo ou imagem, upload de áudio | não visto |
| S09 | Fila e histórico | sempre visível | acompanhar o que está gerando | cartões com status e progresso | não visto |
| S10 | Biblioteca | menu Assets | tudo que foi gerado | grade, filtro por tipo, baixar, apagar, reusar prompt | não visto |
| S11 | Preços e créditos | menu | vender planos | tabela de planos, saldo de créditos | não visto (fora do clone) |

## Fluxos

```
F01 Imagem no estilo da marca
    S02 escolher preset -> escrever prompt -> gerar -> S09 -> S10 baixar
    cliques: cerca de 5
    bordas: prompt bloqueado; GPU ocupada; resultado com mãos ou rosto errado

F02 Imagem vira Reel com movimento de câmera
    S03 subir imagem -> S04 escolher movimento -> 9:16 -> gerar -> S09 -> S10 baixar
    cliques: cerca de 7
    bordas: imagem horizontal num vídeo vertical; geração de vários minutos; falta de memória na GPU

F03 Criar seu personagem
    S06 subir 20+ fotos -> treinar -> usar em S02 e S03
    cliques: cerca de 5, mais o tempo de treino
    bordas: fotos ruins; só fotos de quem consentiu

F04 Vídeo falando
    S08 vídeo ou imagem + áudio (voz do ElevenLabs) -> gerar -> S10
    cliques: cerca de 5
    bordas: áudio longo; rosto de perfil
```

## Componentes

| componente | variantes | estados | usado em |
| --- | --- | --- | --- |
| Cartão de preset | imagem, vídeo em loop | selecionado | S01, S02, S04 |
| Campo de prompt | curto, com sugestões | vazio, bloqueado | S02, S03, S07 |
| Upload de mídia | imagem, várias imagens, áudio | arrastando, enviando, erro de formato | S03, S06, S08 |
| Seletor de proporção | 9:16, 1:1, 16:9, 4:5 | | S02, S03 |
| Cartão de geração | imagem, vídeo | na fila, gerando (%), pronto, erro | S09, S10 |
| Player de vídeo | em loop, com controles | carregando | S01, S04, S10 |

## Modelo de dados inferido

```
Preset        id, tipo (imagem | movimento), nome, prompt_base, parametros, exemplo
              evidência: S01, S02, S04
              confiança: alta

Geracao       id, tipo (imagem | video | lipsync | inpaint), preset_id, prompt, entrada (arquivo),
              modelo, proporcao, duracao, status (fila | gerando | pronto | erro), progresso, saida, criada_em
              evidência: S02, S03, S09
              confiança: alta

Personagem    id, nome, fotos[], status_treino, arquivo_do_modelo (LoRA)
              evidência: S06
              confiança: média (como o Soul ID funciona por dentro não é público)

Arquivo       id, caminho, tipo, tamanho, origem (upload | gerado)
              evidência: S10
              confiança: alta
```

Relações: Preset 1-n Geracao, Personagem 1-n Geracao, Geracao n-1 Arquivo (entrada) e 1-n Arquivo (saída).

## Matriz de funcionalidades

Ver `features.csv`. Must: 8, should: 4, could: 3, skip: 5.

## Fora do escopo (não pode ou não deve ser clonado)

- **Veo, Kling, Sora, Seedance**: modelos pagos de outras empresas. Só pagando a API de cada uma.
- **O modelo Soul e o Soul ID do Higgsfield**: proprietários. O equivalente aberto é um LoRA treinado nas suas fotos.
- **Créditos, planos e cobrança**: desnecessários num painel de uso próprio.
- **A galeria da comunidade, os presets, os exemplos e a marca deles.**

Licenças dos modelos abertos: Wan 2.2 é Apache 2.0 (uso comercial livre). LTX é grátis abaixo de US$ 10 milhões de receita. HunyuanVideo tem licença própria com restrições. Para imagem, FLUX.1 schnell é Apache 2.0; o FLUX.1 dev **não** permite uso comercial. Confirme no arquivo de licença de cada modelo antes de usar.

## O que o eusouodu já tem

- A marca orbe e a paleta, que viram os presets de estilo.
- A conexão com Runway e ElevenLabs nesta sessão (caminho C), útil para testar sem GPU.

## Tamanho

Telas 10 (sem a de preços), fluxos 4, entidades 4.

Partes difíceis:
1. **A GPU.** É o custo e o gargalo do projeto. Sem uma placa de 16 a 24 GB, o caminho é aluguel por hora ou API paga.
2. **A fila.** Um vídeo leva minutos. O app precisa enfileirar, mostrar o progresso e se recuperar de falhas e de falta de memória.
3. **Personagem consistente.** Treinar um LoRA do seu rosto exige um bom conjunto de fotos, tempo de GPU e ajuste fino.

Tamanho: **S** (um fim de semana) se for um painel por cima do ComfyUI, uma ferramenta aberta que já roda Wan e FLUX, rodando na sua máquina, com 6 a 8 presets do orbe. **M** (algumas semanas) com fila, biblioteca, personagem e lipsync numa interface própria. Não sai de graça: o custo vai para a GPU.
