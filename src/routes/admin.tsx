import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listOrders } from "@/lib/shop.functions";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { MenuPanel } from "@/components/admin/MenuPanel";
import logoAsset from "@/assets/logo.jpg.asset.json";

const STORAGE_KEY = "sara-admin-phone";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "لوحة تحكم مركز سارة للحلويات" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  // listOrders doubles as the server-side admin check: it throws unless the phone is the
  // real admin number, so the client never needs to know that number itself.
  const verify = useServerFn(listOrders);

  const [phone, setPhone] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  const [gateInput, setGateInput] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (!stored) {
      setChecking(false);
      return;
    }
    verify({ data: { phone: stored } })
      .then(() => setPhone(stored))
      .catch(() => sessionStorage.removeItem(STORAGE_KEY))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGate(e: React.FormEvent) {
    e.preventDefault();
    setGateBusy(true);
    setGateError(null);
    try {
      await verify({ data: { phone: gateInput } });
      sessionStorage.setItem(STORAGE_KEY, gateInput);
      setPhone(gateInput);
    } catch {
      setGateError("رقم غير صحيح");
    } finally {
      setGateBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPhone(null);
    navigate({ to: "/" });
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        جارِ التحقق...
      </div>
    );
  }

  if (!phone) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "var(--gradient-petal)" }}
      >
        <form
          onSubmit={handleGate}
          className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-card)]"
        >
          <img src={logoAsset.url} alt="" className="mx-auto h-16 w-16 object-contain" />
          <h1 className="mt-4 text-xl text-ink">دخول لوحة التحكم</h1>
          <input
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={gateInput}
            onChange={(e) => setGateInput(e.target.value)}
            placeholder="رقم الهاتف"
            className="mt-5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-center outline-none focus:border-primary"
          />
          {gateError && <p className="mt-2 text-sm text-destructive">{gateError}</p>}
          <button
            type="submit"
            disabled={gateBusy}
            className="mt-5 w-full rounded-full px-6 py-3 font-medium text-primary-foreground disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-pink)" }}
          >
            {gateBusy ? "جارِ التحقق..." : "دخول"}
          </button>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            العودة للموقع
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" className="h-9 w-9 object-contain" />
            <span className="text-ink">لوحة تحكم مركز سارة</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="rounded-full border border-border px-4 py-2 text-sm text-ink">
              معاينة الموقع
            </a>
            <button
              onClick={logout}
              className="rounded-full border border-destructive px-4 py-2 text-sm text-destructive"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 inline-flex rounded-full bg-muted p-1">
          <button
            onClick={() => setTab("orders")}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              tab === "orders" ? "bg-card text-ink shadow" : "text-muted-foreground"
            }`}
          >
            الطلبات
          </button>
          <button
            onClick={() => setTab("menu")}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              tab === "menu" ? "bg-card text-ink shadow" : "text-muted-foreground"
            }`}
          >
            المنيو
          </button>
        </div>

        {tab === "orders" ? <OrdersPanel phone={phone} /> : <MenuPanel phone={phone} />}
      </main>
    </div>
  );
}
