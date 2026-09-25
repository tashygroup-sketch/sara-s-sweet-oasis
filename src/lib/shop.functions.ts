import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const ADMIN_PHONE_DIGITS = "0915756638";
export const WHATSAPP_NUMBER = "218915756638";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  sort_order: number;
  is_available: boolean;
};

export type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  address: string | null;
  delivery_date: string | null;
  notes: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
};

function normalizePhone(raw: string) {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.replace(/^00218/, "0").replace(/^218/, "0");
}

export function isAdminPhone(raw: string) {
  return normalizePhone(raw) === ADMIN_PHONE_DIGITS;
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function adminClient(phone: string) {
  if (!isAdminPhone(phone)) throw new Error("غير مصرح");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getMenu = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("menu_items")
    .select("id,name,description,price,image_url,category,sort_order,is_available")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MenuItem[];
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: {
    customer_name: string;
    phone: string;
    address?: string;
    delivery_date?: string;
    notes?: string;
    items: { name: string; qty: number; price: number }[];
    total: number;
  }) => {
    if (!input.customer_name?.trim()) throw new Error("الاسم مطلوب");
    if (!input.phone?.trim()) throw new Error("رقم الهاتف مطلوب");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name.trim().slice(0, 120),
        phone: data.phone.trim().slice(0, 40),
        address: data.address?.trim().slice(0, 300) ?? null,
        delivery_date: data.delivery_date?.trim().slice(0, 60) ?? null,
        notes: data.notes?.trim().slice(0, 600) ?? null,
        items: data.items ?? [],
        total: data.total ?? 0,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string, isAdmin: isAdminPhone(data.phone) };
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

export const saveMenuItem = createServerFn({ method: "POST" })
  .inputValidator((input: {
    phone: string;
    item: {
      id?: string;
      name: string;
      description?: string;
      price: number;
      image_url?: string;
      category: string;
      sort_order?: number;
      is_available?: boolean;
    };
  }) => {
    if (!input.item?.name?.trim()) throw new Error("اسم الصنف مطلوب");
    return input;
  })
  .handler(async ({ data }) => {
    const db = await adminClient(data.phone);
    const payload = {
      name: data.item.name.trim().slice(0, 120),
      description: data.item.description?.trim().slice(0, 500) ?? null,
      price: Number(data.item.price) || 0,
      image_url: data.item.image_url?.trim() || null,
      category: data.item.category?.trim().slice(0, 60) || "حلويات",
      sort_order: Number(data.item.sort_order) || 0,
      is_available: data.item.is_available ?? true,
    };
    const q = data.item.id
      ? db.from("menu_items").update(payload).eq("id", data.item.id)
      : db.from("menu_items").insert(payload);
    const { error } = await q;
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
