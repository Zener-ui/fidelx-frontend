import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMyVendorProfile, updateVendorProfile } from "@/api/vendors";
import { getCategories } from "@/api/search";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import GpsLocationCapture from "@/components/common/GpsLocationCapture";
import { Skeleton } from "@/components/common/Loader";

export default function VendorSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["vendor-profile"], queryFn: getMyVendorProfile });
  const { data: categoryData } = useQuery({ queryKey: ["vendor-categories"], queryFn: getCategories, staleTime: Infinity });
  const [form, setForm] = useState(null);

  if (!isLoading && data?.vendor && !form) {
    const v = data.vendor;
    setForm({
      business_name: v.business_name, category: v.category, location: v.location,
      address: v.address, phone: v.phone, whatsapp: v.whatsapp || "",
      location_lat: v.location_lat, location_lng: v.location_lng,
    });
  }

  const mutation = useMutation({
    mutationFn: updateVendorProfile,
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries(["vendor-profile"]); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen">
      <TopBar title="Store Settings" />
      <div className="px-4 py-3 space-y-4">
        {isLoading || !form ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-3">
            <Input label="Business Name" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} />
            <div>
              <label htmlFor="settings-category" className="text-sm font-medium text-slate-soft mb-1.5 block">Category</label>
              <select
                id="settings-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
              >
                <option value="">Select a category</option>
                {categoryData?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <Input label="Location / Area" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <div>
              <GpsLocationCapture
                buttonLabel="Set Shop Location"
                onChange={({ lat, lng, description }) => setForm((f) => ({ ...f, address: description || f.address, location_lat: lat, location_lng: lng }))}
              />
              {!form.location_lat && (
                <p className="text-xs text-yellow-400 mt-1">
                  Your store location isn't set yet — customers won't be able to get accurate delivery pricing until you set it.
                </p>
              )}
            </div>
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
            <Button type="submit" size="xl" loading={mutation.isPending}>Save Changes</Button>
          </form>
        )}
      </div>
    </div>
  );
}
