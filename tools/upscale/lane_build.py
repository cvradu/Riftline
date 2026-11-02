import numpy as np,json
from PIL import Image,ImageFilter,ImageDraw
R=json.load(open('lane2/rect.json'));yh,cx,yc=R['yh'],R['cx'],R['yc'];D=yc-yh
fwd=lambda x,y:(cx+(x-cx)*D/(y-yh),yc+D*(y-yc)/(y-yh))
def inv(X,Y):
    y=((Y-yc)*yh-D*yc)/(Y-yc-D);x=cx+(X-cx)*(y-yh)/D;return x,y
import sys
UP=4;src=Image.open('upscale/lane_x4.png').convert('RGBA');W0,H0=src.size[0]//UP,src.size[1]//UP
cs=[fwd(x,y) for x,y in [(0,0),(W0,0),(0,H0),(W0,H0)]]
X0=min(c[0] for c in cs)-4;X1=max(c[0] for c in cs)+4;Y0=min(c[1] for c in cs)-4;Y1=max(c[1] for c in cs)+4
RES=4;OW=int((X1-X0)*RES);OH=int((Y1-Y0)*RES)
# homography: output pixel -> source pixel, from four exact correspondences
o=[(0,0),(OW,0),(0,OH),(OW,OH)];s=[tuple(c*UP for c in inv(X0+ox/RES,Y0+oy/RES)) for ox,oy in o]
A=[];b=[]
for (ox,oy),(sx,sy) in zip(o,s):
    A.append([ox,oy,1,0,0,0,-sx*ox,-sx*oy]);b.append(sx);A.append([0,0,0,ox,oy,1,-sy*ox,-sy*oy]);b.append(sy)
h=np.linalg.solve(np.array(A,float),np.array(b,float))
# premultiply alpha so the resampled edge does not pick up dark fringe from transparent pixels
arr=np.array(src).astype(float);a=arr[...,3:]/255;pm=np.concatenate([arr[...,:3]*a,arr[...,3:]],-1).astype(np.uint8)
up=Image.fromarray(pm,'RGBA').transform((OW,OH),Image.PERSPECTIVE,tuple(h),Image.BICUBIC)
u=np.array(up).astype(float);al=u[...,3:]/255;rgb=np.where(al>0.004,u[...,:3]/np.maximum(al,0.004),0)
out=Image.fromarray(np.concatenate([np.clip(rgb,0,255),u[...,3:]],-1).astype(np.uint8),'RGBA')
out.save('../assets/lane2.webp',quality=88,method=6)
print('rectified',OW,OH,'origin',round(X0,1),round(Y0,1))
