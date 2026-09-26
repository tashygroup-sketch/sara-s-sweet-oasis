import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  getMenu,
  saveMenuItem,
  deleteMenuItem,
  uploadMenuImage,
  type MenuItem,
} from "@/lib/shop.functions";
import { fileToCompressedBase64 } from "@/lib/image";
import { MenuItemForm, type MenuItemDraft } from "./MenuItemForm";
import { Reveal } from "@/components/Reveal";

export function MenuPanel({ phone }: { phone: string }) {
  const fetchMenu = useServerFn(getMenu);
  const save = useServerFn(saveMenuItem);
  const remove = useServerFn(deleteMenuItem);
  const upload = useServerFn(uploadMenuImage);
  const queryClient = useQueryClient();

  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const rows = await fetchMenu();
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل المنيو");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = [...new Set((items ?? []).map((i) => i.category))];

  function nextSortOrderFor(category: string) {
    const inCategory = (items ?? []).filter((i) => i.category === category);
    if (inCategory.length === 0) return 1;
    return Math.max(...inCategory.map((i) => i.sort_order)) + 1;
  }

  async function handleUploadImage(file: File) {
    const { base64, contentType } = await fileToCompressedBase64(file);
    const res = await upload({
      data: { phone, filename: file.name, contentType, dataBase64: base64 },
    });
    return res.url;
  }

  async function handleSubmit(draft: MenuItemDraft) {
    setBusy(true);
    try {
      await save({
        data: {
          phone,
          item: {
            ...(draft.id ? { id: draft.id } : {}),
            name: draft.name,
            description: draft.description,
            price: Number(draft.price) || 0,
            image_url: draft.image_url,
            extra_images: draft.extra_images,
            category: draft.category || "حلويات",
            sort_order: Number(draft.sort_order) || 0,
          },
        },
      });
      setEditing(null);
      await load();
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا الصنف نهائيًا؟")) return;
    try {
      await remove({ data: { phone, id } });
      await load();
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذّر الحذف");
    }
  }

  if (error) return <p className="py-10 text-center text-destructive">{error}</p>;
  if (!items) return <p className="py-10 text-center text-muted-foreground">جارِ التحميل...</p>;

  return (
    <div className="space-y-5">
      {editing === "new" && (
        <MenuItemForm
          categories={categories}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSubmit={handleSubmit}
          onUploadImage={handleUploadImage}
          nextSortOrderFor={nextSortOrderFor}
        />
      )}

      {!editing && (
        <button
          onClick={() => setEditing("new")}
          className="rounded-full px-6 py-2.5 text-sm font-medium text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-pink)" }}
        >
          + إضافة صنف جديد
        </button>
      )}

      {!editing && categories.length > 1 && (
        <Reveal>
          <div>
            <p className="mb-2 text-xs tracking-[0.25em] text-primary">الرفوف</p>
            <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    document
                      .getElementById(`admin-cat-${cat.replace(/\s+/g, "-")}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="shrink-0 rounded-full border border-primary/40 bg-card px-4 py-1.5 text-sm text-ink shadow-[var(--shadow-card)] transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {categories.map((cat) => (
        <div key={cat} id={`admin-cat-${cat.replace(/\s+/g, "-")}`} className="scroll-mt-24">
          <h3 className="mb-3 text-lg text-ink">{cat}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter((item) => item.category === cat)
              .map((item) =>
                editing !== "new" && editing?.id === item.id ? (
                  <MenuItemForm
                    key={item.id}
                    initial={item}
                    categories={categories}
                    busy={busy}
                    onCancel={() => setEditing(null)}
                    onSubmit={handleSubmit}
                    onUploadImage={handleUploadImage}
                    nextSortOrderFor={nextSortOrderFor}
                  />
                ) : (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="max-h-56 w-full bg-muted object-contain"
                      />
                    ) : (
                      <div className="flex h-36 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        بدون صورة
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="text-ink">{item.name}</h4>
                      <p className="mt-1 font-bold text-primary">
                        {Number(item.price).toFixed(2)} د.ل
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setEditing(item)}
                          className="flex-1 rounded-full border border-primary px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full border border-destructive px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">لا توجد أصناف بعد</p>
      )}
    </div>
  );
}
