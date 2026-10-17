// eusouodu app: a energia astrológica do dia, igual para todo mundo.
// GET /api/app-dia?d=AAAA-MM-DD (sem d, usa hoje em Brasília). A resposta fica um dia no cache da Vercel.
import { ceuDoDia } from '../lib/app.mjs';
import { partesLocais } from '../lib/astro.mjs';
import { escrever, blocos } from '../lib/voz.mjs';

export const config = { maxDuration: 60 };

function descreve(c) {
  const pos = c.planetas.map(p => `${p.nome} a ${p.grau} de ${p.signo}${p.retro ? ' (retrógrado)' : ''}`).join('; ');
  const ev = c.eventos.map(e =>
    e.tipo === 'lunacao' ? `${e.fase} em ${e.signo} às ${e.hora}` :
    e.tipo === 'ingresso' ? `${e.planeta} entra em ${e.signo} às ${e.hora}` :
    e.tipo === 'estacao' ? `${e.planeta} ${e.movimento} em ${e.signo}` :
    `${e.de} em ${e.aspecto} com ${e.para}, exato às ${e.hora}`).join('; ');
  return `Dia: ${c.rotulo}.\nLua: ${c.lua.nome} em ${c.lua.signo}, ${c.lua.luz}% iluminada.\nPosições: ${pos}.\nMovimentos do dia: ${ev || 'nenhum aspecto exato, o dia segue o tom da Lua e dos planetas lentos'}.`;
}

export default async function handler(req, res) {
  const q = req.query || {};
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(q.d || '') ? q.d : partesLocais(new Date()).data;
  try {
    const ceu = ceuDoDia(iso);
    let texto = null;
    const bruto = await escrever(`${descreve(ceu)}

Tarefa: escreva a leitura da energia astrológica deste dia para o app, para qualquer pessoa, sem mapa natal.
Escolha o movimento mais forte do dia (a Lua e seus aspectos contam, mas um ingresso, uma estação ou uma lunação pesam mais) e leia o que ele movimenta por dentro e no cotidiano.

Responda exatamente neste formato, sem mais nada:
TITULO: (de 2 a 6 palavras, uma imagem do dia, sem dois pontos)
TEXTO: (de 110 a 160 palavras, 2 ou 3 parágrafos curtos separados por linha em branco)
CHAMADO: (de 30 a 50 palavras: o que está sendo chamado para trabalho hoje e de que forma trabalhar essa energia no dia, de modo concreto)
COR: (uma cor e, em até 8 palavras, por quê)
INCENSO: (um incenso ou erva e, em até 8 palavras, por quê)`);
    if (bruto) texto = blocos(bruto, ['TITULO', 'TEXTO', 'CHAMADO', 'COR', 'INCENSO']);
    if (texto && texto.texto) res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    else res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).json({ ...ceu, texto: texto && texto.texto ? texto : null });
  } catch (e) {
    console.error('app-dia:', e);
    return res.status(500).json({ erro: 'falha' });
  }
}
