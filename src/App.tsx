import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { SiteHeader } from "./components/SiteHeader";
import { ShowroomHero } from "./components/ShowroomHero";
import { RackSection } from "./components/RackSection";
import { RoperoSection } from "./components/ropero/RoperoSection";
import { BrandPhilosophy } from "./components/BrandPhilosophy";
import { AccessoriesPreview } from "./components/AccessoriesPreview";
import { ProductFocusView } from "./components/ProductFocusView";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";
import { getRackProducts } from "./data/products";
import type { ClothingProduct } from "./types/product";

const UPPER = getRackProducts("superior");
const LOWER = getRackProducts("inferior");

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

function App() {
  const [selected, setSelected] = useState<ClothingProduct | null>(null);

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <ShowroomHero onExplore={() => scrollTo("#superior")} onDiscover={() => scrollTo("#filosofia")} />

      <RackSection
        id="superior"
        title="Colección superior"
        description="Camisetas, jerseys y hoodies técnicos. Arrastra, usa las flechas o el teclado para recorrer el rack."
        products={UPPER}
        onSelect={setSelected}
      />

      <RackSection
        id="inferior"
        title="Colección inferior"
        description="Pantalones y shorts técnicos, colgados en perchas de pinza — nunca como una camiseta."
        products={LOWER}
        onSelect={setSelected}
      />

      <RoperoSection />

      <AccessoriesPreview />

      <BrandPhilosophy />

      <Footer />

      <CartDrawer />

      <AnimatePresence>
        {selected ? <ProductFocusView product={selected} onClose={() => setSelected(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}

export default App;
