import { useState } from "react";
import type { MenuItem } from "@/lib/shop.functions";

export type MenuItemDraft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  sort_order: string;
  is_available: boolean;
  image_url: string;
};

const empty: MenuItemDraft = {
  name: "",
  description: "",
  price: "",
  category: "",
  sort_order: "0",
  is_available: true,
  image_url: "",
};

export function MenuItemForm({
  initial,
  categories,
  busy,
  onCancel,
  onSubmit,
  onUploadImage,
}: {
  initial?: MenuItem | null;
  categories: string[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (draft: MenuItemDraft) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const [draft, setDraft] = useState<MenuItemDraft>(
    initial
      ? {
          id: initial.id,
          name: initial.name,
          description: initial.description ?? "",
          price: String(initial.price),
          category: initial.category,
          sort_order: String(initial.sort_order),
          is_available: initial.is_available,
          image_url: initial.image_url ?? "",
        }
      : empty,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await onUploadImage(file);
      setDraft((d) => ({ ...d, image_url: url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
      className="space-y-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="اسم الصنف"
          required
          value={draft.name}
          onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
        />
        <Field
          label="السعر (د.ل)"
          required
          type="number"
          step="0.01"
          value={draft.price}
          onChange={(v) => setDraft((d) => ({ ...d, price: v }))}
        />
        <Field
          label="التصنيف"
          required
          value={draft.category}
          onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
          list="menu-categories"
        />
        <Field
          label="ترتيب العرض"
          type="number"
          value={draft.sort_order}
          onChange={(v) => setDraft((d) => ({ ...d, sort_order: v }))}
        />
      </div>
      <datalist id="menu-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <label className="block">
        <span className="mb-1 block text-sm text-muted-foreground">الوصف</span>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
        />
      </label>

      <div className="flex flex-wrap items-start gap-4">
        {draft.image_url ? (
          <img src={draft.image_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground">
            بدون صورة
          </div>
        )}
        <div className="min-w-[220px] flex-1 space-y-2">
          <Field
            label="رابط الصورة (اختياري)"
            value={draft.image_url}
            onChange={(v) => setDraft((d) => ({ ...d, image_url: v }))}
            placeholder="https://..."
          />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary">
            <span className="rounded-full border border-primary px-3 py-1.5">
              {uploading ? "جارِ الرفع..." : "📷 رفع صورة من الجهاز"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.is_available}
          onChange={(e) => setDraft((d) => ({ ...d, is_available: e.target.checked }))}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm text-ink">متاح للعرض على الموقع</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy || uploading}
          className="rounded-full px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          style={{ backgroundImage: "var(--gradient-pink)" }}
        >
          {busy ? "جارِ الحفظ..." : "حفظ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-6 py-2.5 text-sm text-ink"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  step,
  placeholder,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  step?: string;
  placeholder?: string;
  list?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted-foreground">{label}</span>
      <input
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        list={list}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
      />
    </label>
  );
}
