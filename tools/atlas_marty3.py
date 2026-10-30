# Marty's second walk sheet: sprites painted on a flat dark-slate card with labels and grid lines.
# Key out the card by colour distance (soft edge, fringe un-mixed), keep the 8 labelled frames per row,
# reorder the rows from S,SE,E,NE,N,NW,W,SW to the game's S,SW,W,NW,N,NE,E,SE, and align every frame on its feet.
import sys,json
import numpy as np
from PIL import Image

BG=np.array([24,30,32.])
ROWS=[(255,339),(348,432),(439,525),(528,617),(624,712),(719,808),(817,905),(910,1000)]
COLS=[(333,440),(460,572),(604,713),(740,845),(872,976),(1000,1124),(1128,1257),(1262,1374)]
GAME_FROM_SRC=[0,7,6,5,4,3,2,1]   # game row -> source row

def key(cell):
    # the card is whatever background-coloured area connects to the cell's border; dark armour inside the outline stays solid
    A=cell.astype(float);d=np.sqrt(((A-BG)**2).sum(-1));hh,ww=d.shape;bgish=d<30;reg=np.zeros((hh,ww),bool);st=[]
    for x in range(ww):
        for y in (0,hh-1):
            if bgish[y,x] and not reg[y,x]:reg[y,x]=True;st.append((y,x))
    for y in range(hh):
        for x in (0,ww-1):
            if bgish[y,x] and not reg[y,x]:reg[y,x]=True;st.append((y,x))
    while st:
        cy,cx=st.pop()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=cy+dy,cx+dx
            if 0<=ny<hh and 0<=nx<ww and bgish[ny,nx] and not reg[ny,nx]:reg[ny,nx]=True;st.append((ny,nx))
    a=np.where(reg,np.clip((d-12)/(30-12),0,1),1.0)
    rgb=np.where(a[...,None]>0.01,(A-(1-a[...,None])*BG)/np.maximum(a[...,None],0.01),0)
    out=np.zeros(cell.shape[:2]+(4,),np.uint8);out[...,:3]=np.clip(rgb,0,255);out[...,3]=(a*255).astype(np.uint8);return out

def keep_body(sub):
    occ=sub[:,:,3]>60;hh,ww=occ.shape;lab=-np.ones(occ.shape,int);info=[]
    for y in range(hh):
        for x in range(ww):
            if occ[y,x] and lab[y,x]<0:
                n=len(info);st=[(y,x)];lab[y,x]=n;cnt=0;x0=x1=x;y0=y1=y
                while st:
                    cy,cx=st.pop();cnt+=1;x0=min(x0,cx);x1=max(x1,cx);y0=min(y0,cy);y1=max(y1,cy)
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny,nx=cy+dy,cx+dx
                        if 0<=ny<hh and 0<=nx<ww and occ[ny,nx] and lab[ny,nx]<0:lab[ny,nx]=n;st.append((ny,nx))
                info.append((cnt,x0,x1,y0,y1))
    if not info:return sub
    big=max(i[0] for i in info);keep=np.zeros(len(info)+1,bool)
    for i,(cnt,x0,x1,y0,y1) in enumerate(info):
        line=(x1-x0>=20 and y1-y0<=3) or (y1-y0>=20 and x1-x0<=3) or (cnt<(x1-x0+1)*(y1-y0+1)*0.15 and max(x1-x0,y1-y0)>=30)
        keep[i]=cnt>=big*0.01 and not line
    m=np.where(lab>=0,keep[lab],False)
    # faint halo pixels next to kept ones stay; everything else goes
    from itertools import product
    grown=m.copy()
    for dy,dx in product((-1,0,1),repeat=2):grown|=np.roll(np.roll(m,dy,0),dx,1)
    sub[:,:,3]=np.where(grown,sub[:,:,3],0);return sub

def anchor(sub):
    a=sub[:,:,3]>140;ys,xs=np.nonzero(a);top=np.percentile(ys,0.5);bot0=ys.max();h=bot0-top
    low=ys>top+h*0.55;ax=float(np.median(xs[low]));w=np.percentile(xs,95)-np.percentile(xs,5)
    band=np.abs(xs-ax)<w*0.45;cnt=np.bincount(ys[band],minlength=sub.shape[0]);rows=np.nonzero(cnt>=max(3,w*0.05))[0]
    return ax,float(rows.max()),float(rows.max()-top)

src,out=sys.argv[1],sys.argv[2]
IM=np.array(Image.open(src).convert('RGB'))
# the card's ruled lines: rows/columns where most of the grid is a flat slate a little lighter than the card; paint those pixels back to card colour
F=IM.astype(float);dd=np.sqrt(((F-BG)**2).sum(-1));flat=(F.max(-1)-F.min(-1))<20;lineish=(dd>6)&(dd<55)&flat
hl=[y for y in range(230,1024) if lineish[y,320:1530].mean()>0.45];vl=[x for x in range(300,1536) if lineish[250:1000,x].mean()>0.45]
print('grid rows',hl,'grid cols',vl)
for y in hl:IM[y][lineish[y]]=BG.astype(np.uint8)
for x in vl:IM[:,x][lineish[:,x]]=BG.astype(np.uint8)
frames={};hs=[]
for gr in range(8):
    sr=GAME_FROM_SRC[gr];y0,y1=ROWS[sr]
    for c,(x0,x1) in enumerate(COLS):
        cell=IM[max(0,y0-3):y1+3,max(0,x0-6):x1+6];sub=keep_body(key(cell));ax,bot,h=anchor(sub);frames[(gr,c)]=[sub,ax,bot,h];hs.append(h)
L=max(f[1] for f in frames.values());R=max(f[0].shape[1]-f[1] for f in frames.values());U=max(f[2] for f in frames.values());D=min(10,max(f[0].shape[0]-f[2] for f in frames.values()))
CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
atlas=Image.new('RGBA',(CW*8,CH*8),(0,0,0,0))
for (r,c),(sub,ax,bot,h) in frames.items():
    cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.alpha_composite(Image.fromarray(sub),(int(AX-round(ax)),int(AY-round(bot))));atlas.alpha_composite(cell,(c*CW,r*CH))
atlas.save(out,quality=90,method=6)
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=round(float(np.median(hs)),1))
print(json.dumps(meta))
bg=Image.new('RGBA',atlas.size,(150,160,150,255));bg.alpha_composite(atlas);bg.convert('RGB').resize((CW*8*2,CH*8*2),Image.NEAREST).save(sys.argv[3],quality=88)
