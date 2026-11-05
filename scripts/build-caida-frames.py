#!/usr/bin/env python3
"""Arma la secuencia de la caída libre a partir de las 5 imágenes clave de assets-src/caida/.

Cada imagen tiene un zoom lento (Ken Burns) y entre una y otra hay un fundido. Es la versión
provisional mientras no exista el video de Veo; cuando llegue, se reemplaza con ffmpeg
(ver public/sequences/caida/README.md).

Uso (desde la raíz del proyecto):  python3 scripts/build-caida-frames.py
Después, pon el número de frames en FRAME_COUNT de src/components/FreefallSection.tsx.
"""
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SRC = RAIZ / "assets-src/caida"
OUT = RAIZ / "public/sequences/caida"
FRAMES = 72

# (archivo, inicio, fin) en progreso de scroll 0..1, alineado con las fases de FreefallSection:
# salida 0–0.3, de cerca 0.34–0.68, aterrizaje 0.82–1. Los tramos se solapan = fundido.
# foco_x: dónde está el paracaidista (0 = izquierda, 1 = derecha). Si lo cambias, actualiza
# SUBJECT_X en FreefallSection: con él las pantallas angostas recortan alrededor del paracaidista.
TRAMOS = [
    ("1-puerta.webp", 0.00, 0.20, 0.74),
    ("2-caida.webp", 0.14, 0.38, 0.72),
    ("3-traje.webp", 0.32, 0.70, 0.62),
    ("4-paracaidas.webp", 0.64, 0.86, 0.76),
    ("5-aterrizaje.webp", 0.80, 1.00, 0.80),
]
FUNDIDO = 0.06   # cuánto dura cada fundido (los solapes de arriba)
ZOOM = 0.08      # 1.00 → 1.08 a lo largo de cada tramo

DESKTOP_W = 1600


def peso(t, a, b, primero, ultimo):
    """Opacidad de un tramo en el progreso t: sube en los primeros FUNDIDO y baja en los últimos."""
    if t < a or t > b:
        return 0.0
    w = 1.0
    if not primero and t < a + FUNDIDO:
        w = (t - a) / FUNDIDO
    if not ultimo and t > b - FUNDIDO:
        w = min(w, (b - t) / FUNDIDO)
    return max(0.0, min(1.0, w))


def zoom_crop(img, z, foco_x):
    """Recorta la imagen para simular un zoom z centrado un poco hacia el sujeto."""
    w, h = img.size
    cw, ch = w / z, h / z
    cx = w / 2 + (foco_x - 0.5) * (w - cw)  # el zoom se va acercando al paracaidista
    left = min(max(cx - cw / 2, 0), w - cw)
    top = (h - ch) / 2
    return img.crop((round(left), round(top), round(left + cw), round(top + ch))).resize((w, h), Image.LANCZOS)


def main():
    imgs = [Image.open(SRC / f).convert("RGB") for f, *_ in TRAMOS]
    base = imgs[0].size
    imgs = [im.resize(base, Image.LANCZOS) for im in imgs]
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()

    for i in range(FRAMES):
        t = i / (FRAMES - 1)
        capas = []
        for k, (im, (_, a, b, foco)) in enumerate(zip(imgs, TRAMOS)):
            w = peso(t, a, b, k == 0, k == len(TRAMOS) - 1)
            if w > 0:
                z = 1 + ZOOM * (t - a) / (b - a)
                capas.append((zoom_crop(im, z, foco), w, foco))
        # Mezcla en orden: cada capa nueva se funde sobre la anterior con su peso.
        frame = capas[0][0]
        for capa, w, _ in capas[1:]:
            frame = Image.blend(frame, capa, w)
        nombre = f"{i + 1:04d}.webp"
        frame.resize((DESKTOP_W, round(DESKTOP_W * base[1] / base[0])), Image.LANCZOS).save(OUT / nombre, quality=74, method=6)
    print(f"{FRAMES} frames → {OUT.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
