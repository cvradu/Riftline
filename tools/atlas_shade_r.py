# Shade's ultimate sheet: 8 directions (S, SW, W, NW, N, NE, E, SE) x 6 frames (raise, lunge, spin cut, cross cut, crouch, recover)
# The slash effects belong to each frame, so cells are cut along the emptiest lines and every frame in a row keeps the same scale;
# frames are aligned on the feet, found from the dark body pixels (the effects are bright red, white or grey)
import json
import numpy as np
from PIL import Image
def label(occ):
    hh,ww=occ.shape;lab=np.zeros(occ.shape,int);sizes=[0]
    for y in range(hh):
        for x in range(ww):
            if occ[y,x] and not lab[y,x]:
                n=len(sizes);sizes.append(0);st=[(y,x)];lab[y,x]=n
                while st:
                    cy,cx2=st.pop();sizes[n]+=1
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny,nx=cy+dy,cx2+dx
                        if 0<=ny<hh and 0<=nx<ww and occ[ny,nx] and not lab[ny,nx]:lab[ny,nx]=n;st.append((ny,nx))
    return lab,np.array(sizes,float)
def smooth(v,k):return np.convolve(v,np.ones(k)/k,mode='same')
def peaks(prof,k,minsep,win):
    p=smooth(prof,win).copy();res=[]
    for _ in range(k):
        i=int(p.argmax());res.append(i);p[max(0,i-minsep):i+minsep]=-1
    return sorted(res)
SRC='shade_r/src.webp';OUT='/home/user/riftline/assets/shade_r.webp';NC,NR=6,8
A=np.array(Image.open(SRC).convert('RGBA'));H,W=A.shape[:2]
al=A[:,:,3].astype(float)/255
dark=(A[:,:,3]>170)&(A[:,:,:3].max(axis=2)<110)
# cut lines: the emptiest line near each evenly spaced boundary of the 8 x 6 grid
def cuts(prof,lo,hi,n,win=24):
    b=[lo+(hi-lo)*i/n for i in range(n+1)];out=[lo]
    for i in range(1,n):
        a0=int(b[i]-win);out.append(a0+int(np.argmin(prof[a0:int(b[i]+win)])))
    return out+[hi]
yc=cuts(smooth(al.sum(axis=1),5),8,837,NR)
print('row cuts',yc)
frames={}
for r in range(NR):
    y0,y1=yc[r],yc[r+1];xp=smooth(al[y0:y1].sum(axis=0),5)
    xcut=cuts(xp,0,W,NC,22)
    for c in range(NC):
        x0,x1=xcut[c],xcut[c+1];sub=A[y0:y1,x0:x1].copy()
        lab,sizes=label(sub[:,:,3]>30)
        if len(sizes)>1:
            keep=sizes>=sizes[1:].max()*0.06;keep[0]=False
            sub[:,:,3]=np.where(keep[lab]|(lab==0),sub[:,:,3],0).astype(np.uint8)
        d=(sub[:,:,3]>170)&(sub[:,:,:3].max(axis=2)<110);ys,xs=np.nonzero(d)
        top=np.percentile(ys,1);bot=np.percentile(ys,99.6);low=ys>top+(bot-top)*0.7;ax=float(np.median(xs[low]))
        a=sub[:,:,3].astype(float);f=3
        rr=np.ones(sub.shape[0]);rr[:f]=np.linspace(0.2,1,f);rr[-f:]=np.linspace(1,0.2,f)
        cc=np.ones(sub.shape[1]);cc[:f]=np.linspace(0.2,1,f);cc[-f:]=np.linspace(1,0.2,f)
        sub[:,:,3]=(a*rr[:,None]*cc[None,:]).astype(np.uint8)
        frames[(r,c)]=[sub,ax,bot,bot-top]
L=max(f[1] for f in frames.values());R=max(f[0].shape[1]-f[1] for f in frames.values())
U=max(f[2] for f in frames.values());D=max(f[0].shape[0]-f[2] for f in frames.values())
CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
atlas=Image.new('RGBA',(CW*NC,CH*NR),(0,0,0,0))
for (r,c),(sub,ax,bot,h) in frames.items():
    atlas.alpha_composite(Image.fromarray(sub),(c*CW+int(AX-round(ax)),r*CH+int(AY-round(bot))))
atlas.save(OUT,quality=90,method=6)
# body height of the recover stance (last column), the reference for scaling against the other sheets
h=float(np.median([frames[(r,5)][3] for r in range(NR)]))
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h_recover=round(h,1))
print('meta',meta)
bg=Image.new('RGBA',atlas.size,(60,66,72,255));bg.alpha_composite(atlas);bg=bg.convert('RGB')
from PIL import ImageDraw
dr=ImageDraw.Draw(bg)
for r in range(NR):
    for c in range(NC):dr.line([(c*CW+AX-4,r*CH+AY),(c*CW+AX+4,r*CH+AY)],fill=(0,255,0));dr.rectangle([c*CW,r*CH,c*CW+CW-1,r*CH+CH-1],outline=(90,90,90))
bg.resize((bg.width*2,bg.height*2)).save('shade_r/prev.png')
json.dump(meta,open('shade_r/meta.json','w'))
