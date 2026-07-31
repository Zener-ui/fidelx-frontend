import { useState, useEffect } from "react";
import { Bike, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { createOrder } from "@/api/orders";
import { initializePayment } from "@/api/payments";
import { estimateDelivery } from "@/api/delivery";
import { useCartStore } from "@/store/cartStore";
import { formatNaira } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import GpsLocationCapture from "@/components/common/GpsLocationCapture";

const IDEMPOTENCY_KEY = uuidv4(); // stable for this checkout session

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, toOrderPayload, clearCart, subtotal } = useCartStore();

  const [deliveryType, setDeliveryType] = useState("delivery");
  const [location, setLocation] = useState({ lat: null, lng: null, description: "", voice_note_url: null });

  // Redirect if cart is empty
  useEffect(() => { if (items.length === 0) navigate("/customer/cart"); }, [items]);

  // Get first vendor ID for delivery estimate
  const firstVendorId = items[0]?.vendor_id;

  const estimateQuery = useQuery({
    queryKey: ["delivery-estimate", firstVendorId, location.lat, location.lng],
    queryFn: () => estimateDelivery({ vendor_id: firstVendorId, delivery_lat: location.lat, delivery_lng: location.lng }),
    enabled: !!firstVendorId && !!location.lat && !!location.lng && deliveryType === "delivery",
  });

  // react-query v5 removed onSuccess/onError from useQuery (they only
  // exist on useMutation now) — this used to be a useState populated
  // by a query onSuccess callback that silently never fired, so the
  // fee was calculated correctly by the backend but never reached the
  // UI. Reading it straight from the query's own reactive data fixes
  // that without needing a callback at all.
  const estimatedFee = estimateQuery.data?.estimate?.delivery_fee ?? null;

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (orderData) => {
      // createOrder normally returns order.id. If the idempotency
      // check finds an order that already exists, the backend may return
      // order_id at the top level instead. Normalize both response shapes
      // before initializing Paystack.
      const order_id = orderData.order?.id || orderData.order_id;
      if (!order_id) {
        throw new Error("Order was created, but its ID could not be determined. Please try again.");
      }
      try {
        const payData = await initializePayment(order_id);
        clearCart();
        window.location.href = payData.authorization_url;
      } catch (err) {
        toast.error(err.message || "Payment initialization failed. Your order was created — contact support.");
      }
    },
    onError: (err) => toast.error(err.message || "Failed to place order"),
  });

  const handlePlaceOrder = () => {
    if (deliveryType === "delivery" && (!location.lat || !location.lng)) {
      toast.error("Tap \"Set Delivery Location\" to continue");
      return;
    }
    if (deliveryType === "delivery" && !location.description?.trim() && !location.voice_note_url) {
      toast.error("Please describe where you are, by typing or voice note");
      return;
    }
    if (deliveryType === "delivery" && estimateQuery.isError) {
      toast.error("Can't place this order until a valid delivery fee can be calculated");
      return;
    }

    orderMutation.mutate({
      items: toOrderPayload(),
      delivery_type: deliveryType,
      delivery_address: deliveryType === "delivery" ? location.description : null,
      delivery_lat: deliveryType === "delivery" ? location.lat : null,
      delivery_lng: deliveryType === "delivery" ? location.lng : null,
      delivery_description: deliveryType === "delivery" ? location.description : null,
      delivery_voice_note_url: deliveryType === "delivery" ? location.voice_note_url : null,
      idempotency_key: IDEMPOTENCY_KEY,
    });
  };

  const deliveryFee = estimatedFee || 0;
  const platformFee = Math.round(subtotal() * 0.05);
  const total = subtotal() + platformFee + deliveryFee;

  return (
    <div className="min-h-screen pb-44">
      <TopBar title="Checkout" showBack />

      <div className="px-4 py-3 space-y-4">
        {/* Delivery type */}
        <div>
          <p className="text-slate-soft text-sm font-medium mb-2">Delivery Option</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "delivery", icon: Bike, label: "Delivery", desc: "Delivered to you" },
              { value: "pickup",   icon: Store, label: "Pickup",   desc: "Collect from store" },
            ].map(({ value, icon: Icon, label, desc }) => (
              <button key={value} onClick={() => setDeliveryType(value)}
                className={`p-3 rounded-2xl border text-left transition-all ${deliveryType === value ? "border-teal bg-teal/10" : "border-surface-border bg-surface"}`}>
                <Icon className={`w-6 h-6 ${deliveryType === value ? "text-teal" : "text-slate-muted"}`} />
                <p className={`text-sm font-semibold mt-1 ${deliveryType === value ? "text-teal" : "text-ink"}`}>{label}</p>
                <p className="text-slate-muted text-xs">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery form */}
        {deliveryType === "delivery" && (
          <div className="space-y-3">
            <GpsLocationCapture
              showVoiceMemo
              onChange={(loc) => setLocation(loc)}
            />
            {estimateQuery.isFetching && <p className="text-slate-muted text-xs">Calculating delivery fee...</p>}
            {estimateQuery.isError && (
              <p className="text-red-400 text-xs">
                {estimateQuery.error?.message || "Couldn't calculate a delivery fee for this location — try setting your location again."}
              </p>
            )}
            {estimatedFee !== null && !estimateQuery.isFetching && !estimateQuery.isError && (
              <p className="text-teal text-xs">Delivery fee: {formatNaira(estimatedFee)}</p>
            )}
          </div>
        )}

        {/* Order items summary */}
        <div className="p-4 bg-surface rounded-2xl border border-surface-border">
          <h3 className="text-ink font-semibold text-sm mb-3">Items ({items.length})</h3>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-surface-border last:border-0">
              <span className="text-slate-muted truncate flex-1 mr-2">{item.name} × {item.quantity}</span>
              <span className="text-ink font-medium flex-shrink-0">{formatNaira(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
          <h3 className="text-ink font-semibold text-sm mb-2">Price Breakdown</h3>
          <div className="flex justify-between text-sm"><span className="text-slate-muted">Subtotal</span><span className="text-ink">{formatNaira(subtotal())}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-muted">Platform fee (5%)</span><span className="text-ink">{formatNaira(platformFee)}</span></div>
          {deliveryType === "delivery" && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-muted">Delivery fee</span>
              <span className="text-ink">{deliveryFee ? formatNaira(deliveryFee) : "—"}</span>
            </div>
          )}
          <div className="border-t border-surface-border pt-2 flex justify-between">
            <span className="text-ink font-bold">Total</span>
            <span className="text-teal font-black text-lg">{formatNaira(total)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-navy border-t border-surface-border max-w-lg mx-auto">
        <Button size="xl" onClick={handlePlaceOrder} loading={orderMutation.isPending}>
          Pay {formatNaira(total)} with Paystack
        </Button>
      </div>
    </div>
  );
}
