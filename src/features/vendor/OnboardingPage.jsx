import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getOnboardingStatus, markStepComplete } from "@/api/onboarding";
import { registerVendor } from "@/api/vendors";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Loader from "@/components/common/Loader";
import GpsLocationCapture from "@/components/common/GpsLocationCapture";

const STEPS = [
  { key: "business_profile_completed", label: "Business Profile",    desc: "Tell us about your business" },
  { key: "documents_uploaded",         label: "Upload Documents",    desc: "ID and business documents" },
  { key: "verification_submitted",     label: "Await Verification",  desc: "We'll review within 24h" },
  { key: "first_product_added",        label: "Add First Product",   desc: "List your first item" },
];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [form, setForm] = useState({ business_name: "", category: "", location: "", address: "", phone: user?.phone || "", whatsapp: "", location_lat: null, location_lng: null });
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useQuery({ queryKey: ["onboarding"], queryFn: getOnboardingStatus });
  const progress = data?.onboarding;

  const registerMutation = useMutation({
    mutationFn: registerVendor,
    onSuccess: async () => {
      await markStepComplete("business_profile_completed");
      await markStepComplete("verification_submitted");
      toast.success("Business registered! Awaiting admin approval.");
      qc.invalidateQueries(["onboarding"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.business_name.trim()) e.business_name = "Required";
    if (!form.category.trim()) e.category = "Required";
    if (!form.location.trim()) e.location = "Required";
    if (!form.address.trim()) e.address = "Search for your shop's address above";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.location_lat || !form.location_lng) e.location_pin = "Search for your shop's address or drop a pin to set its location";
    setErrors(e);
    return !Object.keys(e).length;
  };

  if (isLoading) return <Loader fullscreen />;
  if (progress?.onboarding_completed) { navigate("/vendor/dashboard"); return null; }

  const completedCount = STEPS.filter((s) => progress?.[s.key]).length;

  return (
    <div className="min-h-screen bg-navy px-4 py-8 max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="text-ink text-2xl font-display font-semibold flex items-center gap-2">Set up your store <Store className="w-6 h-6 text-teal" /></h1>
        <p className="text-slate-muted text-sm mt-1">{completedCount} of {STEPS.length} steps completed</p>
        <div className="mt-3 h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${(completedCount / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {STEPS.map((step, i) => {
          const done = progress?.[step.key];
          const active = i === completedCount;
          return (
            <div key={step.key} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${done ? "border-teal/30 bg-teal/5" : active ? "border-teal bg-teal/10" : "border-surface-border bg-surface opacity-50"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? "bg-teal text-navy" : active ? "border-2 border-teal text-teal" : "border border-surface-border text-slate-muted"}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div>
                <p className={`text-sm font-semibold ${done || active ? "text-ink" : "text-slate-muted"}`}>{step.label}</p>
                <p className="text-slate-muted text-xs">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Business profile form — shown on step 0 */}
      {!progress?.business_profile_completed && (
        <form onSubmit={(e) => { e.preventDefault(); if (validate()) registerMutation.mutate(form); }} className="space-y-3">
          <Input label="Business Name" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} error={errors.business_name} />
          <Input label="Category (e.g. Food, Fashion)" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} error={errors.category} />
          <Input label="Location / Area" placeholder="e.g. Otukpo Central Market" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} error={errors.location} />
          <div>
            <GpsLocationCapture
              buttonLabel="Set Shop Location"
              onChange={({ lat, lng, description }) => setForm((f) => ({ ...f, address: description, location_lat: lat, location_lng: lng }))}
            />
            {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
            {errors.location_pin && <p className="text-xs text-red-400 mt-1">{errors.location_pin}</p>}
          </div>
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors.phone} />
          <Input label="WhatsApp (optional)" type="tel" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
          <Button type="submit" size="xl" loading={registerMutation.isPending}>Register Business</Button>
        </form>
      )}

      {progress?.verification_submitted && !progress?.onboarding_completed && (
        <div className="p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl text-center">
          <span className="text-3xl">⏳</span>
          <p className="text-yellow-400 font-semibold text-sm mt-2">Awaiting Admin Approval</p>
          <p className="text-slate-muted text-xs mt-1">We'll notify you once your account is approved. Usually within 24 hours.</p>
        </div>
      )}
    </div>
  );
}
