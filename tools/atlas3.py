import json
import numpy as np
from PIL import Image
g=json.load(open('grid.json'));g['5']['cx'][4]=844
names={'2':'walk','3':'auto','4':'q','5':'rmb','6':'e'}
def smooth(v,k):return np.convolve(v,np.ones(k)/k,mode='same')
meta={};report={}
for n,name in names.items():
    A=np.array(Image.open(f'../images/{n}.webp').convert('RGBA'));H,W=A.shape[:2]
    al=A[:,:,3].astype(float)/255;dark=(A[:,:,3]>170)&(A[:,:,:3].max(axis=2)<75)
    ry=g[n]['ry'];cx=g[n]['cx'];spy=(ry[-1]-ry[0])/7;spx=(cx[-1]-cx[0])/5
    frames={}
    for c in range(6):
        xc=cx[c];band=slice(max(0,xc-int(spx*0.13)),min(W,xc+int(spx*0.13)))
        prof=smooth(al[:,band].sum(axis=1),5)
        # vertical cuts: emptiest line between neighbouring row centres, inside this column's central strip
        cuts=[]
        for r in range(7):
            lo,hi=int(ry[r]+spy*0.25),int(ry[r+1]-spy*0.15)
            cuts.append(lo+int(np.argmin(prof[lo:hi])))
        cuts=[max(0,int(ry[0]-spy*0.75))]+cuts+[min(H,int(ry[7]+spy*0.75))]
        for r in range(8):
            y0,y1=cuts[r],cuts[r+1]
            # horizontal cuts: emptiest column between neighbouring column centres within this row's span
            xp=smooth(al[y0:y1].sum(axis=0),5)
            if c>0:lo,hi=int(cx[c-1]+spx*0.3),int(xc-spx*0.2);x0=lo+int(np.argmin(xp[lo:hi]))
            else:x0=max(0,int(xc-spx*0.75))
            if c<5:lo,hi=int(xc+spx*0.2),int(cx[c+1]-spx*0.3);x1=lo+int(np.argmin(xp[lo:hi]))
            else:x1=min(W,int(xc+spx*0.75))
            sub=A[y0:y1,x0:x1].copy();d=dark[y0:y1,x0:x1]
            if d.sum()<400:continue
            ys,xs=np.nonzero(d)
            top=np.percentile(ys,0.5)
            mid=xs.mean()
            cb=np.abs(xs-mid)<spx*0.16
            bot=np.percentile(ys[cb],99.6) if cb.sum()>50 else np.percentile(ys,99.6)
            tb=(ys>top+(bot-top)*0.3)&(ys<top+(bot-top)*0.75)
            ax=xs[tb].mean() if tb.sum()>50 else mid
            a=sub[:,:,3].astype(float)
            fy=6;fx=10
            ry_=np.ones(sub.shape[0]);ry_[:fy]=np.linspace(0,1,fy);ry_[-fy:]=np.linspace(1,0,fy)
            rx_=np.ones(sub.shape[1]);rx_[:fx]=np.linspace(0,1,fx);rx_[-fx:]=np.linspace(1,0,fx)
            sub[:,:,3]=(a*ry_[:,None]*rx_[None,:]).astype(np.uint8)
            frames[(r,c)]=[sub,ax,bot,bot-top]
    # walk frames are all upright: rescale any frame drawn at a different size from the rest of its row
    fixed=[]
    if name=='walk':
        for r in range(8):
            hs=[frames[(r,c)][3] for c in range(6) if (r,c) in frames];med=np.median(hs)
            for c in range(6):
                f=frames.get((r,c))
                if f and abs(f[3]/med-1)>0.05:
                    s=med/f[3];im=Image.fromarray(f[0]);im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
                    frames[(r,c)]=[np.array(im),f[1]*s,f[2]*s,med];fixed.append((r,c,round(s,2)))
    L=max(f[1] for f in frames.values());R=max(f[0].shape[1]-f[1] for f in frames.values())
    U=max(f[2] for f in frames.values());D=max(f[0].shape[0]-f[2] for f in frames.values())
    CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
    atlas=Image.new('RGBA',(CW*6,CH*8),(0,0,0,0))
    for (r,c),(sub,ax,bot,h) in frames.items():
        cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.alpha_composite(Image.fromarray(sub),(int(AX-round(ax)),int(AY-round(bot))));atlas.alpha_composite(cell,(c*CW,r*CH))
    atlas.save(f'/home/user/riftline/assets/shade_{name}.webp',quality=88,method=6)
    h=139.5 if name=='walk' else round(139.5*(938/8)/(1145/8),1)
    meta[name]=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=h);print(name,meta[name],'frames',len(frames),'rescaled',fixed)
    bg=Image.new('RGBA',atlas.size,(120,140,130,255));bg.alpha_composite(atlas);w,hh=bg.size;s=1400/w
    bg.convert('RGB').resize((int(w*s),int(hh*s))).save(f'av_{name}.jpg',quality=80)
json.dump(meta,open('atlas_meta.json','w'))
