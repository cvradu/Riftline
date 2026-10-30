# the walkable deck of the new bridge: beige floor + the grey glass bays, planters filled in as holes; walls, rails and lights excluded
import numpy as np,json,sys
from PIL import Image
A=np.array(Image.open('../images/29.webp').convert('RGBA')).astype(int);H,W=A.shape[:2]
r,g,b,a=A[...,0],A[...,1],A[...,2],A[...,3]
mx=np.maximum(np.maximum(r,g),b);mn=np.minimum(np.minimum(r,g),b);sat=(mx-mn)/np.maximum(mx,1);lum=(r*3+g*6+b)/10
floor=(a>200)&(lum>150)&(sat<0.32)&(r>=b-5)
glass=(a>200)&(lum>85)&(lum<185)&(sat<0.35)&(b>=r-6)&(g>=r-12)
m=floor|glass
def shift(x,dy,dx):
    y=np.zeros_like(x);ys=slice(max(dy,0),H+min(dy,0));yd=slice(max(-dy,0),H+min(-dy,0));xs=slice(max(dx,0),W+min(dx,0));xd=slice(max(-dx,0),W+min(-dx,0));y[ys,xs]=x[yd,xd];return y
def dil(x,k):
    o=x.copy()
    for dy in range(-k,k+1):
        for dx in range(-k,k+1):
            if dy*dy+dx*dx<=k*k:o|=shift(x,dy,dx)
    return o
def ero(x,k):return ~dil(~x,k)
m=ero(dil(m,3),3)   # close tile seams and painted lines
# largest component
lab=np.zeros((H,W),np.int32);cur=0;best=(0,0)
for y0 in range(0,H,3):
    for x0 in range(0,W,3):
        if m[y0,x0] and not lab[y0,x0]:
            cur+=1;st=[(y0,x0)];lab[y0,x0]=cur;n=0
            while st:
                y,x=st.pop();n+=1
                for yy,xx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
                    if 0<=yy<H and 0<=xx<W and m[yy,xx] and not lab[yy,xx]:lab[yy,xx]=cur;st.append((yy,xx))
            if n>best[0]:best=(n,cur)
m=lab==best[1]
# fill holes (the planters and painted emblems): everything not reachable from the border through non-deck is deck
out=np.zeros((H,W),bool);st=[(0,0)];out[0,0]=True
while st:
    y,x=st.pop()
    for yy,xx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
        if 0<=yy<H and 0<=xx<W and not m[yy,xx] and not out[yy,xx]:out[yy,xx]=True;st.append((yy,xx))
m=~out
m=dil(ero(m,6),6)  # drop thin spurs onto the wall tops
np.save('lane2/mask.npy',m)
im=Image.open('../images/29.webp').convert('RGBA');bg=Image.new('RGBA',im.size,(40,40,48,255));bg.alpha_composite(im)
ov=np.array(bg).copy();ov[m]=(ov[m]*0.55+np.array([0,255,90,255])*0.45).astype(np.uint8);Image.fromarray(ov).convert('RGB').save('lane2/mask_ov.png')
print('deck px',m.sum())
