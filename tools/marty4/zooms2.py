import numpy as np,sys
from PIL import Image,ImageDraw
# (sheet,frame,x0,y0,x1,y1) crop boxes in cell coords
B=[(37,11,340,280,450,400),(38,14,300,320,410,440),(38,15,300,320,410,440)];B0=[(37,2,300,220,480,420),(37,11,300,220,480,420),(37,12,300,220,480,420),(38,14,240,250,420,440),(38,15,240,250,420,440),(39,10,40,340,220,500),(42,10,100,200,280,380),(42,11,60,180,240,360),(42,4,60,180,240,360)]
tiles=[]
for sh,i,x0,y0,x1,y1 in B:
    A=np.array(Image.open(f'../images/{sh}.webp').convert('RGBA'));ch,cw=A.shape[0]//4,A.shape[1]//4
    r,c=i//4,i%4;cell=A[r*ch:(r+1)*ch,c*cw:(c+1)*cw][y0:y1,x0:x1]
    im=Image.fromarray(cell);bg=Image.new('RGBA',im.size,(200,205,210,255));bg.alpha_composite(im);S=5
    bg=bg.convert('RGB').resize((im.width*S,im.height*S),Image.NEAREST);d=ImageDraw.Draw(bg)
    for gx in range((x0//20+1)*20,x1,20):
        d.line([((gx-x0)*S,0),((gx-x0)*S,bg.height)],fill=(0,160,255) if gx%20 else (255,0,255),width=1)
        if gx%20==0:d.text(((gx-x0)*S+2,2),str(gx),fill=(0,0,255))
    for gy in range((y0//20+1)*20,y1,20):
        d.line([(0,(gy-y0)*S),(bg.width,(gy-y0)*S)],fill=(0,160,255) if gy%20 else (255,0,255),width=1)
        if gy%20==0:d.text((2,(gy-y0)*S+2),str(gy),fill=(0,0,255))
    d.text((bg.width-60,bg.height-14),f'{sh}/{i}',fill=(200,0,0));tiles.append(bg)
w=max(t.width for t in tiles);h=max(t.height for t in tiles)
out=Image.new('RGB',(w*3,h*3),(255,255,255))
for k,t in enumerate(tiles):out.paste(t,((k%3)*w,(k//3)*h))
out.save('marty4/zooms2.png');print(out.size)
