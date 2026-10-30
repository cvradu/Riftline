import sys,json
from PIL import Image,ImageDraw
import geo
def zoom(name,box,poly,z=3,step=10):
    im=Image.open('src.webp').convert('RGB');x0,y0,x1,y1=box
    c=im.crop(box).resize(((x1-x0)*z,(y1-y0)*z),Image.LANCZOS);d=ImageDraw.Draw(c,'RGBA')
    for x in range((x0//step+1)*step,x1,step):
        X=(x-x0)*z;d.line([(X,0),(X,c.height)],fill=(255,0,0,160) if x%50==0 else (255,170,170,70),width=1)
        if x%50==0:d.text((X+2,2),str(x),fill=(255,255,0))
    for y in range((y0//step+1)*step,y1,step):
        Y=(y-y0)*z;d.line([(0,Y),(c.width,Y)],fill=(0,0,255,160) if y%50==0 else (170,170,255,70),width=1)
        if y%50==0:d.text((2,Y+2),str(y),fill=(0,255,255))
    pts=[((x-x0)*z,(y-y0)*z) for x,y in poly]
    d.line(pts+[pts[0]],fill=(255,0,255,255),width=2)
    for i,(x,y) in enumerate(poly):
        if x0<=x<=x1 and y0<=y<=y1:d.text(((x-x0)*z+3,(y-y0)*z-12),str(i),fill=(255,255,255))
    c.save(name)
if __name__=='__main__':
    poly=json.load(open(sys.argv[1])) if len(sys.argv)>1 else geo.POLY
    zoom('zA.png',(700,160,1010,340),poly)
    zoom('zB.png',(860,420,1170,620),poly)
