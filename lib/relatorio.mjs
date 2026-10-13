// Monta o relatório: cálculo + sorteio da carta + texto escrito pela IA
import { randomInt } from 'node:crypto';
import { mapaNatal, transitosPeriodo, semanas, resumoNatal, NOMES, rotuloData } from './astro.mjs';

export const ARCANOS = [
  'O Louco (Le Mat, a carta sem número)', 'O Mago (I, Le Bateleur)', 'A Papisa (II, La Papesse)', 'A Imperatriz (III, L’Impératrice)',
  'O Imperador (IIII, L’Empereur)', 'O Papa (V, Le Pape)', 'O Enamorado (VI, L’Amoureux)', 'O Carro (VII, Le Chariot)',
  'A Justiça (VIII, La Justice)', 'O Eremita (VIIII, L’Hermite)', 'A Roda da Fortuna (X, La Roue de Fortune)', 'A Força (XI, La Force)',
  'O Pendurado (XII, Le Pendu)', 'O Arcano Sem Nome (XIII)', 'A Temperança (XIIII, Tempérance)', 'O Diabo (XV, Le Diable)',
  'A Casa de Deus (XVI, La Maison Dieu)', 'A Estrela (XVII, L’Étoile)', 'A Lua (XVIII, La Lune)', 'O Sol (XVIIII, Le Soleil)',
  'O Julgamento (XX, Le Jugement)', 'O Mundo (XXI, Le Monde)',
];

const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const VOZ = `Você escreve como o Eduardo (@eusouodu), astrólogo e terapeuta brasileiro que trabalha há mais de dez anos com astrologia, simbolismo e mitologia.
Regras de voz, obrigatórias:
- Português do Brasil. Escreva no coletivo, com "a gente", ou em construções impessoais. Evite "você". Nunca use "tu" nem "ti". O nome da pessoa pode aparecer de vez em quando.
- Alterne frases curtas e quebradas com frases mais longas e reflexivas.
- Abra o símbolo: explique o que o planeta, o signo, a casa ou a fase da Lua significam e como isso toca a vida concreta. Nada enigmático, nada de imagem solta sem desdobramento.
- Mitologia, filosofia e simbolismo entram como textura, sem citar autores nem fazer aula.
- Sem linguagem motivacional, sem coaching, sem promessas, sem fechamentos redondos. Os finais deixam algo em aberto.
- Vênus é o planeta, então é sempre masculino: "o Vênus", "Vênus retrógrado", "ao Vênus natal", "do Vênus". Nunca "Vênus retrógrada" nem "à Vênus".
- Proibido: travessão (—), frases começando com "Existe", "fica com essa frase", "o detalhe que ninguém conta" e variações, abrir com tom de fábula ("Tem um homem que..."), a expressão "psicologia profunda", frases que anunciam o que vem ("agora vamos ver...").
- Nunca preveja acontecimentos como certos. Fale em tendências, convites e tensões. Cada decisão é da pessoa.
- Use SOMENTE os dados astrológicos fornecidos. Não invente posições, aspectos, casas ou datas.`;

