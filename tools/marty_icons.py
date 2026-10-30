# Marty's five ability icons from the presentation card: find each gold frame, crop just inside it, pack a 128px strip (P,Q,RMB,E,R).
import numpy as np,sys
from PIL import Image
A=np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int);H,W=A.shape[:2]
r,g,b=A[...,0],A[...,1],A[...,2];gold=(r>150)&(g>110)&(b<120)&(r>b+60)
# frame columns: runs of x where the frame band holds many gold pixels
band=gold[100:480].sum(0);cols=band>60
runs=[];x=0
while x<W:
    if cols[x]:
        j=x
        while j<W and cols[j]:j+=1
        runs.append((x,j));x=j
    else:x+=1
print('gold column runs',runs)
rows=gold[:, :].sum(1);ys=np.nonzero(rows>150)[0];y0,y1=ys.min(),ys.max();print('frame rows',y0,y1)
# pair runs into frames: left edge run, right edge run
# the art inside the frames is gold too, so take the outer edges of the five evenly spaced frames as measured on this card
frames=[(25,390),(421,787),(818,1183),(1214,1580),(1611,1977)];print('frames',frames)
out=Image.new('RGB',(128*5,128))
for n,(x0,x1) in enumerate(frames):
    m=int((x1-x0)*0.035)+4;im=Image.fromarray(A[y0+m:y1-m,x0+m:x1-m].astype(np.uint8));out.paste(im.resize((128,128),Image.LANCZOS),(n*128,0))
out.save(sys.argv[2],quality=90);out.resize((640*2,256)).save(sys.argv[3])
