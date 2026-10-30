import numpy as np,json
from PIL import Image,ImageFilter,ImageDraw
R=json.load(open('lane2/rect.json'));yh,cx,yc=R['yh'],R['cx'],R['yc'];D=yc-yh
fwd=lambda x,y:(cx+(x-cx)*D/(y-yh),yc+D*(y-yc)/(y-yh))
def inv(X,Y):
    y=((Y-yc)*yh-D*yc)/(Y-yc-D);x=cx+(X-cx)*(y-yh)/D;return x,y
src=Image.open('../images/29.webp').convert('RGBA');W0,H0=src.size
cs=[fwd(x,y) for x,y in [(0,0),(W0,0),(0,H0),(W0,H0)]]
X0=min(c[0] for c in cs)-4;X1=max(c[0] for c in cs)+4;Y0=min(c[1] for c in cs)-4;Y1=max(c[1] for c in cs)+4
RES=2;OW=int((X1-X0)*RES);OH=int((Y1-Y0)*RES)
# homography: output pixel -> source pixel, from four exact correspondences
o=[(0,0),(OW,0),(0,OH),(OW,OH)];s=[inv(X0+ox/RES,Y0+oy/RES) for ox,oy in o]
A=[];b=[]
for (ox,oy),(sx,sy) in zip(o,s):
    A.append([ox,oy,1,0,0,0,-sx*ox,-sx*oy]);b.append(sx);A.append([0,0,0,ox,oy,1,-sy*ox,-sy*oy]);b.append(sy)
h=np.linalg.solve(np.array(A,float),np.array(b,float))
# premultiply alpha so the resampled edge does not pick up dark fringe from transparent pixels
arr=np.array(src).astype(float);a=arr[...,3:]/255;pm=np.concatenate([arr[...,:3]*a,arr[...,3:]],-1).astype(np.uint8)
up=Image.fromarray(pm,'RGBA').transform((OW,OH),Image.PERSPECTIVE,tuple(h),Image.BICUBIC)
u=np.array(up).astype(float);al=u[...,3:]/255;rgb=np.where(al>0.004,u[...,:3]/np.maximum(al,0.004),0)
out=Image.fromarray(np.concatenate([np.clip(rgb,0,255),u[...,3:]],-1).astype(np.uint8),'RGBA')
rgbI=out.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.6,percent=70,threshold=2));out=Image.merge('RGBA',(*rgbI.split(),out.split()[3]))
out.save('/home/user/riftline/assets/lane2.webp',quality=86,method=6)
print('rectified',OW,OH,'origin',round(X0,1),round(Y0,1))
T=lambda p:[round(fwd(*p)[0]-X0,1),round(fwd(*p)[1]-Y0,1)]
poly=[T(p) for p in json.load(open('lane2/poly.json'))]
feat={'L':(150,710),'R':(1528,90),'C':(906,385),'P1':(725,375),'P2':(960,262),'P3':(845,505),'P4':(1075,400),'B1':(545,420),'B2':(700,612),'B3':(1130,190),'B4':(1270,318)}
F={k:T(v) for k,v in feat.items()}
# the planters' long axes, for two brush patches each
pl={'P1':[(680,392),(770,360)],'P2':[(915,282),(1005,248)],'P3':[(800,522),(890,488)],'P4':[(1030,418),(1120,385)]}
F['bush']={k:[T(p) for p in v] for k,v in pl.items()}
json.dump({'poly':poly,'feat':F,'size':[OW,OH],'res':RES},open('lane2/lane2.json','w'))
print(json.dumps(F))
pv=Image.new('RGBA',out.size,(30,30,40,255));pv.alpha_composite(out);d=ImageDraw.Draw(pv)
d.line([(x*RES,y*RES) for x,y in poly]+[(poly[0][0]*RES,poly[0][1]*RES)],fill=(80,255,120,255),width=3)
for k,v in F.items():
    if k=='bush':continue
    d.ellipse([v[0]*RES-6,v[1]*RES-6,v[0]*RES+6,v[1]*RES+6],fill=(255,60,60,255));d.text((v[0]*RES+8,v[1]*RES-8),k,fill=(255,255,0,255))
pv.convert('RGB').resize((OW//2,OH//2)).save('lane2/rect_prev.jpg',quality=85)
