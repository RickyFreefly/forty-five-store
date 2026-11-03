import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine } from "../store/cart";
import { formatCOP } from "../data/products";

interface CartItemProps {
  line: CartLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItem({ line, onQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-4">
      <div className="flex-1">
        <p className="text-sm text-paper">{line.name}</p>
        <p className="mt-0.5 text-xs text-paper-dim normal-case">
          Talla {line.size} · {line.colorName}
        </p>
        <p className="tnum mt-1 text-sm text-accent">{formatCOP(line.priceCOP)}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${line.name}`}
          className="text-paper-dim transition hover:text-paper"
        >
          <Trash2 size={14} />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onQuantity(line.quantity - 1)}
            aria-label="Disminuir cantidad"
            className="flex h-6 w-6 items-center justify-center rounded-sm border border-line text-paper hover:border-paper-dim"
          >
            <Minus size={10} />
          </button>
          <span className="tnum w-4 text-center text-xs text-paper">{line.quantity}</span>
          <button
            type="button"
            onClick={() => onQuantity(line.quantity + 1)}
            aria-label="Aumentar cantidad"
            className="flex h-6 w-6 items-center justify-center rounded-sm border border-line text-paper hover:border-paper-dim"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
