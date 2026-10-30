# Find blobs attached to the body only through a thin neck: erode by K, label, and report non-main pieces below the top 30%.
import numpy as np,sys
from PIL import Image
sys.path.insert(0,'marty4')
from comps import label
from build_helpers import dil,ero
SHEETS=[44,37,38,39,40,41,42,43]
K=int(sys.argv[1]);MAXN=int(sys.argv[2])
DW,DH=246,250;dimg=Image.new('RGB',(DW*16,DH*8),(200,205,210));hits=[]
for gi,sh in enumerate(SHEETS):
    A=np.array(Image.open(f'../images/{sh}.webp').convert('RGBA'));ch,cw=A.shape[0]//4,A.shape[1]//4
    for i in range(16):
        r,c=i//4,i%4;cell=A[r*ch:(r+1)*ch,c*cw:(c+1)*cw].copy();m=cell[...,3]>30
        lab0,info0=label(m);mx0=max(info0,key=lambda q:q['n']);top,bot=mx0['y0'],mx0['y1'];hh=bot-top
        body=lab0==mx0['id'];e=ero(body,K);lab,info=label(e);mx=max(info,key=lambda q:q['n']);cut=np.zeros_like(m)
        for q in info:
            if q is mx:continue
            if q['cy']>top+0.3*hh and q['n']<=MAXN:
                piece=dil(lab==q['id'],K+1)&body&~dil(lab==mx['id'],K+1);cut|=piece;hits.append((sh,i,q['n'],int(q['cx']),int(q['cy'])))
        cc=cell.copy();cc[cut]=[255,0,0,255];im=Image.fromarray(cc);bg=Image.new('RGBA',im.size,(200,205,210,255));bg.alpha_composite(im)
        dimg.paste(bg.convert('RGB').resize((DW,DH)),(i*DW,gi*DH))
dimg.save(f"marty4/neck{K}.png");print(len(hits))
import pickle;pickle.dump(hits,open(f"marty4/neck{K}.pkl","wb"))
print(sorted(set((s,i) for s,i,n,x,y in hits if n>=30)))
