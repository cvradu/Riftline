import sys, json
import numpy as np
from PIL import Image
def peaks(prof,k,minsep,win):
    p=np.convolve(prof,np.ones(win)/win,mode='same');p=p.copy();res=[]
    for _ in range(k):
        i=int(p.argmax());res.append(i);p[max(0,i-minsep):i+minsep]=-1
    return sorted(res)
out={}
for n,rows,cols in [(2,8,6),(3,8,6),(4,8,6),(5,8,6),(6,8,6)]:
    a=np.array(Image.open(f'../images/{n}.webp').convert('RGBA')).astype(int)
    dark=(a[:,:,3]>170)&(a[:,:,:3].max(axis=2)<70)
    H,W=dark.shape
    ry=peaks(dark.sum(axis=1).astype(float),rows,int(H/rows*0.6),15)
    cx=peaks(dark.sum(axis=0).astype(float),cols,int((W*0.85)/cols*0.6),25)
    print(n,'row centres',ry,'\n  col centres',cx)
    out[n]={'ry':ry,'cx':cx}
json.dump(out,open('grid.json','w'))
