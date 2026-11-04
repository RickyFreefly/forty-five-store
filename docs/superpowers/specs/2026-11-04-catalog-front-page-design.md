# Catálogo interactivo del Front Page — diseño

Fecha: 2026-11-04
Estado: en revisión

## 1. Intención

El `CategoryDashboard` (panel de 4 tarjetas a la derecha del hero en `ShowroomHero`)
es hoy un mockup visual: cada tarjeta ("Technical Suits", "Prendas Sup.", "Prendas
Inf.", el combo Streetwear+Accesorios) abre un `DemoProductDialog` genérico con texto
de relleno ("X slots de exhibición"), sin productos reales. El usuario pidió
convertirlo en un sistema de navegación jerárquico de verdad: categoría → género →
(subcategoría) → grid de productos reales, con acordeones, animado, accesible y
responsive — sin tocar el hero, el header ni la identidad visual.

## 2. Alcance de esta iteración (decidido con el usuario)

El catálogo actual no tiene campo de género ni las categorías "Technical Suits"
(Híbridos/Skydiving/Túnel) o "Streetwear" (Cabeza/Sup/Inf) que pide el spec — solo
camiseta/hoodie/jersey/pantalón/short agrupados en `superior`/`inferior`. El spec
prohíbe explícitamente inventar prendas ficticias o fingir slots poblados.

**Decisión del usuario: "solo la arquitectura".** Se construye toda la navegación
interactiva (acordeones, selector de género, subcategorías, grid, paginación, estado
vacío) conectada de verdad a los datos del catálogo — pero no se agregan productos
nuevos. Donde no hay datos reales para una combinación, se muestra el
`EmptyCatalogState`, nunca contenido inventado.

Consecuencia concreta: "Technical Suits" y "Streetwear" no tienen hoy ningún producto
que encaje en su taxonomía (son líneas que el catálogo real no tiene todavía), así que
sus grids mostrarán estado vacío en todas las combinaciones. "Prendas Superiores" e
"Inferiores" sí pueden mostrar productos reales ya existentes (ver §6.3).

## 3. Goals

- Reemplazar los 4 `DemoProductDialog` genéricos por navegación jerárquica real:
  categoría (acordeón) → género → (subcategoría) → grid de productos.
- Que el grid se alimente siempre de datos reales del catálogo (`products.ts`), nunca
  de una imagen única por categoría.
- Dejar la arquitectura lista para que, cuando existan más productos en Technical
  Suits/Streetwear, aparezcan automáticamente sin tocar componentes.
- Mantener la identidad visual, el layout general (hero izquierda, panel derecha) y
  el tema oscuro/acento naranja.
- Accesibilidad: `aria-expanded`, roles, navegación por teclado, foco visible.
- Responsive: desktop (igual composición), tablet, mobile (acordeón vertical).

## 4. Non-goals (esta iteración)

- No se agregan productos nuevos a `products.ts` para Technical Suits ni Streetwear.
- No se construye backend/API; todo sigue siendo datos estáticos en el repo.
- No se cambia el hero, el header, ni `AccessoriesPreview` (la sección aparte más
  abajo en la página).
- El panel de Accesorios dentro del dashboard se mantiene como está hoy (el spec lo
  pide explícitamente: "conservar... sin agregar obligatoriamente el filtro M/F");
  no se le aplica el patrón de acordeón.

## 5. Anti-goals

- Que una categoría sin productos parezca poblada (placeholders disfrazados de
  productos reales, conteos de slots inventados, etc.).
- Que abrir un acordeón produzca saltos de layout bruscos o rompa la composición
  hero+panel en desktop.
- Que el nuevo grid de producto duplique la lógica de `ProductFocusView`/`RackSection`
  en vez de reutilizarla.

## 6. Decisiones de arquitectura

### 6.1 Modelo de datos

- `ClothingProduct`/`AccessoryProduct` ganan un campo opcional `gender?: "M" | "F"`.
  Ningún producto existente lo tiene hoy (quedan `undefined`).
- Nueva config `src/data/catalogTaxonomy.ts`, independiente del modelo de producto,
  que describe las 4 categorías del dashboard, sus subcategorías y la capacidad de
  slots de cada una (tal como las nombra el spec: Híbridos 4, Skydiving 2, Túnel 2,
  Prendas Sup. 6, Prendas Inf. 6, Streetwear Cabeza/Sup/Inf hasta 12 en total).
- Función `resolveCatalogSlice(categoryId, gender, subcategoryId?) → Product[]`
  en ese mismo archivo: hoy solo "Prendas Superiores/Inferiores" devuelven productos
  reales (ver §6.3); Technical Suits y Streetwear devuelven `[]` porque no hay
  productos con esa taxonomía — queda documentado en el propio archivo con un
  comentario, no oculto.

### 6.2 Componentes nuevos (en `src/components/dashboard/`)

| Componente | Responsabilidad |
|---|---|
| `CatalogMenu` | Reemplaza el grid estático de `CategoryDashboard`; orquesta qué acordeón está abierto (uno a la vez) y renderiza los 4 `CategoryAccordion` + el `AccessoriesPanel` sin cambios. |
| `CategoryAccordion` | Chrome de acordeón reutilizable sobre `DashboardPanel` (header siempre visible, `aria-expanded`, rota el indicador, anima alto/opacidad 250-350ms). Dentro renderiza `GenderSelector` + (si aplica) `SubcategorySelector` + `ProductGrid`. |
| `GenderSelector` | Ya existe, se reutiliza tal cual. |
| `SubcategorySelector` | Fila de botones (como el patrón de tabs que ya tiene `StreetwearPanel`), con `aria-pressed`/`role="tablist"`. Solo lo usan Technical Suits y Streetwear. |
| `ProductGrid` | Recibe productos + capacidad de slots; pinta `ProductCard` por cada uno, rellena el resto visualmente como espacio libre (no placeholders falsos), y pagina si `productos.length > slots` disponibles por página. |
| `ProductCard` | Imagen/visual, nombre, referencia (sku), precio si existe, disponibilidad (`stock`). Al hacer clic, abre el detalle real (ver §6.4). |
| `EmptyCatalogState` | Mensaje honesto ("Próximamente" / "Sin prendas en esta combinación todavía"), consistente visualmente, sin inventar productos. |

`TechnicalSuitsPanel.tsx` y `StreetwearPanel.tsx` actuales se reemplazan por usos de
`CategoryAccordion` con su config correspondiente (se elimina su lógica a medida,
ya duplicada en el componente genérico).

### 6.3 Qué se muestra en cada categoría hoy

- **Technical Suits** (Híbridos/Skydiving/Túnel) → `EmptyCatalogState` en toda
  combinación género×subcategoría. No hay productos de esa línea en el catálogo.
- **Prendas Superiores** → `clothingProducts.filter(p => p.group === "superior")`
  (5 productos reales: Flow Line Tee, Terminal Tee, Aero Jersey 45, Drop Zone Hoodie).
- **Prendas Inferiores** → `clothingProducts.filter(p => p.group === "inferior")`
  (4 productos reales: Exit Point Trouser, Precision Cargo Pant, Wind Tunnel Short,
  Freefall Short).
- **Streetwear** (Cabeza/Sup/Inf) → `EmptyCatalogState` en todas las combinaciones.
  No hay línea streetwear en el catálogo.
- **Accesorios** → sin cambios (panel actual, fuera de alcance).

**Mi llamada sobre género en Prendas Sup./Inf.:** como ningún producto real tiene
`gender` todavía, un producto sin ese campo se considera válido para ambos géneros
(se muestra en M y en F). Así "Prendas Superiores → M" y "→ F" muestran los mismos
5 productos reales hoy, en vez de quedar ambos vacíos solo porque falta un dato que
nadie ha cargado aún. El día que se agregue `gender` a un producto, ese producto
empieza a filtrarse de verdad. Esto queda comentado en `resolveCatalogSlice`.

### 6.4 Abrir el detalle de un producto

`CategoryDashboard` está anidado bajo `ShowroomHero`, lejos del estado `selected` que
hoy vive en `App.tsx` y alimenta `ProductFocusView`. En vez de pasar esa función por
props a través de 3 niveles, se agrega `src/store/productFocus.ts` (store de Zustand,
mismo patrón que `store/cart.ts`): `{ product, open(product), close() }`. `App.tsx`
sigue montando `ProductFocusView` pero lee del store en vez de `useState` local;
`ProductCard` llama `open(product)` directo. Esto también deja lista la integración
para cuando otras partes del sitio quieran abrir un producto sin prop-drilling.

`ProductFocusView` hoy solo acepta `ClothingProduct`. Como Prendas Sup./Inf. son
siempre `ClothingProduct`, no hace falta tocarlo esta vez; si más adelante un
`ProductCard` de Accesorios necesita abrir detalle, se deja anotado como pendiente
(ver §8), no se improvisa una vista nueva ahora.

### 6.5 Motion, accesibilidad, responsive

- Motion: valores exactos del spec (apertura/cierre 250-350ms, M/F 150-200ms,
  productos con fade+translateY leve al aparecer, hover con escala moderada, chevron
  rotando). `useReducedMotion` ya se usa en el dashboard; se respeta igual.
- Un acordeón abierto cierra los demás (estado único en `CatalogMenu`); segundo clic
  sobre el abierto lo cierra. Header de cada categoría siempre visible y con estado
  activo marcado visualmente.
- `aria-expanded` en el trigger, `aria-controls` apuntando al panel, el panel con
  `id` correspondiente; `role="tablist"`/`role="tab"` en `SubcategorySelector`
  (mismo patrón que ya usa `StreetwearPanel`); foco visible con las clases
  `focus-visible` que ya usa el resto del sitio.
- Responsive: desktop conserva el grid 2/4 columnas actual; tablet/mobile colapsan a
  columna única con el mismo acordeón (ya es el comportamiento implícito de
  `grid-cols-2 lg:grid-cols-4`); grid de productos pasa a 1-2 columnas en mobile.
  Sin scroll horizontal no intencional.

### 6.6 Estado de carga/error

El spec pide administrar "estado de carga y error, cuando exista integración con
API". Hoy todo es síncrono desde un array en memoria — no hay fetch real. Se deja el
tipo de estado de `CatalogMenu`/`ProductGrid` preparado para aceptar
`status: "idle" | "loading" | "error"`, pero `resolveCatalogSlice` siempre devuelve
`"idle"` con datos síncronos; no se simula loading falso. Pendiente real para cuando
exista una API.

## 7. Approaches considerados

1. **Extender el catálogo con datos reales mínimos** — agregar género y las nuevas
   categorías al modelo, más algunos productos de ejemplo para poblar Technical
   Suits/Streetwear. Descartado: el usuario pidió explícitamente "solo la
   arquitectura", sin productos nuevos.
2. **Solo la arquitectura, cero productos nuevos (elegido)** — se construye toda la
   navegación/filtrado/grid real; Technical Suits y Streetwear quedan vacíos hasta
   que se cargue esa línea de producto. Prendas Sup./Inf. sí muestran productos
   reales porque ya existen en el catálogo.
3. **Catálogo completo** (~69 slots posibles) — descartado, alcance muy por encima
   de "rediseñar el comportamiento de navegación".

## 8. Qué queda para el builder / pendiente explícito

- Microcopy exacto de `EmptyCatalogState` por categoría (tono de marca).
- Si el conteo de slots por subcategoría (4/2/2, 6, 6, 12) se usa solo como techo de
  paginación o también se muestra en UI (ej. "2 de 4 slots") — decisión de copy, no
  de arquitectura.
- Cargar productos reales de Technical Suits/Streetwear y Accesorios con detalle
  queda fuera de esta iteración (ver §4).
- Vista de detalle para `AccessoryProduct` (hoy no existe) — no se construye ahora.
