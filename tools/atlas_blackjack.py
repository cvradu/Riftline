# Viktor's sheets: 8 directions (S, SW, W, NW, N, NE, E, SE) x 8 walk frames, cut along the emptiest gaps and aligned on the feet
import json,sys
import numpy as np
from PIL import Image
def smooth(v,k):return np.convolve(v,np.ones(k)/k,mode='same')
def peaks(prof,k,minsep,win):
    p=smooth(prof,win).copy();res=[]
    for _ in range(k):
        i=int(p.argmax());res.append(i);p[max(0,i-minsep):i+minsep]=-1
    return sorted(res)
def build(src,out,NC=8,NR=8):
    A=np.array(Image.open(src).convert('RGBA'));H,W=A.shape[:2]
    al=A[:,:,3].astype(float)/255;solid=A[:,:,3]>170
    ry=peaks(solid.sum(axis=1).astype(float),NR,int(H/NR*0.6),9);cx=peaks(solid.sum(axis=0).astype(float),NC,int(W/NC*0.55),9)
    spy=(ry[-1]-ry[0])/(NR-1);spx=(cx[-1]-cx[0])/(NC-1)
    frames={}
    for c in range(NC):
        xc=cx[c];band=slice(max(0,xc-int(spx*0.15)),min(W,xc+int(spx*0.15)))
        prof=smooth(al[:,band].sum(axis=1),3);cuts=[]
        for r in range(NR-1):
            lo,hi=int(ry[r]+spy*0.2),int(ry[r+1]-spy*0.1);cuts.append(lo+int(np.argmin(prof[lo:hi])))
        cuts=[max(0,int(ry[0]-spy*0.8))]+cuts+[min(H,int(ry[-1]+spy*0.8))]
        for r in range(NR):
            y0,y1=cuts[r],cuts[r+1];xp=smooth(al[y0:y1].sum(axis=0),3)
            if c>0:lo,hi=int(cx[c-1]+spx*0.3),int(xc-spx*0.2);x0=lo+int(np.argmin(xp[lo:hi]))
            else:x0=max(0,int(xc-spx*0.8))
            if c<NC-1:lo,hi=int(xc+spx*0.2),int(cx[c+1]-spx*0.3);x1=lo+int(np.argmin(xp[lo:hi]))
            else:x1=min(W,int(xc+spx*0.8))
            sub=A[y0:y1,x0:x1].copy()
            # drop slivers of the neighbouring rows: label connected pieces and keep only the big ones
            occ=sub[:,:,3]>40;lab=np.zeros(occ.shape,int);sizes=[0];hh,ww=occ.shape
            for y in range(hh):
                for x in range(ww):
                    if occ[y,x] and not lab[y,x]:
                        n=len(sizes);sizes.append(0);st=[(y,x)];lab[y,x]=n
                        while st:
                            cy,cx2=st.pop();sizes[n]+=1
                            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                                ny,nx=cy+dy,cx2+dx
                                if 0<=ny<hh and 0<=nx<ww and occ[ny,nx] and not lab[ny,nx]:lab[ny,nx]=n;st.append((ny,nx))
            big=max(sizes);keep=np.array([s_>=big*0.08 for s_ in sizes]);keep[0]=False
            sub[:,:,3]=np.where(keep[lab]|(sub[:,:,3]<=40)&(lab==0),sub[:,:,3],0).astype(np.uint8)
            rgb=sub[:,:,:3].astype(int);flame=((rgb[:,:,2]>170)&(rgb[:,:,1]>130)&(rgb[:,:,0]<140))|((rgb[:,:,0]>220)&(rgb[:,:,1]>120)&(rgb[:,:,2]<110))
            m=(sub[:,:,3]>170)&~flame
            # keep only the biggest blob's rows/cols neighbourhood: drop stray bits of the neighbours that touch the cut edges
            ys,xs=np.nonzero(m);top=np.percentile(ys,0.5);mid=np.median(xs)
            cb=np.abs(xs-mid)<spx*0.18;bot=np.percentile(ys[cb],99.5)
            tb=(ys>top+(bot-top)*0.3)&(ys<top+(bot-top)*0.8)&(np.abs(xs-mid)<spx*0.22)
            ax=xs[tb].mean()
            a=sub[:,:,3].astype(float);fy=4;fx=5
            r_=np.ones(sub.shape[0]);r_[:fy]=np.linspace(0,1,fy);r_[-fy:]=np.linspace(1,0,fy)
            c_=np.ones(sub.shape[1]);c_[:fx]=np.linspace(0,1,fx);c_[-fx:]=np.linspace(1,0,fx)
            sub[:,:,3]=(a*r_[:,None]*c_[None,:]).astype(np.uint8)
            frames[(r,c)]=[sub,ax,bot,bot-top]
    fixed=[]
    for r in range(NR):
        med=np.median([frames[(r,c)][3] for c in range(NC)])
        for c in range(NC):
            f=frames[(r,c)]
            if abs(f[3]/med-1)>0.06:
                s=med/f[3];im=Image.fromarray(f[0]).resize((max(1,round(f[0].shape[1]*s)),max(1,round(f[0].shape[0]*s))),Image.LANCZOS)
                frames[(r,c)]=[np.array(im),f[1]*s,f[2]*s,med];fixed.append((r,c,round(s,2)))
    L=max(f[1] for f in frames.values());R=max(f[0].shape[1]-f[1] for f in frames.values())
    U=max(f[2] for f in frames.values());D=min(16,max(f[0].shape[0]-f[2] for f in frames.values()))
    CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
    atlas=Image.new('RGBA',(CW*NC,CH*NR),(0,0,0,0))
    for (r,c),(sub,ax,bot,h) in frames.items():
        cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.alpha_composite(Image.fromarray(sub),(int(AX-round(ax)),int(AY-round(bot))));atlas.alpha_composite(cell,(c*CW,r*CH))
    atlas.save(out,quality=88,method=6)
    hs=[f[3] for f in frames.values()]
    meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=round(float(np.median(hs)),1))
    print(src,'rows',ry,'cols',cx,'meta',meta,'rescaled',fixed)
    bg=Image.new('RGBA',atlas.size,(60,66,72,255));bg.alpha_composite(atlas);w,h=bg.size;s=1400/w
    bg.convert('RGB').resize((int(w*s),int(h*s))).save(out.split('/')[-1].replace('.webp','_prev.jpg'),quality=84)
    return meta

import sys
m1=build('bj/move.webp','/home/user/riftline/assets/blackjack_move.webp',NC=4,NR=8)
m2=build('bj/atk.webp','/home/user/riftline/assets/blackjack_atk.webp',NC=6,NR=8)
json.dump({'move':m1,'atk':m2},open('bj/meta.json','w'))
