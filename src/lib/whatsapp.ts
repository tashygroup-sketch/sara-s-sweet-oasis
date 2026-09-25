import type { CartLine } from "./cart";

export const WHATSAPP_NUMBER = "218915756638";

export type BookingInfo = {
  name: string;
  phone: string;
  address: string;
  date: string;
  notes: string;
};

export function buildWhatsAppDraft(info: BookingInfo, lines: CartLine[], total: number) {
  const items = lines.length
    ? lines.map((l) => `• ${l.name} × ${l.qty} — ${(l.price * l.qty).toFixed(2)} د.ل`).join("\n")
    : "• لا توجد أصناف محددة (طلب خاص)";

  const text = [
    "طلب جديد من موقع مركز سارة للحلويات 🌸",
    "",
    `الاسم: ${info.name}`,
    `الهاتف: ${info.phone}`,
    info.address ? `العنوان: ${info.address}` : null,
    info.date ? `تاريخ الاستلام: ${info.date}` : null,
    "",
    "الطلبات:",
    items,
    "",
    `الإجمالي: ${total.toFixed(2)} د.ل`,
    info.notes ? `ملاحظات: ${info.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
