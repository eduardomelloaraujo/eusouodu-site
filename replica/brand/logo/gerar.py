import math, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONTES = '/home/user/eusouodu-site/lib/fontes'
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

AMBAR, AMBAR_CLARO = '#9C7A44', '#C9A56A'
NOITE, NOITE_TEXTO, AREIA = '#252421', '#F2EFE2', '#F6F5F1'

fonte = TTFont(f'{FONTES}/cormorant-garamond-latin-500-italic.woff2')
cmap, gs, upm = fonte.getBestCmap(), fonte.getGlyphSet(), fonte['head'].unitsPerEm
hmtx = fonte['hmtx']


def texto(s, size, track=0):
    """Texto -> (path d, largura) com a linha de base em y=0."""
    pen = SVGPathPen(gs)
    x, k = 0, size / upm
    for ch in s:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))
        x += hmtx[g][0] * k + track
    return pen.getCommands(), x - track


# --- símbolos, desenhados numa caixa de 1024 -------------------------------

def simbolo_orbe(cor, fundo):
    # o centro é você (o ponto natal), o anel é o céu, o disco é o trânsito de hoje
    a = math.radians(-40)
    px, py = 512 + 300 * math.cos(a), 512 + 300 * math.sin(a)
    return (f'<circle cx="512" cy="512" r="300" fill="none" stroke="{cor}" stroke-width="22"/>'
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="92" fill="{fundo}"/>'
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="70" fill="{cor}"/>'
            f'<circle cx="512" cy="512" r="38" fill="{cor}"/>')


def simbolo_hoje(cor, fundo):
    # a Lua do dia: metade acesa, contorno fino (o "o" de hoje)
    return (f'<circle cx="512" cy="512" r="330" fill="none" stroke="{cor}" stroke-width="22"/>'
            f'<path d="M512 182 A330 330 0 0 1 512 842 A170 330 0 0 0 512 182 Z" fill="{cor}"/>')


def simbolo_mare(cor, fundo):
    # crescente sobre duas ondas: a Lua que move a energia do dia
    lua = (f'<path d="M560 170 A200 200 0 1 0 560 530 A160 160 0 1 1 560 170 Z" fill="{cor}"/>')
    onda = lambda y: (f'<path d="M222 {y} C 318 {y-70}, 414 {y-70}, 512 {y} S 706 {y+70}, 802 {y}" '
                      f'fill="none" stroke="{cor}" stroke-width="26" stroke-linecap="round"/>')
    return lua + onda(680) + onda(800)


CONCEITOS = {
    'orbe': simbolo_orbe,
    'hoje': simbolo_hoje,
    'mare': simbolo_mare,
}
NOMES = {'orbe': 'orbe', 'hoje': 'hoje', 'mare': 'maré'}


def svg(w, h, corpo, fundo=None, rx=0):
    bg = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{fundo}"/>' if fundo else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{bg}{corpo}</svg>'


for chave, simbolo in CONCEITOS.items():
    # ícone do app: 1024, sem transparência, sem cantos (a loja arredonda)
    open(f'{OUT}/{chave}-icone.svg', 'w').write(svg(1024, 1024, simbolo(AMBAR_CLARO, NOITE), NOITE))
    # símbolo solto, para favicon e usos pequenos
    open(f'{OUT}/{chave}-simbolo.svg', 'w').write(svg(1024, 1024, simbolo(AMBAR, '#FFFFFF')))
    # assinatura horizontal: símbolo + nome
    d, larg = texto(NOMES[chave], 300, 4)
    W, H = 280 + 60 + larg + 50, 380
    for tema, (cor_s, cor_t, fundo) in {'claro': (AMBAR, NOITE, AREIA), 'escuro': (AMBAR_CLARO, NOITE_TEXTO, NOITE)}.items():
        corpo = (f'<g transform="translate(20 50) scale(0.273)">{simbolo(cor_s, fundo)}</g>'
                 f'<path transform="translate(340 275)" d="{d}" fill="{cor_t}"/>')
        open(f'{OUT}/{chave}-assinatura-{tema}.svg', 'w').write(svg(round(W), H, corpo, fundo))
print('ok')
