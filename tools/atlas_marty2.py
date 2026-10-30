# Marty's ability sheets: 8 (or 7) direction rows x 6 columns: four body poses, then two effect columns.
# Bodies are aligned on the mech's own feet (water, steam, ink and dust are ignored when finding them) and scaled to match the walk sheet;
# effects are packed as 8-frame strips centred on their own bounding boxes.
import sys,json
import numpy as np
from PIL import Image

def smooth(v,k):return np.convolve(v,np.ones(k)/k,mode='same')
def peaks(prof,k,minsep,win):
    p=smooth(prof,win).copy();res=[]
    for _ in range(k):
        i=int(p.argmax());res.append(i);p[max(0,i-minsep):i+minsep]=-1
    return sorted(res)
def cuts_between(prof,cs,lo_edge,hi_edge):
    out=[lo_edge]
    for a,b in zip(cs[:-1],cs[1:]):
        lo,hi=int(a+(b-a)*0.3),int(b-(b-a)*0.3);out.append(lo+int(np.argmin(prof[lo:hi])))
    out.append(hi_edge);return out

def mech_mask(sub):
    rgb=sub[:,:,:3].astype(int);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2];a=sub[:,:,3]
    water=(b>150)&(g>120)&(r<170)&(b>r+25)
    steam=(r>175)&(g>185)&(b>190)&(b>=r-5)
    ink=(b>r+12)&(b>g+25)&(np.maximum(np.maximum(r,g),b)<170)
    return (a>170)&~water&~steam&~ink

def drop_slivers(sub):
    # remove pieces that touch the cut edges and are small next to the frame's main body (bits of the neighbouring cells)
    occ=sub[:,:,3]>8;hh,ww=occ.shape;lab=-np.ones(occ.shape,int);sizes=[];edge=[]
    for y in range(hh):
        for x in range(ww):
            if occ[y,x] and lab[y,x]<0:
                n=len(sizes);sizes.append(0);edge.append(False);st=[(y,x)];lab[y,x]=n
                while st:
                    cy,cx=st.pop();sizes[n]+=1
                    if cy==0 or cx==0 or cy==hh-1 or cx==ww-1:edge[n]=True
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny,nx=cy+dy,cx+dx
                        if 0<=ny<hh and 0<=nx<ww and occ[ny,nx] and lab[ny,nx]<0:lab[ny,nx]=n;st.append((ny,nx))
    if not sizes:return sub
    big=max(sizes);kill=[i for i in range(len(sizes)) if edge[i] and sizes[i]<big*0.25]
    for i in kill:sub[:,:,3][lab==i]=0
    return sub

