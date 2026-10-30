import numpy as np,sys
from PIL import Image
def label(m):
    H,W=m.shape;lab=np.zeros((H,W),np.int32);n=0;info=[]
    for y0 in range(H):
        row=m[y0]
        for x0 in np.nonzero(row&(lab[y0]==0))[0]:
            if lab[y0,x0]:continue
            n+=1;st=[(y0,x0)];lab[y0,x0]=n;cnt=0;ys=[];xs=[]
            while st:
                y,x=st.pop();cnt+=1;ys.append(y);xs.append(x)
                for yy,xx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
                    if 0<=yy<H and 0<=xx<W and m[yy,xx] and not lab[yy,xx]:lab[yy,xx]=n;st.append((yy,xx))
            info.append(dict(id=n,n=cnt,x0=min(xs),x1=max(xs),y0=min(ys),y1=max(ys),cx=float(np.mean(xs)),cy=float(np.mean(ys))))
    return lab,info
if __name__=='__main__':
    A=np.array(Image.open(sys.argv[1]).convert('RGBA'))
    lab,info=label(A[...,3]>30)
    H,W=A.shape[:2]
    for c in sorted(info,key=lambda c:(int(c['cy']//(H/4)),int(c['cx']//(W/4)),-c['n'])):
        if c['n']<15:continue
        print('cell',int(c['cy']//(H/4)),int(c['cx']//(W/4)),'n',c['n'],'bbox',c['x0'],c['y0'],c['x1'],c['y1'])
