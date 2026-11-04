import { SiteHeader } from "./components/SiteHeader";
import { FreefallSection } from "./components/FreefallSection";
import { CartDrawer } from "./components/CartDrawer";
import { goToRopero } from "./lib/routes";

/** La landing es solo el motion design de la caída libre; la tienda vive en /ropero/. */
function App() {
  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <FreefallSection onShop={goToRopero} />

      <CartDrawer />
    </div>
  );
}

export default App;