function dadosSemana(sem, natal, nome) {
  const linhas = [];
  linhas.push(`Pessoa: ${nome}. Mapa natal: ${resumoNatal(natal)}.`);
  linhas.push(`Período desta parte: ${sem.rotulo}.`);
  if (sem.fases.length) linhas.push('Fases principais da Lua: ' + sem.fases.map(f => `${f.fase} em ${f.rotulo}, às ${f.hora} (horário de Brasília), a ${f.grau} de ${f.signo}, na casa ${f.casaNatal} do mapa natal`).join('; ') + '.');
  else linhas.push('Nenhuma das quatro fases principais da Lua cai neste período.');
  for (const d of sem.dias) {
    const ev = d.eventos.map(e => {
      if (e.tipo === 'aspecto') return `${e.transito} em trânsito faz ${e.aspecto} ao ${e.natal} natal${e.exato ? ' (exato neste dia)' : e.aplicando ? ' (se aproximando)' : ' (se afastando)'}`;
      if (e.tipo === 'casa') return `${e.planeta} entra na casa ${e.entraNaCasa} do mapa natal`;
      if (e.tipo === 'signo') return `${e.planeta} entra em ${e.entraEm}`;
      if (e.tipo === 'estacao') return `${e.planeta} ${e.movimento} em ${e.signo}, na casa ${e.casaNatal}`;
      if (e.tipo === 'lunacao') return `${e.fase} às ${e.hora} em ${e.signo}, na casa ${e.casaNatal}`;
      return '';
    }).filter(Boolean);
    const pos = Object.entries(d.posicoes).filter(([k]) => k !== 'Moon').map(([k, p]) => `${NOMES[k]} em ${p.signo} na casa ${p.casaNatal}${p.retro ? ' (retrógrado)' : ''}`).join(', ');
    linhas.push(`\n${d.rotulo} (${d.data}). Energia calculada: ${d.energia}. Lua em ${d.lua.signo}, passando pela casa ${d.lua.casaNatal}. Planetas: ${pos}. Acontecimentos: ${ev.length ? ev.join('; ') : 'nenhum aspecto exato importante'}.`);
  }
  return linhas.join('\n');
}

const FORMATO = `Responda no formato estruturado pedido, preenchendo os campos assim:
{
  "chave": { "titulo": "título curto da chave central do período", "texto": "dois parágrafos sobre o trabalho central deste período no mapa da pessoa, ancorado nos trânsitos mais fortes e nas casas envolvidas" },
  "carta": { "leitura": "dois parágrafos lendo a carta sorteada do Tarot de Marselha para este período: descreva a imagem da carta (o que aparece nela), o que ela simboliza e como conversa com os trânsitos; termine com uma pergunta" },
  "lua": [ { "fase": "nome da fase", "texto": "um parágrafo sobre essa fase no signo e na casa natal indicados" } ],
  "cor": { "nome": "nome da cor", "hex": "#RRGGBB", "texto": "um parágrafo: por que essa cor para esta energia, com base no que a psicologia das cores observa (efeitos de atenção, ativação, calma, associação cultural), sem exagerar o que a ciência sustenta", "pergunta": "uma pergunta que a cor provoca" },
  "incenso": { "nome": "um incenso tradicional (ex.: olíbano, mirra, sândalo, breu-branco, palo santo de origem sustentável, benjoim, alecrim)", "texto": "um parágrafo: o uso histórico e simbólico dessa resina ou erva e por que ela conversa com a semana", "pergunta": "uma pergunta" },
  "oleo": { "nome": "um óleo essencial", "texto": "um parágrafo: o que a aromacologia observa sobre esse aroma (humor, atenção, relaxamento), dito com precisão e sem prometer cura, e por que ele conversa com a semana", "pergunta": "uma pergunta", "cuidado": "uma frase curta de segurança específica desse óleo (diluição, gestação, crianças, animais, fotossensibilidade quando for cítrico)" },
  "dias": [ { "data": "AAAA-MM-DD", "titulo": "título curto do dia", "texto": "um parágrafo lendo o dia", "trabalhar": "o que vale trabalhar neste dia, concreto", "fortes": "pontos fortes do dia", "desafios": "pontos desafiadores do dia" } ]
}
O array "dias" deve ter exatamente um item para cada dia do período, na ordem, usando a classificação de energia calculada (fluida, mista ou desafiadora) para dar o tom. O array "lua" tem um item por fase principal do período (pode ser vazio).`;

