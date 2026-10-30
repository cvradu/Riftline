import math,json
from PIL import Image,ImageDraw
IC=math.sqrt(0.5);IK=0.6
A=dict(cx=628,cy=552,k=0.47,v=1.15)
def w2i(dx,dy):return (A['cx']+(dx+dy)*IC*A['k'], A['cy']+(dy-dx)*IC*IK*A['k']*A['v'])
def i2w(ix,iy):
    u=(ix-A['cx'])/A['k']/IC; w=(iy-A['cy'])/(A['k']*A['v']*IK*IC); return ((u-w)/2,(u+w)/2)
# floor edge, traced on the art (image px), clockwise from the top gate
EDGE=[(628,205),(665,206),(700,215),(760,218),(820,222),(870,230),(905,250),(950,274),(1000,305),(1040,340),(1060,380),(1072,420),(1082,455),(1100,495),(1114,545),(1100,592),(1095,630),(1092,670),(1080,705),(1050,760),(1015,795),(975,830),(930,855),(880,870),(840,878),(770,880),(700,882),(628,884),
      (556,882),(486,880),(414,878),(374,870),(324,855),(279,830),(239,795),(204,760),(174,705),(162,670),(159,630),(154,592),(140,545),(154,495),(172,455),(182,420),(194,380),(214,340),(254,305),(304,274),(349,250),(384,230),(434,222),(494,218),(554,215),(590,206)]
# ruins: footprint centre on the art, radius in world units
ROCKS=[(440,392,62),(492,358,34),(388,432,52),  (815,392,62),(765,362,34),(868,440,52),  (372,684,64),(472,752,46),(400,632,30),  (880,668,58),(800,752,52),(762,760,30)]
# brush: centre on the art, radius in world units, garden id
BUSH=[(330,400,130,0),(400,330,110,0),(470,450,90,0),  (925,400,130,1),(860,330,110,1),(790,450,90,1),
      (320,712,130,2),(400,760,110,2),(470,660,80,2),  (935,712,130,3),(860,764,110,3),(790,668,80,3)]
PORT=[(628,232),(628,858),(176,546),(1080,546)]   # top, bottom, left, right
PLANT=[(520,452),(738,452),(520,652),(738,652)]
SPAWN=[(300,552),(956,552)]
def save():
    im=Image.open('src.webp').convert('RGB');d=ImageDraw.Draw(im,'RGBA')
    d.line(EDGE+[EDGE[0]],fill=(255,0,255,255),width=3)
    def circ(ix,iy,r,col,width=2,fill=None):
        dx,dy=i2w(ix,iy);pts=[w2i(dx+math.cos(a/40*math.tau)*r,dy+math.sin(a/40*math.tau)*r) for a in range(41)]
        if fill:d.polygon(pts,fill=fill)
        d.line(pts,fill=col,width=width)
    for x,y,r in ROCKS:circ(x,y,r,(255,40,40,255),2,(255,40,40,70))
    for x,y,r,g in BUSH:circ(x,y,r,(40,255,80,255),2)
    for x,y in PORT:circ(x,y,44,(0,240,255,255),3)
    for x,y in PLANT:circ(x,y,26,(255,255,0,255),3)
    for x,y in SPAWN:circ(x,y,70,(80,140,255,255),3)
    circ(628,552,270,(255,200,120,255),2)
    im.save('overlay.png')
if __name__=='__main__':
    save()
    # world radius of the edge by angle
    pol=[i2w(x,y) for x,y in EDGE];rs=[math.hypot(*p) for p in pol]
    print('edge r min/max/mean',int(min(rs)),int(max(rs)),int(sum(rs)/len(rs)))
