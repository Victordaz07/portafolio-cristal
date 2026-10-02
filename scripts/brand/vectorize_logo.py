# Vectoriza el logo de Foliocrew (public/brand/original/logo-plano.webp, hecho con ChatGPT)
# y genera public/brand/{logo,logo-claro,isotipo,icono-app}.svg separando los 3 colores.
# Uso: pip install pillow numpy potracer && python3 scripts/brand/vectorize_logo.py
import numpy as np, potrace, sys
from PIL import Image
import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')
im=np.array(Image.open(os.path.join(ROOT,'public/brand/original/logo-plano.webp')).convert('RGBA')).astype(int)
INK=(37,16,35); PURPLE=(127,32,123); LAV=(182,146,231)
cols={'ink':INK,'purple':PURPLE,'lav':LAV}
rgb=im[:,:,:3]; a=im[:,:,3]
d={k:((rgb-np.array(v))**2).sum(-1) for k,v in cols.items()}
keys=list(cols); stack=np.stack([d[k] for k in keys]); near=stack.argmin(0)
def path_of(mask):
    bm=potrace.Bitmap(~mask)  # potracer traza los píxeles en False
    plist=bm.trace(turdsize=8, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.2)
    out=[]
    for curve in plist:
        sp=curve.start_point; s=f'M{sp.x:.1f} {sp.y:.1f}'
        for seg in curve.segments:
            if seg.is_corner: s+=f'L{seg.c.x:.1f} {seg.c.y:.1f}L{seg.end_point.x:.1f} {seg.end_point.y:.1f}'
            else: s+=f'C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} {seg.end_point.x:.1f} {seg.end_point.y:.1f}'
        out.append(s+'Z')
    return ''.join(out)
paths={k:path_of((a>127)&(near==i)) for i,k in enumerate(keys)}
p=paths
OUT=os.path.join(ROOT,'public','brand')
INK='#251023'; PURPLE='#7F207B'; LAV='#B692E7'; CREAM='#FBF7F5'; LAV_ICON='#BCA3EA'
def svg(vb,body,w=None,h=None):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Foliocrew"><title>Foliocrew</title>{body}</svg>\n'
iso=lambda a,b: f'<path fill-rule="evenodd" fill="{a}" d="{p["purple"]}"/><path fill-rule="evenodd" fill="{b}" d="{p["lav"]}"/>'
# logos horizontales (margen 20 px)
vb='70 111 1880 459'
open(f'{OUT}/logo.svg','w').write(svg(vb, iso(PURPLE,LAV)+f'<path fill-rule="evenodd" fill="{INK}" d="{p["ink"]}"/>'))
open(f'{OUT}/logo-claro.svg','w').write(svg(vb, iso(PURPLE,LAV)+f'<path fill-rule="evenodd" fill="{CREAM}" d="{p["ink"]}"/>'))
# isotipo sin fondo (cuadrado): x 90-494, y 131-550 → centro (292,340.5), lado 460
open(f'{OUT}/isotipo.svg','w').write(svg('62 110.5 460 460', iso(PURPLE,LAV)))
# ícono de app: fondo tinta, pieza crema + lavanda (como la imagen 3)
side=640; cx,cy=292,340.5; x0=cx-side/2; y0=cy-side/2
bg=lambda r: f'<rect x="{x0}" y="{y0}" width="{side}" height="{side}" rx="{r}" fill="{INK}"/>'
open(f'{OUT}/icono-app.svg','w').write(svg(f'{x0} {y0} {side} {side}', bg(144)+iso(CREAM,LAV_ICON)))
open(os.path.join(OUT,'..','..','scripts','brand','icono-cuadrado.svg'),'w').write(svg(f'{x0} {y0} {side} {side}', bg(0)+iso(CREAM,LAV_ICON)))
