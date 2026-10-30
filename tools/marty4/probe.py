import numpy as np,sys
from PIL import Image
sys.path.insert(0,'marty4')
from comps import label
def shift(x,dy,dx):
    H,W=x.shape;y=np.zeros_like(x);y[max(dy,0):H+min(dy,0),max(dx,0):W+min(dx,0)]=x[max(-dy,0):H+min(-dy,0),max(-dx,0):W+min(-dx,0)];return y
def dil(x,k):
    o=x.copy()
    for dy in range(-k,k+1):
        for dx in range(-k,k+1):
            if dy*dy+dx*dx<=k*k:o|=shift(x,dy,dx)
    return o
ero=lambda x,k:~dil(~x,k)
for sh,i in [(37,2),(38,15),(40,0),(40,1),(42,15)]:
    A=np.array(Image.open(f'../images/{sh}.webp').convert('RGBA'));H,W=A.shape[:2];ch,cw=H//4,W//4;r,c=i//4,i%4
    cell=A[r*ch:(r+1)*ch,c*cw:(c+1)*cw];m=cell[...,3]>30
    lab0,info0=label(m);mx=max(info0,key=lambda q:q['n']);top,bot=mx['y0'],mx['y1'];hh=bot-top
    print((sh,i),'comps',[(q['n'],int(q['cx']),int(q['cy'])) for q in info0 if q['n']>15],'body y',top,bot)
    for R in (4,6,8,10):
        res=m&~dil(ero(m,R),R+1);l,inf=label(res)
        big=[(q['n'],max(q['x1']-q['x0'],q['y1']-q['y0']),int(q['cx']),int(q['cy'])) for q in inf if q['n']>=60 and q['cy']>top+0.4*hh]
        print('  R',R,sorted(big,reverse=True)[:6])
