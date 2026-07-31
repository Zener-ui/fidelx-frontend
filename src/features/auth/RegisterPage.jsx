import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { register } from "@/api/auth";
import { registerVendor } from "@/api/vendors";
import { registerRider } from "@/api/riders";
import { getPilotSettings } from "@/api/admin";
import { getCategories } from "@/api/search";
import { useAuthStore } from "@/store/authStore";
import { roleHomePath, isValidNigerianPhone } from "@/utils";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import GpsLocationCapture from "@/components/common/GpsLocationCapture";

const ROLES = [
  { value: "customer", label: "Customer", desc: "Browse and shop" },
  { value: "vendor",   label: "Vendor",   desc: "Sell your products" },
  { value: "rider",    label: "Rider",     desc: "Deliver orders" },
];

const BLANK_FORM = {
  full_name: "", email: "", phone: "", password: "", role: "customer", invite_code: "",
  // Vendor-only fields
  business_name: "", category: "", location: "", whatsapp: "",
  vendor_address: "", vendor_lat: null, vendor_lng: null,
  // Rider-only fields
  vehicle_type: "motorcycle", nin: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();

  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Check pilot settings to know if invite code is required
  const { data: pilotData } = useQuery({
    queryKey: ["pilot-settings"],
    queryFn: getPilotSettings,
    staleTime: Infinity,
  });

  const pilot = pilotData?.settings;
  const needsInvite =
    (form.role === "vendor" && pilot?.vendor_invite_only) ||
    (form.role === "rider"  && pilot?.rider_invite_only);

  const { data: categoryData } = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: getCategories,
    staleTime: Infinity,
  });

  // Switching roles clears out the other roles' fields, so a role
  // switch can never accidentally submit incompatible leftover data
  // from a previously-selected role.
  const selectRole = (role) => {
    setForm((f) => ({ ...BLANK_FORM, full_name: f.full_name, email: f.email, phone: f.phone, password: f.password, role }));
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (!isValidNigerianPhone(form.phone)) e.phone = "Enter a valid Nigerian phone number";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (needsInvite && !form.invite_code.trim()) e.invite_code = "Invite code required for this role";

    if (form.role === "vendor") {
      if (!form.business_name.trim()) e.business_name = "Business name is required";
      if (!form.category.trim()) e.category = "Category is required";
      if (!form.location.trim()) e.location = "Required";
      if (!form.vendor_lat || !form.vendor_lng) e.vendor_location = "Set your shop location using the button above";
    }

    if (form.role === "rider") {
      if (!/^\d{11}$/.test(form.nin)) e.nin = "Enter your 11-digit NIN";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: register,
    onError: (err) => toast.error(err.message || "Registration failed."),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const basePayload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      };
      if (needsInvite) basePayload.invite_code = form.invite_code;

      // Step 1: create the account (same for every role)
      const accountData = await registerMutation.mutateAsync(basePayload);
      storeLogin(accountData.token, accountData.user); // writes the token so step 2 is authenticated

      // Step 2: role-specific profile, using the now-existing account.
      // Both of these are the exact same endpoints the dedicated
      // vendor/rider onboarding pages already use — nothing new here,
      // just called immediately instead of on a separate later visit.
      if (form.role === "vendor") {
        try {
          await registerVendor({
            business_name: form.business_name,
            category: form.category,
            location: form.location,
            address: form.vendor_address,
            phone: form.phone,
            whatsapp: form.whatsapp || form.phone,
            location_lat: form.vendor_lat,
            location_lng: form.vendor_lng,
          });
        } catch (err) {
          // Account exists and is logged in even if this step fails —
          // don't strand the user, just send them to finish it themselves.
          toast.error("Account created, but business details didn't save — please complete your profile.");
          navigate("/vendor/onboarding", { replace: true });
          return;
        }
      }

      if (form.role === "rider") {
        try {
          await registerRider({
            nin: form.nin,
            phone: form.phone,
            vehicle_type: form.vehicle_type,
          });
        } catch (err) {
          toast.error("Account created, but rider details didn't save — please complete your profile.");
          navigate("/rider/onboarding", { replace: true });
          return;
        }
      }

      toast.success("Account created! Welcome to Fidelx");
      navigate(roleHomePath(form.role), { replace: true });
    } catch (err) {
      // Base account creation itself failed — already toasted by registerMutation.onError
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-ink text-xl font-bold mb-1">Create account</h2>
      <p className="text-slate-muted text-sm mb-6">Join Fidelx today</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selector */}
        <div>
          <label className="text-sm font-medium text-slate-soft mb-1.5 block">I want to</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectRole(value)}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  form.role === value
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-surface-border bg-surface text-slate-muted hover:border-navy-light"
                }`}
              >
                <span className="font-semibold text-xs">{label}</span>
                <span className="text-[10px] mt-0.5 opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fields common to every role */}
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          error={errors.full_name}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="08012345678"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          error={errors.phone}
          autoComplete="tel"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          error={errors.password}
          autoComplete="new-password"
        />

        {/* Vendor-only fields */}
        {form.role === "vendor" && (
          <div className="space-y-4 p-3 rounded-xl bg-surface/50 border border-surface-border">
            <p className="text-xs font-semibold text-teal">Business Details</p>
            <Input
              label="Business Name"
              placeholder="Mama Ngozi Stores"
              value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
              error={errors.business_name}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vendor-category" className="text-sm font-medium text-slate-soft">Category</label>
              <select
                id="vendor-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
              >
                <option value="">Select a category</option>
                {categoryData?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
            </div>
            <Input
              label="Location / Area"
              placeholder="e.g. Otukpo Central Market"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              error={errors.location}
            />
            <Input
              label="WhatsApp (optional, defaults to phone above)"
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            />
            <div>
              <GpsLocationCapture
                buttonLabel="Set Shop Location"
                onChange={({ lat, lng, description }) =>
                  setForm((f) => ({ ...f, vendor_lat: lat, vendor_lng: lng, vendor_address: description }))
                }
              />
              {errors.vendor_location && <p className="text-xs text-red-400 mt-1">{errors.vendor_location}</p>}
            </div>
          </div>
        )}

        {/* Rider-only fields */}
        {form.role === "rider" && (
          <div className="space-y-4 p-3 rounded-xl bg-surface/50 border border-surface-border">
            <p className="text-xs font-semibold text-teal">Rider Details</p>
            <Input
              label="NIN (National ID Number)"
              placeholder="11-digit NIN"
              value={form.nin}
              onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
              error={errors.nin}
              helper="Your NIN will be verified via NIMC"
            />
            <div>
              <label className="text-sm font-medium text-slate-soft block mb-1.5">Vehicle Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: "motorcycle", label: "Motorcycle" }, { v: "bicycle", label: "Bicycle" }].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, vehicle_type: v }))}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      form.vehicle_type === v ? "border-teal bg-teal/10 text-teal" : "border-surface-border bg-surface text-slate-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invite code — shown only when pilot mode requires it */}
        {needsInvite && (
          <Input
            label="Invite Code"
            placeholder="CM-VENDOR-XXXXXX"
            value={form.invite_code}
            onChange={(e) => setForm((f) => ({ ...f, invite_code: e.target.value.toUpperCase() }))}
            error={errors.invite_code}
            helper={`${form.role === "vendor" ? "Vendor" : "Rider"} registration is currently invite-only`}
          />
        )}

        <Button
          type="submit"
          size="xl"
          loading={submitting}
          disabled={submitting}
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-muted mt-5">
        Already have an account?{" "}
        <Link to="/login" className="text-teal font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
