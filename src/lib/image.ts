// Resize + compress an image file in the browser before sending it to the server as base64.
// Keeps admin photo uploads small (a phone photo can be 5-10MB straight out of the camera).
export async function fileToCompressedBase64(file: File, maxDim = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّرت معالجة الصورة");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("تعذّر ضغط الصورة"))),
      "image/jpeg",
      quality,
    ),
  );

  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const base64 = btoa(binary);

  return { base64, contentType: "image/jpeg" };
}

// Normalizes any phone the customer typed (local "0..." or international "218...") into the
// international digits wa.me expects. Not a secret — just formatting, safe to ship to the client.
export function toIntlLibyaPhone(raw: string) {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("00218")) digits = digits.slice(2);
  if (digits.startsWith("218")) return digits;
  if (digits.startsWith("0")) return `218${digits.slice(1)}`;
  return `218${digits}`;
}

export function waLink(rawPhone: string, text?: string) {
  const number = toIntlLibyaPhone(rawPhone);
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${number}${query}`;
}
