# Marty's auto attack: one 6x6 sheet per direction. Take each cell's body, drop the loose squiggles beside the feet,
# scale each direction to its standing still, anchor on the feet (smoothed over time), and pack rows S,SW,W,NW,N,NE,E,SE.
import numpy as np,json,sys
from PIL import Image
sys.path.insert(0,'marty4')
from comps import label
ATK={0:65,1:58,2:59,3:60,4:61,5:62,6:63,7:64}   # game row (S,SW,W,NW,N,NE,E,SE) -> sheet
M=40
def measure(a):
    ys,xs=np.nonzero(a[...,3]>140);t,b=ys.min(),ys.max();h=b-t
    band=(ys>t+h*0.3)&(ys<t+h*0.75);ax=float(np.median(xs[band]))
    cnt=np.bincount(ys,minlength=a.shape[0]);rows=np.nonzero(cnt>=6)[0];foot=float(rows.max())
    return ax,foot,foot-t,np.percentile(xs,99)-np.percentile(xs,1)
def frames_of(k):
    A=np.array(Image.open(f'../images/{k}.webp').convert('RGBA'));H,W=A.shape[:2];cw,ch=W/6,H/6;out=[];gone=[]
    for i in range(36):
        c,r=i%6,i//6;X0,Y0=int(c*cw)-M,int(r*ch)-M;x0,y0=max(0,X0),max(0,Y0);raw=A[y0:min(H,int((r+1)*ch)+M),x0:min(W,int((c+1)*cw)+M)]
        sub=np.zeros((int(ch)+2*M+2,int(cw)+2*M+2,4),np.uint8);sub[y0-Y0:y0-Y0+raw.shape[0],x0-X0:x0-X0+raw.shape[1]]=raw;x0,y0=X0,Y0
        m=sub[...,3]>30;lab,info=label(m);big=max(info,key=lambda q:q['n']);top,hh=big['y0'],big['y1']-big['y0'];keep=lab==big['id']
        ix0,iy0=c*cw-x0,r*ch-y0;g=0
        for q in info:
            if q is big:continue
            inside=ix0<=q['cx']<ix0+cw and iy0<=q['cy']<iy0+ch
            if inside and q['n']>=30 and q['cy']<top+0.3*hh:keep|=lab==q['id']   # flag tip, lamp
            elif inside:g+=q['n']
        sub[...,3]=np.where(keep,sub[...,3],0);out.append(sub);gone.append(g)
    return out,gone
SA=np.array(Image.open('marty6/idle_stills_backup.webp').convert('RGBA'));SM=json.load(open('marty5/meta.json'))
stills=[SA[r*SM['ch']:(r+1)*SM['ch'],0:SM['cw']] for r in range(8)]
area=lambda a:np.sqrt((a[...,3]>140).sum())
cells=[];hit={}
for row,k in ATK.items():
    fr,gone=frames_of(k);s=float(np.mean([area(stills[row])/area(fr[i]) for i in (0,35)]))
    sc=[];
    for a in fr:
        im=Image.fromarray(a);im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS);b=np.array(im);ax,foot,h,w=measure(b);sc.append([b,ax,foot,w])
    # the swing's contact: widest reach in the first two thirds
    # where the punch finishes: the last frame that still moves noticeably (the tail of the sheet is a held pose)
    al=[f[0][...,3].astype(float)/255 for f in sc];mv=[]
    for i in range(35):
        a0,a1=al[i],al[i+1];hh,ww=max(a0.shape[0],a1.shape[0]),max(a0.shape[1],a1.shape[1])
        P=lambda a,dx,dy:np.pad(a,((0,hh-a.shape[0]),(0,ww-a.shape[1])))
        b0=P(a0,0,0);b1=P(a1,0,0);dx=int(round(sc[i+1][1]-sc[i][1]));dy=int(round(sc[i+1][2]-sc[i][2]))
        mv.append(float(np.abs(b0-np.roll(np.roll(b1,-dy,0),-dx,1)).sum()))
    thr=0.35*np.median(mv);hit[row]=max(i+1 for i in range(35) if mv[i]>thr)
    print('   motion',' '.join(str(int(v/100)) for v in mv))
    # anchors: feet per frame, smoothed (median of 5 then mean of 3) so the measure's noise doesn't jitter him
    for j in (1,2):
        v=np.array([f[j] for f in sc]);p=np.pad(v,2,mode='edge');med=np.array([np.median(p[i:i+5]) for i in range(36)]);p=np.pad(med,1,mode='edge');sm=(p[:-2]+p[1:-1]+p[2:])/3
        for i in range(36):sc[i][j]=sm[i]
    for i,(b,ax,foot,w) in enumerate(sc):cells.append((row,i,b,ax,foot))
    print(k,'row',row,'scale',round(s,3),'punch ends at frame',hit[row],'| squiggle px dropped',sum(gone),'frames',sum(1 for x in gone if x))
ext=[0,0,0,0]
for r,c,a,ax,foot in cells:
    ys,xs=np.nonzero(a[...,3]>8);ext=[max(ext[0],ax-xs.min()),max(ext[1],xs.max()-ax),max(ext[2],foot-ys.min()),max(ext[3],ys.max()-foot)]
CW=int(np.ceil(ext[0]+ext[1]))+4;CH=int(np.ceil(ext[2]+ext[3]))+4;AX=int(np.ceil(ext[0]))+2;AY=int(np.ceil(ext[2]))+2;N=36
atlas=Image.new('RGBA',(CW*N,CH*8),(0,0,0,0))
for r,c,a,ax,foot in cells:
    cell=Image.new('RGBA',(CW,CH),(0,0,0,0));im=Image.fromarray(a);cell.paste(im,(int(round(AX-ax)),int(round(AY-foot))),im);atlas.alpha_composite(cell,(c*CW,r*CH))
atlas.save('/home/user/riftline/assets/marty_atk.webp',quality=86,method=6)
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,h=206.5,n=N,rows=[1 if r in ATK else 0 for r in range(8)],hit=[hit.get(r,0) for r in range(8)])
json.dump(meta,open('marty7/meta.json','w'));print(json.dumps(meta))
from PIL import ImageDraw
pv=Image.new('RGBA',(CW*12,CH*8),(200,205,210,255));d=ImageDraw.Draw(pv)
for j,row in enumerate(ATK):
    for n,c in enumerate(range(0,36,3)):pv.alpha_composite(atlas.crop((c*CW,row*CH,(c+1)*CW,(row+1)*CH)),(n*CW,j*CH))
    d.line([(0,j*CH+AY),(pv.width,j*CH+AY)],fill=(255,0,0,255))
pv.convert('RGB').resize((pv.width*2//3,pv.height*2//3)).save('marty7/prev.jpg',quality=85)