const T = { type: 'string' };
const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    chave: { type: 'object', additionalProperties: false, properties: { titulo: T, texto: T }, required: ['titulo', 'texto'] },
    carta: { type: 'object', additionalProperties: false, properties: { leitura: T }, required: ['leitura'] },
    lua: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { fase: T, texto: T }, required: ['fase', 'texto'] } },
    cor: { type: 'object', additionalProperties: false, properties: { nome: T, hex: T, texto: T, pergunta: T }, required: ['nome', 'hex', 'texto', 'pergunta'] },
    incenso: { type: 'object', additionalProperties: false, properties: { nome: T, texto: T, pergunta: T }, required: ['nome', 'texto', 'pergunta'] },
    oleo: { type: 'object', additionalProperties: false, properties: { nome: T, texto: T, pergunta: T, cuidado: T }, required: ['nome', 'texto', 'pergunta', 'cuidado'] },
    dias: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { data: T, titulo: T, texto: T, trabalhar: T, fortes: T, desafios: T }, required: ['data', 'titulo', 'texto', 'trabalhar', 'fortes', 'desafios'] } },
  },
  required: ['chave', 'carta', 'lua', 'cor', 'incenso', 'oleo', 'dias'],
};

// saída estruturada: a API garante um JSON que segue o esquema
async function chamarIA(sistema, usuario) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODELO, max_tokens: 12000, system: sistema,
      output_config: { format: { type: 'json_schema', schema: ESQUEMA } },
      messages: [{ role: 'user', content: usuario }],
    }),
  });
  if (!r.ok) throw new Error(`IA ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  const txt = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  const obj = JSON.parse(txt);
  if (!Array.isArray(obj.dias)) throw new Error(`IA sem resposta estruturada (stop: ${j.stop_reason})`);
  return obj;
}

const limpar = s => typeof s === 'string' ? s.replace(/\s*—\s*/g, ', ') : s;
function limparTudo(o) { if (Array.isArray(o)) return o.map(limparTudo); if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, limparTudo(v)])); return limpar(o); }

async function escreverSemana(sem, natal, pessoa, carta, idx, total) {
  const usuario = `${dadosSemana(sem, natal, pessoa.nome)}

Carta sorteada do Tarot de Marselha para este período: ${carta}.
${total > 1 ? `Esta é a semana ${idx + 1} de ${total} de um relatório de 30 dias. A "chave" é o trabalho central desta semana.` : 'Este é um relatório de 7 dias. A "chave" é o trabalho central da semana inteira.'}

${FORMATO}`;
  let ultimoErro;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try { return limparTudo(await chamarIA(VOZ, usuario)); } catch (e) { ultimoErro = e; }
  }
  throw ultimoErro;
}

// pessoa: { nome, email, data, hora, cidade, tz, lat, lon }; plano: 7 | 30; inicioISO: primeiro dia
export async function gerarRelatorio(pessoa, plano, inicioISO) {
  const natal = mapaNatal(pessoa);
  const periodo = transitosPeriodo(natal, inicioISO, plano);
  const sems = semanas(periodo);
  const cartas = sems.map(() => ARCANOS[randomInt(ARCANOS.length)]);
  const textos = await Promise.all(sems.map((s, i) => escreverSemana(s, natal, pessoa, cartas[i], i, sems.length)));
  return {
    pessoa: { nome: pessoa.nome, cidade: pessoa.cidade, data: pessoa.data, hora: pessoa.hora },
    plano, inicio: periodo.dias[0].data, fim: periodo.dias[periodo.dias.length - 1].data,
    natal: Object.fromEntries(Object.entries(natal.planetas).map(([k, p]) => [NOMES[k], { signo: p.signo, grau: p.grau, casa: p.casa, retro: p.retro }])),
    semanas: sems.map((s, i) => ({
      ...textos[i],
      rotulo: s.rotulo, melhores: s.melhores, fases: s.fases,
      cartaNome: cartas[i], cartaLeitura: textos[i].carta?.leitura || '',
      dias: s.dias.map(d => ({ data: d.data, rotulo: d.rotulo, energia: d.energia, lua: d.lua, ...((textos[i].dias || []).find(x => x.data === d.data) || {}) })),
    })),
  };
}

export { rotuloData };
