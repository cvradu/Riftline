# Map upscale

The lane and arena paintings are small (lane source ~1670px, arena 1254px), so they are redrawn 4x with Real-ESRGAN (`RealESRGAN_x4plus.pth` from the xinntao/Real-ESRGAN v0.1.0 release, sha256 `4fa0d389...682f1`, loaded with `weights_only=True`). Run from `tools/` with torch, numpy and pillow installed:

    python upscale/sr.py ../source-art/29.webp upscale/lane_x4.png   # ~8 min on 4 CPU cores
    python upscale/lane_build.py                                      # rectifies into ../assets/lane2.webp (res 4)
    python upscale/sr.py ../source-art/12.webp upscale/arena_x4.png
    python -c "from PIL import Image;Image.open('upscale/arena_x4.png').save('../assets/arena.webp',quality=88,method=6)"

The game reads `LANE_ART.res` and `ARENA_ART.res` (both 4) to keep map coordinates in the original art's pixels.
