import numpy as np
from PIL import Image
import sys
sys.path.insert(0,'marty6');sys.path.insert(0,'.')
from cut import cut
def measure(a):
    ys,xs=np.nonzero(a[...,3]>140);t,b=ys.min(),ys.max();h=b-t
    band=(ys>t+h*0.3)&(ys<t+h*0.75);ax=float(np.median(xs[band]))
    cnt=np.bincount(ys,minlength=a.shape[0]);rows=np.nonzero(cnt>=6)[0];foot=float(rows.max())
    return ax,foot,foot-t,np.percentile(xs,98)-np.percentile(xs,2)
for k in range(53,58):
    A,boxes,xc=cut(k);H,W=A.shape[:2];res=[]
    for i,(x0,y0,x1,y1) in enumerate(boxes):
        sub=A[y0:y1,x0:x1].copy()
        # keep only the biggest blob's neighbourhood for measuring
        ax,foot,h,w=measure(sub);c,r=i%6,i//6
        res.append((ax+x0-c*W/6,foot+y0-r*H/6,h,w))
    R=np.array(res);print(k,'x rel uniform: min %.0f max %.0f sd %.1f | foot rel: min %.0f max %.0f sd %.1f | h %.0f-%.0f | w %.0f-%.0f'%(R[:,0].min(),R[:,0].max(),R[:,0].std(),R[:,1].min(),R[:,1].max(),R[:,1].std(),R[:,2].min(),R[:,2].max(),R[:,3].min(),R[:,3].max()))
    print('   x',' '.join('%.0f'%v for v in R[:,0]));print('   y',' '.join('%.0f'%v for v in R[:,1]))
