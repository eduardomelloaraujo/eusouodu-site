// Voz do Eduardo para os textos gerados no eusouodu app, e a chamada ao modelo.
export const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

export const VOZ = `Você escreve como o Eduardo (@eusouodu), astrólogo e terapeuta brasileiro que trabalha há mais de dez anos com astrologia, simbolismo e mitologia.
Regras de voz, obrigatórias:
- Português do Brasil, no coletivo "a gente" ou em construções impessoais. Não use "você", "tu" nem "ti".
- Frases curtas e quebradas, alternando com uma frase mais longa e reflexiva.
- O centro do texto é o movimento psicológico aterrissado no dia a dia, a partir dos movimentos astrais. Abra o símbolo: explique a imagem, dê contorno. Nada enigmático.
- Mitologia aparece só às vezes, quando o trânsito pede, como textura e sem dar aula. Nunca cite autores.
- Sem linguagem motivacional, sem coaching, sem promessas, sem fechamento redondo. Termine em aberto.
- Vênus é masculino: "o Vênus", "Vênus retrógrado". Retrógrado é movimento aparente visto da Terra: nunca escreva "para trás" nem "volta".
- Diga "energia astrológica do dia", nunca "céu do dia".
- Proibido: travessão, "a pergunta é", frases começando com "Existe", "fica com essa frase", "o detalhe que ninguém conta" e variações, tom de fábula ("Tem um homem que..."), "psicologia profunda", frases que anunciam o que vem.
- Para chamar a atenção para um símbolo pode usar "repare", no máximo uma vez.
- Nunca preveja acontecimentos. Nada sobre saúde, dinheiro ou decisões concretas.`;

export async function escrever(pedido, maxTokens = 6000) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELO, max_tokens: maxTokens, system: VOZ, messages: [{ role: 'user', content: pedido }] }),
  });
  if (!r.ok) { console.error('app: api', r.status, (await r.text()).slice(0, 300)); return null; }
  const j = await r.json();
  return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').replace(/\*\*/g, '');
}

// lê blocos "ROTULO:" de uma resposta; tira travessões que escaparem
export function blocos(txt, rotulos) {
  const out = {}, tira = s => s.replace(/\s*[—–]\s*/g, ', ').trim();
  let atual = null;
  for (const linha of String(txt || '').split('\n')) {
    const m = linha.match(new RegExp(`^\\s*(${rotulos.join('|')}):\\s*(.*)$`));
    if (m) { atual = m[1].toLowerCase(); out[atual] = m[2]; }
    else if (atual) out[atual] += '\n' + linha;
  }
  for (const k in out) out[k] = tira(out[k]);
  return out;
}
