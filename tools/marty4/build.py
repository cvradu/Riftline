# Marty's walk, 8 sheets x 16 frames (4x4), one sheet per direction, transparent backgrounds.
# Remove the stray splotch beside the feet, align every frame on its feet, scale, and pack rows in the game's order S,SW,W,NW,N,NE,E,SE.
import numpy as np,json,sys
from PIL import Image
sys.path.insert(0,'marty4')
from comps import label
SHEETS=[44,37,38,39,40,41,42,43]   # game rows S,SW,W,NW,N,NE,E,SE
R=12;SC=0.5
# splotches fused flat against a fist or foot, boxed by hand in cell pixels (x0,y0,x1,y1)
MANUAL={(37,2):(398,285,462,375),(42,11):(140,232,198,290)}
def shift(x,dy,dx):
    H,W=x.shape;y=np.zeros_like(x);y[max(dy,0):H+min(dy,0),max(dx,0):W+min(dx,0)]=x[max(-dy,0):H+min(-dy,0),max(-dx,0):W+min(-dx,0)];return y
def dil(x,k):
    o=x.copy()
    for dy in range(-k,k+1):
        for dx in range(-k,k+1):
            if dy*dy+dx*dx<=k*k:o|=shift(x,dy,dx)
    return o
ero=lambda x,k:~dil(~x,k)
frames=[];removed=[];dbg=[];DBG={};CLEAN={}
for gi,sh in enumerate(SHEETS):
    A=np.array(Image.open(f'../images/{sh}.webp').convert('RGBA'));H,W=A.shape[:2];ch,cw=H//4,W//4
    for i in range(16):
        r,c=i//4,i%4;cell=A[r*ch:(r+1)*ch,c*cw:(c+1)*cw].copy();m=cell[...,3]>30
        lab0,info0=label(m);mx0=max(info0,key=lambda q:q['n']);top,bot=mx0['y0'],mx0['y1'];hh=bot-top;gone=0
        final=m.copy()
        # 1) pieces not joined to the body: drop unless they sit up top (flag, lamp)
        for q in info0:
            if q is mx0:continue
            if q['cy']>top+0.3*hh or q['n']<20:final[lab0==q['id']]=False;gone+=q['n']
        # 2) thin strokes hanging off the lower body: what an opening of radius R strips away, in long pieces
        op=dil(ero(final,R),R+1);res=final&~op;lab1,info1=label(res)
        for q in info1:
            L=max(q['x1']-q['x0'],q['y1']-q['y0'])
            if q['cy']>top+0.4*hh and q['n']>=120 and L>=30:final[lab1==q['id']]=False;gone+=q['n'];dbg.append((sh,i,q))
        # 3) crumbs left behind once a stroke is cut away
        lab2,info2=label(final);mx=max(info2,key=lambda q:q['n'])
        for q in info2:
            if q is not mx and q['cy']>mx['y0']+0.3*(mx['y1']-mx['y0']):final[lab2==q['id']]=False;gone+=q['n']
        # 4) boxed splotches: fill wholly inside the box goes, outline goes unless it borders fill that reaches outside the box
        if (sh,i) in MANUAL:
            x0,y0,x1,y1=MANUAL[(sh,i)];inb=np.zeros_like(m);inb[y0:y1,x0:x1]=True
            lum=cell[...,:3].astype(int).mean(-1);fill=final&(cell[...,3]>200)&(lum>62);lf,inf=label(fill);keep=np.zeros_like(m)
            for q in inf:
                pc=lf==q['id']
                if (pc&~inb).any():keep|=pc
            kill=inb&final&~(keep|(dil(keep,8)&~fill))
            final&=~kill;gone+=int(kill.sum())
            lab3,info3=label(final);mx3=max(info3,key=lambda q:q['n'])
            for q in info3:
                if q is not mx3 and q['n']<400:final[lab3==q['id']]=False
        cutmask=m&~final
        DBG[(gi,i)]=(cell.copy(),cutmask)
        cell[...,3]=np.where(final,cell[...,3],0);removed.append((sh,i,gone))
        if (sh,i) in MANUAL:CLEAN[(sh,i)]=(DBG[(gi,i)],cell.copy())
        ys,xs=np.nonzero(cell[...,3]>140);t,b=ys.min(),ys.max();h=b-t
        band=(ys>t+h*0.3)&(ys<t+h*0.75);ax=float(np.median(xs[band]))
        cnt=np.bincount(ys,minlength=ch);rows=np.nonzero(cnt>=6)[0];foot=float(rows.max())
        im=Image.fromarray(cell).resize((round(cw*SC),round(ch*SC)),Image.LANCZOS)
        frames.append((gi,i,np.array(im),ax*SC,foot*SC,h*SC))
