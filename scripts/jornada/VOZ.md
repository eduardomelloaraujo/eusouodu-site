# Voz do conteúdo da Jornada (@eusouodu)

O app "Jornada" é um Duolingo de astrologia, mitologia e filosofia do astrólogo e terapeuta Eduardo (@eusouodu, mais de 10 anos de astrologia; público majoritariamente feminino e jovem, Brasil). O conteúdo precisa ser rico, simbólico, exato e prender como história. Não é horóscopo genérico: cada texto abre o símbolo, dá contorno a ele e liga signo, mito e vida.

Antes de escrever, leia como referência de voz e profundidade: /home/claude/eusouodu-site/scripts/jornada/aries.json e /home/claude/eusouodu-site/lib/jornada/escorpiao.json (a jornada 1, já pronta e aprovada).

## Regras obrigatórias
- Português do Brasil. Endereçamento coletivo com "a gente". NUNCA "você", "seu", "sua", "tu", "ti", "te". Para falar do mapa de quem joga: "neste mapa", "o Sol deste mapa", "quem tem a Lua em Câncer", "a gente". Instruções curtas no imperativo ("Ligue", "Escolha", "Coloque") estão ok.
- Também não use "seu/sua" como endereçamento direto à leitora ("o seu Sol", "sua Lua"). Para a terceira pessoa ("Zeus e seu trono") está ok.
- Frases curtas, de ritmo quebrado, alternando com frases mais longas e reflexivas.
- Explicar a simbologia e dar contorno ao símbolo. Nada enigmático, nenhuma imagem solta sem desdobramento.
- Sem linguagem motivacional, sem coaching, sem fechamentos redondos, sem promessas ("vai dar tudo certo"). Finais podem ficar abertos.
- Nada de determinismo nem medo: trânsito difícil é travessia, não condenação.
- PROIBIDO travessão (—) e meia-risca (–). Use ponto, vírgula ou dois-pontos.
- Jung, filosofia e mitologia entram como textura, nunca como citação acadêmica ("segundo Jung...", não).
- "repare" pode aparecer, mas raramente (no máximo uma vez a cada 6 textos).
- NUNCA usar: "fica com essa frase", "fica nisso", frases começando com "Existe...", "a pergunta é...", "o detalhe que ninguém conta" ou variações, abertura de fábula ("Tem um homem que...", "Era uma vez"), frases que anunciam o que vem ("agora a gente vai ver...", "vamos entender..."), "jornada de autoconhecimento", "universo conspira", "energia" solta (diga "energia astrológica" quando for o caso), "céu da semana".
- Não usar a palavra "mito" (nem "mitos"): usar "mitologia" (ex.: "astrologia, mitologia e filosofia", "a mitologia de Perséfone").
- Vênus é SEMPRE masculino: "o Vênus", "do Vênus", "ao Vênus", "regido pelo Vênus", "Vênus retrógrado". Nunca "a Vênus", "da Vênus", "Vênus retrógrada".
- Retrógrado NUNCA é "andar para trás", "volta", "recua": é movimento aparente, uma ilusão de ótica vista da Terra. Não escreva "para trás".
- Não use "psicologia profunda".
- Viradas: em cada bloco maior, pelo menos um momento em que o simbolismo se abre de repente e a leitora pensa "uau", ligando mito, símbolo e vida. A virada nunca é anunciada.
- Perguntas de reflexão ("q") são abertas, concretas, curtas, no coletivo ("O que a gente..."), e não podem soar como coaching.

## Exatidão
Astrologia tropical. Casas em signos inteiros (cada signo, a partir do signo do Ascendente, é uma casa). Dignidades tradicionais corretas. Regentes modernos e tradicionais: Escorpião (Plutão, tradicional Marte), Aquário (Urano, tradicional Saturno), Peixes (Netuno, tradicional Júpiter). Mitos fiéis às fontes gregas e romanas, nomes em português. Ciclos: Lua ~27,3 dias pelo zodíaco e 29,5 dias de fase; Mercúrio ~1 ano, retrógrado ~3 vezes por ano por ~3 semanas; Vênus ~1 ano, retrógrado a cada ~19 meses por ~40 dias, ciclo de 8 anos (pentagrama); Marte ~2 anos, retrógrado a cada ~26 meses; Júpiter ~12 anos (~1 ano por signo); Saturno ~29,5 anos (~2,5 anos por signo); Urano ~84 anos (~7 por signo); Netuno ~165 anos (~14 por signo); Plutão ~248 anos (de 12 a 30 por signo); nodos lunares ~18,6 anos, movem em sentido contrário aos signos, ~1,5 ano por eixo. Se tiver dúvida sobre um fato, escolha outro fato do qual tenha certeza.

## Formato
JSON válido, UTF-8, sem comentários. Os textos usam no máximo uns 320 caracteres por parágrafo. Todos os textos devem ser escritos para funcionar sozinhos dentro de uma lição de app, lidos no celular.

## Validação (rode antes de entregar)
python3 /home/claude/eusouodu-site/scripts/jornada/checar_voz.py <arquivo.json>
Corrija tudo o que ele apontar e rode de novo até sair "ok".
