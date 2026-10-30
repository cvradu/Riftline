# cut the Jetstep flame sheet (4 rows x 8 frames on a 192x256 grid) into a packed atlas with per-row base lines
import sys,json;import numpy as np;from PIL import Image
src=sys.argv[1];out=sys.argv[2]
im=Image.open(src).convert('RGBA');A=np.array(im);H,W=A.shape[:2];CW,CH=W//8,H//4
rows=[];y=0;sheet=[]
for r in range(4):
    band=A[r*CH:(r+1)*CH].copy();band[band[...,3]<24]=0
    prof=(band[...,3]>40).sum(0);occ=np.where(prof>0)[0];runs=[];st=occ[0]
    for a_,b_ in zip(occ[:-1],occ[1:]):
        if b_-a_>6:runs.append([st,a_]);st=b_
    runs.append([st,occ[-1]])
    while len(runs)>8:  # fold stray embers into the nearest frame
        i=min(range(len(runs)),key=lambda i:runs[i][1]-runs[i][0]);a_,b_=runs.pop(i)
        j=min(range(len(runs)),key=lambda j:min(abs(runs[j][0]-b_),abs(a_-runs[j][1])));runs[j]=[min(runs[j][0],a_),max(runs[j][1],b_)]
    assert len(runs)==8,runs
    cw0=max(b_-a_ for a_,b_ in runs)+11
    cells=[]
    for a_,b_ in runs:
        cl=np.zeros((CH,cw0,4),np.uint8);x0_=max(0,a_-5);seg=band[:,x0_:b_+6];cl[:,:seg.shape[1]]=seg;cells.append(cl)
    CW=cw0
    for cl in cells:  # drop faint haze
        cl[cl[...,3]<24]=0
    un=np.zeros((CH,CW),bool)
    for cl in cells:un|=cl[...,3]>40
    ys,xs=np.where(un);x0,x1,y0,y1=xs.min()-2,xs.max()+3,ys.min()-2,ys.max()+3
    x0=max(0,x0);y0=max(0,y0);x1=min(CW,x1);y1=min(CH,y1)
    crop=[cl[y0:y1,x0:x1] for cl in cells];cw,ch=x1-x0,y1-y0
    # per frame: the burning bar's base line (lowest solid pixel per column, robust line fit, embers dropped), as its two ends
    fr=[]
    for cl in crop:
        u=cl[...,3]>110;bx=[];by=[]
        for x in range(cw):
            col=np.where(u[:,x])[0]
            if len(col):bx.append(x);by.append(col.max())
        bx=np.array(bx,float);by=np.array(by,float);m=np.ones(len(bx),bool)
        for it in range(4):
            k,b=np.polyfit(bx[m],by[m],1);m=np.abs(by-(k*bx+b))<10
        xs_=np.sort(bx[m]);runs=[];st=xs_[0]
        for a_,b_ in zip(xs_[:-1],xs_[1:]):
            if b_-a_>5:runs.append((st,a_));st=b_
        runs.append((st,xs_[-1]));lo,hi=max(runs,key=lambda t:t[1]-t[0])
        if r<3:cl[:,:max(0,int(lo)-4)]=0;cl[:,int(hi)+5:]=0
        if r<3:fr.append([round(lo,1),round(k*lo+b-5,1),round(hi,1),round(k*hi+b-5,1)])
        else:
            ys,xs=np.where(u);bot=ys.max();xs2=xs[ys>bot-14];fr.append([round(float(xs2.mean()),1),float(bot-3)])
    rows.append({'y':int(y),'cw':int(cw),'ch':int(ch),'f':fr})
    sheet.append(np.concatenate(crop,axis=1));y+=ch
Wt=max(s.shape[1] for s in sheet);atlas=np.zeros((y,Wt,4),np.uint8);yy=0
for s in sheet:atlas[yy:yy+s.shape[0],:s.shape[1]]=s;yy+=s.shape[0]
Image.fromarray(atlas).save(out,'WEBP',quality=90,method=6)
print(json.dumps(rows))
# preview with base lines
pv=Image.new('RGBA',(Wt,y),(40,44,52,255));pv.alpha_composite(Image.fromarray(atlas))
from PIL import ImageDraw;d=ImageDraw.Draw(pv)
for r in rows:
    for c,f in enumerate(r['f']):
        if len(f)==4:d.line([(c*r['cw']+f[0],r['y']+f[1]),(c*r['cw']+f[2],r['y']+f[3])],fill=(255,80,80,255),width=2)
        else:d.ellipse([c*r['cw']+f[0]-3,r['y']+f[1]-3,c*r['cw']+f[0]+3,r['y']+f[1]+3],fill=(255,80,80,255))
pv.save(out.replace('.webp','_prev.png'))
