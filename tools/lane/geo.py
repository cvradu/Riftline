import math,json,sys
from PIL import Image,ImageDraw
# image -> world: the art is sheared (x'=x, y'=y+SH*x) so its bridge runs along the world x axis; fountains sit on the two platform glows
L=(201,625);R=(1611,152);SH=-0.6+(L[1]-R[1])/(R[0]-L[0])
IC=math.sqrt(0.5);IK=0.6
S=5900*IC/(R[0]-L[0])          # screen units per art px (at SCALE 1)
ex=(IC/S,(-IC*IK-SH*IC)/S);ey=(IC/S,(IC*IK-SH*IC)/S)
def i2w(ix,iy):
    dx,dy=ix-L[0],iy-L[1];s_=dx/ex[0];b=(dy-ex[1]*s_)/(ey[1]-ex[1]);a=s_-b;return (250+a-38,650+b-20)
def w2i(wx,wy):a,b=wx-250+38,wy-650+20;return (L[0]+a*ex[0]+b*ey[0],L[1]+a*ex[1]+b*ey[1])
POLY=[(45,615),(75,565),(125,525),(195,503),(290,497),(360,494),(540,440),(560,410),(600,395),(760,330),(765,300),(760,240),(800,222),(900,200),(945,215),(975,268),(1020,262),(1030,205),(1190,165),(1215,203),(1395,158),(1430,110),(1500,75),(1600,65),(1690,80),(1740,120),(1750,165),(1730,210),
      (1700,235),(1640,265),(1560,280),(1500,280),(1440,295),(1335,352),(1315,398),(1112,455),(1140,535),(930,600),(900,520),(880,540),(650,605),(600,600),(420,650),(380,680),(320,700),(240,725),(150,722),(95,700),(55,665)]
BUSH=[(628,398,120),(712,366,120),(1062,262,120),(1150,234,120),(708,566,120),(800,536,120),(1158,425,120),(1248,393,120)]; RELIC=[(850,265),(1030,525)]
def draw(out='overlay.png',crop=None,z=1):
    im=Image.open('src.webp').convert('RGB');d=ImageDraw.Draw(im,'RGBA')
    d.line(POLY+[POLY[0]],fill=(255,0,255,255),width=2)
    for i,(x,y) in enumerate(POLY):d.text((x+3,y-10),str(i),fill=(255,255,0))
    def circ(wx,wy,r,col,w=2):
        pts=[w2i(wx+math.cos(a/40*math.tau)*r,wy+math.sin(a/40*math.tau)*r) for a in range(41)];d.line(pts,fill=col,width=w)
    for x,y,r in BUSH:circ(*i2w(x,y),r,(40,255,80,255))
    for x,y in [(3360,150),(3040,1250)]:circ(x,y,30,(255,255,0,255),3)
    for f in [(250,650),(6150,650)]:circ(*f,320,(0,200,255,255))
    for tx in [1623,6400-1623]:circ(tx,650,88,(255,60,60,255),3)
    # world grid lines along the lane every 500 units, and y = 650 +- 400
    for wy in [250,650,1050]:d.line([w2i(0,wy),w2i(6400,wy)],fill=(255,255,255,120),width=1)
    if crop:im=im.crop(crop).resize(((crop[2]-crop[0])*z,(crop[3]-crop[1])*z),Image.LANCZOS)
    im.save(out)
if __name__=='__main__':
    print('shear',SH,'S',S,'ex',ex,'ey',ey,'centre',i2w(925,394))
    draw()
