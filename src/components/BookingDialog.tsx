import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/lib/cart";
import { buildWhatsAppDraft } from "@/lib/whatsapp";
import { createOrder } from "@/lib/shop.functions";

export function BookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, total, clear } = useCart();
  const submit = useServerFn(createOrder);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", address: "", date: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);

  if (!open) return null;

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setError("الرجاء إدخال الاسم ورقم الهاتف");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          customer_name: form.name,
          phone: form.phone,
          address: form.address,
          delivery_date: form.date,
          notes: form.notes,
          items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
          total,
        },
      });
      const url = buildWhatsAppDraft(form, lines, total);
      setDraftUrl(url);
      if (res.isAdmin) {
        sessionStorage.setItem("sara-admin-phone", form.phone);
        navigate({ to: "/admin" });
        return;
      }
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال الحجز");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="animate-scale-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 shadow-[var(--shadow-card)] sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl text-ink">احجز طلبك</h2>
            <p className="mt-1 text-sm text-muted-foreground">نستلم طلبك ونرسله مباشرة إلى واتساب المركز</p>
          </div>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-muted-foreground hover:bg-muted">
            ✕
          </button>
        </div>

        {draftUrl ? (
          <div className="mt-6 text-center">
            <p className="text-lg text-ink">تم تسجيل حجزك بنجاح 🌸</p>
            <p className="mt-2 text-sm text-muted-foreground">
              اضغط الزر لفتح رسالة واتساب الجاهزة وإرسالها إلى المركز.
            </p>
            <a
              href={draftUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full px-6 py-3 font-medium text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-pink)" }}
            >
              إرسال الطلب عبر واتساب
            </a>
            <button onClick={onClose} className="mt-3 w-full rounded-full border border-border px-6 py-3 text-ink">
              إغلاق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <Input label="الاسم الكامل" required {...field("name")} />
            <Input label="رقم الهاتف" required inputMode="tel" {...field("phone")} />
            <Input label="العنوان" {...field("address")} />
            <Input label="تاريخ الاستلام" placeholder="مثال: 12 رمضان أو 2026-10-01" {...field("date")} />
            <label className="block">
              <span className="mb-1 block text-sm text-muted-foreground">ملاحظات</span>
              <textarea
                rows={3}
                {...field("notes")}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
              />
            </label>

            {lines.length > 0 && (
              <div className="rounded-2xl bg-secondary/70 p-4 text-sm">
                {lines.map((l) => (
                  <div key={l.id} className="flex justify-between py-0.5">
                    <span>
                      {l.name} × {l.qty}
                    </span>
                    <span>{(l.price * l.qty).toFixed(2)} د.ل</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-ink">
                  <span>الإجمالي</span>
                  <span>{total.toFixed(2)} د.ل</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full px-6 py-3 font-medium text-primary-foreground disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-pink)" }}
            >
              {busy ? "جاري الإرسال..." : "تأكيد الحجز"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
      />
    </label>
  );
}
