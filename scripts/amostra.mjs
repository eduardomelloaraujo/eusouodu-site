// Gera um e-mail de amostra sem chamar a IA: usa o cálculo real e um texto escrito à mão.
// Uso: node scripts/amostra.mjs > amostra.html
import { readFileSync } from 'node:fs';
import { mapaNatal, transitosPeriodo, semanas, NOMES } from '../lib/astro.mjs';
import { montarEmail } from '../lib/email.mjs';

const pessoa = { nome: 'Marina Exemplo', data: '1990-07-21', hora: '09:40', cidade: 'Salvador, Bahia, Brasil', tz: 'America/Bahia', lat: -12.9714, lon: -38.5014 };
const natal = mapaNatal(pessoa);
const periodo = transitosPeriodo(natal, '2026-10-13', 7);
const [s] = semanas(periodo);
const t = JSON.parse(readFileSync(new URL('./amostra-texto.json', import.meta.url)));
const rel = {
  pessoa, plano: 7, inicio: s.inicio, fim: s.fim,
  natal: Object.fromEntries(Object.entries(natal.planetas).map(([k, p]) => [NOMES[k], { signo: p.signo, grau: p.grau, casa: p.casa }])),
  semanas: [{ ...t, rotulo: s.rotulo, melhores: s.melhores, fases: s.fases, cartaNome: 'A Justiça (VIII, La Justice)', cartaLeitura: t.carta.leitura,
    dias: s.dias.map(d => ({ data: d.data, rotulo: d.rotulo, energia: d.energia, lua: d.lua, ...t.dias.find(x => x.data === d.data) })) }],
};
const { assunto, html } = montarEmail(rel);
console.error(assunto);
process.stdout.write(html);
