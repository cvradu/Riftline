# Marty's idle: column 0 of every row is the standing still; columns 1..36 are the look-around loop for the directions that have one.
# Frames are taken per cell of the 6x6 sheet (body plus loose bits centred in the cell), scaled to the still and anchored on their own feet.
import numpy as np,json,sys
from PIL import Image
sys.path.insert(0,'marty4')
from comps import label
IDLE={1:53,2:54,3:55,4:56,5:57}   # game row (S,SW,W,NW,N,NE,E,SE) -> sheet
M=45
def measure(a):
    ys,xs=np.nonzero(a[...,3]>140);t,b=ys.min(),ys.max();h=b-t
    band=(ys>t+h*0.3)&(ys<t+h*0.75);ax=float(np.median(xs[band]))
    cnt=np.bincount(ys,minlength=a.shape[0]);rows=np.nonzero(cnt>=6)[0];foot=float(rows.max())
    return ax,foot,foot-t,np.percentile(xs,98)-np.percentile(xs,2)
def frames_of(k):
    A=np.array(Image.open(f'../images/{k}.webp').convert('RGBA'));H,W=A.shape[:2];cw,ch=W/6,H/6;out=[]
    for i in range(36):
        c,r=i%6,i//6;X0,Y0=int(c*cw)-M,int(r*ch)-M;X1,Y1=int((c+1)*cw)+M,int((r+1)*ch)+M
        x0,y0=max(0,X0),max(0,Y0);sub=A[y0:min(H,Y1),x0:min(W,X1)].copy();m=sub[...,3]>30;lab,info=label(m)
        ix0,iy0=c*cw-x0,r*ch-y0;keep=np.zeros_like(m)
        big=max(info,key=lambda q:q['n'])
        for q in info:
            if q is big or (q['n']>=30 and ix0<=q['cx']<ix0+cw and iy0<=q['cy']<iy0+ch):keep|=lab==q['id']
        sub[...,3]=np.where(keep,sub[...,3],0);out.append(sub)
    return out
STILL=json.load(open('marty5/meta.json'));SA=np.array(Image.open('marty6/idle_stills_backup.webp').convert('RGBA'))   # the stills-only atlas from marty5
stills=[SA[r*STILL['ch']:(r+1)*STILL['ch'],0:STILL['cw']] for r in range(8)]
raw={};ratios=[];srow={}
for row,k in IDLE.items():
    # overall size by area: height and width disagree because the loop's flag and arms sit differently from the still's
    fr=frames_of(k);raw[row]=fr;area=lambda a:np.sqrt((a[...,3]>140).sum())
    for i in (0,35):ratios.append(area(stills[row])/area(fr[i]))
    srow[row]=float(np.mean(ratios[-2:]))   # per direction, so the loop starts and ends exactly the still's size
    print(k,'row',row,'ratios frame0,35',[round(float(v),3) for v in ratios[-2:]])
print('scales',{r:round(v,3) for r,v in srow.items()})
cells=[]  # (row,col,array,ax,foot)
for r in range(8):
    a=stills[r];ax,foot,_,_=measure(a);cells.append((r,0,a,ax,foot))
for row,fr in raw.items():
    s=srow[row]
    for i,a in enumerate(fr):
        im=Image.fromarray(a);im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS);b=np.array(im);ax,foot,_,_=measure(b);cells.append((row,1+i,b,ax,foot))
ext=[0,0,0,0]
for r,c,a,ax,foot in cells:
    ys,xs=np.nonzero(a[...,3]>8);ext=[max(ext[0],ax-xs.min()),max(ext[1],xs.max()-ax),max(ext[2],foot-ys.min()),max(ext[3],ys.max()-foot)]
CW=int(np.ceil(ext[0]+ext[1]))+4;CH=int(np.ceil(ext[2]+ext[3]))+4;AX=int(np.ceil(ext[0]))+2;AY=int(np.ceil(ext[2]))+2;N=37
atlas=Image.new('RGBA',(CW*N,CH*8),(0,0,0,0))
for r,c,a,ax,foot in cells:
    cell=Image.new('RGBA',(CW,CH),(0,0,0,0));im=Image.fromarray(a);cell.paste(im,(int(round(AX-ax)),int(round(AY-foot))),im);atlas.alpha_composite(cell,(c*CW,r*CH))
atlas.save('/home/user/riftline/assets/marty_idle.webp',quality=86,method=6)
anim=[36 if r in IDLE else 0 for r in range(8)]
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=206.5,n=N,anim=anim);json.dump(meta,open('marty6/meta.json','w'));print(json.dumps(meta))
# contact sheet: each idle row, every 3rd frame, with the foot line
from PIL import ImageDraw
pv=Image.new('RGBA',(CW*13,CH*5),(200,205,210,255));d=ImageDraw.Draw(pv)
for j,row in enumerate(IDLE):
    for n,c in enumerate([0]+list(range(1,37,3))):pv.alpha_composite(atlas.crop((c*CW,row*CH,(c+1)*CW,(row+1)*CH)),(n*CW,j*CH))
    d.line([(0,j*CH+AY),(pv.width,j*CH+AY)],fill=(255,0,0,255))
pv.convert('RGB').resize((pv.width//2,pv.height//2)).save('marty6/prev.jpg',quality=85)
