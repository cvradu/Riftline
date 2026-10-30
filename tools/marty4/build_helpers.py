import numpy as np
def shift(x,dy,dx):
    H,W=x.shape;y=np.zeros_like(x);y[max(dy,0):H+min(dy,0),max(dx,0):W+min(dx,0)]=x[max(-dy,0):H+min(-dy,0),max(-dx,0):W+min(-dx,0)];return y
def dil(x,k):
    o=x.copy()
    for dy in range(-k,k+1):
        for dx in range(-k,k+1):
            if dy*dy+dx*dx<=k*k:o|=shift(x,dy,dx)
    return o
ero=lambda x,k:~dil(~x,k)
