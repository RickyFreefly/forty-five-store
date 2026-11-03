import { BrandMark } from "./brand/BrandMark";

export function Footer() {
  return (
    <footer className="border-t border-line py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
        <BrandMark variant="horizontal" className="text-2xl" />
        <p className="max-w-sm text-xs text-paper-dim normal-case">
          MVP de demostración. Productos, precios y existencias son simulados — no son referencias comerciales
          confirmadas. Las ilustraciones de producto son provisionales, generadas en código.
        </p>
      </div>
    </footer>
  );
}
