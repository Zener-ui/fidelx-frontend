import { useState } from "react";
import { Package, AlertTriangle, Store, BadgeCheck, Star } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getProduct } from "@/api/products";
import { getVendorReviews } from "@/api/reviews";
import { useCartStore } from "@/store/cartStore";
import { formatNaira, getAvailabilityDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Loader, { Skeleton } from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });

  const { data: reviewData } = useQuery({
    queryKey: ["vendor-reviews", data?.product?.vendors?.id],
    queryFn: () => getVendorReviews(data.product.vendors.id, { limit: 5 }),
    enabled: !!data?.product?.vendors?.id,
  });

  if (isLoading) return <Loader fullscreen text="Loading product..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const product = data?.product;
  const vendor = product?.vendors;
  const variants = product?.variants || [];
  const avail = getAvailabilityDisplay(vendor?.availability_status);

  const isUnavailable = vendor?.availability_status === "CLOSED" || vendor?.availability_status === "TEMPORARILY_UNAVAILABLE";
  const outOfStock = product?.stock_quantity <= 0;

  const effectivePrice = selectedVariant
    ? product.price + (selectedVariant.price_adjustment || 0)
    : product.price;

  const handleAddToCart = () => {
    if (isUnavailable) { toast.error("This store is currently unavailable"); return; }
    if (outOfStock) { toast.error("This item is out of stock"); return; }

    addItem({
      product_id: product.id,
      variant_id: selectedVariant?.id || null,
      name: product.name,
      price: effectivePrice,
      image: product.images?.[0] || null,
      vendor_id: vendor?.id,
      vendor_name: vendor?.business_name,
      quantity: qty,
    });
    toast.success(`${product.name} added to cart`);
  };

  const ctaLabel = outOfStock ? "Out of Stock" : isUnavailable ? "Store Unavailable" : `Add to Cart — ${formatNaira(effectivePrice * qty)}`;

  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      <TopBar showBack />

      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-4">
        {/* Image gallery */}
        <div className="relative aspect-square bg-navy-mid lg:rounded-2xl lg:overflow-hidden lg:sticky lg:top-20 lg:self-start">
          {product.images?.length > 0 ? (
            <>
              <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
              {product.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-teal w-4" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-slate-soft" strokeWidth={1.5} /></div>
          )}
        </div>

        <div className="px-4 py-4 lg:px-0 lg:py-0 space-y-4">
          {/* Title + Price */}
          <div>
            <h1 className="text-ink text-xl lg:text-2xl font-display font-medium">{product.name}</h1>
            <p className="text-teal text-2xl font-black mt-1.5">{formatNaira(effectivePrice)}</p>
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Only {product.stock_quantity} left</p>
            )}
            {outOfStock && <p className="text-red-400 text-xs mt-1">Out of stock</p>}
          </div>

          {/* Vendor */}
          {vendor && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-surface-border">
              <div className="w-10 h-10 rounded-xl bg-navy-mid flex items-center justify-center shrink-0 overflow-hidden">
                {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-slate-soft" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-semibold truncate">{vendor.business_name}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-medium ${avail.color}`}>{avail.label}</p>
                  {vendor.is_verified && <span className="text-teal text-xs flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-slate-muted text-xs">{vendor.rating || "New"}</span>
              </div>
            </div>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <p className="text-slate-soft text-sm font-medium mb-2">Select Option</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                    disabled={v.stock_quantity <= 0}
                    className={`px-4 py-2 rounded-xl text-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      selectedVariant?.id === v.id
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-surface-border bg-surface text-slate-muted"
                    }`}
                  >
                    {v.value}
                    {v.price_adjustment !== 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({v.price_adjustment > 0 ? "+" : ""}{formatNaira(v.price_adjustment)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="text-slate-soft text-sm font-medium mb-2">Quantity</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-surface border border-surface-border text-ink text-xl flex items-center justify-center hover:bg-navy-mid"
              >−</button>
              <span className="text-ink font-semibold text-lg w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))}
                disabled={qty >= product.stock_quantity}
                className="w-10 h-10 rounded-xl bg-surface border border-surface-border text-ink text-xl flex items-center justify-center hover:bg-navy-mid disabled:opacity-40"
              >+</button>
            </div>
          </div>

          {/* Add to cart — inline on desktop, sticky bar takes over on mobile */}
          <div className="hidden lg:block pt-2">
            <Button size="xl" onClick={handleAddToCart} disabled={outOfStock || isUnavailable}>
              {ctaLabel}
            </Button>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <p className="text-slate-soft text-sm font-medium mb-2">Description</p>
              <p className="text-slate-muted text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Reviews */}
          {reviewData?.reviews?.length > 0 && (
            <div>
              <p className="text-slate-soft text-sm font-medium mb-3">Customer Reviews</p>
              <div className="space-y-3">
                {reviewData.reviews.map((r, i) => (
                  <div key={i} className="p-3 bg-surface rounded-xl border border-surface-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-ink text-xs font-medium">{r.users?.full_name || "Customer"}</span>
                      <span className="flex items-center gap-0.5">{Array.from({ length: r.vendor_rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />)}</span>
                    </div>
                    {r.comment && <p className="text-slate-muted text-xs">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA — mobile only; desktop has the inline button above */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 md:left-60 p-4 bg-navy border-t border-surface-border">
        <Button
          size="xl"
          onClick={handleAddToCart}
          disabled={outOfStock || isUnavailable}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
