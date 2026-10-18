# Junta os textos das jornadas 2 e 3 (scripts/jornada/conteudo) nos arquivos pagos que a API serve.
import json, glob, os
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = os.path.abspath(HERE + '../../lib/jornada') + '/'
mapa = {}
for f in sorted(glob.glob(HERE + 'conteudo/j2-*.json')):
    d = json.load(open(f, encoding='utf-8'))
    dup = set(mapa) & set(d)
    assert not dup, f'chave repetida {dup} em {f}'
    mapa.update(d)
need = ['sol', 'lua', 'merc', 'venus', 'marte', 'jupiter', 'saturno', 'ciclos', 'par', 'lentos', 'casas', 'aspectos', 'nodos', 'sintese']
falta = [k for k in need if k not in mapa]
assert not falta, f'faltam na jornada 2: {falta}'
tr = json.load(open(HERE + 'conteudo/j3-transitos.json', encoding='utf-8'))
need3 = ['lua', 'mercurio', 'venus', 'marte', 'jupiter', 'saturno', 'lentos', 'eclipses', 'revolucao', 'transitos', 'ano']
falta = [k for k in need3 if k not in tr]
assert not falta, f'faltam na jornada 3: {falta}'
json.dump(mapa, open(OUT + 'mapa.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(tr, open(OUT + 'transitos.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', os.path.getsize(OUT + 'mapa.json'), os.path.getsize(OUT + 'transitos.json'))
