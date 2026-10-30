import numpy as np,json
from PIL import Image,ImageDraw
m=np.load('lane2/mask.npy');H,W=m.shape
add=Image.new('L',(W,H),0);d=ImageDraw.Draw(add)
REG={
 'P1':[(652,400),(667,345),(780,333),(800,350),(785,397),(690,425)],
 'P2':[(885,285),(900,227),(1015,225),(1040,252),(1022,287),(925,322)],
 'P3':[(775,522),(792,465),(895,450),(918,470),(902,522),(822,560)],
 'P4':[(1000,420),(1018,375),(1130,360),(1150,377),(1135,412),(1050,450)],
 'B1':[(452,480),(468,428),(500,392),(612,350),(642,360),(628,410),(560,442),(470,492)],
 'B2':[(590,642),(608,600),(700,560),(805,553),(818,598),(802,640),(700,672),(600,670)],
 'B3':[(1026,240),(1048,172),(1098,140),(1222,138),(1238,160),(1212,200),(1120,242),(1040,252)],
 'B4':[(1196,334),(1210,290),(1280,264),(1346,262),(1352,300),(1332,342),(1260,374),(1200,372)],
 'W1':[(380,497),(422,485),(476,500),(462,527),(392,532)],
 'W2':[(495,640),(520,604),(582,600),(572,650),(510,657)],
 'W3':[(1222,167),(1240,127),(1282,124),(1276,162),(1236,172)],
 'RB':[(1310,60),(1340,35),(1560,28),(1615,80),(1622,140),(1600,170),(1490,215),(1420,205)],
}
for k,p in REG.items():d.polygon(p,fill=255)
m=m|(np.array(add)>0)
def shift(x,dy,dx):
    y=np.zeros_like(x);ys=slice(max(dy,0),H+min(dy,0));yd=slice(max(-dy,0),H+min(-dy,0));xs=slice(max(dx,0),W+min(dx,0));xd=slice(max(-dx,0),W+min(-dx,0));y[ys,xs]=x[yd,xd];return y
def dil(x,k):
    o=x.copy()
    for dy in range(-k,k+1):
        for dx in range(-k,k+1):
            if dy*dy+dx*dx<=k*k:o|=shift(x,dy,dx)
    return o
ero=lambda x,k:~dil(~x,k)
m=ero(dil(m,7),7)
m=dil(ero(m,5),5)
out=np.zeros((H,W),bool);st=[(0,0)];out[0,0]=True
while st:
    y,x=st.pop()
    for yy,xx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
        if 0<=yy<H and 0<=xx<W and not m[yy,xx] and not out[yy,xx]:out[yy,xx]=True;st.append((yy,xx))
m=~out
# trace the outer boundary (Moore neighbourhood), starting from the top-most, left-most pixel
ys,xs=np.nonzero(m);i=np.lexsort((xs,ys))[0];start=(ys[i],xs[i])
N8=[(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1),(0,-1),(-1,-1)]
inside=lambda p:0<=p[0]<H and 0<=p[1]<W and m[p]
cont=[start];cur=start;back=6
for it in range(200000):
    found=False
    for k in range(8):
        dd=(back+1+k)%8;q=(cur[0]+N8[dd][0],cur[1]+N8[dd][1])
        if inside(q):back=(dd+4)%8;cur=q;found=True;break
    if not found or (cur==start and len(cont)>10):break
    cont.append(cur)
pts=np.array([(p[1],p[0]) for p in cont],float)
def rdp(P,eps):
    if len(P)<3:return P
    a,b=P[0],P[-1];ab=b-a;L=np.hypot(*ab)or 1;dist=np.abs(ab[0]*(P[:,1]-a[1])-ab[1]*(P[:,0]-a[0]))/L;i=int(dist.argmax())
    if dist[i]>eps:return np.vstack([rdp(P[:i+1],eps)[:-1],rdp(P[i:],eps)])
    return np.vstack([a,b])
# split the closed loop at its far point so RDP keeps the shape
j=int(np.hypot(*(pts-pts[0]).T).argmax())
poly=np.vstack([rdp(pts[:j+1],3.5)[:-1],rdp(np.vstack([pts[j:],pts[:1]]),3.5)[:-1]])
P=[[int(round(x)),int(round(y))] for x,y in poly]
json.dump(P,open('lane2/poly.json','w'));print('vertices',len(P))
im=Image.open('../images/29.webp').convert('RGBA');bg=Image.new('RGBA',im.size,(40,40,48,255));bg.alpha_composite(im)
dr=ImageDraw.Draw(bg);dr.line([tuple(p) for p in P]+[tuple(P[0])],fill=(80,255,120,255),width=2)
for p in P:dr.ellipse([p[0]-2,p[1]-2,p[0]+2,p[1]+2],fill=(255,255,0,255))
bg.convert('RGB').save('lane2/poly_ov.png')
