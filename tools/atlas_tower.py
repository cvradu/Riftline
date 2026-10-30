# Tower atlas: 8 turret directions (S, SW, W, NW, N, NE, E, SE) x 2 teams + a ruined stump per team.
from PIL import Image;import numpy as np,json
im=Image.open('../images/9.webp').convert('RGBA');A=np.array(im)
al=A[:,:,3]>40
H,W=al.shape
# row cut: emptiest row in the middle band; column cuts: emptiest columns between towers
rp=al.sum(1);ry=300+int(np.argmin(rp[300:720]))
frames=[]
for (y0,y1) in [(0,ry),(ry,H)]:
    cp=al[y0:y1].sum(0);cuts=[0]
    for c in [384,768,1152]:cuts.append(c-90+int(np.argmin(cp[c-90:c+90])))
    cuts.append(W)
    for i in range(4):
        x0,x1=cuts[i],cuts[i+1];m=al[y0:y1,x0:x1];ys,xs=np.nonzero(m)
        frames.append(dict(x0=x0+xs.min(),x1=x0+xs.max()+1,y0=y0+ys.min(),y1=y0+ys.max()+1))
print('row cut',ry)
# per-frame base: centre of the platform from its widest rows near the bottom
for f in frames:
    m=al[f['y0']:f['y1'],f['x0']:f['x1']];h=m.shape[0]
    band=m[int(h*0.72):]
    cols=np.nonzero(band.any(0))[0];f['bw']=int(cols.max()-cols.min()+1);f['cx']=f['x0']+(cols.max()+cols.min())/2
    f['bot']=f['y1'];f['h']=f['y1']-f['y0']
    print(f)
bw=float(np.median([f['bw'] for f in frames]))
def recolor(arr,shift,satk=1.0):
    rgb=Image.fromarray(arr[:,:,:3]).convert('HSV');h,s,v=[np.array(c).astype(int) for c in rgb.split()]
    m=(arr[:,:,3]>0)&(h>=105)&(h<=165)&(((s>45)&(v>70))|((s>20)&(v>170)))
    h[m]=(h[m]+shift)%256;s[m]=np.clip(s[m]*satk,0,255).astype(int)
    out=Image.merge('HSV',[Image.fromarray(x.astype(np.uint8)) for x in (h,s,v)]).convert('RGB')
    return np.dstack([np.array(out),arr[:,:,3]])
cells=[]
for f in frames:
    sub=A[f['y0']:f['y1'],f['x0']:f['x1']].copy()
    k=bw/f['bw']  # normalise every view to the same platform width so the turret turning does not pop
    if abs(k-1)>0.01:
        img=Image.fromarray(sub).resize((round(sub.shape[1]*k),round(sub.shape[0]*k)),Image.LANCZOS);sub=np.array(img)
    ax=(f['cx']-f['x0'])*k;bot=sub.shape[0]
    cells.append([sub,ax,bot])
# ground centre sits above the platform's front edge
GROUND=0.27*bw
L=max(c[1] for c in cells);R=max(c[0].shape[1]-c[1] for c in cells);U=max(c[2] for c in cells)
CW=int(np.ceil(L+R))+4;AX=int(np.ceil(L))+2;CH=int(np.ceil(U))+4;AY=CH-2-int(round(GROUND))
# muzzle: farthest opaque pixel along the aim's screen direction, inside the turret band (upper part)
dirs=[(0,1),(-1,1),(-1,0),(-1,-1),(0,-1),(1,-1),(1,0),(1,1)]
mz=[]
for i,(sub,ax,bot) in enumerate(cells):
    a=sub[:,:,3]>120;hh=sub.shape[0];ys,xs=np.nonzero(a[:int(hh*0.45)])
    oy=AY-(CH-2-bot);ox=AX-ax  # cell offset of this frame
    if i in (0,4):  # turret pointing at or away from the camera: fire from the crystal
        sel=(np.abs(xs-ax)<20);yy=ys[sel];cy=int(np.percentile(yy,35)) if i==4 else int(np.percentile(yy,60))
        px,py=ax,cy
    else:
        dx,dy=dirs[i];n=np.hypot(dx,dy);pr=((xs-ax)*dx+(ys-hh*0.2)*dy)/n;j=int(np.argmax(pr));px,py=xs[j],ys[j]
    mz.append([round(float(px-ax),1),round(float(py+(CH-2-bot)-AY),1)])
atlas=Image.new('RGBA',(CW*9,CH*2),(0,0,0,0))
teams=[(16,1.05),(126,1.15)]
for t,(shift,sk) in enumerate(teams):
    for i,(sub,ax,bot) in enumerate(cells):
        cell=Image.new('RGBA',(CW,CH));cell.alpha_composite(Image.fromarray(recolor(sub,shift,sk)),(int(round(AX-ax)),CH-2-bot));atlas.alpha_composite(cell,(i*CW,t*CH))
    # ruin: the south view broken off above the platform, darkened, glow drained
    sub,ax,bot=cells[0];r=recolor(sub,shift,sk).astype(float);hh=sub.shape[0]
    rng=np.random.default_rng(7+t);xs=np.arange(sub.shape[1]);base_top=hh-int(0.36*bw)-10
    cut=base_top-40+np.cumsum(rng.normal(0,4,len(xs)));cut=np.clip(cut,base_top-90,base_top+10)
    yy=np.arange(hh)[:,None];keep=yy>cut[None,:]
    r[...,3]*=keep;hsv=Image.fromarray(r[...,:3].astype(np.uint8)).convert('HSV');h,s,v=[np.array(c).astype(float) for c in hsv.split()]
    s*=0.35;v*=0.55;r[...,:3]=np.array(Image.merge('HSV',[Image.fromarray(x.astype(np.uint8)) for x in (h,s,v)]).convert('RGB'))
    cell=Image.new('RGBA',(CW,CH));cell.alpha_composite(Image.fromarray(r.astype(np.uint8)),(int(round(AX-ax)),CH-2-bot));atlas.alpha_composite(cell,(8*CW,t*CH))
atlas.save('/home/user/riftline/assets/tower.webp',quality=90,method=6)
meta=dict(cw=CW,ch=CH,ax=AX,ay=AY,bw=round(bw,1),top=AY-(CH-2-max(c[2] for c in cells)),mz=mz)
json.dump(meta,open('tower_meta.json','w'));print(meta)
prev=atlas.copy();d=prev.load()
from PIL import ImageDraw
dr=ImageDraw.Draw(prev)
for t in range(2):
    for i in range(9):
        X,Y=i*CW+AX,t*CH+AY;dr.ellipse((X-4,Y-4,X+4,Y+4),outline=(255,0,255,255),width=2)
        if i<8:mx,my=mz[i];dr.ellipse((X+mx-5,Y+my-5,X+mx+5,Y+my+5),outline=(0,255,0,255),width=2)
bg=Image.new('RGBA',prev.size,(40,44,48,255));bg.alpha_composite(prev);bg.convert('RGB').resize((prev.size[0]//2,prev.size[1]//2)).save('tower_prev.png')
