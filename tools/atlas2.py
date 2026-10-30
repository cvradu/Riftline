import json
import numpy as np
from PIL import Image, ImageFilter
g=json.load(open('grid.json'));g['5']['cx'][4]=844
names={'2':'walk','3':'auto','4':'q','5':'rmb','6':'e'}
def label(mask):
    h,w=mask.shape;lab=np.zeros((h,w),np.int32);n=0;sizes={}
    for y in range(h):
        row=mask[y]
        for x in np.nonzero(row)[0]:
            if lab[y,x]:continue
            n+=1;st=[(y,x)];lab[y,x]=n;cnt=0
            while st:
                cy,cx=st.pop();cnt+=1
                for yy,xx in ((cy+1,cx),(cy-1,cx),(cy,cx+1),(cy,cx-1)):
                    if 0<=yy<h and 0<=xx<w and mask[yy,xx] and not lab[yy,xx]:lab[yy,xx]=n;st.append((yy,xx))
            sizes[n]=cnt
    return lab,sizes
def dil(m,k):return np.array(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(k)))>0
meta={}
for n,name in names.items():
    im=Image.open(f'../images/{n}.webp').convert('RGBA');A=np.array(im);H,W=A.shape[:2]
    ry=g[n]['ry'];cx=g[n]['cx'];sp=(ry[-1]-ry[0])/7
    bx=[max(0,cx[0]-(cx[1]-cx[0])//2)]+[(cx[i]+cx[i+1])//2 for i in range(5)]+[min(W,cx[5]+(cx[5]-cx[4])//2)]
    frames=[]
    for r in range(8):
        for c in range(6):
            x0,x1=bx[c],bx[c+1];y0=max(0,int(ry[r]-sp*0.9));y1=min(H,int(ry[r]+sp*0.9))
            sub=A[y0:y1,x0:x1].copy();dark=(sub[:,:,3]>170)&(sub[:,:,:3].max(axis=2)<75)
            if dark.sum()<400:frames.append(None);continue
            S=2;h2,w2=dark.shape[0]//S,dark.shape[1]//S
            sm=dark[:h2*S,:w2*S].reshape(h2,S,w2,S).sum(axis=(1,3))>0
            sm=dil(sm,3);lab,sizes=label(sm)
            big=[k for k,v in sizes.items() if v>40]
            if not big:frames.append(None);continue
            cyc,cxc=(ry[r]-y0)/S,(cx[c]-x0)/S
            def score(k):
                ys,xs=np.nonzero(lab==k);return sizes[k]-0.6*np.hypot(ys.mean()-cyc,xs.mean()-cxc)**2/10
            main=max(big,key=score)
            mainm=np.kron(lab==main,np.ones((S,S),bool));mainm=np.pad(mainm,((0,dark.shape[0]-mainm.shape[0]),(0,dark.shape[1]-mainm.shape[1])))
            foreign=np.kron(np.isin(lab,[k for k in big if k!=main]),np.ones((S,S),bool));foreign=np.pad(foreign,((0,dark.shape[0]-foreign.shape[0]),(0,dark.shape[1]-foreign.shape[1])))
            ys,xs=np.nonzero(mainm&dark)
            top,bot=int(np.percentile(ys,0.3)),int(np.percentile(ys,99.7))
            band=(ys>top+(bot-top)*0.3)&(ys<top+(bot-top)*0.75)
            ax=xs[band].mean() if band.sum()>50 else xs.mean()
            # erase neighbours: dilated foreign dark parts, and anything well above the hood or below the feet
            kill=dil(foreign,9)
            yy=np.arange(sub.shape[0])[:,None];kill|=(yy<top-12)|(yy>bot+14)
            a=sub[:,:,3].astype(float);a[kill]=0
            w=sub.shape[1];ramp=np.ones(w);f=10;ramp[:f]=np.linspace(0,1,f);ramp[-f:]=np.linspace(1,0,f)
            sub[:,:,3]=(a*ramp[None,:]).astype(np.uint8)
            frames.append((sub,ax,bot))
    L=R=U=D=0
    for fr in frames:
        if fr is None:continue
        sub,ax,bot=fr;L=max(L,ax);R=max(R,sub.shape[1]-ax);U=max(U,bot);D=max(D,sub.shape[0]-bot)
    D=min(D,20)
    CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
    atlas=Image.new('RGBA',(CW*6,CH*8),(0,0,0,0));cnt=0
    for i,fr in enumerate(frames):
        r,c=divmod(i,6)
        if fr is None:continue
        sub,ax,bot=fr;cnt+=1
        t=Image.fromarray(sub);canvas=Image.new('RGBA',(CW,CH),(0,0,0,0));canvas.alpha_composite(t,(int(AX-round(ax)),int(AY-round(bot))))
        atlas.alpha_composite(canvas,(c*CW,r*CH))
    atlas.save(f'/home/user/riftline/assets/shade_{name}.webp',quality=88,method=6)
    h=139.5 if name=='walk' else round(139.5*(938/8)/(1145/8),1)
    meta[name]=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=h);print(name,meta[name],'frames',cnt)
    bg=Image.new('RGBA',atlas.size,(120,140,130,255));bg.alpha_composite(atlas);bg.convert('RGB').save(f'atlas_{name}.jpg',quality=82)
json.dump(meta,open('atlas_meta.json','w'))
