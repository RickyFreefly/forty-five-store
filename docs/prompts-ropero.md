# Prompts para las fotos de El Ropero (frente y espalda)

> **Diseños actuales:** las 9 prendas de la propuesta salen de «Propuesta Camisetas FINAL.pdf» con
> `python3 scripts/extract-propuesta.py` (necesita pikepdf, scipy, Pillow y poppler). Cuando lleguen los PNG del diseñador, reemplaza los
> `.webp` de `public/images/ropero/` con el mismo nombre y no hay que tocar el código.

El riel (`src/components/rack/RackShowcase.tsx`) muestra cada prenda como una foto recortada
sobre fondo transparente; el gancho lo dibuja la web. Las fotos actuales vienen del prototipo
`cp.html`: solo frente, y los hoodies son pequeños (unos 340 px) y tenían el logo de otra marca
(se borró a mano, en algunos colores claros queda una marca leve).

## Reglas para todas

- PNG con **fondo transparente**, sin gancho, sin maniquí visible (efecto "ghost mannequin").
- Prenda **centrada, de frente a cámara, recta**, ocupando ~90 % del alto. Mismo encuadre en
  frente y espalda para que el cambio "Frente / Espalda" no salte.
- Mínimo **1200 px de alto**.
- **Sin logos ni texto**: la IA no dibuja bien el logo de FORTY FIVE. Si quieres el logo,
  se agrega después sobre la foto.
- Luz de estudio suave y pareja, sombras mínimas.

## Prompt base (cambia lo que está entre corchetes)

```
Fotografía de producto de estudio, estilo "ghost mannequin": [PRENDA] en color [COLOR],
vista de [frente / espalda], centrada y recta, ocupando el 90 % del alto del encuadre.
Fondo totalmente transparente (PNG), sin gancho, sin maniquí visible, sin logos ni texto.
Luz suave y pareja de estudio, textura de tela muy detallada, formato vertical 4:5,
mínimo 1200 px de alto.
```

Para la espalda, en el mismo chat: «Ahora la misma prenda, mismo color y mismo encuadre, vista
de espalda».

## Las prendas

| Prenda | [PRENDA] | Archivo (frente) |
|---|---|---|
| Drop Zone Hoodie | hoodie de felpa pesada oversize con capucha, cordones y bolsillo canguro | `hoodie-<color>.webp` |
| Flow Line Tee / Terminal Tee | camiseta técnica de manga corta, cuello redondo, corte oversize | `tee-<color>.webp` |
| Aero Jersey 45 | polo técnico de malla ligera con cuello y vivos de contraste en cuello y mangas | `polo-<color>.webp` |
| Exit Point Trouser | pantalón técnico recto de pretina ajustable, vista completa de cintura a bota | `pant-<color>.webp` |

Colores en uso (nombre del archivo → color para el prompt): `negro` negro, `naranja` naranja
intenso, `carbon` gris carbón, `jaspe` gris jaspe, `hueso` blanco hueso, `marino` azul marino,
`bosque` verde bosque, `vinotinto` vinotinto, `camel` camel, `arena` arena, `cafe` café,
`celeste` celeste, `oliva` verde oliva, `cobalto` azul cobalto, `crema` crema, `chicle` rosa
chicle, `fucsia` fucsia, `verdeK` verde kelly.

## Cómo ponerlas en la web

1. Convierte cada PNG a WebP con el nombre de la tabla, por ejemplo `hoodie-negro.webp`, la
   espalda con `-espalda` (`hoodie-negro-espalda.webp`) y el lado con `-lado`
   (`hoodie-negro-lado.webp`). Recorta las vistas de una prenda con el mismo encuadre y
   guárdalas en `public/images/ropero/` (reemplaza las que ya existen). Los originales van en
   `assets-src/ropero/`.
2. Registra las vistas extra en `EXTRA_VIEWS` en `src/data/ropero.ts`, por ejemplo
   `"tee-negro": ["back", "side"]`. Los botones «Espalda» y «Lado» se activan solos.
3. El hoodie es la excepción: solo se fotografía en negro. `python3 scripts/recolor-hoodie.py`
   tiñe sus tres vistas a todos los colores del hoodie en `src/data/ropero.ts`.
4. Si quieres cambiar qué cuelga en el riel o en qué orden, edita `RACK` en el mismo archivo.
