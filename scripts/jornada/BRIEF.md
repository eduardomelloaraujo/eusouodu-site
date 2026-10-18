# Briefing: subjornada de signo do app "Jornada" (@eusouodu)

Você vai escrever UMA subjornada (unidade) de um app tipo Duolingo de astrologia, mitologia e filosofia, para o astrólogo e terapeuta Eduardo (@eusouodu, mais de 10 anos de astrologia, público majoritariamente feminino e jovem, Brasil). O conteúdo precisa ser rico, simbólico, exato e prender como história.

## Molde obrigatório
Leia /home/claude/jornada/units/aries.json. Ele é o molde: mesma estrutura JSON, mesmo nível de profundidade, mesma voz. Sua unidade tem exatamente 5 lições, nesta ordem:
1. kind "Signo": o signo (posição na roda, estação/data de entrada do Sol, elemento, qualidade/modalidade, regente, parte do corpo, eixo/signo oposto). light: "sign:<índice>". card: null.
2. kind "Mito": o mito principal da constelação/signo. light: null. card: {"kind":"Mito","title":...,"text": 2 a 3 frases}.
3. kind "Planeta": o planeta regente (glifo, dignidades: domicílio, exaltação, exílio, queda; ciclo/tempo de volta no zodíaco; retrogradação quando fizer sentido). light: "planet:<chave>". card: null.
4. kind "Mito": o mito do deus/deusa do planeta regente, ligado de volta ao signo. light: null. card {"kind":"Mito",...}.
5. kind "Filosofia": um filósofo ou ideia filosófica que abre o signo (não precisa ser grego). light: null. card {"kind":"Filosofia",...}. O doneText da lição 5 fecha a subjornada e passa a mão para o próximo signo.

Cada lição: 5 a 7 steps, terminando SEMPRE com um step "reflect". Use variedade de tipos: teach, choice, match, order, multi, reflect (pelo menos um match ou order por lição quando couber). Em choice, a resposta certa é SEMPRE a primeira opção ("a":0); o app embaralha. Em multi, "correct" lista os índices certos. "big": true só quando as opções forem glifos. Em order, "items" já na ordem certa. Ids: "<slug>-1" a "<slug>-5". glyph de lição/teach: um caractere ou símbolo curto (glifos astrológicos ♈♉♊♋♌♍♎♏♐♑♒♓ ☉☽☿♀♂♃♄♅♆♇, ou símbolos simples como ✦ △ ▽ ◯ ⚔ ⚖ ☾ ∞). Não use emoji.

Chaves de planeta para "light": sol, lua, merc, venus, marte, jupiter, saturno, urano, netuno, plutao. Índices dos signos: Áries 0, Touro 1, Gêmeos 2, Câncer 3, Leão 4, Virgem 5, Libra 6, Escorpião 7, Sagitário 8, Capricórnio 9, Aquário 10, Peixes 11.

Cada lição precisa de pelo menos uma VIRADA: um teach em que o simbolismo se abre de repente e a leitora pensa "uau", ligando mito, signo e vida. A virada nunca é anunciada (nada de "agora vem a virada", não use "Virada" como eyebrow). A explicação de cada choice abre o símbolo, não só confirma o fato.

## Voz (regras do Eduardo, todas obrigatórias)
- Português do Brasil. Endereçamento coletivo com "a gente". Não use "você" nem "tu/ti". Instruções de exercício no imperativo curto ("Ligue", "Escolha", "Coloque") estão ok.
- Frases curtas, de ritmo quebrado, alternando com frases mais longas e reflexivas.
- Explicar a simbologia e dar contorno ao símbolo. Nada enigmático, nenhuma imagem solta sem desdobramento.
- Sem linguagem motivacional, sem coaching, sem fechamentos redondos. Finais podem ficar abertos.
- PROIBIDO travessão (—) e meia-risca (–). Use ponto, vírgula ou dois-pontos.
- Jung, filosofia e mitologia entram como textura, nunca como citação acadêmica.
- Pode usar "repare" para chamar atenção a um símbolo, no máximo uma vez por lição.
- Nunca: "fica com essa frase", "fica nisso", frases começando com "Existe...", "a pergunta é...", "o detalhe que ninguém conta" e variações, abertura de fábula ("Tem um homem que...", "Era uma vez"), frases que anunciam o que vem ("agora a gente vai ver...").
- Diga "energia astrológica", nunca "céu da semana".
- Vênus é SEMPRE masculino: "o Vênus", "regido pelo Vênus", "Vênus retrógrado".
- Retrógrado nunca é "andar para trás": é ilusão de ótica vista da Terra. Não escreva "para trás".
- Não use "psicologia profunda".

## Exatidão
Astrologia tropical. Dignidades tradicionais corretas; quando houver regente moderno e tradicional (Escorpião: Plutão e Marte; Aquário: Urano e Saturno; Peixes: Netuno e Júpiter), a lição 3 trata o moderno e menciona o tradicional. Mitos fiéis às fontes gregas e romanas (nomes em português). Datas e números de órbita corretos. Se tiver dúvida sobre um fato, escolha outro fato do qual tenha certeza. Opções erradas devem ser plausíveis, mas claramente erradas para quem estudou.

## Entrega
Escreva o arquivo /home/claude/jornada/units/<slug>.json com a mesma forma de aries.json (campos sign, slug, name, subtitle curto em minúsculas tipo "a matéria", element, blurb de uma frase, lessons). Depois valide:
python3 -c "import json;d=json.load(open('/home/claude/jornada/units/<slug>.json'));s=open('/home/claude/jornada/units/<slug>.json').read();assert len(d['lessons'])==5;assert '—' not in s and '–' not in s;print('ok')"
e procure no texto por: você, Existe, a pergunta é, para trás, céu da semana, "a Vênus", "da Vênus". Corrija o que aparecer. Responda só com "pronto: <slug>" e os títulos das 5 lições.
