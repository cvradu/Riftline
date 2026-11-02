import sys, numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image
torch.set_num_threads(4)

class RDB(nn.Module):
    def __init__(s, nf=64, gc=32):
        super().__init__()
        s.conv1 = nn.Conv2d(nf, gc, 3, 1, 1); s.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        s.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1); s.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        s.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        x1 = s.l(s.conv1(x)); x2 = s.l(s.conv2(torch.cat((x, x1), 1)))
        x3 = s.l(s.conv3(torch.cat((x, x1, x2), 1))); x4 = s.l(s.conv4(torch.cat((x, x1, x2, x3), 1)))
        return s.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * 0.2 + x

class RRDB(nn.Module):
    def __init__(s, nf=64):
        super().__init__(); s.rdb1 = RDB(nf); s.rdb2 = RDB(nf); s.rdb3 = RDB(nf)
    def forward(s, x): return s.rdb3(s.rdb2(s.rdb1(x))) * 0.2 + x

class Net(nn.Module):
    def __init__(s, nf=64, nb=23):
        super().__init__()
        s.conv_first = nn.Conv2d(3, nf, 3, 1, 1); s.body = nn.Sequential(*[RRDB(nf) for _ in range(nb)])
        s.conv_body = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_last = nn.Conv2d(nf, 3, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        f = s.conv_first(x); f = f + s.conv_body(s.body(f))
        f = s.l(s.conv_up1(F.interpolate(f, scale_factor=2, mode='nearest')))
        f = s.l(s.conv_up2(F.interpolate(f, scale_factor=2, mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(f)))

net = Net()
sd = torch.load('upscale/RealESRGAN_x4plus.pth', map_location='cpu', weights_only=True)
sd = sd.get('params_ema', sd.get('params', sd)); net.load_state_dict(sd); net.eval()

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src); alpha = im.getchannel('A') if 'A' in im.mode else None
x = torch.from_numpy(np.array(im.convert('RGB'))).float().permute(2, 0, 1)[None] / 255
_, _, H, W = x.shape; T, P = 200, 12; out = torch.zeros(1, 3, H * 4, W * 4)
with torch.no_grad():
    for y0 in range(0, H, T):
        for x0 in range(0, W, T):
            ya, yb, xa, xb = max(0, y0 - P), min(H, y0 + T + P), max(0, x0 - P), min(W, x0 + T + P)
            o = net(x[:, :, ya:yb, xa:xb]); ty, tx = min(T, H - y0), min(T, W - x0)
            out[:, :, y0*4:(y0+ty)*4, x0*4:(x0+tx)*4] = o[:, :, (y0-ya)*4:(y0-ya+ty)*4, (x0-xa)*4:(x0-xa+tx)*4]
        print('row', y0, '/', H, flush=True)
r = Image.fromarray((out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255 + 0.5).astype(np.uint8))
if alpha is not None: r.putalpha(alpha.resize(r.size, Image.BICUBIC))
r.save(dst)
print('done', r.size)
