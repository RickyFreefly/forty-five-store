import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { SiteHeader } from "./components/SiteHeader";
import { ShowroomHero } from "./components/ShowroomHero";
import { RoperoSection } from "./components/ropero/RoperoSection";
import { BrandPhilosophy } from "./components/BrandPhilosophy";
import { AccessoriesPreview } from "./components/AccessoriesPreview";
import { ProductFocusView } from "./components/ProductFocusView";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";
import type { ClothingProduct } from "./types/product";

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

function App() {
  const [selected, setSelected] = useState<ClothingProduct | null>(null);

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      <ShowroomHero onExplore={() => scrollTo("#ropero")} onDiscover={() => scrollTo("#filosofia")} />

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
