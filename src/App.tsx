import { AnimatePresence } from "motion/react";
import { SiteHeader } from "./components/SiteHeader";
import { ShowroomHero } from "./components/ShowroomHero";
import { RoperoSection } from "./components/ropero/RoperoSection";
import { BrandPhilosophy } from "./components/BrandPhilosophy";
import { AccessoriesPreview } from "./components/AccessoriesPreview";
import { ProductFocusView } from "./components/ProductFocusView";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";
import { useProductFocusStore } from "./store/productFocus";

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

function App() {
  const product = useProductFocusStore((s) => s.product);
  const closeProductFocus = useProductFocusStore((s) => s.close);

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
        {product ? <ProductFocusView product={product} onClose={closeProductFocus} /> : null}
      </AnimatePresence>
    </div>
  );
}

export default App;
