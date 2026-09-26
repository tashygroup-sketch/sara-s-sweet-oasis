import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listOrders } from "@/lib/shop.functions";
import { MenuPanel } from "@/components/admin/MenuPanel";
import { StoryPanel } from "@/components/admin/StoryPanel";
import logoAsset from "@/assets/logo.jpg.asset.json";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
  }),
  head: () => ({
    meta: [{ title: "لوحة تحكم مركز سارة للحلويات" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { phone: urlPhone } = Route.useSearch();
  const verify = useServerFn(listOrders);

  const [phone, setPhone] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"menu" | "story">("menu");

  useEffect(() => {
    if (!urlPhone) {
      setChecking(false);
      return;
    }
    verify({ data: { phone: urlPhone } })
      .then(() => setPhone(urlPhone))
      .catch(() => setPhone(null))
      .finally(() => setChecking(false));
  }, [urlPhone]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        جارِ التحقق...
      </div>
    );
  }

  if (!phone) {
    return null;
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
