import { useEffect, useRef } from "react";
import { BrandMark } from "../brand/BrandMark";
import { mountRopero } from "./engine";
import "./ropero.css";

/**
 * El Ropero — riel 3D interactivo: recorre el catálogo colgado de una pared perforada,
 * gira cada prenda en 3D, arma un outfit y agrégalo al carrito real del sitio.
 * El motor (engine.ts) es un módulo casi-vanilla adaptado de un prototipo standalone;
 * este componente solo monta la marcación y delega toda la lógica a mountRopero().
 */
export function RoperoSection() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const destroy = mountRopero(rootRef.current);
    return () => destroy();
  }, []);

  return (
    <section id="ropero" className="ropero-root" ref={rootRef}>
      <canvas id="store" aria-hidden="true" tabIndex={-1} />

      <header id="top">
        <div className="bar">
          <a className="brand" href="#ropero" id="brandLink" aria-label="FORTY FIVE, volver al inicio del riel">
            <BrandMark variant="horizontal" className="text-base" />
          </a>
          <div className="actions">
            <button className="hbtn" id="btnCatalog" type="button" aria-label="Ver catálogo en lista">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <span className="lbl">Catálogo</span>
            </button>
            <button className="hbtn" id="btnOutfit" type="button" aria-label="Arma tu outfit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3Z" />
              </svg>
              <span className="lbl">Arma tu outfit</span>
            </button>
            <button className="hbtn" id="btnCart" type="button" aria-label="Abrir carrito">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M5 8h14l-1 13H6L5 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
              <span className="lbl">Carrito</span>
              <b id="cartCount" className="zero">
                0
              </b>
            </button>
          </div>
        </div>
      </header>
      <div id="vig" aria-hidden="true" />

      <div id="guide" hidden>
        <div className="guide-box" role="note">
          <svg viewBox="0 0 64 40" aria-hidden="true">
            <path d="M8 20h48M14 13l-7 7 7 7M50 13l7 7-7 7" fill="none" stroke="#F2B01E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <b>Desliza para recorrer el riel</b>
            <span>De lado o hacia arriba. Toca la prenda del centro para ver precio, tallas y colores.</span>
          </div>
        </div>
      </div>

      <div id="focusLabel" aria-hidden="false" />
      <p id="focusLive" className="sr" aria-live="polite" />

      <div id="dock">
        <button className="arrow" id="prev" type="button" aria-label="Prenda anterior">
          ←
        </button>
        <div className="pill">
          <nav id="sections" aria-label="Secciones de la tienda" />
          <div className="prog" aria-hidden="true">
            <i id="progFill" />
          </div>
        </div>
        <button className="arrow" id="next" type="button" aria-label="Siguiente prenda">
          →
        </button>
      </div>

      <div id="loading" role="status">
        <span>FORTY FIVE</span>
        <small>Abriendo El Ropero…</small>
      </div>
      <div id="toast" role="status" hidden />

      {/* Ficha de producto */}
      <dialog className="modal" id="dlgProduct" aria-labelledby="pdName">
        <div className="pd">
          <div className="studio-host" id="pdStage">
            <div className="stage-btns">
              <button type="button" id="pdReset">
                Volver al inicio
              </button>
            </div>
            <div className="stage-hint">Arrastra para inclinarla · pellizca o usa la rueda para acercar · doble toque para volver</div>
          </div>
          <div className="pd-info">
            <div className="pd-top">
              <div>
                <span className="badge" id="pdBadge" />
                <h2 id="pdName" />
              </div>
              <button className="x" type="button" data-close aria-label="Cerrar ficha">
                ×
              </button>
            </div>
            <p className="price" id="pdPrice" />
            <p id="pdDesc" />
            <fieldset>
              <legend>
                Color: <b id="pdColorName" />
              </legend>
              <div className="swatches" id="pdColors" role="group" aria-label="Colores" />
            </fieldset>
            <fieldset>
              <legend>
                Talla: <b id="pdSizeName" />
              </legend>
              <div className="sizes" id="pdSizes" />
            </fieldset>
            <details id="pdGuide">
              <summary>Guía de tallas (medidas en cm)</summary>
              <div className="tbl-wrap" id="pdGuideTable" />
              <p className="fine">Medidas de la prenda en plano, tolerancia ±1,5 cm. Medidas de ejemplo.</p>
            </details>
            <div className="add-row">
              <div className="qty" role="group" aria-label="Cantidad">
                <button type="button" id="pdMinus" aria-label="Quitar una">
                  −
                </button>
                <output id="pdQty">1</output>
                <button type="button" id="pdPlus" aria-label="Agregar una">
                  +
                </button>
              </div>
              <button className="btn primary" type="button" id="pdAdd">
                Agregar al carrito
              </button>
            </div>
            <p className="fine" id="pdFine" />
          </div>
        </div>
      </dialog>

      {/* Arma tu outfit */}
      <dialog className="modal" id="dlgOutfit" aria-labelledby="ofTitle">
        <div className="of">
          <div className="studio-host" id="ofStage">
            <img id="ofPhoto" alt="Tu foto, solo en este dispositivo" hidden />
            <div className="stage-btns">
              <button type="button" id="ofPhotoOff" hidden>
                Quitar foto
              </button>
            </div>
            <div className="stage-hint" id="ofHint">
              Arrastra para inclinar el outfit
            </div>
          </div>
          <div className="of-panel">
            <div className="pd-top">
              <h2 id="ofTitle" style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: 20, margin: 0, textTransform: "none" }}>
                Arma tu outfit
              </h2>
              <button className="x" type="button" data-close aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="of-group">
              <h3>Arriba</h3>
              <div className="opts" id="ofTop" />
              <div className="swatches sm" id="ofTopC" role="group" aria-label="Color de arriba" />
              <label className="sel-size">
                Talla <select id="ofTopS" />
              </label>
            </div>
            <div className="of-group">
              <h3>Abajo</h3>
              <div className="opts" id="ofBot" />
              <div className="swatches sm" id="ofBotC" role="group" aria-label="Color de abajo" />
              <label className="sel-size">
                Talla <select id="ofBotS" />
              </label>
            </div>
            <div className="photo-box">
              <h3>Pruébatelo con tu foto</h3>
              <p className="fine" style={{ margin: 0 }}>
                Tómate una foto de frente, de cuerpo entero o de la cintura para arriba, y acomoda la ropa encima. Tu foto se queda en tu teléfono: no
                se sube, no se guarda y se borra al cerrar esta ventana.
              </p>
              <div className="row">
                <button className="btn" type="button" id="ofCamBtn">
                  Tomar foto
                </button>
                <button className="btn" type="button" id="ofFileBtn">
                  Elegir de la galería
                </button>
                <input type="file" accept="image/*" capture="user" id="ofCam" hidden />
                <input type="file" accept="image/*" id="ofFile" hidden />
              </div>
              <div className="photo-ctl" id="ofPhotoCtl" hidden>
                <label htmlFor="ofScale">Tamaño</label>
                <input type="range" id="ofScale" min={0.3} max={2.2} step={0.01} defaultValue={1} />
                <label htmlFor="ofRot">Girar</label>
                <input type="range" id="ofRot" min={-60} max={60} step={1} defaultValue={0} />
                <span />
                <span className="fine">Arrastra la ropa sobre la foto para acomodarla. Pellizca para cambiar el tamaño.</span>
              </div>
            </div>
            <div className="of-total">
              <div className="sum">
                <span id="ofCount">2 prendas</span>
                <b id="ofTotal">$0</b>
              </div>
              <button className="btn primary" type="button" id="ofAdd">
                Agregar todo al carrito
              </button>
            </div>
          </div>
        </div>
      </dialog>

      {/* Catálogo en lista */}
      <dialog className="modal" id="dlgCatalog" aria-labelledby="catTitle">
        <div className="m-wrap">
          <div className="m-head">
            <h2 id="catTitle">Catálogo</h2>
            <button className="x" type="button" data-close aria-label="Cerrar catálogo">
              ×
            </button>
          </div>
          <div className="m-scroll">
            <div className="filters" id="catFilters" role="group" aria-label="Filtrar catálogo" />
            <div className="grid" id="catGrid" />
            <p className="fine" style={{ marginTop: 16 }}>
              Las imágenes se generan con los mismos modelos del riel.
            </p>
          </div>
        </div>
      </dialog>

      {/* Info */}
      <dialog className="modal" id="dlgInfo" aria-labelledby="infoTitle" data-w="860">
        <div className="m-wrap">
          <div className="m-head">
            <h2 id="infoTitle">Sobre El Ropero</h2>
            <button className="x" type="button" data-close aria-label="Cerrar">
              ×
            </button>
          </div>
          <div className="m-scroll">
            <div className="info-grid" id="infoGrid" />
          </div>
        </div>
      </dialog>

      <div id="fallback" hidden>
        <div className="fb-in">
          <h1>FORTY FIVE · El Ropero</h1>
          <p>Tu navegador no pudo abrir el riel en 3D. Aquí tienes el catálogo:</p>
          <div id="fbList" />
        </div>
      </div>
    </section>
  );
}
