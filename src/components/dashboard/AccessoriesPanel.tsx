import { CategoryProductCard } from "./CategoryProductCard";
import type { DemoDialogContent } from "./DemoProductDialog";

interface AccessoriesPanelProps {
  onOpenDemo: (content: DemoDialogContent) => void;
}

export function AccessoriesPanel({ onOpenDemo }: AccessoriesPanelProps) {
  return (
    <CategoryProductCard
      title="Accesorios"
      index="05"
      image="/images/products/gafas-demo.webp"
      alt="Gafas deportivas Forty Five con lente espejado, vista de estudio."
      caption="5 slots"
      onClick={() =>
        onOpenDemo({
          eyebrow: "Accesorios",
          title: "Gafas, gorras y guantes técnicos",
          description: "El set de accesorios que acompaña cada traje: lentes polarizados, gorras six-panel y guantes de agarre.",
          meta: "5 slots de exhibición",
        })
      }
    />
  );
}