L=max(f[3] for f in frames);Rr=max(f[2].shape[1]-f[3] for f in frames);U=max(f[4] for f in frames);D=max(0,max(f[2].shape[0]-f[4] for f in frames))
# trim empty margins: measure the real extent of the pixels around the anchor
ext=[0,0,0,0]
for gi,i,a,ax,foot,h in frames:
    ys,xs=np.nonzero(a[...,3]>8);ext[0]=max(ext[0],ax-xs.min());ext[1]=max(ext[1],xs.max()-ax);ext[2]=max(ext[2],foot-ys.min());ext[3]=max(ext[3],ys.max()-foot)
CW=int(np.ceil(ext[0]+ext[1]))+4;CH=int(np.ceil(ext[2]+ext[3]))+4;AX=int(np.ceil(ext[0]))+2;AY=int(np.ceil(ext[2]))+2
atlas=Image.new('RGBA',(CW*16,CH*8),(0,0,0,0))
for gi,i,a,ax,foot,h in frames:
    atlas.alpha_composite(Image.fromarray(a),(i*CW+int(round(AX-ax)),gi*CH+int(round(AY-foot)))) if (AX-ax)>=0 and (AY-foot)>=0 else None
    if (AX-ax)<0 or (AY-foot)<0:
        im=Image.fromarray(a);ox,oy=int(round(AX-ax)),int(round(AY-foot));cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.paste(im,(ox,oy),im);atlas.alpha_composite(cell,(i*CW,gi*CH))
atlas.save('/home/user/riftline/assets/marty_move.webp',quality=86,method=6)
hs=[f[5] for f in frames];meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=round(float(np.median(hs)),1),n=16)
json.dump(meta,open('marty4/meta.json','w'));print(json.dumps(meta))
print('splotch px removed per sheet:',{s:sum(g for ss,i,g in removed if ss==s) for s in SHEETS})
print('frames with nothing removed:',[(s,i) for s,i,g in removed if g==0])
bg=Image.new('RGBA',atlas.size,(200,205,210,255));bg.alpha_composite(atlas);bg.convert('RGB').resize((CW*16//2,CH*8//2)).save('marty4/prev.jpg',quality=85)

# debug: every frame with what was cut shown in red
DW,DH=246,250
dimg=Image.new('RGB',(DW*16,DH*8),(200,205,210))
for (gi,i),(cell,cut) in DBG.items():
    c=cell.copy();c[cut]=[255,0,0,255];im=Image.fromarray(c);bg=Image.new('RGBA',im.size,(200,205,210,255));bg.alpha_composite(im)
    dimg.paste(bg.convert('RGB').resize((DW,DH)),(i*DW,gi*DH))
dimg.save('marty4/debug.png')
print('stroke cuts:',[(s_,i,q['n']) for s_,i,q in dbg])

# before/after of the hand-boxed frames at full size
tl=[]
for k,((orig,cut),cl) in CLEAN.items():
    x0,y0,x1,y1=MANUAL[k];X0,Y0,X1,Y1=max(0,x0-70),max(0,y0-50),min(orig.shape[1],x1+30),min(orig.shape[0],y1+40)
    pair=[]
    for a in (orig,cl):
        im=Image.fromarray(a[Y0:Y1,X0:X1]);bg=Image.new('RGBA',im.size,(200,205,210,255));bg.alpha_composite(im);pair.append(bg.convert('RGB').resize((im.width*2,im.height*2),Image.NEAREST))
    t=Image.new('RGB',(pair[0].width*2+6,pair[0].height),(255,255,255));t.paste(pair[0],(0,0));t.paste(pair[1],(pair[0].width+6,0));tl.append(t)
W2=max(t.width for t in tl);H2=max(t.height for t in tl);o=Image.new('RGB',(W2*2,H2*4),(255,255,255))
for n,t in enumerate(tl):o.paste(t,((n%2)*W2,(n//2)*H2))
o.save('marty4/manual.png')
