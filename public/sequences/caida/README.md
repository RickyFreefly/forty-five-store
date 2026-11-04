# Secuencia "caída libre"

Los 30 frames actuales son **provisionales**: zoom y desplazamiento generados a partir de
`public/images/hero/skydiver-demo.webp`. Se reemplazan por los frames de un video real.

- `0001.webp … NNNN.webp` → escritorio (1600 px de ancho)
- `mobile/0001.webp … NNNN.webp` → móvil (900 px de ancho, mismos nombres y misma cantidad)

La sección (`src/components/FreefallSection.tsx`) los dibuja en un canvas según el scroll.

## 1. El video que hay que generar (Veo 3.1, Gemini u otra)

Un solo plano continuo, 8 s, 1080p o más, 16:9, **sin audio**, cámara estable, sin texto ni logos
generados. Encadena tramos usando el último frame de un video como imagen inicial del siguiente.

| Tramo de scroll | Qué pasa | Texto encima |
|---|---|---|
| 0 – 30 % | Paracaidista sale por la puerta del avión y se estabiliza en caída libre (vista amplia, cielo y nubes). | Presentación del traje |
| 35 – 68 % | La cámara se acerca de lado al traje: costuras, paneles, tejido en primer plano. | Costuras · Aerodinámica · Materiales |
| 80 – 100 % | Se abre el paracaídas y aterriza suavemente; termina en plano fijo en tierra. | Aterrizaje + "Ir a la tienda" |

Consejos: deja la **mitad izquierda del encuadre relativamente despejada** (ahí va el texto)
y evita cortes bruscos — cada frame debe parecerse al anterior.

## 2. Extraer los frames

ffmpeg no está instalado todavía:

```bash
brew install ffmpeg
```

Desde la raíz del proyecto, borra los frames provisionales y extrae los nuevos (24 fps → ~192
frames para 8 s):

```bash
rm public/sequences/caida/*.webp public/sequences/caida/mobile/*.webp
```

```bash
ffmpeg -i caida.mp4 -vf "fps=24,scale=1600:-1" -q:v 80 public/sequences/caida/%04d.webp
```

```bash
ffmpeg -i caida.mp4 -vf "fps=24,scale=900:-1" -q:v 75 public/sequences/caida/mobile/%04d.webp
```

## 3. Actualizar la cantidad de frames

Cuenta los frames y pon ese número en `FRAME_COUNT` de `src/components/FreefallSection.tsx`:

```bash
ls public/sequences/caida/*.webp | wc -l
```

Si la caída se siente demasiado rápida o lenta, ajusta `heightVh` en el mismo archivo
(más alto = scroll más largo). Los tramos de texto se mueven con los `range` de cada `<Phase>`.
