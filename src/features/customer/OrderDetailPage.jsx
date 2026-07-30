import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, FileText, Download, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getOrderWithSubOrders, cancelSubOrder } from "@/api/orders";
import { createDispute, getMyDisputes } from "@/api/disputes";
import { formatNaira, formatDateTime, getStatusDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";
import OrderProgress from "@/components/common/OrderProgress";
import { getReceiptHtml, getReceiptPdf, getReceiptByReference } from "@/api/receipts";
import { uploadDisputeEvidence } from "@/api/uploads";

export default function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  // The receipt's real receipt_id isn't the same as the order's id —
  // resolve it via reference lookup before the receipt buttons work.
  const { data: receiptRef } = useQuery({
    queryKey: ["receipt-ref", id],
    queryFn: () => getReceiptByReference(id),
    enabled: !!id,
    retry: false,
  });
  const receiptId = receiptRef?.receipt?.receipt_id;

  const handleViewReceipt = async () => {
    if (!receiptId) return;
    const receiptWindow = window.open("about:blank", "_blank");
    try {
      if (!receiptWindow) {
        toast.error("Please allow pop-ups to view your receipt.");
        return;
      }
      const html = await getReceiptHtml(receiptId);
      const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      receiptWindow.location.href = blobUrl;
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      receiptWindow?.close();
      toast.error(err.message || "Couldn't open the receipt.");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptId) return;
    try {
      const blob = await getReceiptPdf(receiptId);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `fidelx-receipt-${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      toast.error(err.message || "Couldn't download the receipt.");
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => getOrderWithSubOrders(id),
    refetchInterval: (d) => {
      const inProgress = ["PAYMENT_CONFIRMED","WAITING_RIDER","RIDER_ASSIGNED","PICKED_UP","DELIVERING"].includes(d?.order?.status);
      return inProgress ? 15000 : false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubOrder,
    onSuccess: () => { toast.success("Sub-order cancelled"); qc.invalidateQueries(["order-detail", id]); },
    onError: (err) => toast.error(err.message),
  });

  // Existing disputes for THIS order — fetches all of the customer's
  // disputes and filters client-side since there's no single-order
  // lookup endpoint; fine at this scale (a customer's total dispute
  // count is always small).
  const { data: disputesData } = useQuery({
    queryKey: ["my-disputes"],
    queryFn: getMyDisputes,
  });
  const existingDispute = disputesData?.disputes?.find((d) => d.order_id === id || d.orders?.id === id);

  const [disputeForm, setDisputeForm] = useState({ reason: "" });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const disputeMutation = useMutation({
    mutationFn: createDispute,
    onSuccess: () => {
      toast.success("Dispute submitted. An admin will review it.");
      setShowDisputeForm(false);
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
    },
    onError: (err) => toast.error(err.message || "Couldn't submit dispute."),
  });

  const handleEvidenceSelection = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const valid = selected.filter((file) => {
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: JPG, PNG or WebP only.`);
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: maximum size is 8 MB.`);
        return false;
      }
      return true;
    });
    const remaining = 5 - evidenceFiles.length;
    if (valid.length > remaining) toast.error("You can upload a maximum of 5 evidence photos.");
    setEvidenceFiles((current) => [...current, ...valid.slice(0, Math.max(0, remaining)).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = "";
  };

  const removeEvidenceFile = (index) => {
    setEvidenceFiles((current) => {
      const removed = current[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return current.filter((_, i) => i !== index);
    });
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeForm.reason.trim()) return toast.error("Please describe the problem.");
    if (!evidenceFiles.length) return toast.error("At least one evidence photo is required.");

    try {
      const uploaded = await uploadDisputeEvidence(evidenceFiles.map((item) => item.file));
      const paths = uploaded?.paths || [];
      if (!paths.length) throw new Error("Evidence upload failed.");

      await createDispute({
        order_id: id,
        reason: disputeForm.reason.trim(),
        evidence_urls: paths,
      });

      toast.success("Dispute submitted. An admin will review it.");
      setShowDisputeForm(false);
      setDisputeForm({ reason: "" });
      evidenceFiles.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      setEvidenceFiles([]);
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
    } catch (err) {
      toast.error(err.message || "Couldn't submit dispute.");
    }
  };

  if (isLoading) return <Loader fullscreen text="Loading order..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const order = data?.order;

  return (
    <div className="min-h-screen pb-8">
      <TopBar title="Order Details" showBack />
      <div className="px-4 md:px-8 py-4 space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 md:items-start">
        <div className="md:col-span-2 space-y-4">
          {/* Order header */}
          <div className="p-4 bg-surface rounded-2xl border border-surface-border">
            <p className="text-slate-muted text-xs">Order #{order?.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-slate-muted text-xs">{formatDateTime(order?.created_at)}</p>
          </div>

          {/* Sub-orders with progress tracker */}
          {order?.sub_orders?.map((sub) => {
            const subStatus = getStatusDisplay(sub.status);
            const cancellable = ["PAYMENT_CONFIRMED","WAITING_RIDER","RIDER_ASSIGNED"].includes(sub.status);
            return (
              <div key={sub.id} className="p-4 bg-surface rounded-2xl border border-surface-border space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-ink font-display font-medium">{sub.vendors?.business_name}</p>
                </div>

                <OrderProgress status={sub.status} deliveryType={sub.delivery_type} statusDisplay={subStatus} />

                <div className="space-y-2 pt-1">
                  {sub.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b border-surface-border pb-2">
                      <span className="text-slate-muted">{item.products?.name} × {item.quantity}</span>
                      <span className="text-ink">{formatNaira(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-muted">Vendor payout</span>
                  <span className="text-teal font-semibold">{formatNaira(sub.vendor_payout)}</span>
                </div>
                {sub.delivery_type === "delivery" && sub.delivery_address && (
                  <p className="text-slate-muted text-xs flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {sub.delivery_address}</p>
                )}
                {cancellable && (
                  <Button variant="danger" size="sm" onClick={() => cancelMutation.mutate(sub.id)} loading={cancelMutation.isPending}>
                    Cancel this item
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 md:sticky md:top-20">
          {/* Price summary */}
          <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
            <p className="text-ink font-display font-medium mb-1">Summary</p>
            <div className="flex justify-between text-sm"><span className="text-slate-muted">Subtotal</span><span className="text-ink">{formatNaira(order?.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-muted">Platform fee</span><span className="text-ink">{formatNaira(order?.platform_fee)}</span></div>
            {order?.delivery_fee > 0 && (
              <div className="flex justify-between text-sm"><span className="text-slate-muted">Delivery</span><span className="text-ink">{formatNaira(order?.delivery_fee)}</span></div>
            )}
            <div className="border-t border-surface-border pt-2 flex justify-between">
              <span className="text-ink font-bold">Total Paid</span>
              <span className="text-teal font-black">{formatNaira(order?.total)}</span>
            </div>
          </div>

          {/* Receipt buttons */}
          {order?.status === "DELIVERED" && receiptId && (
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" className="flex-1"
                onClick={handleViewReceipt}>
                <FileText className="w-4 h-4 inline mr-1.5" />View Receipt
              </Button>
              <Button variant="secondary" size="lg" className="flex-1"
                onClick={handleDownloadReceipt}>
                <Download className="w-4 h-4 inline mr-1.5" />PDF
              </Button>
            </div>
          )}

          {/* Report a problem / dispute */}
          {order?.status === "DELIVERED" && (
            <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-3">
              {existingDispute ? (
                <>
                  <p className="text-ink font-display font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Dispute Filed
                  </p>
                  <p className="text-slate-muted text-xs">
                    Status: <span className="text-ink font-medium">{existingDispute.status}</span>
                  </p>
                  {existingDispute.resolution_note && (
                    <p className="text-slate-muted text-xs">{existingDispute.resolution_note}</p>
                  )}
                </>
              ) : showDisputeForm ? (
                <form onSubmit={handleDisputeSubmit} className="space-y-3">
                  <p className="text-ink font-display font-medium">Report a Problem</p>
                  <textarea
                    rows={3}
                    placeholder="What went wrong with this order?"
                    value={disputeForm.reason}
                    onChange={(e) => setDisputeForm((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full bg-navy rounded-xl border border-surface-border text-ink placeholder:text-slate-muted py-2.5 px-3 text-sm outline-none resize-none focus:border-teal focus:ring-1 focus:ring-teal/30"
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-soft block mb-1.5">Evidence Photos</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {evidenceFiles.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-navy-mid border border-surface-border">
                          <img src={file.preview} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeEvidenceFile(i)}
                            className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1" aria-label="Remove evidence">
                            <span className="text-xs leading-none">×</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    {evidenceFiles.length < 5 && (
                      <label className="flex items-center justify-center h-20 rounded-xl border border-dashed border-surface-border text-slate-muted hover:text-teal hover:border-teal/50 cursor-pointer text-sm">
                        Add photos of the damaged/incorrect product
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleEvidenceSelection} />
                      </label>
                    )}
                    <p className="text-slate-muted text-xs mt-1.5">
                      Up to 5 photos. JPG, PNG or WebP, max 8 MB each. Images must be at least 500×500px.
                    </p>
                  </div>
                  <p className="text-slate-muted text-xs">
                    Disputes must be filed within 24 hours of delivery. At least one photo is required as evidence.
                  </p>
                  <div className="flex gap-2">
                    <Button type="submit" size="md" className="flex-1" loading={disputeMutation.isPending}>
                      Submit Dispute
                    </Button>
                    <Button type="button" variant="secondary" size="md" onClick={() => setShowDisputeForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button variant="secondary" size="md" onClick={() => setShowDisputeForm(true)}>
                  <AlertTriangle className="w-4 h-4 inline mr-1.5" />Report a Problem
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
