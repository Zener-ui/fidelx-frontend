import { useQuery } from "@tanstack/react-query";
import { Bell, ShoppingCart, Store, Package, Search, Star, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getHomepageData } from "@/api/search";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatNaira, getAvailabilityDisplay } from "@/utils";
import { Skeleton } from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";
import Card from "@/components/common/Card";

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["homepage"],
    queryFn: getHomepageData,
  });

  const firstName = user?.full_name?.split(" ")[0] || "there";

  if (isError) {
    return (
      <div className="px-4 pt-6">
        <ErrorState message={error?.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-10 pb-4 flex items-center justify-between">
        <div>
          <p className="text-slate-muted text-sm">Good day,</p>
          <h1 className="text-ink text-2xl md:text-3xl font-display font-medium tracking-tight">
            {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/customer/notifications"
            className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center hover:border-navy-light transition-colors">
            <Bell className="w-5 h-5 text-ink" strokeWidth={1.75} />
          </Link>
          {totalItems > 0 && (
            <Link to="/customer/cart"
              className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center relative">
              <ShoppingCart className="w-5 h-5 text-teal" strokeWidth={1.75} />
              <span className="absolute -top-1 -right-1 bg-teal text-navy text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 md:px-8 mb-8">
        <button
          onClick={() => navigate("/customer/search")}
          className="w-full bg-surface border border-surface-border rounded-full px-5 py-3.5 text-left text-slate-muted text-sm flex items-center gap-2.5 hover:border-teal/30 hover:shadow-card transition-all"
        >
          <Search className="w-4 h-4" strokeWidth={2} />
          <span>Search products and vendors...</span>
        </button>
      </div>

      {/* Categories */}
      <section className="mb-10">
        <SectionHeading eyebrow="One cart, every category" title="What are we moving?" className="px-4 md:px-8" />
        <div className="flex gap-3 px-4 md:px-8 overflow-x-auto md:overflow-visible pb-1 scrollbar-hide md:grid md:grid-cols-6 lg:grid-cols-8">
          {isLoading
            ? Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 md:w-full md:h-20 flex-shrink-0 rounded-2xl" />
              ))
            : data?.categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/customer/search?category_id=${cat.id}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-shrink md:py-2 group"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-surface border border-surface-border flex items-center justify-center text-2xl group-hover:border-teal/40 group-hover:-translate-y-0.5 transition-all">
                    {cat.icon}
                  </div>
                  <span className="text-[10px] md:text-xs text-slate-muted text-center w-16 md:w-full truncate">{cat.name.split(" ")[0]}</span>
                </Link>
              ))}
        </div>
      </section>

      {/* Featured Vendors */}
      {(isLoading || data?.featured_vendors?.length > 0) && (
        <section className="mb-10">
          <SectionHeading eyebrow="Trusted local sellers" title="Featured stores" className="px-4 md:px-8" />
          <div className="flex gap-3 px-4 md:px-8 overflow-x-auto md:overflow-visible pb-1 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4">
            {isLoading
              ? Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="w-36 h-32 md:w-full flex-shrink-0 rounded-2xl" />
                ))
              : data.featured_vendors.map((v) => {
                  const avail = getAvailabilityDisplay(v.availability_status);
                  return (
                    <Link
                      key={v.id}
                      to={`/customer/search?vendor_id=${v.id}`}
                      className="flex-shrink-0 w-36 md:w-full"
                    >
                      <Card hover className="p-4">
                        <div className="w-11 h-11 rounded-xl bg-navy-mid border border-surface-border flex items-center justify-center mb-3 overflow-hidden">
                          {v.logo_url ? (
                            <img src={v.logo_url} alt={v.business_name} className="w-full h-full object-cover" />
                          ) : <Store className="w-5 h-5 text-slate-soft" strokeWidth={1.75} />}
                        </div>
                        <p className="text-ink text-sm font-semibold truncate">{v.business_name}</p>
                        <p className="text-slate-muted text-xs truncate">{v.category}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-slate-muted text-xs">{v.rating || "New"}</span>
                          <span className={`text-xs ml-auto font-medium ${avail.color}`}>{avail.label}</span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="px-4 md:px-8 mb-10">
        <div className="flex items-center justify-between">
          <SectionHeading eyebrow="Fresh picks for you" title="Featured products" />
          <Link to="/customer/search" className="text-teal text-sm font-medium flex items-center gap-1 hover:gap-1.5 transition-all shrink-0">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mt-4">
          {isLoading
            ? Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))
            : data?.featured_products?.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, className = "" }) {
  return (
    <div className={`mb-4 ${className}`}>
      <p className="text-teal text-xs font-semibold uppercase tracking-wide mb-1">{eyebrow}</p>
      <h2 className="text-ink font-display font-medium text-xl">{title}</h2>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/customer/product/${product.id}`}>
      <Card hover className="overflow-hidden">
        <div className="aspect-square bg-navy-mid flex items-center justify-center">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-10 h-10 text-slate-soft" strokeWidth={1.5} />
          )}
        </div>
        <div className="p-3">
          <p className="text-ink text-sm font-semibold truncate">{product.name}</p>
          <p className="text-slate-muted text-xs truncate">{product.vendors?.business_name}</p>
          <p className="text-teal font-bold text-sm mt-1.5">{formatNaira(product.price)}</p>
        </div>
      </Card>
    </Link>
  );
}
