# M4NTi5: the walk sheet (rows N,NE,E,SE,S,SW,W,NW) and four Telescopic Strike sheets (S, SE, N, NE; mirrored for SW, W, NW)
import json,sys
import numpy as np
from PIL import Image
src=open('atlas_blackjack2.py').read();src=src[:src.index("\nimport sys\nm3=")];exec(src)        # build(): peak-cut walk sheets
m2=open('atlas_marty2.py').read();exec(m2[m2.index("def drop_slivers"):m2.index("def gap_cuts")])  # drop_slivers()
OUT='/home/user/riftline/assets/'
# --- walk: build in source order, then reorder the rows into the game's S,SW,W,NW,N,NE,E,SE
mw=build('../images/31.webp','mantis/walk_src.webp',NC=8,NR=8)
A=Image.open('mantis/walk_src.webp');CW,CH=mw['cw'],mw['ch'];G2S=[4,5,6,7,0,1,2,3]
W=Image.new('RGBA',A.size,(0,0,0,0))
for g,s_ in enumerate(G2S):W.paste(A.crop((0,s_*CH,8*CW,(s_+1)*CH)),(0,g*CH))
W.save(OUT+'mantis_move.webp',quality=88,method=6)
def body(sub):
    rgb=sub[...,:3].astype(int);r,g,b=rgb[...,0],rgb[...,1],rgb[...,2];a=sub[...,3]
    blade=(g>120)&(g>r+15)&(g>b+40);cyan=(b>140)&(g>120)&(r<120)
    return (a>160)&~blade&~cyan
def walk_h():
    M=np.array(W);hs=[]
    for c in range(8):
        sub=M[4*CH:5*CH,c*CW:(c+1)*CW];ys,xs=np.nonzero(body(sub));hs.append(ys.max()-np.percentile(ys,1))
    return float(np.median(hs))
WH=walk_h();print('walk body height',WH,'meta',mw)
# --- Q
SHEETS={'32':'S','33':'SE','34':'N','35':'NE'}
ORDER=['S','SW','W','NW','N','NE','E','SE'];SRC={'S':('32',0),'SW':('33',1),'W':('33',1),'NW':('35',1),'N':('34',0),'NE':('35',0),'E':('33',0),'SE':('33',0)}
cells={}
for f in SHEETS:
    S=np.array(Image.open('../images/'+f+'.webp').convert('RGBA'));H,Wd=S.shape[:2];ch,cw=H//2,Wd//4
    for i in range(8):
        r,c=i//4,i%4;sub=drop_slivers(S[r*ch:(r+1)*ch,c*cw:(c+1)*cw].copy());cells[(f,i)]=sub
def anchor(sub):
    m=body(sub);ys,xs=np.nonzero(m);top=np.percentile(ys,1);bot0=ys.max();h=bot0-top
    low=ys>top+h*0.55;ax=float(np.median(xs[low]))
    cnt=np.bincount(ys,minlength=sub.shape[0]);rows=np.nonzero(cnt>=6)[0];bot=float(rows.max())
    return ax,bot,bot-top
k0=np.median([anchor(cells[(f,0)])[2] for f in SHEETS]);SC=WH/k0;print('Q scale',SC)
fr={}
for d in ORDER:
    f,mir=SRC[d]
    for i in range(8):
        sub=cells[(f,i)];im=Image.fromarray(sub)
        if mir:im=im.transpose(Image.FLIP_LEFT_RIGHT)
        im=im.resize((max(1,round(im.width*SC)),max(1,round(im.height*SC))),Image.LANCZOS);a=np.array(im);ax,bot,h=anchor(a);fr[(d,i)]=(a,ax,bot)
L=max(f[1] for f in fr.values());R=max(f[0].shape[1]-f[1] for f in fr.values());U=max(f[2] for f in fr.values());D=max(f[0].shape[0]-f[2] for f in fr.values())
QW=int(np.ceil(L+R))+2;QH=int(np.ceil(U+D))+2;QX=int(np.ceil(L))+1;QY=int(np.ceil(U))+1
Q=Image.new('RGBA',(QW*8,QH*8),(0,0,0,0))
for gi,d in enumerate(ORDER):
    for i in range(8):a,ax,bot=fr[(d,i)];Q.alpha_composite(Image.fromarray(a),(i*QW+int(round(QX-ax)),gi*QH+int(round(QY-bot))))
Q.save(OUT+'mantis_q.webp',quality=88,method=6)
meta={'move':dict(cw=CW,ch=CH,ax=mw['ax'],ay=mw['ay'],h=round(WH,1)),'q':dict(cw=QW,ch=QH,ax=QX,ay=QY,h=round(WH,1))}
json.dump(meta,open('mantis/meta.json','w'));print(json.dumps(meta))
for name,img,cw_,ch_ in [('walk',W,CW,CH),('q',Q,QW,QH)]:
    bg=Image.new('RGBA',img.size,(70,76,82,255));bg.alpha_composite(img);s=1600/bg.width;bg.convert('RGB').resize((int(bg.width*s),int(bg.height*s))).save('mantis/'+name+'_prev.jpg',quality=85)
