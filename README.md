# eusouodu-site

Página central de eusouodu.com.

- `index.html`: o site.
- `semana.json`: o texto da energia astrológica da semana e as fases da Lua. É o único arquivo que muda toda semana.
- `scripts/efemerides.mjs`: calcula a semana (fases da Lua com hora exata, ingressos, retrogradações e aspectos). Uso: `npm i && node scripts/efemerides.mjs 2026-10-19`.

## Voz do texto da semana

- Vênus é o planeta, sempre no masculino: "o Vênus", "Vênus retrógrado", "ao Vênus natal". Nunca "Vênus retrógrada".
- Retrógrado não é "andar para trás": é movimento aparente visto da Terra. Não escrever "para trás" nem "volta".
- Nunca usar a fórmula "a pergunta é".
- Dizer "energia astrológica da semana". Sem travessões. Coletivo com "a gente".

## Jornada (jornada.eusouodu.com)

App de astrologia, mito e filosofia por assinatura. Instala na tela de início do celular.

- `jornada/`: o app (`index.html`, gerado), ícones, `manifest.webmanifest`, `sw.js`, `termos.html`, `privacidade.html`.
- `lib/jornada/*.json`: as 11 subjornadas pagas (Touro a Peixes). Ficam fora da pasta pública e só saem pela API para quem tem plano ativo. Áries vai dentro do `index.html`, grátis.
- `api/jornada.js`: uma função com as ações `entrar`, `pedir-link`, `abrir`, `sync`, `conteudo`, `checkout`, `cancelar`, `webhook`, `diario`, `sair-emails`, `status`.
- `lib/jornada.mjs`: contas, sessões assinadas, planos, Mercado Pago e e-mails.
- Passe semanal: R$ 9,90 por Pix (preferência do Mercado Pago só com Pix), soma 7 dias. Mensal: R$ 29,90 no cartão (assinatura `preapproval` do Mercado Pago).
- Variáveis: as mesmas do site (`MP_ACCESS_TOKEN`, `RESEND_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `ADMIN_KEY`) e `JORNADA_SECRET` (assina os links de entrada; se faltar, usa a `ADMIN_KEY`). Preços opcionais: `JORNADA_PRECO_SEMANA`, `JORNADA_PRECO_MES`.
- Diagnóstico: `https://eusouodu.com/api/jornada?a=status&key=ADMIN_KEY`.
