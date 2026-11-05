"""Tiñe las tres vistas del hoodie negro (assets-src/ropero) a cada color del catálogo.

Uso: python3 scripts/recolor-hoodie.py [carpeta_salida]

La tela negra trae la luz y las sombras; se normaliza contra su tono medio y se aplica
sobre el color de destino, así todos los colores comparten pliegues y encuadre.
"""
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src/ropero"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/images/ropero"
VIEWS = {"frente": "", "espalda": "-espalda", "lado": "-lado"}
HEIGHT = 1000

# Colores del hoodie: los toma de src/data/ropero.ts para no duplicarlos.
ts = (ROOT / "src/data/ropero.ts").read_text()
HEX = dict(re.findall(r'(\w+): \["[^"]+", "#([0-9A-Fa-f]{6})"\]', ts))
hoodie = re.search(r'photo: "hoodie",\s*colors: \[([^\]]+)\]', ts).group(1)
COLORS = [c for c in re.findall(r'"(\w+)"', hoodie) if c != "negro"]


def load_views():
    ims = {v: Image.open(SRC / f"hoodie-negro-{v}.webp").convert("RGBA") for v in VIEWS}
    # Mismo recorte para las tres vistas: el cambio Frente/Espalda/Lado no salta.
    boxes = [im.getchannel("A").getbbox() for im in ims.values()]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    out = {}
    for v, im in ims.items():
        c = im.crop(box)
        out[v] = c.resize((round(c.width * HEIGHT / c.height), HEIGHT), Image.LANCZOS)
    return out


def tint(im: Image.Image, hex_color: str) -> Image.Image:
    px = np.asarray(im).astype(np.float32) / 255
    rgb, alpha = px[..., :3], px[..., 3:]
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    mid = np.median(lum[alpha[..., 0] > 0.8])
    shade = (lum / mid) ** 0.7  # suaviza el contraste propio de la tela negra
    target = np.array([int(hex_color[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255
    # Sombras: oscurecen el color. Brillos: lo aclaran un poco hacia blanco.
    over = np.clip(shade - 1, 0, None)[..., None]
    out = np.clip(target * np.minimum(shade, 1)[..., None] + over * (0.5 * target + 0.35 * (1 - target)), 0, 1)
    return Image.fromarray((np.concatenate([out, alpha], axis=-1) * 255).astype(np.uint8), "RGBA")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    views = load_views()
    for v, im in views.items():
        im.save(OUT / f"hoodie-negro{VIEWS[v]}.webp", quality=86, method=6)
    for color in COLORS:
        for v, im in views.items():
            tint(im, HEX[color]).save(OUT / f"hoodie-{color}{VIEWS[v]}.webp", quality=86, method=6)
    print(f"{len(COLORS) + 1} colores × {len(VIEWS)} vistas → {OUT}")


if __name__ == "__main__":
    main()
