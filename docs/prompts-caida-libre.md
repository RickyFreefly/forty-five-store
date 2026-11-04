# Prompts para la caída libre (imágenes y videos)

Flujo: 5 imágenes clave en ChatGPT (o Gemini) → 3 videos en Veo 3.1 que van de una imagen a la
siguiente → frames en `public/sequences/caida/` (ver `public/sequences/caida/README.md`).

Pega siempre el **bloque del traje** al final de cada prompt para que el paracaidista y el traje
se vean iguales en todas las imágenes. Pide **16:9** y **sin texto, logos ni marcas de agua**: el
logo de FORTY FIVE lo pone la web encima, la IA no lo dibuja bien.

## Bloque del traje (pegar en todos)

```
Mismo paracaidista en todas las imágenes: traje técnico de caída libre de una pieza, negro mate
con paneles laterales naranja «Aero Orange» (#FE572B) en brazos y piernas, costuras visibles en
contraste, cremallera frontal, casco abierto negro mate con gafas de caída libre reflectantes,
guantes negros, contenedor de paracaídas negro en la espalda. Sin logos ni texto en el traje.
Fotografía realista y cinematográfica, luz natural de sol de mañana, alto detalle de tela.
Formato 16:9. Deja la mitad izquierda del encuadre despejada (cielo o nubes) para poner texto.
```

## 1. Puerta del avión (primer frame)

```
Crea una fotografía: paracaidista asomado a la puerta abierta de un avión de salto, a punto de
saltar, visto desde dentro del avión hacia afuera. Afuera, cielo azul profundo y un mar de nubes
sobre cordilleras andinas a lo lejos. El paracaidista está a la derecha del encuadre, de frente a
la puerta, una mano en el marco. Sensación de altura y adrenalina contenida.
[bloque del traje]
```

## 2. Caída libre estable

```
Crea una nueva imagen en base a la anterior: el mismo paracaidista ya en caída libre en posición
estable de "box" (brazos y piernas abiertos, pecho hacia abajo), visto desde un camarógrafo que
cae a su lado, ligeramente por encima. Fondo de nubes y cordillera abajo, cielo arriba. El
paracaidista a la derecha, ocupando un tercio del encuadre. Viento marcando la tela del traje.
[bloque del traje]
```

## 3. Acercamiento lateral al traje (mitad del recorrido)

```
Crea una nueva imagen: plano cercano lateral del mismo paracaidista en caída libre, la cámara a
la altura de su torso y brazo. Se ven en detalle las costuras en contraste, el panel naranja del
brazo y la textura del tejido técnico tensado por el viento. Fondo de cielo y nubes desenfocado.
El traje ocupa la mitad derecha del encuadre.
[bloque del traje]
```

## 4. Paracaídas abierto

```
Crea una nueva imagen: el mismo paracaidista justo después de abrir el paracaídas, visto desde
abajo y de lado; velamen rectangular negro con bordes naranja desplegado arriba, el paracaidista
colgando sereno de las líneas. Cielo limpio, sol alto, nubes debajo empezando a quedar atrás.
[bloque del traje]
```

## 5. Aterrizaje (último frame)

```
Crea una nueva imagen: el mismo paracaidista recién aterrizado de pie en un campo verde de la
sabana, con el velamen cayendo detrás de él, mirando a cámara con calma. Montañas de fondo, luz
dorada de tarde. Plano fijo, cámara a la altura de los ojos, paracaidista a la derecha.
[bloque del traje]
```

Si una imagen no sale bien, corrige con frases cortas como en el video de referencia:
«bien, pero crea una nueva: haz el traje más protagonista, plano un poco más distante,
paracaidista a la derecha».

## Videos en Veo 3.1 (de imagen a imagen)

Configuración: 8 s, 1080p, 16:9, sin audio. Usa la imagen de inicio y la de final de cada tramo.
Haz 2 o 3 versiones de cada uno y quédate con la mejor. Si un tramo no queda, rehaz solo ese:
toma su último frame y empieza el siguiente desde ahí.

**Tramo A — imagen 1 → 2**

```
Single continuous cinematic shot, no cuts. Start exactly from the first image: the skydiver at
the open aircraft door leaps out; the camera follows him out of the plane and settles beside him
as he stabilizes into a belly-to-earth freefall position, ending exactly on the second image.
Keep the suit, helmet and colors identical throughout. Smooth, stable camera, no text, no logos,
no audio.
```

**Tramo B — imagen 2 → 3**

```
Single continuous cinematic shot, no cuts. Start exactly from the first image: freefall in a
stable box position. The camera slowly orbits and moves closer to the skydiver's side until it
frames a lateral close-up of the torso and arm, showing the stitching and orange panel, ending
exactly on the second image. Fabric rippling in the wind. Keep the suit identical. No text, no
logos, no audio.
```

**Tramo C — imagen 3 → 4 → 5** (si Veo no acepta tres imágenes, hazlo en dos videos)

```
Single continuous cinematic shot, no cuts. Start exactly from the first image. The camera pulls
back as the skydiver deploys a black canopy with orange edges; the canopy opens smoothly and he
glides down, then lands softly standing on a green field with mountains behind, ending on a calm
static frame matching the last image. Keep the suit identical. No text, no logos, no audio.
```

Después une los videos en orden (A, B, C) en un solo `caida.mp4` y sigue los pasos de
`public/sequences/caida/README.md` para pasarlo a frames.
