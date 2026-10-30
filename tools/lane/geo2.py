import math
from PIL import Image,ImageDraw
import geo  # polygon and bush art coords
IK=0.6
L=(201,625);R=(1611,152)
slope=(L[1]-R[1])/(R[0]-L[0]);PSI=math.atan(slope/IK);CS,SN=math.cos(PSI),math.sin(PSI)
SIG=5900*CS/(R[0]-L[0])
OFF=[0,0]
def i2w(ix,iy):
    u=SIG*(ix-L[0]);v=SIG*(iy-L[1]);return (250+u*CS-v/IK*SN+OFF[0],650+u*SN+v/IK*CS+OFF[1])
def w2i(wx,wy):
    dx,dy=wx-250-OFF[0],wy-650-OFF[1];u=dx*CS+dy*SN;v=(dy*CS-dx*SN)*IK;return (L[0]+u/SIG,L[1]+v/SIG)
print('psi deg',math.degrees(PSI),'sigma',SIG)
c=i2w(925,394);dl=i2w(550,522);dr=i2w(1300,266);print('centre',[round(v) for v in c],'diamonds',[round(v) for v in dl],[round(v) for v in dr])
OFF[0]=-( (dl[0]+dr[0])/2-3200 );OFF[1]=-((dl[1]+dr[1])/2-650)*0.5
print('off',OFF)
for n,p in [('dL',(550,522)),('dR',(1300,266)),('glowL',L),('glowR',R),('centre',(925,394)),('alcA',(850,262)),('alcB',(1030,528))]:print(n,[round(v) for v in i2w(*p)])
pw=[i2w(*p) for p in geo.POLY]
far=[pw[i] for i in (4,5,6,19,20)];near=[pw[i] for i in (40,41,42,32,33)]
print('far edge y',[round(p[1]) for p in far],'near edge y',[round(p[1]) for p in near])
print('poly x range',round(min(p[0] for p in pw)),round(max(p[0] for p in pw)),'y range',round(min(p[1] for p in pw)),round(max(p[1] for p in pw)))
for b in geo.BUSH:print('bush',b,[round(v) for v in i2w(b[0],b[1])])
OFF[:]=[-44,-32]
def draw(out,BR=140,REL=[(3230,-150),(3140,1580)]):
    im=Image.open('src.webp').convert('RGB');d=ImageDraw.Draw(im,'RGBA')
    d.line(geo.POLY+[geo.POLY[0]],fill=(255,0,255,255),width=2)
    def circ(wx,wy,r,col,w=2):
        pts=[w2i(wx+math.cos(a/40*math.tau)*r,wy+math.sin(a/40*math.tau)*r) for a in range(41)];d.line(pts,fill=col,width=w)
    for x,y,r in geo.BUSH:circ(*i2w(x,y),BR,(40,255,80,255))
    for x,y in REL:circ(x,y,30,(255,255,0,255),3);circ(x,y,62,(255,255,0,120),1)
    for f in [(250,650),(6150,650)]:circ(*f,320,(0,200,255,255))
    for tx in [1624,6400-1624]:circ(tx,650,88,(255,60,60,255),3)
    for wy in [200,650,1150]:d.line([w2i(0,wy),w2i(6400,wy)],fill=(255,255,255,140),width=1)
    im.save(out)
draw('ov3.png')
