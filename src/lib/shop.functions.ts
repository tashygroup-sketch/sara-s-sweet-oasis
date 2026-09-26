import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const WHATSAPP_NUMBER = "218913411424";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  image_ratio: number | null;
  extra_images: string[];
  extra_image_ratios: number[];
  category: string;
  sort_order: number;
  is_available: boolean;
};

// Reads a JPEG's real width/height straight from its file header, without any image
// library — works in the Workers runtime and needs no client round-trip. Every upload
// is compressed to JPEG client-side before it reaches here, so this is the only format
// that needs to be supported.
function getJpegRatio(bytes: Uint8Array): number | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1]!;
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) {
      const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!;
      const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!;
      if (width > 0 && height > 0) return height / width;
      return null;
    }
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

export type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  address: string | null;
  delivery_date: string | null;
  notes: string | null;
  location_url: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function adminClient(phone: string) {
  const { isAdminPhone } = await import("@/lib/admin.server");
  if (!isAdminPhone(phone)) throw new Error("غير مصرح");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getMenu = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("menu_items")
    .select(
      "id,name,description,price,image_url,image_ratio,extra_images,extra_image_ratios,category,sort_order,is_available",
    )
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MenuItem[];
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      customer_name: string;
      phone: string;
      address: string;
      notes?: string;
      location_url?: string;
      items: { name: string; qty: number; price: number }[];
      total: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { isAdminPhone } = await import("@/lib/admin.server");
    if (isAdminPhone(data.phone)) {
      // Admin trigger code: don't log this as a real customer order, and skip every
      // validation rule below that a real order would need to satisfy.
      return { id: "admin", isAdmin: true as const };
    }

    const name = data.customer_name?.trim();
    const phone = data.phone?.trim();
    const address = data.address?.trim();
    if (!name) throw new Error("الاسم مطلوب");
    if (!phone || !/^(091|092|093|094)\d{7}$/.test(phone)) {
      throw new Error("رقم الهاتف يجب أن يتكون من 10 أرقام ويبدأ بـ 091 أو 092 أو 093 أو 094");
    }
    if (!address) throw new Error("العنوان مطلوب");
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("اختر صنفًا واحدًا على الأقل من المنيو");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: Database["public"]["Tables"]["orders"]["Insert"] = {
      customer_name: name.slice(0, 120),
      phone: phone.slice(0, 40),
      address: address.slice(0, 300),
      notes: data.notes?.trim().slice(0, 600) ?? null,
      location_url: data.location_url?.trim().slice(0, 300) ?? null,
      items: data.items,
      total: data.total ?? 0,
    };
    let result = await supabaseAdmin.from("orders").insert(payload).select("id").single();
    if (result.error?.code === "PGRST204") {
      // The location_url column hasn't been migrated onto the live database yet —
      // don't let a customer's order fail just because of that; save without it.
      const { location_url: _locationUrl, ...withoutLocation } = payload;
      result = await supabaseAdmin.from("orders").insert(withoutLocation).select("id").single();
    }
    if (result.error) throw new Error(result.error.message);
    return { id: result.data.id as string, isAdmin: false as const };
  });

