# cut a 6x6 idle sheet into frames along its empty gaps
import numpy as np
from PIL import Image
import sys
sys.path.insert(0,'.')
from atlas_marty2 import gap_cuts
def cut(k):
    A=np.array(Image.open(f'../images/{k}.webp').convert('RGBA'));al=A[...,3]>40
    xc=gap_cuts(al.sum(0),6,0,A.shape[1])
    cells=[]
    for c in range(6):
        yc=gap_cuts(al[:,xc[c]:xc[c+1]].sum(1),6,0,A.shape[0])
        cells.append([(xc[c],yc[r],xc[c+1],yc[r+1]) for r in range(6)])
    return A,[cells[i%6][i//6] for i in range(36)],xc
if __name__=='__main__':
    tiles=[]
    for k in range(53,58):
        A,boxes,xc=cut(k);print(k,'cols',xc,'rows c0',[b[1] for b in boxes[0::6]])
        for i in (0,6,15,35):
            x0,y0,x1,y1=boxes[i];im=Image.fromarray(A[y0:y1,x0:x1]);bg=Image.new('RGBA',(300,340),(200,205,210,255));bg.alpha_composite(im,(0,0));tiles.append(bg)
    o=Image.new('RGB',(300*4,340*5))
    for n,t in enumerate(tiles):o.paste(t.convert('RGB'),((n%4)*300,(n//4)*340))
    o.resize((600,850)).save('marty6/keys.jpg',quality=85)
    st=Image.new('RGB',(8*190,200),(200,205,210))
    for r,k in enumerate([49,45,47,50,52,48,51,46]):
        im=Image.open(f'../images/{k}.png').convert('RGBA');im.thumbnail((190,200));bg=Image.new('RGBA',im.size,(200,205,210,255));bg.alpha_composite(im);st.paste(bg.convert('RGB'),(r*190,0))
    st.save('marty6/stills.jpg',quality=85)
