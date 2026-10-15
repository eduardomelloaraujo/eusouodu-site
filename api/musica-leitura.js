// Música Astral: escreve a leitura da música do dia, ligando o tom original da música,
// o trânsito mais forte do dia e o tema da música. Respostas iguais ficam em cache um dia.
const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const SIGNOS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
const PLANETAS = ['Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno'];
const ASPECTOS = { conj: 'conjunção', opos: 'oposição', quad: 'quadratura', trig: 'trígono', sext: 'sextil', none: 'sem aspecto forte' };
const PONTOS = { Sol: 'o Sol', Lua: 'a Lua', Asc: 'o Ascendente' };

const VOZ = `Você escreve como o Eduardo (@eusouodu), astrólogo e terapeuta brasileiro que trabalha há mais de dez anos com astrologia, simbolismo e mitologia.
Regras de voz, obrigatórias:
- Português do Brasil, no coletivo "a gente" ou em construções impessoais. Não use "você", "tu" nem "ti".
- Frases curtas e quebradas, alternando com uma frase mais longa e reflexiva.
- Abra o símbolo: explique a imagem, dê contorno. Nada enigmático.
- Mitologia e simbolismo entram como textura, sem citar autores nem dar aula.
- Sem linguagem motivacional, sem coaching, sem promessas, sem fechamento redondo. Termine em aberto.
- Vênus é masculino: "o Vênus". Retrógrado nunca é "andar para trás".
- Proibido: travessão (—), "a pergunta é", frases começando com "Existe", "fica com essa frase", "o detalhe que ninguém conta", tom de fábula, "psicologia profunda", frases que anunciam o que vem.
- Nunca preveja acontecimentos. Nada sobre saúde, dinheiro ou decisões. Amplo, mas com direção: um convite para olhar algo hoje.`;

const limpa = (s, n = 80) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  const q = req.query || {};
  const sol = limpa(q.sol), lua = limpa(q.lua), asc = limpa(q.asc);
  const planeta = limpa(q.planeta), signo = limpa(q.signo), aspecto = limpa(q.aspecto), ponto = limpa(q.ponto);
  const musica = limpa(q.musica, 120), artista = limpa(q.artista, 120), tema = limpa(q.tema, 120);
  if (!SIGNOS.includes(sol) || !SIGNOS.includes(lua) || (asc && !SIGNOS.includes(asc)) || !PLANETAS.includes(planeta) ||
      !SIGNOS.includes(signo) || !(aspecto in ASPECTOS) || !(ponto in PONTOS) || !musica || !artista) {
    return res.status(400).json({ erro: 'dados incompletos' });
  }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ erro: 'sem chave' });

  const art = planeta === 'Lua' ? 'a' : 'o';
  const pedido = `Dados de hoje:
- Mapa: Sol em ${sol}, Lua em ${lua}${asc ? `, Ascendente em ${asc}` : ''}.
- Trânsito mais forte de hoje: ${art} ${planeta} em ${signo}, ${aspecto === 'none' ? 'sem aspecto forte com o mapa' : `em ${ASPECTOS[aspecto]} com ${PONTOS[ponto]} do mapa`}.
- Música do dia: "${musica}", de ${artista}. Tema que ela carrega: ${tema || 'livre'}.

Tarefa:
1. Diga a tonalidade original da gravação mais conhecida dessa música (ex.: "Lá menor"). Se não tiver segurança, dê só o modo (maior ou menor) seguido de "provável".
2. Escreva por que essa é a música do dia, ligando simbolicamente o tom (o que ele sugere: maior ou menor, claro ou escuro, a sensação que a tradição costuma dar a ele), o trânsito de hoje e o tema da música. O texto deixa a gente pensando no próprio dia.
De 70 a 110 palavras, em 2 ou 3 parágrafos curtos.

Responda exatamente neste formato, sem mais nada:
TOM: (a tonalidade)
TEXTO:
(os parágrafos, separados por uma linha em branco)`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODELO, max_tokens: 5000, system: VOZ, messages: [{ role: 'user', content: pedido }] }),
    });
    if (!r.ok) {
      console.error('musica-leitura: api', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ erro: 'falha na escrita' });
    }
    const j = await r.json();
    const bruto = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    const semMd = bruto.replace(/\*\*/g, '');
    const tm = semMd.match(/TOM:\s*(.+)/i), xm = semMd.match(/TEXTO:\s*([\s\S]+)/i);
    const texto = (xm ? xm[1] : semMd.replace(/^.*TOM:.*$/im, '')).trim();
    const d = { tom: tm ? tm[1].trim() : '', texto };
    if (!d.texto) {
      console.error('musica-leitura: vazia', j.stop_reason, JSON.stringify(j.content || []).slice(0, 300));
      return res.status(502).json({ erro: 'resposta vazia', motivo: j.stop_reason, tipos: (j.content || []).map(c => c.type) });
    }
    const tira = s => String(s || '').replace(/\s*[—–]\s*/g, ', ');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json({ tom: tira(d.tom).slice(0, 40), texto: tira(d.texto) });
  } catch (e) {
    console.error('musica-leitura:', e);
    return res.status(500).json({ erro: 'falha' });
  }
}
