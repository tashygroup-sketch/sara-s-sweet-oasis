import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listOrders } from "@/lib/shop.functions";
import { MenuPanel } from "@/components/admin/MenuPanel";
import { StoryPanel } from "@/components/admin/StoryPanel";
import logoAsset from "@/assets/logo.jpg.asset.json";

// Same key BookingDialog writes to when the magic admin phone is entered in the
// reservation form. Using localStorage (not sessionStorage) means that, once set, this
// survives closing the tab/browser — so this page never needs its own login screen.
const STORAGE_KEY = "sara-admin-phone";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "لوحة تحكم مركز سارة للحلويات" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  // listOrders doubles as the server-side admin check: it throws unless the phone is the
  // admin code, so the client never needs to know that code itself.
  const verify = useServerFn(listOrders);
  const navigate = useNavigate();

  const [phone, setPhone] = useState<string | null>(null);
  const [tab, setTab] = useState<"menu" | "story">("menu");

  useEffect(() => {
    // No separate login page here: the only way in is typing the admin code in the
    // reservation phone field on the home page. If it's not already stored, bounce home.
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) {
      navigate({ to: "/" });
      return;
    }
    verify({ data: { phone: stored } })
      .then(() => setPhone(stored))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        navigate({ to: "/" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!phone) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        جارِ التحقق...
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
            <a
              href="/"
              className="rounded-full px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)]"
              style={{ backgroundImage: "var(--gradient-pink)" }}
            >
              الرجوع الى الموقع
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 inline-flex rounded-full bg-muted p-1">
          <button
            onClick={() => setTab("menu")}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              tab === "menu" ? "bg-card text-ink shadow" : "text-muted-foreground"
            }`}
          >
            المنيو
          </button>
          <button
            onClick={() => setTab("story")}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              tab === "story" ? "bg-card text-ink shadow" : "text-muted-foreground"
            }`}
          >
            القصة والإعلانات
          </button>
        </div>

        {tab === "menu" && <MenuPanel phone={phone} />}
        {tab === "story" && <StoryPanel phone={phone} />}
      </main>
    </div>
  );
}
