import numpy as np,json
from PIL import Image
IK=0.6
A=np.array(Image.open('../images/30.webp').convert('RGBA'))
BOX=[(20,447,[(34,344),(391,729),(747,1134),(1187,1518)]),(509,952,[(35,341),(382,704),(762,1151),(1167,1491)])]
AIM=[(0,1),(-1,0.55),(-1,0),(-1,-0.55),(0,-1),(1,-0.55),(1,0),(1,0.55)]   # S SW W NW N NE E SE on screen
frames=[]
for y0,y1,cols in BOX:
    for x0,x1 in cols:frames.append(A[y0-4:y1+4,x0-6:x1+6].copy())
def base_info(f):
    a=f[...,3]>60;H=a.shape[0];w=np.array([np.ptp(np.nonzero(r)[0]) if r.any() else 0 for r in a])
    bw=np.percentile(w[int(H*0.6):],95);bot=np.nonzero(a.any(1))[0].max()
    # the platform: scan up from the bottom while the rows stay nearly as wide as the base
    top=bot
    while top>0 and (w[top-1]>bw*0.72 or top>bot-40):top-=1
    xs=np.nonzero(a[top:bot+1].any(0))[0];cx=(xs.min()+xs.max())/2
    return cx,bot,bw,top
meta=[];cells=[]
for i,f in enumerate(frames):
    cx,bot,bw,top=base_info(f);ay=bot-bw*IK*0.42   # the centre of the platform's footprint, a little above its front edge
    rgb=f[...,:3].astype(int);cy=(rgb[...,2]>190)&(rgb[...,1]>170)&(rgb[...,0]<170)&(f[...,3]>150)
    ys,xs=np.nonzero(cy);m=ys<top-10;ys,xs=ys[m],xs[m]
    d=np.array(AIM[i]);d=d/np.hypot(*d);pr=(xs-cx)*d[0]+(ys-ay)*d[1];k=pr>=np.percentile(pr,97)
    mz=[float(xs[k].mean()-cx),float(ys[k].mean()-ay)]
    meta.append(dict(cx=cx,ay=ay,bw=bw,top=top,mz=mz));cells.append(f)
bw=float(np.median([m['bw'] for m in meta]))
L=max(m['cx'] for m in meta);R=max(c.shape[1]-m['cx'] for c,m in zip(cells,meta));U=max(m['ay'] for m in meta);D=max(c.shape[0]-m['ay'] for c,m in zip(cells,meta))
CW=int(np.ceil(L+R))+4;CH=int(np.ceil(U+D))+4;AX=int(np.ceil(L))+2;AY=int(np.ceil(U))+2
def recolor_red(f):
    x=f.astype(float)/255;r,g,b,a=x[...,0],x[...,1],x[...,2],x[...,3];mx=np.maximum(np.maximum(r,g),b);mn=np.minimum(np.minimum(r,g),b);d=mx-mn
    h=np.zeros_like(mx);s=np.where(mx>0,d/np.maximum(mx,1e-6),0);v=mx
    nz=d>1e-6
    hr=np.where((mx==r)&nz,((g-b)/np.maximum(d,1e-6))%6,0);hg=np.where((mx==g)&nz,(b-r)/np.maximum(d,1e-6)+2,0);hb=np.where((mx==b)&nz,(r-g)/np.maximum(d,1e-6)+4,0)
    h=np.where(mx==r,hr,np.where(mx==g,hg,hb))*60
    sel=(h>150)&(h<225)&(s>0.18)
    h2=np.where(sel,358.0,h);s2=np.where(sel,np.minimum(1,s*1.05+0.05),s)
    # cyan glows were near-white at their core: keep them bright, now red-white
    C=v*s2;Hp=h2/60;X=C*(1-np.abs(Hp%2-1));m=v-C
    z=np.zeros_like(C);conds=[(Hp<1),(Hp<2),(Hp<3),(Hp<4),(Hp<5),(Hp>=5)]
    rr=np.select(conds,[C,X,z,z,X,C]);gg=np.select(conds,[X,C,C,X,z,z]);bb=np.select(conds,[z,z,X,C,C,X])
    out=np.stack([rr+m,gg+m,bb+m,a],-1)
    return (np.clip(np.where(sel[...,None],out,x),0,1)*255).astype(np.uint8)
atlas=Image.new('RGBA',(CW*9,CH*2),(0,0,0,0))
for team in (0,1):
    for i,(f,m) in enumerate(zip(cells,meta)):
        im=Image.fromarray(f if team==0 else recolor_red(f));atlas.alpha_composite(im,(i*CW+int(round(AX-m['cx'])),team*CH+int(round(AY-m['ay']))))
    # the ruin: the S platform only, a jagged stump left of the column, scorched
    f=cells[0].copy();m=meta[0];H0=f.shape[0];cut=int(m['top']-28);xs=np.arange(f.shape[1])
    jag=cut+(np.sin(xs*0.21)*9+np.sin(xs*0.057+1)*14).astype(int)
    for x in range(f.shape[1]):f[:max(0,jag[x]),x,3]=0
    if team==1:f=recolor_red(f)
    rgb=f[...,:3].astype(float);g=rgb.mean(-1,keepdims=True);rgb=(rgb*0.45+g*0.25)*0.62;f[...,:3]=np.clip(rgb,0,255).astype(np.uint8)
    atlas.alpha_composite(Image.fromarray(f),(8*CW+int(round(AX-m['cx'])),team*CH+int(round(AY-m['ay']))))
atlas.save('/home/user/riftline/assets/tower2.webp',quality=88,method=6)
top=float(np.median([AY-(m['ay']-m['top']) for m in meta]))
out=dict(cw=CW,ch=CH,ax=AX,ay=AY,bw=round(bw,1),top=round(AY-min(m['ay']-0 for m in meta),1),head=round(float(np.median([m['ay']-m['top'] for m in meta])),1),mz=[[round(m['mz'][0],1),round(m['mz'][1],1)] for m in meta])
print(json.dumps(out))
bg=Image.new('RGBA',atlas.size,(60,66,72,255));bg.alpha_composite(atlas)
from PIL import ImageDraw;d=ImageDraw.Draw(bg)
for t in (0,1):
    for i in range(9):
        x,y=i*CW+AX,t*CH+AY;d.ellipse([x-5,y-5,x+5,y+5],outline=(255,255,0,255))
        if i<8:mx,my=meta[i]['mz'];d.ellipse([x+mx-6,y+my-6,x+mx+6,y+my+6],outline=(255,0,255,255),width=2)
bg.convert('RGB').resize((CW*9//2,CH*2//2)).save('tower2/prev.jpg',quality=85)
json.dump(out,open('tower2/meta.json','w'))
