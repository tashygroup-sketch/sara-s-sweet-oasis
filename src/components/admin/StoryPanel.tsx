import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  getStorySection,
  saveStorySettings,
  addPromotion,
  deletePromotion,
  uploadMenuImage,
} from "@/lib/shop.functions";
import { fileToCompressedBase64 } from "@/lib/image";

type StoryData = Awaited<ReturnType<typeof getStorySection>>;

export function StoryPanel({ phone }: { phone: string }) {
  const fetchStory = useServerFn(getStorySection);
  const save = useServerFn(saveStorySettings);
  const addImage = useServerFn(addPromotion);
  const removeImage = useServerFn(deletePromotion);
  const upload = useServerFn(uploadMenuImage);
  const queryClient = useQueryClient();

  const [data, setData] = useState<StoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ story_label: "", story_title: "", story_text: "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetchStory();
      setData(res);
      setForm({
        story_label: res.story_label,
        story_title: res.story_title,
        story_text: res.story_text,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل محتوى القسم");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshPublicStory() {
    queryClient.invalidateQueries({ queryKey: ["story"] });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await save({ data: { phone, ...form } });
      setSaved(true);
      refreshPublicStory();
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { base64, contentType } = await fileToCompressedBase64(file);
      const res = await upload({
        data: { phone, filename: file.name, contentType, dataBase64: base64 },
      });
      await addImage({ data: { phone, image_url: res.url } });
      await load();
      refreshPublicStory();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه الصورة؟")) return;
    try {
      await removeImage({ data: { phone, id } });
      await load();
      refreshPublicStory();
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذّر الحذف");
    }
  }

  if (error) return <p className="py-10 text-center text-destructive">{error}</p>;
  if (!data) return <p className="py-10 text-center text-muted-foreground">جارِ التحميل...</p>;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="space-y-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
      >
        <label className="block">
          <span className="mb-1 block text-sm text-muted-foreground">العنوان الصغير</span>
          <input
            value={form.story_label}
            onChange={(e) => setForm((f) => ({ ...f, story_label: e.target.value }))}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted-foreground">العنوان الرئيسي</span>
          <input
            value={form.story_title}
            onChange={(e) => setForm((f) => ({ ...f, story_title: e.target.value }))}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted-foreground">الفقرة</span>
          <textarea
            rows={4}
            value={form.story_text}
            onChange={(e) => setForm((f) => ({ ...f, story_text: e.target.value }))}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-pink)" }}
          >
            {busy ? "جارِ الحفظ..." : "حفظ النص"}
          </button>
          {saved && <span className="text-sm text-primary">✓ تم الحفظ</span>}
        </div>
      </form>

      <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg text-ink">صور الإعلانات</h3>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary">
            <span className="rounded-full border border-primary px-3 py-1.5">
              {uploading ? "جارِ الرفع..." : "+ إضافة صورة"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}

        <div className="scrollbar-none mt-4 flex gap-3 overflow-x-auto pb-2">
          {data.images.map((img) => (
            <div key={img.id} className="relative shrink-0">
              <img src={img.image_url} alt="" className="h-32 w-40 rounded-2xl object-cover" />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-sm text-white"
                aria-label="حذف الصورة"
              >
                ✕
              </button>
            </div>
          ))}
          {data.images.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">لا توجد صور بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
