"""Recorta las prendas de «Propuesta Camisetas FINAL.pdf» con fondo transparente para El Ropero.

Uso: python3 scripts/extract-propuesta.py [ruta.pdf] [filtro]
Necesita pikepdf, scipy y Pillow, y pdftoppm (poppler). Escribe public/images/ropero/<nombre>.webp.

Antes de renderizar se limpia una copia del PDF: el fondo de concreto de las páginas 2–4 pasa a
magenta liso (así la tela sale con clave de color) y se quitan las flechas y fotos de referencia
de las anotaciones de las páginas 4 y 7.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import pikepdf
from PIL import Image, ImageFilter
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Downloads/Propuesta Camisetas FINAL.pdf"
WEB = ROOT / "public/images/ropero"
WORK = Path(tempfile.mkdtemp(prefix="propuesta-"))
DPI = 165
K = DPI / 110  # las cajas están medidas en el render de 110 dpi

# nombre, página, caja (x0, y0, x1, y1) a 110 dpi, método de fondo
ITEMS = [
    ("tee-logo-negro", 2, (1110, 60, 1690, 600), "key"),
    ("tee-logo-negro-espalda", 2, (1690, 60, 2265, 600), "key"),
    ("tee-logo-hueso", 2, (1110, 600, 1690, 1240), "key"),
    ("tee-logo-hueso-espalda", 2, (1690, 600, 2265, 1240), "key"),
    ("tee-45-negro", 3, (420, 60, 1235, 840), "key"),
    ("tee-45-negro-espalda", 3, (1240, 60, 2060, 840), "key"),
    ("tee-cero-hueso-espalda", 3, (420, 850, 1235, 1590), "key"),
    ("tee-cero-hueso", 3, (1240, 850, 2060, 1590), "key"),
    ("tee-graffiti-negro", 4, (470, 380, 1425, 1260), "key"),
    ("tee-graffiti-negro-espalda", 4, (1415, 380, 2250, 1260), "key"),
    ("hoodie-ff-negro", 5, (420, 200, 1690, 1440), "white"),
    ("hoodie-ff-negro-espalda", 5, (1690, 200, 2880, 1440), "white"),
    ("hoodie-aurora-negro", 6, (360, 320, 1690, 1560), "white"),
    ("hoodie-aurora-negro-espalda", 6, (1785, 320, 2880, 1560), "white"),
    ("hoodie-45-negro", 7, (440, 545, 1455, 1560), "white"),
    ("hoodie-45-negro-espalda", 7, (1460, 545, 2460, 1560), "white"),
    ("longsleeve-cero-negro", 8, (560, 480, 1580, 1660), "white"),
    ("longsleeve-cero-negro-espalda", 8, (1580, 480, 2700, 1660), "white"),
    ("deportiva-45-negro", 9, (520, 170, 1600, 1640), "white"),
    ("deportiva-45-negro-espalda", 9, (1600, 170, 2720, 1640), "white"),
]


def clean_pdf():
    pdf = pikepdf.open(PDF)
    bg = pdf.get_object((61, 0))  # imagen de concreto 4500×3000 de las páginas 2–4
    bg.write(bytes([255, 0, 255]))
    for k in ("/DecodeParms", "/SMask", "/Decode", "/Filter"):
        if k in bg:
            del bg[k]
    bg.Width, bg.Height, bg.BitsPerComponent = 1, 1, 8
    bg.ColorSpace = pikepdf.Name.DeviceRGB
    # (página, índice del trazo de la flecha, imagen de referencia) — vistos en el contenido del PDF.
    for pn, stroke, ref in ((4, 1184, "/Im4"), (7, 479, "/Im1")):
        page_ = pdf.pages[pn - 1]
        out = []
        for i, (operands, op) in enumerate(pikepdf.parse_content_stream(page_)):
            if i == stroke:
                out.append(pikepdf.ContentStreamInstruction([], pikepdf.Operator("n")))
            elif not (str(op) == "Do" and str(operands[0]) == ref):
                out.append(pikepdf.ContentStreamInstruction(operands, op))
        page_.Contents = pdf.make_stream(pikepdf.unparse_content_stream(out))
    path = WORK / "limpio.pdf"
    pdf.save(path)
    return path


def page(p, cache={}):
    if "pdf" not in cache:
        cache["pdf"] = clean_pdf()
    if p not in cache:
        f = WORK / f"p-{p}"
        subprocess.run(["pdftoppm", "-r", str(DPI), "-f", str(p), "-l", str(p), "-singlefile", "-png", str(cache["pdf"]), str(f)], check=True)
        cache[p] = np.asarray(Image.open(f"{f}.png").convert("RGB")).astype(np.float32)
    return cache[p]


def key_alpha(rgb):
    """Opacidad según cuánto magenta tiene el píxel (fondo = 0, tela neutra = 1)."""
    chroma = (rgb[..., 0] + rgb[..., 2]) / 2 - rgb[..., 1]
    return 1 - np.clip((chroma - 20) / 60, 0, 1)


def mask_for(rgb, method):
    if method == "white":  # fondo blanco liso: todo lo que no sea casi blanco
        m = rgb.min(axis=2) < 236
    else:
        # Magenta tiene R≈B; los estampados rojos o morados no, así que no cuentan como fondo.
        m = (key_alpha(rgb) > 0.5) | (np.abs(rgb[..., 0] - rgb[..., 2]) > 45)
    # La apertura borra líneas finas que tocan la prenda (flechas de las anotaciones).
    m = nd.binary_opening(m, iterations=4)
    lab, n = nd.label(m)
    if n == 0:
        return m
    sizes = nd.sum(m, lab, range(1, n + 1))
    m = lab == (np.argmax(sizes) + 1)
    m = nd.binary_closing(m, iterations=4)
    m = nd.binary_fill_holes(m)
    # Si la prenda vecina asoma por un borde unida por un hilo, se queda solo el tramo de
    # columnas más ancho (las mangas no dejan columnas casi vacías en medio).
    cols = m.sum(axis=0) > 0.01 * m.shape[0]
    runs, start = [], None
    for x, v in enumerate(list(cols) + [False]):
        if v and start is None:
            start = x
        elif not v and start is not None:
            runs.append((start, x))
            start = None
    if len(runs) > 1:
        x0, x1 = max(runs, key=lambda r: r[1] - r[0])
        m[:, :x0] = False
        m[:, x1:] = False
    return m


def main(only=None):
    for name, p, box, method in ITEMS:
        if only and only not in name:
            continue
        img = page(p)
        x0, y0, x1, y1 = (round(v * K) for v in box)
        rgb = img[y0:y1, x0:x1]
        m = mask_for(rgb, method)
        if method == "key":
            # Borde suave con la clave de color; adentro opaco (logos rojos o morados no son fondo).
            inner = nd.binary_erosion(m, iterations=3)
            a = np.where(inner, 1.0, key_alpha(rgb) * nd.binary_dilation(m, iterations=2))
            # Quita el tinte magenta del borde: la tela es neutra, se usa su canal verde.
            edge = (a < 1) & ~inner
            rgb = rgb.copy()
            rgb[edge] = rgb[edge][:, [1]].repeat(3, axis=1)
            alpha = Image.fromarray((a * 255).astype(np.uint8))
        else:
            alpha = Image.fromarray((nd.binary_erosion(m, iterations=1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))
        im = Image.fromarray(rgb.astype(np.uint8)).convert("RGBA")
        im.putalpha(alpha)
        im = im.crop(im.getchannel("A").getbbox())
        h = min(1000, im.height)
        im.resize((round(im.width * h / im.height), h), Image.LANCZOS).save(WEB / f"{name}.webp", quality=86, method=6)
        print(name, im.size)


if __name__ == "__main__":
    main(sys.argv[2] if len(sys.argv) > 2 else None)
