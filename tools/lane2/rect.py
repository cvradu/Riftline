import numpy as np,json
IK=0.6
PTS={'L':(150,710),'R':(1528,90),'C':(906,385),'P1':(725,375),'P4':(1075,400),'P2':(960,262),'P3':(845,505)}
PAIRS=[('L','R'),('P1','P4'),('P2','P3')]
cx,yc=906,385
def rect(p,yh):
    x,y=p;D=yc-yh;return np.array([cx+(x-cx)*D/(y-yh),yc+D*(y-yc)/(y-yh)])
def iso(p):  # unsquash the vertical so distances are ground distances (up to scale)
    return np.array([p[0],p[1]/IK])
def resid(yh):
    C=iso(rect(PTS['C'],yh));e=[]
    for a,b in PAIRS:
        m=(iso(rect(PTS[a],yh))+iso(rect(PTS[b],yh)))/2;e.append(np.hypot(*(m-C)))
    return e
best=None
for yh in range(-20000,-500,50):
    r=sum(v*v for v in resid(yh))
    if best is None or r<best[0]:best=(r,yh)
print('best horizon',best[1],'residuals',[round(v,1) for v in resid(best[1])])
for yh in (-1e9,best[1]):print(yh,[round(v,1) for v in resid(yh)])
json.dump({'yh':best[1],'cx':cx,'yc':yc},open('lane2/rect.json','w'))
