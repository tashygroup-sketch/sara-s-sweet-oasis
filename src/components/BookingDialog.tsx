import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/lib/cart";
import { buildWhatsAppDraft } from "@/lib/whatsapp";
import { createOrder } from "@/lib/shop.functions";

const PHONE_RE = /^(091|092|093|094)\d{7}$/;

export function BookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, total, clear } = useCart();
  const submit = useServerFn(createOrder);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const [locating, setLocating] = useState(false);
  const [locationUrl, setLocationUrl] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  if (!open) return null;

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  function shareLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationUrl(`https://www.google.com/maps?q=${latitude},${longitude}`);
        setLocating(false);
      },
      () => {
        setLocationError("تعذّر الحصول على الموقع، تأكدي من السماح بالوصول للموقع من المتصفح");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validate() {
    if (!form.name.trim()) return "الرجاء إدخال الاسم";
    if (!PHONE_RE.test(form.phone.trim())) {
      return "رقم الهاتف يجب أن يتكون من 10 أرقام ويبدأ بـ 091 أو 092 أو 093 أو 094";
    }
    if (!form.address.trim()) return "الرجاء إدخال العنوان";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    // Build + open the WhatsApp draft synchronously, in direct response to the click,
    // so the browser doesn't block the popup once we `await` the save below.
    const url = buildWhatsAppDraft(
      {
        name: form.name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        ...(locationUrl ? { locationUrl } : {}),
      },
      lines,
      total,
    );
    setDraftUrl(url);
    window.open(url, "_blank");

    setBusy(true);
    setSaveNote(null);
    submit({
      data: {
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        ...(locationUrl ? { location_url: locationUrl } : {}),
        items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        total,
      },
    })
      .then(() => clear())
      .catch(() => setSaveNote("تم فتح واتساب لإرسال طلبك، لكن تعذّر حفظ نسخة منه في النظام."))
      .finally(() => setBusy(false));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="animate-scale-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 shadow-[var(--shadow-card)] sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl text-ink">احجز طلبك</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              نستلم طلبك ونرسله مباشرة إلى واتساب المركز
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        {draftUrl ? (
          <div className="mt-6 text-center">
            <p className="text-lg text-ink">تم إرسال طلبك 🌸</p>
            <p className="mt-2 text-sm text-muted-foreground">
              فتحنا لك واتساب في نافذة جديدة برسالة الطلب جاهزة — فقط اضغطي إرسال هناك. إذا لم تفتح
              النافذة، اضغطي الزر أدناه.
            </p>
            {saveNote && <p className="mt-3 text-sm text-destructive">{saveNote}</p>}
            <a
              href={draftUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full px-6 py-3 font-medium text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-pink)" }}
            >
              فتح واتساب لإرسال الطلب
            </a>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-full border border-border px-6 py-3 text-ink"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <Input label="الاسم الكامل" required {...field("name")} />
            <Input
              label="رقم الهاتف"
              required
              inputMode="tel"
              dir="ltr"
              placeholder="0912345678"
              maxLength={10}
              {...field("phone")}
            />
            <Input label="العنوان" required {...field("address")} />

            <div>
              <button
                type="button"
                onClick={shareLocation}
                disabled={locating}
                className="w-full rounded-2xl border border-dashed border-primary/50 px-4 py-3 text-sm text-primary transition-colors hover:bg-accent disabled:opacity-60"
              >
                {locating
                  ? "جارِ تحديد موقعك..."
                  : locationUrl
                    ? "✓ تم تحديد موقعك — اضغطي لإعادة التحديد"
                    : "📍 مشاركة موقعي على الخريطة (اختياري)"}
              </button>
              {locationError && <p className="mt-1 text-sm text-destructive">{locationError}</p>}
              {locationUrl && (
                <button
                  type="button"
                  onClick={() => setLocationUrl(null)}
                  className="mt-1 text-xs text-muted-foreground underline"
                >
                  إزالة الموقع
                </button>
              )}
            </div>

            <label className="block">
              <span className="mb-1 block text-sm text-muted-foreground">ملاحظات (اختياري)</span>
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
              {busy ? "جاري الإرسال..." : "تأكيد الحجز عبر واتساب"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
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
