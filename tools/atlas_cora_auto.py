import json
import numpy as np
from PIL import Image
def smooth(v,k):return np.convolve(v,np.ones(k)/k,mode='same')
A=np.array(Image.open('../images/8.webp').convert('RGBA'));H,W=A.shape[:2]
hsv=np.array(Image.fromarray(A[:,:,:3]).convert('HSV')).astype(int)
glow=(hsv[:,:,1]>140)&(hsv[:,:,2]>150)          # bright swing trails and axe glow
al=A[:,:,3].astype(float)/255;body=(A[:,:,3]>170)&~glow
ry=[int(round(65+i*(793-65)/7)) for i in range(8)];cx=[int(round(68+i*(739-68)/5)) for i in range(6)]
spy=(ry[-1]-ry[0])/7;spx=(cx[-1]-cx[0])/5
frames={}
for c in range(6):
    xc=cx[c];band=slice(max(0,xc-int(spx*0.12)),min(W,xc+int(spx*0.12)))
    prof=smooth((al*~glow)[:,band].sum(axis=1),5);cuts=[]
    for r in range(7):
        lo,hi=int(ry[r]+spy*0.2),int(ry[r+1]-spy*0.1);cuts.append(lo+int(np.argmin(prof[lo:hi])))
    cuts=[max(0,int(ry[0]-spy*0.8))]+cuts+[min(H,int(ry[7]+spy*0.8))]
    for r in range(8):
        y0,y1=cuts[r],cuts[r+1];xp=smooth(al[y0:y1].sum(axis=0),5)
        x0=max(0,int(xc-spx*0.75)) if c==0 else int(cx[c-1]+spx*0.3)+int(np.argmin(xp[int(cx[c-1]+spx*0.3):int(xc-spx*0.2)]))
        x1=min(W,int(xc+spx*0.75)) if c==5 else int(xc+spx*0.2)+int(np.argmin(xp[int(xc+spx*0.2):int(cx[c+1]-spx*0.3)]))
        sub=A[y0:y1,x0:x1].copy();m=body[y0:y1,x0:x1];ys,xs=np.nonzero(m)
        top=np.percentile(ys,0.5);mid=np.median(xs)
        cb=np.abs(xs-mid)<spx*0.16;bot=np.percentile(ys[cb],99.6)
        tb=(ys>top+(bot-top)*0.35)&(ys<top+(bot-top)*0.8)&(np.abs(xs-mid)<spx*0.22);ax=xs[tb].mean()
        a=sub[:,:,3].astype(float);fy=5;fx=8
        r_=np.ones(sub.shape[0]);r_[:fy]=np.linspace(0,1,fy);r_[-fy:]=np.linspace(1,0,fy)
        c_=np.ones(sub.shape[1]);c_[:fx]=np.linspace(0,1,fx);c_[-fx:]=np.linspace(1,0,fx)
        sub[:,:,3]=(a*r_[:,None]*c_[None,:]).astype(np.uint8)
        frames[(r,c)]=[sub,ax,bot,bot-top]
def swap_axes(sub,ax,top):
    rgb=Image.fromarray(sub[:,:,:3]).convert('HSV');h,sat,v=[np.array(ch).astype(int) for ch in rgb.split()]
    yy,xx=np.mgrid[0:sub.shape[0],0:sub.shape[1]];head=((xx-ax)/20.0)**2+((yy-(top+18))/22.0)**2<1
    sel=(~head)&(sat>80)&(v>70)&(sub[:,:,3]>20);ora=sel&(h>=4)&(h<=48);blu=sel&(h>=108)&(h<=185)
    h[ora]=(h[ora]+128)%256;h[blu]=(h[blu]-128)%256
    out=Image.merge('HSV',[Image.fromarray(x.astype(np.uint8)) for x in (h,sat,v)]).convert('RGB')
    return np.dstack([np.array(out),sub[:,:,3]])
# sheet rows are S, SW, W, NW, N, E, SE, S(again); rebuild NE from NW mirrored with the axes swapped back to their hands
order=[0,1,2,3,4,'M',5,6];nf={}
for nr,src in enumerate(order):
    for c in range(6):
        if src=='M':
            sub,ax,bot,h=frames[(3,c)];m=np.ascontiguousarray(sub[:,::-1]);axm=sub.shape[1]-ax;nf[(nr,c)]=[m,axm,bot,h]  # plain mirror: the bronze axe swings in every direction
        else:nf[(nr,c)]=frames[(src,c)]
frames=nf
L=max(f[1] for f in frames.values());R=max(f[0].shape[1]-f[1] for f in frames.values())
U=max(f[2] for f in frames.values());D=min(24,max(f[0].shape[0]-f[2] for f in frames.values()))
CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
atlas=Image.new('RGBA',(CW*6,CH*8),(0,0,0,0))
for (r,c),(sub,ax,bot,h) in frames.items():
    cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.alpha_composite(Image.fromarray(sub),(int(AX-round(ax)),int(AY-round(bot))));atlas.alpha_composite(cell,(c*CW,r*CH))
atlas.save('/home/user/riftline/assets/cora_auto.webp',quality=88,method=6)
stance=[frames[(r,0)][3] for r in range(8)]
# scale: both sheets draw her at the same size relative to their row height
walk=json.load(open('cora_meta.json'))
h=round(walk['h']*((793-65)/7)/(1125/8.0),1)
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=h,stance_h=float(np.median(stance)))
print('meta',meta);json.dump(meta,open('cora_auto_meta.json','w'))
bg=Image.new('RGBA',atlas.size,(70,90,80,255));bg.alpha_composite(atlas);w,hh=bg.size;s=1300/w
bg.convert('RGB').resize((int(w*s),int(hh*s))).save('av_cora_auto.jpg',quality=82)