export const listOrders = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) => input)
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const { data: rows, error } = await db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []) as OrderRow[];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; id: string; status: string }) => input)
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const { error } = await db.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveMenuItem = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      phone: string;
      item: {
        id?: string;
        name: string;
        description?: string;
        price: number;
        image_url?: string;
        image_ratio?: number | null;
        extra_images?: string[];
        extra_image_ratios?: number[];
        category: string;
        sort_order?: number;
        is_available?: boolean;
      };
    }) => {
      if (!input.item?.name?.trim()) throw new Error("اسم الصنف مطلوب");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const payload = {
      name: data.item.name.trim().slice(0, 120),
      description: data.item.description?.trim().slice(0, 500) ?? null,
      price: Number(data.item.price) || 0,
      image_url: data.item.image_url?.trim() || null,
      image_ratio: data.item.image_ratio ?? null,
      extra_images: (data.item.extra_images ?? []).map((u) => u.trim()).filter(Boolean),
      extra_image_ratios: data.item.extra_image_ratios ?? [],
      category: data.item.category?.trim().slice(0, 60) || "حلويات",
      sort_order: Number(data.item.sort_order) || 0,
      is_available: data.item.is_available ?? true,
    };
    let q = data.item.id
      ? db.from("menu_items").update(payload).eq("id", data.item.id)
      : db.from("menu_items").insert(payload);
    let { error } = await q;
    if (error?.code === "PGRST204") {
      // The new ratio/extra_images columns haven't been migrated onto the live
      // database yet — save the rest of the item rather than failing the whole save.
      const {
        extra_images: _extraImages,
        extra_image_ratios: _ratios,
        image_ratio: _ratio,
        ...rest
      } = payload;
      q = data.item.id
        ? db.from("menu_items").update(rest).eq("id", data.item.id)
        : db.from("menu_items").insert(rest);
      ({ error } = await q);
    }
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMenuItem = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; id: string }) => input)
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const { error } = await db.from("menu_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadMenuImage = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { phone: string; filename: string; contentType: string; dataBase64: string }) => {
      if (!input.dataBase64?.trim()) throw new Error("لا توجد صورة");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.byteLength > 6 * 1024 * 1024)
      throw new Error("حجم الصورة كبير جدًا (الحد الأقصى 6 ميجابايت)");
    const ext =
      (data.filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage
      .from("menu-photos")
      .upload(path, bytes, { contentType: data.contentType || "image/jpeg", upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = db.storage.from("menu-photos").getPublicUrl(path);
    const ratio = getJpegRatio(bytes);
    return { url: pub.publicUrl, ratio };
  });

const DEFAULT_STORY = {
  story_label: "قصتنا",
  story_title: "لمسة سارة في كل قطعة",
  story_text:
    "من مطبخ صغير إلى مركز متكامل للحلويات، نختار أجود المكوّنات ونُزيّن كل طبق بعناية لتصل إليك قطعة تليق بفرحتك.",
};

export type Promotion = { id: string; image_url: string; ratio: number | null; sort_order: number };

export const getStorySection = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const [settings, promos] = await Promise.all([
    client
      .from("site_settings")
      .select("story_label,story_title,story_text")
      .eq("id", 1)
      .maybeSingle(),
    client
      .from("promotions")
      .select("id,image_url,ratio,sort_order")
      .order("sort_order", { ascending: true }),
  ]);
  if (settings.error) throw new Error(settings.error.message);
  if (promos.error) throw new Error(promos.error.message);
  return {
    story_label: settings.data?.story_label ?? DEFAULT_STORY.story_label,
    story_title: settings.data?.story_title ?? DEFAULT_STORY.story_title,
    story_text: settings.data?.story_text ?? DEFAULT_STORY.story_text,
    images: (promos.data ?? []) as Promotion[],
  };
});

export const saveStorySettings = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { phone: string; story_label: string; story_title: string; story_text: string }) =>
      input,
  )
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const { error } = await db.from("site_settings").upsert({
      id: 1,
      story_label: data.story_label.trim().slice(0, 60) || DEFAULT_STORY.story_label,
      story_title: data.story_title.trim().slice(0, 120) || DEFAULT_STORY.story_title,
      story_text: data.story_text.trim().slice(0, 800) || DEFAULT_STORY.story_text,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addPromotion = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; image_url: string; ratio?: number | null }) => {
    if (!input.image_url?.trim()) throw new Error("رابط الصورة مطلوب");
    return input;
  })
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const { data: last, error: lastError } = await db
      .from("promotions")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    if (lastError) throw new Error(lastError.message);
    const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;
    const payload = {
      image_url: data.image_url.trim(),
      ratio: data.ratio ?? null,
      sort_order: nextOrder,
    };
    let { error } = await db.from("promotions").insert(payload);
    if (error?.code === "PGRST204") {
      // The ratio column hasn't been migrated onto the live database yet.
      const { ratio: _ratio, ...withoutRatio } = payload;
      ({ error } = await db.from("promotions").insert(withoutRatio));
    }
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePromotion = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; id: string }) => input)
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const { error } = await db.from("promotions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
