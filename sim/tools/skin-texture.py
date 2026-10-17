import numpy as np
from PIL import Image
D='/tmp/ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/'
im=np.asarray(Image.open(D+'T_Superhero_Female_Dark_BaseColor.png').convert('RGB').resize((1024,1024),Image.LANCZOS)).astype(np.float32)
sat=im.max(axis=2)-im.min(axis=2)
mask=((im.max(axis=2)<95)|((sat<38)&(im.max(axis=2)<150)))
from PIL import ImageFilter as _F
class ndimage:
  @staticmethod
  def binary_dilation(m,iterations=1):
    im=Image.fromarray((m*255).astype(np.uint8)).filter(_F.MaxFilter(2*iterations+1));return np.asarray(im)>127
mask=ndimage.binary_dilation(mask,iterations=3)
M0=mask.copy()
print('masked',mask.mean())
valid=~mask; out=im.copy()
for it in range(80):
    if not mask.any():break
    acc=np.zeros_like(out);cnt=np.zeros(mask.shape,np.float32)
    for dy,dx in[(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)]:
        v=np.roll(np.roll(valid,dy,0),dx,1);o=np.roll(np.roll(out,dy,0),dx,1)
        acc+=o*v[...,None];cnt+=v
    fill=mask&(cnt>0)
    out[fill]=acc[fill]/cnt[fill][:,None];valid=valid|fill;mask=mask&~fill
# soften the filled seam
from PIL import ImageFilter
filled=ndimage.binary_dilation(M0,iterations=2)
bl=np.asarray(Image.fromarray(out.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)
out[filled]=bl[filled]
# tone toward warm medium brown, less orange
l=out.mean(axis=2,keepdims=True);out=l+(out-l)*0.78
out=out*np.array([0.97,0.95,0.97])
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(D+'T_Female_Skin_Promenade.png')
