import json
import numpy as np
from PIL import Image
g=json.load(open('grid.json'))
g['5']['cx'][4]=844  # the shuriken-only column; keeps the throw frame's shurikens inside its own cell
names={'2':'walk','3':'auto','4':'q','5':'rmb','6':'e'}
meta={}
for n,name in names.items():
    im=Image.open(f'../images/{n}.webp').convert('RGBA');A=np.array(im)
    H,W=A.shape[:2];ry=g[n]['ry'];cx=g[n]['cx']
    by=[max(0,ry[0]-(ry[1]-ry[0])//2)]+[(ry[i]+ry[i+1])//2 for i in range(7)]+[min(H,ry[7]+(ry[7]-ry[6])//2+8)]
    bx=[max(0,cx[0]-(cx[1]-cx[0])//2)]+[(cx[i]+cx[i+1])//2 for i in range(5)]+[min(W,cx[5]+(cx[5]-cx[4])//2)]
    frames=[];heights=[]
    for r in range(8):
        for c in range(6):
            x0,x1,y0,y1=bx[c],bx[c+1],by[r],by[r+1]
            sub=A[y0:y1,x0:x1].copy();a=sub[:,:,3].astype(int)
            dark=(a>170)&(sub[:,:,:3].max(axis=2)<70)
            ys,xs=np.nonzero(dark)
            if len(ys)<400:frames.append(None);continue
            top,bot=np.percentile(ys,1),np.percentile(ys,99.5)
            band=(ys>top+(bot-top)*0.3)&(ys<top+(bot-top)*0.75)
            ax=xs[band].mean() if band.sum()>50 else xs.mean()
            if c==0:heights.append(bot-top)
            # soften hard cuts where long effects cross the cell edge
            w=sub.shape[1];ramp=np.ones(w)
            f=10;ramp[:f]=np.linspace(0,1,f);ramp[-f:]=np.linspace(1,0,f)
            sub[:,:,3]=(a*ramp[None,:]).astype(np.uint8)
            frames.append((sub,ax,bot))
    L=R=U=D=0
    for fr in frames:
        if fr is None:continue
        sub,ax,bot=fr;L=max(L,ax);R=max(R,sub.shape[1]-ax);U=max(U,bot);D=max(D,sub.shape[0]-bot)
    CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
    atlas=Image.new('RGBA',(CW*6,CH*8),(0,0,0,0));present=[]
    for i,fr in enumerate(frames):
        r,c=divmod(i,6)
        if fr is None:present.append(0);continue
        present.append(1);sub,ax,bot=fr
        atlas.alpha_composite(Image.fromarray(sub),(int(c*CW+AX-round(ax)),int(r*CH+AY-round(bot))))
    atlas.save(f'/home/user/riftline/assets/shade_{name}.webp',quality=88,method=6)
    hm=float(np.median(heights));meta[name]=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=round(hm,1))
    print(name,'cell',CW,CH,'anchor',AX,AY,'body h',round(hm,1),'frames',sum(present))
    bg=Image.new('RGBA',atlas.size,(120,140,130,255));bg.alpha_composite(atlas);bg.convert('RGB').save(f'atlas_{name}.jpg',quality=80)
json.dump(meta,open('atlas_meta.json','w'));print(json.dumps(meta))
