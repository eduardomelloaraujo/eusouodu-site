#!/usr/bin/env python3
"""Confere as regras de voz do Eduardo num arquivo JSON de conteúdo da Jornada."""
import json, re, sys

REGRAS = [
    (r'—|–', 'travessão ou meia-risca'),
    (r'\b[Vv]ocê(s)?\b', '"você"'),
    (r'\b(tu|ti|contigo)\b', '"tu/ti"'),
    (r'(^|[.!?]\s+)Existe\b', 'frase começando com "Existe"'),
    (r'\ba pergunta é\b', '"a pergunta é"'),
    (r'para trás', '"para trás"'),
    (r'céu da semana', '"céu da semana"'),
    (r'\b(a|da|na|pela) Vênus\b', 'Vênus no feminino'),
    (r'Vênus retrógrada', 'Vênus no feminino'),
    (r'psicologia profunda', '"psicologia profunda"'),
    (r'fica (com essa frase|nisso)', 'vício "fica com essa frase/fica nisso"'),
    (r'ninguém (conta|lembra|fala)', 'fórmula "o detalhe que ninguém conta"'),
    (r'quase ninguém', 'fórmula "quase ninguém"'),
    (r'\bEra uma vez\b|\bTem um (homem|menino|rei)\b', 'abertura de fábula'),
    (r'\b(vamos (entender|ver)|agora a gente vai)\b', 'frase que anuncia o que vem'),
    (r'universo conspira|autoconhecimento', 'clichê'),
]

def textos(x, caminho=''):
    if isinstance(x, str):
        yield caminho, x
    elif isinstance(x, dict):
        for k, v in x.items():
            yield from textos(v, f'{caminho}.{k}')
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from textos(v, f'{caminho}[{i}]')

def main(arq):
    d = json.load(open(arq, encoding='utf-8'))
    probs = []
    repare = 0
    for c, t in textos(d):
        t = t.replace('Conhece-te a ti mesmo', '')
        for pat, nome in REGRAS:
            if re.search(pat, t):
                probs.append(f'{c}: {nome}: {t[:120]}')
        repare += len(re.findall(r'\b[Rr]epare\b', t))
    n = sum(1 for _ in textos(d))
    if repare > max(2, n // 25):
        probs.append(f'"repare" aparece {repare} vezes: reduza')
    if probs:
        print('\n'.join(probs)); print(f'{len(probs)} problema(s)'); sys.exit(1)
    print('ok', n, 'textos')

if __name__ == '__main__':
    main(sys.argv[1])
