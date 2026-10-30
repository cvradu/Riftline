# Thistle: an 8x8 walk sheet (source-art/67.png) and a 2x4 standing sheet (source-art/68.png), both with rows/cells in the order
# S, SE, E, NE, N, NW, W, SW. Packed into one sheet in the game's S,SW,W,NW,N,NE,E,SE row order: column 0 standing, 1-8 walking.
# Run from tools/: python3 atlas_thistle.py
import json
import numpy as np
from PIL import Image
from scipy import ndimage
OUT='../assets/thistle.webp';SRC_ORDER=['S','SE','E','NE','N','NW','W','SW'];ORDER=['S','SW','W','NW','N','NE','E','SE']
TARGET_H=190  # body height in sheet pixels
def clean(sub):
    a=sub[...,3].astype(float);rgb=sub[...,:3].astype(int);r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
    solid=a>110
    # the background cut left a red/yellow halo: saturated pixels within 3px of the outside
    outside=~ndimage.binary_fill_holes(solid);near=ndimage.binary_dilation(outside,iterations=3)
    halo=near&(((r>170)&(g<110)&(b<110))|((r>190)&(g>170)&(b<90)))
    keep=solid&~halo
    lab,n=ndimage.label(keep)
    if n>1:  # drop stray specks, keep the figure
        sz=ndimage.sum(keep,lab,range(1,n+1));big=np.argmax(sz)+1;keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>sz.max()*0.02])
    out=sub.copy();out[...,3]=np.where(keep,np.clip((a-110)*255/90,0,255),0).astype(np.uint8);return out
def cells(path,nr,nc):
    A=np.array(Image.open(path).convert('RGBA'));H,W=A.shape[:2];ch,cw=H//nr,W//nc
    return [[clean(A[r*ch:(r+1)*ch,c*cw:(c+1)*cw]) for c in range(nc)] for r in range(nr)]
def bbox(a):ys,xs=np.nonzero(a[...,3]>128);return ys.min(),ys.max(),xs
walk=cells('../source-art/67.png',8,8);st=cells('../source-art/68.png',2,4);stand=[st[i//4][i%4] for i in range(8)]
def scale_to(a,k):im=Image.fromarray(a);return np.array(im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS))
hw=np.median([bbox(c)[1]-bbox(c)[0] for c in walk[0]]);hs=bbox(stand[0])[1]-bbox(stand[0])[0]
fr={}
for si,d in enumerate(SRC_ORDER):
    for c in range(9):
        a=scale_to(stand[si],TARGET_H/hs) if c==0 else scale_to(walk[si][c-1],TARGET_H/hw)
        ys,xs=np.nonzero(a[...,3]>128);bot=ys.max();top=ys.min();low=ys>top+(bot-top)*0.75;ax=float(np.median(xs[low]))
        fr[(d,c)]=(a,ax,bot)
L=max(v[1] for v in fr.values());R=max(v[0].shape[1]-v[1] for v in fr.values());U=max(v[2] for v in fr.values());D=max(v[0].shape[0]-v[2] for v in fr.values())
CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
S=Image.new('RGBA',(CW*9,CH*8),(0,0,0,0))
for gi,d in enumerate(ORDER):
    for c in range(9):a,ax,bot=fr[(d,c)];S.alpha_composite(Image.fromarray(a),(c*CW+int(round(AX-ax)),gi*CH+int(round(AY-bot))))
S.save(OUT,quality=88,method=6)
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=TARGET_H);json.dump(meta,open('thistle/meta.json','w'));print(json.dumps(meta))
bg=Image.new('RGBA',S.size,(70,76,82,255));bg.alpha_composite(S);k=1800/bg.width;bg.convert('RGB').resize((int(bg.width*k),int(bg.height*k))).save('thistle/prev.jpg',quality=85)
