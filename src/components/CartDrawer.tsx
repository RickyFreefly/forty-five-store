import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCartStore, cartTotal } from "../store/cart";
import { formatCOP } from "../data/products";
import { CartItem } from "./CartItem";
import { DURATION } from "../lib/motionTokens";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const [confirmed, setConfirmed] = useState(false);
  const total = cartTotal(lines);

  function handleCheckout() {
    setConfirmed(true);
  }

  function handleClose() {
    close();
    setTimeout(() => setConfirmed(false), 300);
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            role="dialog"
            aria-label="Carrito de compras"
            className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface p-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: DURATION.panel, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-paper">Tu carrito</h2>
              <button type="button" onClick={handleClose} aria-label="Cerrar carrito" className="text-paper-dim hover:text-paper">
                <X size={20} />
              </button>
            </div>

            {confirmed ? (
              <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="font-display text-xl text-accent uppercase">Pedido de demostración</p>
                <p className="max-w-xs text-sm text-paper-dim normal-case">
                  Este es un resumen de ejemplo — ningún pago fue procesado. Total simulado: {formatCOP(total)}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    handleClose();
                  }}
                  className="mt-4 rounded-full border border-line px-5 py-2 font-display text-xs tracking-[0.1em] text-paper uppercase hover:border-accent hover:text-accent"
                >
                  Cerrar
                </button>
              </div>
            ) : lines.length === 0 ? (
              <div className="mt-10 flex flex-1 items-center justify-center text-center text-sm text-paper-dim normal-case">
                Tu carrito está vacío. Explora el rack y añade tu primera prenda.
              </div>
            ) : (
              <>
                <div className="mt-4 flex-1 overflow-y-auto">
                  {lines.map((line) => (
                    <CartItem
                      key={`${line.productId}-${line.size}-${line.colorId}`}
                      line={line}
                      onQuantity={(q) => setQuantity(line.productId, line.size, line.colorId, q)}
                      onRemove={() => removeLine(line.productId, line.size, line.colorId)}
                    />
                  ))}
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-paper-dim">Total</span>
                    <span className="tnum text-lg text-paper">{formatCOP(total)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="mt-4 w-full rounded-full bg-accent py-3 font-display text-sm font-semibold tracking-[0.1em] text-accent-ink uppercase hover:brightness-110"
                  >
                    Finalizar compra
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
