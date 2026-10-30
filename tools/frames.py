import sys, json
import numpy as np
from PIL import Image, ImageFilter
def detect(path):
    im=Image.open(path).convert('RGBA');a=np.array(im).astype(int)
    dark=(a[:,:,3]>170)&(a[:,:,:3].max(axis=2)<80)
    H,W=dark.shape;S=4;h,w=H//S,W//S
    small=dark[:h*S,:w*S].reshape(h,S,w,S).sum(axis=(1,3))>3
    m=Image.fromarray((small*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    small=np.array(m)>0
    lab=np.zeros(small.shape,int);n=0;comps=[]
    for y in range(h):
        for x in range(w):
            if small[y,x] and not lab[y,x]:
                n+=1;st=[(y,x)];lab[y,x]=n;pts=[]
                while st:
                    cy,cx=st.pop();pts.append((cy,cx))
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        yy,xx=cy+dy,cx+dx
                        if 0<=yy<h and 0<=xx<w and small[yy,xx] and not lab[yy,xx]:
                            lab[yy,xx]=n;st.append((yy,xx))
                if len(pts)>120:
                    ys=[p[0] for p in pts];xs=[p[1] for p in pts]
                    y0,y1,x0,x1=min(ys)*S,(max(ys)+1)*S,min(xs)*S,(max(xs)+1)*S
                    sub=dark[y0:y1,x0:x1];yy,xx=np.nonzero(sub)
                    comps.append(dict(cx=float(xx.mean()+x0),cy=float(yy.mean()+y0),bot=int(np.percentile(yy,99.5)+y0),top=int(yy.min()+y0),area=len(pts)))
    return comps
def cluster(vals,gap):
    order=sorted(range(len(vals)),key=lambda i:vals[i]);groups=[];cur=[order[0]]
    for i in order[1:]:
        if vals[i]-vals[cur[-1]]>gap:groups.append(cur);cur=[i]
        else:cur.append(i)
    groups.append(cur);return groups
out={}
for n in sys.argv[1:]:
    comps=detect(f'../images/{n}.webp')
    rows=cluster([c['cy'] for c in comps],40)
    print(n,'components',len(comps),'rows',len(rows),[len(r) for r in rows])
    grid=[]
    for r in rows:
        rr=sorted(r,key=lambda i:comps[i]['cx'])
        grid.append([comps[i] for i in rr])
    for gi,g in enumerate(grid):print('  row',gi,' '.join(f"({c['cx']:.0f},{c['bot']},h{c['bot']-c['top']})" for c in g))
    out[n]=grid
json.dump(out,open('frames.json','w'))
