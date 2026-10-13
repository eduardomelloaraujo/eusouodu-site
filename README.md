# eusouodu-site

Página central de eusouodu.com.

- `index.html`: o site.
- `semana.json`: o texto da energia astrológica da semana e as fases da Lua. É o único arquivo que muda toda semana.
- `scripts/efemerides.mjs`: calcula a semana (fases da Lua com hora exata, ingressos, retrogradações e aspectos). Uso: `npm i && node scripts/efemerides.mjs 2026-10-19`.

## Voz do texto da semana

- Vênus é o planeta, sempre no masculino: "o Vênus", "Vênus retrógrado", "ao Vênus natal". Nunca "Vênus retrógrada".
- Retrógrado não é "andar para trás": é movimento aparente visto da Terra. Não escrever "para trás" nem "volta".
- Dizer "energia astrológica da semana". Sem travessões. Coletivo com "a gente".
