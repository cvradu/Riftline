import json
import numpy as np
from PIL import Image
def smooth(v,k):return np.convolve(v,np.ones(k)/k,mode='same')
def peaks(prof,k,minsep,win):
    p=smooth(prof,win).copy();res=[]
    for _ in range(k):
        i=int(p.argmax());res.append(i);p[max(0,i-minsep):i+minsep]=-1
    return sorted(res)
A=np.array(Image.open('../images/7.webp').convert('RGBA'));H,W=A.shape[:2]
al=A[:,:,3].astype(float)/255;solid=A[:,:,3]>170
ry=peaks(solid.sum(axis=1).astype(float),8,int(H/8*0.6),15);cx=peaks(solid.sum(axis=0).astype(float),6,int(W/6*0.55),25)
spy=(ry[-1]-ry[0])/7;spx=(cx[-1]-cx[0])/5
frames={}
for c in range(6):
    xc=cx[c];band=slice(max(0,xc-int(spx*0.12)),min(W,xc+int(spx*0.12)))
    prof=smooth(al[:,band].sum(axis=1),5);cuts=[]
    for r in range(7):
        lo,hi=int(ry[r]+spy*0.2),int(ry[r+1]-spy*0.15);cuts.append(lo+int(np.argmin(prof[lo:hi])))
    cuts=[max(0,int(ry[0]-spy*0.75))]+cuts+[min(H,int(ry[7]+spy*0.75))]
    for r in range(8):
        y0,y1=cuts[r],cuts[r+1];xp=smooth(al[y0:y1].sum(axis=0),5)
        if c>0:lo,hi=int(cx[c-1]+spx*0.3),int(xc-spx*0.2);x0=lo+int(np.argmin(xp[lo:hi]))
        else:x0=max(0,int(xc-spx*0.75))
        if c<5:lo,hi=int(xc+spx*0.2),int(cx[c+1]-spx*0.3);x1=lo+int(np.argmin(xp[lo:hi]))
        else:x1=min(W,int(xc+spx*0.75))
        sub=A[y0:y1,x0:x1].copy();m=solid[y0:y1,x0:x1];ys,xs=np.nonzero(m)
        top=np.percentile(ys,0.5);mid=np.median(xs)
        cb=np.abs(xs-mid)<spx*0.14;bot=np.percentile(ys[cb],99.6)
        tb=(ys>top+(bot-top)*0.35)&(ys<top+(bot-top)*0.8)&(np.abs(xs-mid)<spx*0.2)
        ax=xs[tb].mean()
        a=sub[:,:,3].astype(float);fy=6;fx=8
        r_=np.ones(sub.shape[0]);r_[:fy]=np.linspace(0,1,fy);r_[-fy:]=np.linspace(1,0,fy)
        c_=np.ones(sub.shape[1]);c_[:fx]=np.linspace(0,1,fx);c_[-fx:]=np.linspace(1,0,fx)
        sub[:,:,3]=(a*r_[:,None]*c_[None,:]).astype(np.uint8)
        frames[(r,c)]=[sub,ax,bot,bot-top]
fixed=[]
for r in range(8):
    med=np.median([frames[(r,c)][3] for c in range(6)])
    for c in range(6):
        f=frames[(r,c)]
        if abs(f[3]/med-1)>0.05:
            s=med/f[3];im=Image.fromarray(f[0]).resize((max(1,round(f[0].shape[1]*s)),max(1,round(f[0].shape[0]*s))),Image.LANCZOS)
            frames[(r,c)]=[np.array(im),f[1]*s,f[2]*s,med];fixed.append((r,c,round(s,2)))
def swap_axes(sub,ax):
    rgb=Image.fromarray(sub[:,:,:3]).convert('HSV');h,sat,v=[np.array(ch).astype(int) for ch in rgb.split()]
    xx=np.arange(sub.shape[1])[None,:];side=np.abs(xx-ax)>24   # axes hang well out to the sides; the face and body stay untouched
    sel=side&(sat>80)&(v>70)&(sub[:,:,3]>20);ora=sel&(h>=4)&(h<=48);blu=sel&(h>=108)&(h<=185)
    h[ora]=(h[ora]+128)%256;h[blu]=(h[blu]-128)%256
    out=Image.merge('HSV',[Image.fromarray(x.astype(np.uint8)) for x in (h,sat,v)]).convert('RGB')
    return np.dstack([np.array(out),sub[:,:,3]])
order=[0,1,2,3,4,'M',5,6]
nf={}
for nr,src in enumerate(order):
    for c in range(6):
        if src=='M':
            sub,ax,bot,h=frames[(3,c)];m=np.ascontiguousarray(sub[:,::-1]);nf[(nr,c)]=[swap_axes(m,sub.shape[1]-ax),sub.shape[1]-ax,bot,h]
        else:nf[(nr,c)]=frames[(src,c)]
frames=nf
L=max(f[1] for f in frames.values());R=max(f[0].shape[1]-f[1] for f in frames.values())
U=max(f[2] for f in frames.values());D=max(f[0].shape[0]-f[2] for f in frames.values())
CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
atlas=Image.new('RGBA',(CW*6,CH*8),(0,0,0,0))
for (r,c),(sub,ax,bot,h) in frames.items():
    cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.alpha_composite(Image.fromarray(sub),(int(AX-round(ax)),int(AY-round(bot))));atlas.alpha_composite(cell,(c*CW,r*CH))
atlas.save('/home/user/riftline/assets/cora_walk.webp',quality=88,method=6)
hs=[f[3] for f in frames.values()]
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=round(float(np.median(hs)),1))
print('rows',ry,'cols',cx);print('meta',meta,'rescaled',fixed)
json.dump(meta,open('cora_meta.json','w'))
bg=Image.new('RGBA',atlas.size,(70,90,80,255));bg.alpha_composite(atlas);w,h=bg.size;s=1300/w
bg.convert('RGB').resize((int(w*s),int(h*s))).save('av_cora.jpg',quality=82)
