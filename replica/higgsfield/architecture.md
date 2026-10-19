# Arquitetura: estúdio orbe (clone do Higgsfield para uso próprio)

Base: `replica/higgsfield/recon.md` e `features.csv`.
Máquina: iMac M4, 32 GB de memória, 1 TB de disco.
Uso: só o eusouodu, no próprio iMac. Sem login, sem cobrança, sem servidor na nuvem.
Data: 2026-10-19

## A ideia em uma frase

Um programa que roda no iMac e gera as imagens e os vídeos de graça. Por cima dele, um painel do orbe com os estilos da marca, a fila e a biblioteca. Quando um vídeo precisar sair rápido, ele vai para o Runway, que é pago, e só depois de você confirmar.

```
navegador (http://localhost:4400)
        │
        ▼
estúdio orbe ── Node, um arquivo SQLite, uma pasta de arquivos
        │
        ├──► ComfyUI no próprio iMac (http://127.0.0.1:8188)  ── grátis
        │      imagem: FLUX.1 schnell   vídeo: Wan 2.2 5B ou LTX-Video
        │
        └──► Runway API, com a sua chave  ── pago, só com confirmação
```

## 1. Stack

| camada | escolha | por quê |
| --- | --- | --- |
| motor de geração | **ComfyUI** no macOS, usando o chip M4 (Metal) | aberto, gratuito, roda FLUX e Wan no Mac; tem API HTTP local documentada |
| modelo de imagem | **FLUX.1 schnell** (Apache 2.0) | uso comercial livre; 4 passos, rápido; cabe em 32 GB |
| modelo de vídeo | **Wan 2.2 TI2V 5B** (Apache 2.0) | texto e imagem para vídeo em 720p; o maior que roda folgado em 32 GB |
| vídeo rápido | **LTX-Video** distilled (grátis abaixo de US$ 10 mi de receita) | bem mais rápido que o Wan no Mac; bom para rascunho |
| plano B de vídeo | **Runway API** (gen4 imagem para vídeo), com a sua chave | API oficial e pública; você já usa Runway |
| servidor | **Node 22+**, sem framework | é o que o site do eusouodu já usa (`type: module`) |
| interface | **HTML, CSS e JS sem build**, nas fontes e cores do orbe | igual ao site; nada para compilar |
| banco | **SQLite** pelo `node:sqlite` embutido no Node | um arquivo só, sem instalar nada; um usuário só |
| arquivos | pasta `~/orbe-estudio/arquivos` no disco do iMac | 1 TB sobra; nada sai do computador |
| onde fica o código | pasta `estudio/` neste repositório, fora do deploy (`.vercelignore`) | versionado junto com o resto, sem ir para o site |

O que **não** entra, e por quê: Supabase, Stripe, Vercel e login. Não há usuários além de você, nem venda, nem acesso de fora. O servidor só escuta em `127.0.0.1`, então ninguém na rede alcança o estúdio.

### Sobre os movimentos de câmera

O Wan e o LTX não têm um botão de "dolly" ou "órbita". O movimento vem do texto do prompt ("a câmera se aproxima devagar…") e, em alguns casos, de LoRAs de câmera, que são pequenos complementos abertos para o modelo. Cada preset do orbe é, portanto, **um molde de prompt mais parâmetros** (número de quadros, força do movimento, proporção). Os presets não vão obedecer tão bem quanto os do Higgsfield. Os 6 a 8 primeiros precisam ser testados e ajustados um a um.

### Tempo esperado no M4 com 32 GB (estimativa, medir no M1)

| tarefa | tempo |
| --- | --- |
| imagem FLUX schnell 1024 px | ~20 s a 1 min |
| vídeo LTX, 3 a 5 s, 9:16 | alguns minutos |
| vídeo Wan 2.2 5B, 5 s, 720p | ~15 a 40 min |
| Runway, 5 a 10 s | ~1 a 2 min, pago |

## 2. Schema

SQLite, em `replica/higgsfield/schema.sql`. Decisões:

- **Sem coluna de dono e sem regras de acesso por linha.** É um usuário só, numa máquina só, e o servidor só aceita conexões locais. Se um dia o estúdio for aberto para outras pessoas, isso vira a primeira mudança.
- `id` como texto UUID (`crypto.randomUUID()`), datas em UTC no formato ISO 8601.
- Status com `check`.
- Custo do Runway em **créditos inteiros**, nunca em número quebrado.
- `on delete`: apagar um preset não apaga gerações (`set null`). Apagar uma geração apaga o registro, e o servidor remove os arquivos de saída do disco. Arquivos de entrada (uploads) ficam, porque podem ser reusados.

Tabelas: `presets`, `arquivos`, `personagens`, `geracoes`, `custos_runway`.

## 3. API (servidor local)

Todas as rotas aceitam só `127.0.0.1`. Quem pode chamar: o navegador do iMac.