def gap_cuts(occ,n,lo,hi):
    # split [lo,hi) into n pieces at the n-1 widest empty runs; fall back to the emptiest spots near even spacing
    runs=[];i=lo
    while i<hi:
        if occ[i]==0:
            j=i
            while j<hi and occ[j]==0:j+=1
            if i>lo and j<hi:runs.append((j-i,(i+j)//2))
            i=j
        else:i+=1
    runs.sort(reverse=True);cs=sorted(c for w,c in runs[:n-1])
    if len(cs)<n-1:
        prof=smooth(occ.astype(float),5);step=(hi-lo)/n;cs=[]
        for k in range(1,n):
            a,b=int(lo+step*(k-0.35)),int(lo+step*(k+0.35));cs.append(a+int(np.argmin(prof[a:b])))
    return [lo]+cs+[hi]
def grid(A,NR,NC):
    H,W=A.shape[:2];al=A[:,:,3]>40
    xc=gap_cuts(al.sum(axis=0),NC,0,W)
    ycs=[gap_cuts(al[:,xc[c]:xc[c+1]].sum(axis=1),NR,0,H) for c in range(NC)]
    return ycs,xc
def body_anchor(sub):
    m=mech_mask(sub);ys,xs=np.nonzero(m)
    if len(ys)<50:return None
    top=np.percentile(ys,1);bot0=np.percentile(ys,99.5);hgt=bot0-top
    mid=(ys>top+hgt*0.3)&(ys<top+hgt*0.8);ax=float(np.median(xs[mid]))
    w=np.percentile(xs,95)-np.percentile(xs,5);band=np.abs(xs-ax)<w*0.4
    # the feet: lowest row where the central band still has a real run of mech pixels (stray rocks and droplets are too sparse)
    cnt=np.bincount(ys[band],minlength=sub.shape[0]);thr=max(3,w*0.06);rows=np.nonzero(cnt>=thr)[0]
    bot=float(rows.max()) if len(rows) else bot0
    return ax,bot,bot-top

def build_bodies(src,NR,NC,ref_col,row_map,walk_h,out,prev):
    A=np.array(Image.open(src).convert('RGBA'));ycs,xc=grid(A,NR,NC)
    frames={};hs=[]
    for r in range(NR):
        for c in range(4):
            yc=ycs[c];sub=drop_slivers(A[yc[r]:yc[r+1],xc[c]:xc[c+1]].copy());an=body_anchor(sub)
            frames[(r,c)]=(sub,an)
            if c==ref_col and an:hs.append(an[2])
    h=float(np.median(hs));s=walk_h/h  # scale every frame so the reference pose matches the walk sheet's height
    sc={}
    for k,(sub,an) in frames.items():
        im=Image.fromarray(sub);im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
        sc[k]=(np.array(im),an[0]*s,an[1]*s)
    L=max(f[1] for f in sc.values());R=max(f[0].shape[1]-f[1] for f in sc.values());U=max(f[2] for f in sc.values());D=max(f[0].shape[0]-f[2] for f in sc.values())
    CW=int(np.ceil(L+R))+2;CH=int(np.ceil(U+D))+2;AX=int(np.ceil(L))+1;AY=int(np.ceil(U))+1
    atlas=Image.new('RGBA',(CW*4,CH*8),(0,0,0,0))
    for orow in range(8):
        r=row_map[orow]
        for c in range(4):
            sub,ax,bot=sc[(r,c)];cell=Image.new('RGBA',(CW,CH),(0,0,0,0));cell.alpha_composite(Image.fromarray(sub),(int(AX-round(ax)),int(AY-round(bot))));atlas.alpha_composite(cell,(c*CW,orow*CH))
    atlas.save(out,quality=88,method=6)
    bg=Image.new('RGBA',atlas.size,(60,66,72,255));bg.alpha_composite(atlas)
    from PIL import ImageDraw;d=ImageDraw.Draw(bg)
    for orow in range(8):
        for c in range(4):x,y=c*CW+AX,orow*CH+AY;d.line([(x-6,y),(x+6,y)],fill=(255,60,60,255));d.line([(x,y-6),(x,y+6)],fill=(255,60,60,255))
    bg.convert('RGB').save(prev,quality=85)
    return dict(cw=CW,ch=CH,ax=AX,ay=AY,h=round(walk_h,1),scale=round(s,3))

def build_fx(src,NR,NC,cols,s,out,prev):
    A=np.array(Image.open(src).convert('RGBA'));ycs,xc=grid(A,NR,NC);strips=[]
    for c in cols:
        cells=[]
        for r in range(NR):
            yc=ycs[c];sub=drop_slivers(A[yc[r]:yc[r+1],xc[c]:xc[c+1]].copy());ys,xs=np.nonzero(sub[:,:,3]>20)
            sub=sub[ys.min():ys.max()+1,xs.min():xs.max()+1];im=Image.fromarray(sub);im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS);cells.append(im)
        cw=max(i.width for i in cells)+2;ch=max(i.height for i in cells)+2
        st=Image.new('RGBA',(cw*len(cells),ch),(0,0,0,0))
        for i,im in enumerate(cells):st.alpha_composite(im,(i*cw+(cw-im.width)//2,(ch-im.height)//2))
        strips.append((st,cw,ch))
    W=max(t[0].width for t in strips);H=sum(t[2] for t in strips);atlas=Image.new('RGBA',(W,H),(0,0,0,0));y=0;meta=[]
    for st,cw,ch in strips:atlas.alpha_composite(st,(0,y));meta.append(dict(y=y,cw=cw,ch=ch,n=st.width//cw));y+=ch
    atlas.save(out,quality=88,method=6)
    bg=Image.new('RGBA',atlas.size,(60,66,72,255));bg.alpha_composite(atlas);bg.convert('RGB').save(prev,quality=85)
    return meta

if __name__=='__main__':
    WALK_H=84.8;OUT='/home/user/riftline/assets/';D='marty/'
    sheets=[('vent','../images/22.webp',8,0),('hay','../images/23.webp',8,0),('ink','../images/24.webp',8,0),('charge','../images/25.webp',8,0),('drop','../images/26.webp',7,3)]
    meta={}
    for key,src,NR,ref in sheets:
        A0=np.array(Image.open(src).convert('RGBA'));g=grid(A0,NR,6);print(key,'cols',g[1],'rows c0',g[0][0],'rows c1',g[0][1])
        rm=list(range(8)) if NR==8 else json.loads(sys.argv[1]) if len(sys.argv)>1 else [0,1,2,3,4,5,5,6]
        m=build_bodies(src,NR,6,ref,rm,WALK_H,OUT+'marty_'+key+'.webp',D+key+'_prev.jpg')
        m['fx']=build_fx(src,NR,6,[4,5],m['scale'],OUT+'marty_'+key+'fx.webp',D+key+'fx_prev.jpg')
        meta[key]=m;print(key,m)
    json.dump(meta,open(D+'meta2.json','w'))
