# Genera public/brand/{logo,logo-claro,isotipo}.svg con el texto convertido a trazos.
# Uso: pip install fonttools && python3 scripts/brand/make_logo.py
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os
# Necesita fraunces.ttf (Fraunces Italic 700) y spacemono.ttf (Space Mono 700) junto a este archivo.
S=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(S,'..','..','public','brand')
INK='#241227'; CREAM='#FBF7F5'; LILA='#A866BE'; MORADO='#801F82'; LAVANDA='#C3ACEA'

def text_path(fontfile, text, size, x, y, tracking=0):
    f=TTFont(fontfile); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
    s=size/upm; pen=SVGPathPen(gs); cx=0
    for ch in text:
        g=cmap[ord(ch)]
        tp=TransformPen(pen,(s,0,0,-s,x+cx,y)); gs[g].draw(tp)
        cx+=gs[g].width*s+tracking
    return pen.getCommands(), cx

def isotipo(x=0,y=0,size=96,bg=INK,awning=LILA,play=CREAM,stripe=LAVANDA):
    # Vitrina: cuadro redondeado + toldo festoneado (3 ondas) + play
    k=size/96
    def P(v): return v*k
    g=[f'<g transform="translate({x} {y})">']
    g.append(f'<rect width="{P(96)}" height="{P(96)}" rx="{P(24)}" fill="{bg}"/>')
    # toldo: franja superior con borde de 3 festones
    w=P(64); left=P(16); top=P(18); h=P(14); r=w/6
    d=f'M{left} {top+P(4)} Q{left} {top} {left+P(4)} {top} H{left+w-P(4)} Q{left+w} {top} {left+w} {top+P(4)} V{top+h}'
    for i in range(3):
        cx=left+w-(2*i+1)*r
        d+=f' A{r} {r} 0 0 1 {cx-r} {top+h}'
    d+=' Z'
    g.append(f'<path d="{d}" fill="{awning}"/>')
    # rayas del toldo (alternadas)
    g.append(f'<path d="M{left+w/3} {top} h{w/3} v{h} a{r} {r} 0 0 1 {-w/3} 0 Z" fill="{stripe}"/>')
    # play
    px=P(40); py=P(49); ph=P(28)
    g.append(f'<path d="M{px} {py} L{px+ph*0.9} {py+ph/2} L{px} {py+ph} Z" fill="{play}" stroke="{play}" stroke-width="{P(5)}" stroke-linejoin="round"/>')
    g.append('</g>')
    return '\n'.join(g)

def svg(w,h,body,title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}"><title>{title}</title>\n{body}\n</svg>\n'

def wordmark(x, base, ink, pill, pilltext):
    d1,w1=text_path(f'{S}/fraunces.ttf','vitrina',64,x,base)
    px=x+w1+14
    d2,w2=text_path(f'{S}/spacemono.ttf','UGC',30,px+16,base-6,tracking=2)
    pw=w2+30
    body=f'<path d="{d1}" fill="{ink}"/>\n<rect x="{px}" y="{base-38}" width="{pw:.1f}" height="44" rx="22" fill="{pill}"/>\n<path d="{d2}" fill="{pilltext}"/>'
    return body, px+pw-x

# Isotipo
open(f'{OUT}/isotipo.svg','w').write(svg(96,96,isotipo(),'Vitrina UGC'))
# Logo horizontal claro y oscuro
for name,ink,pill,pilltext,bg,aw in [('logo',INK,LILA,'#FFFFFF',INK,LILA),('logo-claro',CREAM,LAVANDA,INK,CREAM,LILA)]:
    iso=isotipo(0,0,96,bg=bg,awning=aw,play=(CREAM if bg==INK else INK),stripe=(LAVANDA if bg==INK else MORADO))
    wm,ww=wordmark(118,70,ink,pill,pilltext)
    open(f'{OUT}/{name}.svg','w').write(svg(118+ww+4,96,iso+'\n'+wm,'Vitrina UGC'))
print('ok')