| método e caminho | o que faz | entrada | saída | fluxo |
| --- | --- | --- | --- | --- |
| `GET /` | a interface | | HTML | todos |
| `GET /api/presets?tipo=` | lista os estilos e movimentos | tipo | presets[] | F01, F02 |
| `POST /api/presets` | cria ou edita um preset seu | nome, tipo, molde, parametros | preset | F01, F02 |
| `POST /api/arquivos` | sobe uma imagem ou áudio | arquivo (até 50 MB) | arquivo | F02, F03, F04 |
| `GET /arquivos/:id` | serve o arquivo | | binário | todos |
| `POST /api/geracoes` | põe na fila | tipo, preset_id, prompt, entrada_id, proporcao, duracao, motor (local ou runway), personagem_id | geracao (status fila) | F01, F02 |
| `POST /api/geracoes/:id/confirmar` | autoriza um envio ao Runway depois de ver o custo | | geracao | F02 (plano B) |
| `GET /api/geracoes?status=&tipo=` | biblioteca e fila | filtros | geracoes[] | F01, F02 |
| `GET /api/geracoes/:id` | detalhe | | geracao | todos |
| `POST /api/geracoes/:id/repetir` | gera de novo com outra semente | | nova geracao | F01, F02 |
| `DELETE /api/geracoes/:id` | cancela, se na fila, ou apaga | | ok | todos |
| `GET /api/eventos` | progresso ao vivo (Server-Sent Events) | | eventos | todos |
| `GET /api/estado` | ComfyUI está no ar? quanto disco livre? gasto do mês no Runway? | | estado | todos |

### Serviços externos (só APIs oficiais)

- **ComfyUI (local):** `POST /prompt` com o fluxo em JSON, WebSocket `/ws` para o progresso, `GET /history/{id}` para o resultado, `GET /view` para baixar, `POST /upload/image` para a entrada.
- **Runway:** a API pública para desenvolvedores, com a sua chave guardada num arquivo `.env` que nunca vai para o git.

### Trabalho em segundo plano

- **Trabalhador da fila**, dentro do próprio servidor: pega **uma** geração por vez (a memória de 32 GB não aguenta duas), manda ao motor, acompanha o progresso e salva a saída.
- **Na inicialização:** gerações presas em `gerando` voltam para `fila`, porque o Mac pode ter dormido ou reiniciado.
- **Limpeza mensal:** avisa quando a pasta passar de 200 GB. Não apaga nada sozinha.

## 4. As partes que mordem

- **Memória:** imagem e vídeo usam modelos diferentes. Trocar de um para outro descarrega e recarrega cerca de 10 a 20 GB. A fila agrupa gerações do mesmo tipo quando possível.
- **Mac dormindo:** um vídeo de 30 minutos morre se o Mac dormir. O servidor roda `caffeinate` enquanto há algo gerando.
- **Operações sem suporte no chip Apple:** iniciar o ComfyUI com `PYTORCH_ENABLE_MPS_FALLBACK=1`. Algumas operações caem para o processador e ficam mais lentas.
- **Dimensões:** Wan e LTX exigem largura e altura múltiplas de 16 ou 32. O servidor arredonda 9:16 para 720×1280 ou 480×832.
- **Custo do Runway:** nada vai para lá sem `confirmar`. A tela mostra o custo em créditos antes, e há um teto mensal no `.env`, acima do qual o envio é recusado.
- **Repetição:** se o servidor cair entre enviar e receber, a geração guarda o `id` remoto (ComfyUI ou Runway) e retoma em vez de pagar de novo.
- **Licenças:** usar só FLUX.1 **schnell** (não o dev, que proíbe uso comercial), Wan 2.2 e LTX. Registrar em `presets` qual modelo cada preset usa.
- **Seu rosto (personagem):** o treino de LoRA no Mac é lento e frágil. O plano é treinar **uma vez** numa GPU alugada (cerca de 30 a 60 min) e usar o arquivo pronto no iMac. Só fotos suas ou de quem consentiu.
- **Disco:** vídeos de 720p ocupam 5 a 30 MB cada, e os modelos somam uns 60 a 80 GB. 1 TB dá conta por muito tempo.

## 5. Ordem de construção

| marco | o que entrega | telas | tabelas | rotas |
| --- | --- | --- | --- | --- |
| **M1, fatia vertical** | instalar ComfyUI e FLUX schnell; escrever prompt, gerar uma imagem, vê-la na biblioteca | S02, S09, S10 | geracoes, arquivos | `/`, `POST /api/geracoes`, `GET /api/geracoes`, `/api/eventos`, `/arquivos/:id` |
| **M2, estilos da marca** | 6 presets de imagem do orbe, proporções 9:16, 1:1 e 4:5, baixar, repetir | S01, S02 | presets | `/api/presets`, `repetir` |
| **M3, vídeo local** | imagem para vídeo com Wan e LTX; 6 a 8 movimentos de câmera; texto para vídeo | S03, S04 | | `POST /api/arquivos` |
| **M4, plano B** | enviar ao Runway com confirmação de custo e teto mensal | S03 | custos_runway | `confirmar`, `/api/estado` |
| **M5, desejáveis** | editar parte da imagem (inpaint); personagem com seu rosto (LoRA treinado fora) | S06, S07 | personagens | |
| **M6, opcionais** | lipsync com voz do ElevenLabs; combinar movimentos | S05, S08 | | |

M1 a M3 cobrem todos os itens obrigatórios do `features.csv`.

## Antes de começar o M1

1. Instalar no iMac: Python 3.12, Git e ComfyUI (versão para macOS). Eu escrevo um passo a passo.
2. Baixar os modelos: FLUX.1 schnell, Wan 2.2 TI2V 5B, LTX-Video. São cerca de 60 a 80 GB no total.
3. Criar a conta de desenvolvedor do Runway e gerar uma chave. Só no M4.
