import { useNavigate } from "react-router-dom";
import { ShoppingCart, Package, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatNaira } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <TopBar title="Cart" />
        <EmptyState icon={ShoppingCart} title="Your cart is empty" description="Add items to get started" action={() => navigate("/customer/search")} actionLabel="Browse Products" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <TopBar title={`Cart (${items.length})`} right={
        <button onClick={clearCart} className="text-red-400 text-xs">Clear all</button>
      } />

      <div className="px-4 py-3 space-y-3">
        {items.map((item) => {
          const key = `${item.product_id}_${item.variant_id || ""}`;
          return (
            <div key={key} className="flex gap-3 p-3 bg-surface rounded-2xl border border-surface-border">
              <div className="w-16 h-16 rounded-xl bg-surface-raised flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-soft" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-semibold truncate">{item.name}</p>
                <p className="text-slate-muted text-xs">{item.vendor_name}</p>
                <p className="text-teal font-bold text-sm mt-0.5">{formatNaira(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-surface-raised border border-surface-border text-ink flex items-center justify-center text-sm">−</button>
                  <span className="text-ink text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-surface-raised border border-surface-border text-ink flex items-center justify-center text-sm">+</button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.product_id, item.variant_id)} className="text-slate-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                <p className="text-ink font-bold text-sm">{formatNaira(item.price * item.quantity)}</p>
              </div>
            </div>
          );
        })}

        {/* Order summary */}
        <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
          <h3 className="text-ink font-semibold text-sm mb-3">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Subtotal</span>
            <span className="text-ink">{formatNaira(subtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Platform fee (5%)</span>
            <span className="text-ink">{formatNaira(subtotal() * 0.05)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Delivery fee</span>
            <span className="text-slate-muted">Calculated at checkout</span>
          </div>
          <div className="border-t border-surface-border pt-2 flex justify-between">
            <span className="text-ink font-semibold">Estimated total</span>
            <span className="text-teal font-bold">{formatNaira(subtotal() * 1.05)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-navy border-t border-surface-border max-w-lg mx-auto">
        <Button size="xl" onClick={() => navigate("/customer/checkout")}>
          Proceed to Checkout — {formatNaira(subtotal() * 1.05)}
        </Button>
      </div>
    </div>
  );
}
