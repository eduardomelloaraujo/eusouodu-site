# Gera a marca final do orbe (versão clara). Uso: python3 gerar.py <pasta de saída>
import math, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
AMBAR, NOITE, BRANCO = '#9C7A44', '#252421', '#FFFFFF'

fonte = TTFont('/home/user/eusouodu-site/lib/fontes/cormorant-garamond-latin-500-italic.woff2')
cmap, gs, upm, hmtx = fonte.getBestCmap(), fonte.getGlyphSet(), fonte['head'].unitsPerEm, fonte['hmtx']


def texto(s, size, track=0):
    pen, x, k = SVGPathPen(gs), 0, size / upm
    for ch in s:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))
        x += hmtx[g][0] * k + track
    return pen.getCommands(), x - track


def simbolo(cor, fundo, traco=22, planeta=70, centro=38):
    # o centro é você (o ponto natal), o anel é o céu, o disco é o trânsito de hoje
    a = math.radians(-40)
    px, py = 512 + 300 * math.cos(a), 512 + 300 * math.sin(a)
    return (f'<circle cx="512" cy="512" r="300" fill="none" stroke="{cor}" stroke-width="{traco}"/>'
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{planeta + traco}" fill="{fundo}"/>'
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{planeta}" fill="{cor}"/>'
            f'<circle cx="512" cy="512" r="{centro}" fill="{cor}"/>')


def svg(w, h, corpo, fundo=None, vb=None):
    bg = f'<rect width="{w}" height="{h}" fill="{fundo}"/>' if fundo else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {w} {h}"}" width="{w}" height="{h}">{bg}{corpo}</svg>'


def grava(nome, conteudo):
    open(f'{OUT}/{nome}', 'w').write(conteudo)


# ícone do app: 1024, fundo branco sólido (a App Store não aceita transparência)
grava('orbe-icone.svg', svg(1024, 1024, simbolo(AMBAR, BRANCO), BRANCO))
# versão para tamanhos pequenos: traço e pontos mais grossos, recorte mais justo
grava('orbe-icone-pequeno.svg', svg(1024, 1024, f'<g transform="translate(512 512) scale(1.25) translate(-512 -512)">{simbolo(AMBAR, BRANCO, 56, 92, 64)}</g>', BRANCO))
# símbolo solto, sem fundo
grava('orbe-simbolo.svg', svg(1024, 1024, simbolo(AMBAR, BRANCO), vb='170 170 684 684'))

# assinatura horizontal: símbolo + nome
d, larg = texto('orbe', 300, 4)
W, H = round(280 + 60 + larg + 50), 380
corpo = (f'<g transform="translate(20 50) scale(0.273)">{simbolo(AMBAR, BRANCO)}</g>'
         f'<path transform="translate(340 275)" d="{d}" fill="{NOITE}"/>')
grava('orbe-assinatura.svg', svg(W, H, corpo, BRANCO))
grava('orbe-assinatura-transparente.svg', svg(W, H, corpo))

# imagem de compartilhamento 1200x630
d2, l2 = texto('orbe', 200, 3)
sub, ls = texto('o céu de hoje no seu mapa', 46, 1)
x0 = (1200 - (190 + 40 + l2)) / 2
corpo = (f'<g transform="translate({x0:.0f} 165) scale(0.19)">{simbolo(AMBAR, BRANCO)}</g>'
         f'<path transform="translate({x0 + 230:.0f} 330)" d="{d2}" fill="{NOITE}"/>'
         f'<path transform="translate({(1200 - ls) / 2:.0f} 470)" d="{sub}" fill="{AMBAR}"/>')
grava('orbe-social.svg', svg(1200, 630, corpo, BRANCO))
print('ok')
