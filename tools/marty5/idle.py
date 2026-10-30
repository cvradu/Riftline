# Marty's standing stills, one per direction: drop stray specks, scale to the walk sheet, align on the feet, pack rows S,SW,W,NW,N,NE,E,SE.
import numpy as np,json,sys
from PIL import Image
sys.path.insert(0,'marty4')
from comps import label
STILLS=[49,45,47,50,52,48,51,46]
WALK=json.load(open('marty4/meta.json'));WA=np.array(Image.open('/home/user/riftline/assets/marty_move.webp').convert('RGBA'))
def measure(a):
    ys,xs=np.nonzero(a[...,3]>140);t,b=ys.min(),ys.max();h=b-t
    band=(ys>t+h*0.3)&(ys<t+h*0.75);ax=float(np.median(xs[band]))
    cnt=np.bincount(ys,minlength=a.shape[0]);rows=np.nonzero(cnt>=6)[0];foot=float(rows.max())
    return ax,foot,foot-t,np.percentile(xs,98)-np.percentile(xs,2)
# the walk's own size per direction: median over its 16 frames
wh={}
for r in range(8):
    hs=[];ws=[]
    for c in range(16):
        cell=WA[r*WALK['ch']:(r+1)*WALK['ch'],c*WALK['cw']:(c+1)*WALK['cw']];_,_,h,w=measure(cell);hs.append(h);ws.append(w)
    wh[r]=(float(np.median(hs)),float(np.median(ws)))
out=[]
for r,k in enumerate(STILLS):
    A=np.array(Image.open(f'../images/{k}.png').convert('RGBA'));m=A[...,3]>30;lab,info=label(m);mx=max(info,key=lambda q:q['n'])
    top,bot=mx['y0'],mx['y1'];hh=bot-top;keep=lab==mx['id']
    for q in info:
        if q is not mx and q['n']>=40 and q['cy']<top+0.3*hh:keep|=lab==q['id']   # flag, lamp
    from build_helpers import dil
    A[...,3]=np.where(dil(keep,1),A[...,3],0)
    ax,foot,h,w=measure(A);out.append((r,k,A,ax,foot,h,w))
    print('row',r,'img',k,'still h/w',round(h),round(w),'walk h/w',[round(v,1) for v in wh[r]],'ratio h',round(wh[r][0]/h,4),'w',round(wh[r][1]/w,4),'dropped px',int(m.sum()-keep.sum()))
s=float(np.median([wh[r][0]/h for r,k,A,ax,foot,h,w in out]));print('scale',s)
fr=[]
for r,k,A,ax,foot,h,w in out:
    im=Image.fromarray(A);im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS);a=np.array(im)
    ys,xs=np.nonzero(a[...,3]>8);fr.append((r,a,ax*s,foot*s,xs.min(),xs.max(),ys.min(),ys.max()))
L=max(ax-x0 for r,a,ax,ft,x0,x1,y0,y1 in fr);R=max(x1-ax for r,a,ax,ft,x0,x1,y0,y1 in fr);U=max(ft-y0 for r,a,ax,ft,x0,x1,y0,y1 in fr);D=max(y1-ft for r,a,ax,ft,x0,x1,y0,y1 in fr)
CW=int(np.ceil(L+R))+4;CH=int(np.ceil(U+max(D,0)))+4;AX=int(np.ceil(L))+2;AY=int(np.ceil(U))+2
atlas=Image.new('RGBA',(CW,CH*8),(0,0,0,0))
for r,a,ax,ft,x0,x1,y0,y1 in fr:
    cell=Image.new('RGBA',(CW,CH),(0,0,0,0));im=Image.fromarray(a);cell.paste(im,(int(round(AX-ax)),int(round(AY-ft))),im);atlas.alpha_composite(cell,(0,r*CH))
atlas.save('/home/user/riftline/assets/marty_idle.webp',quality=88,method=6)
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=WALK['h'],n=1);json.dump(meta,open('marty5/meta.json','w'));print(json.dumps(meta))
# preview: each direction's still next to walk frame 0, both on the same foot line
pv=Image.new('RGBA',((CW+WALK['cw'])*8,max(CH,WALK['ch'])),(200,205,210,255))
for r in range(8):
    x=r*(CW+WALK['cw']);base=max(AY,WALK['ay'])
    pv.alpha_composite(atlas.crop((0,r*CH,CW,(r+1)*CH)),(x,base-AY));pv.alpha_composite(Image.fromarray(WA[r*WALK['ch']:(r+1)*WALK['ch'],0:WALK['cw']]),(x+CW,base-WALK['ay']))
pv.convert('RGB').save('marty5/prev.jpg',quality=85)
