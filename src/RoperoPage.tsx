import { SiteHeader } from "./components/SiteHeader";
import { RackShowcase } from "./components/rack/RackShowcase";
import { CartDrawer } from "./components/CartDrawer";

/**
 * Página propia de El Ropero (/ropero/): el riel de prendas a pantalla completa,
 * bajo el header del sitio y con el mismo carrito que la landing.
 */
export function RoperoPage() {
  return (
    <div className="ropero-page min-h-screen bg-ink">
      <SiteHeader />
      <RackShowcase />
      <CartDrawer />
    </div>
  );
}
