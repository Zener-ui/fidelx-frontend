import { Store, BadgeCheck, Star, Package, SearchX } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getVendor } from "@/api/vendors";
import { searchProducts } from "@/api/search";
import { formatNaira, getAvailabilityDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Loader, { Skeleton } from "@/components/common/Loader";

// Store-first discovery, step 3: this store's products. Reached via
// the "View Products" button on the store's landing/profile page
// (StorePage.jsx) — products belong to the store the customer
// already chose, so there is no mixed-store product browsing
// anywhere in this flow.
export default function StoreProductsPage() {
  const { id } = useParams();

  const { data: vendorData, isLoading: vendorLoading, error: vendorError, refetch: refetchVendor } = useQuery({
    queryKey: ["store", id],
    queryFn: () => getVendor(id),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["store-products", id],
    queryFn: () => searchProducts({ vendor_id: id, limit: 50 }),
    enabled: !!id,
  });

  if (vendorLoading) return <Loader fullscreen text="Loading store..." />;
  if (vendorError) return <ErrorState message={vendorError.message} onRetry={refetchVendor} />;

  const vendor = vendorData?.vendor;
  const products = productsData?.products || [];
  const avail = getAvailabilityDisplay(vendor?.availability_status);

  return (
    <div className="min-h-screen pb-8">
      <TopBar title={vendor?.business_name || "Store"} showBack />

      {/* Store header */}
      <div className="px-4 md:px-8 py-4 flex items-center gap-3 border-b border-surface-border">
        <div className="w-14 h-14 rounded-2xl bg-navy-mid border border-surface-border flex items-center justify-center shrink-0 overflow-hidden">
          {vendor?.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          ) : <Store className="w-7 h-7 text-slate-soft" strokeWidth={1.5} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-ink font-semibold truncate">{vendor?.business_name}</p>
            {vendor?.is_verified && <BadgeCheck className="w-4 h-4 text-teal shrink-0" />}
          </div>
          <p className="text-slate-muted text-xs truncate">{vendor?.location}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-slate-muted text-xs">{vendor?.rating || "New"}</span>
            </span>
            <span className={`text-xs font-medium ${avail.color}`}>{avail.label}</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 md:px-8 py-4">
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={SearchX} title="No products yet" description={`${vendor?.business_name || "This store"} hasn't listed any products yet.`} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => (
              <Link key={p.id} to={`/customer/product/${p.id}`}>
                <Card hover className="overflow-hidden">
                  <div className="aspect-square bg-navy-mid flex items-center justify-center">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <Package className="w-10 h-10 text-slate-soft" strokeWidth={1.5} />}
                  </div>
                  <div className="p-3">
                    <p className="text-ink text-sm font-semibold line-clamp-2">{p.name}</p>
                    <p className="text-teal font-bold text-sm mt-1.5">{formatNaira(p.price)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
