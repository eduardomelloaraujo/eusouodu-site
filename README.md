# eusouodu-site

Página central de eusouodu.com.

- `index.html`: o site.
- `semana.json`: o texto da energia astrológica da semana e as fases da Lua. É o único arquivo que muda toda semana.
- `scripts/efemerides.mjs`: calcula a semana (fases da Lua com hora exata, ingressos, retrogradações e aspectos). Uso: `npm i && node scripts/efemerides.mjs 2026-10-19`.
