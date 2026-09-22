import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getOrCreateCurrentUser } from "@/lib/current-user";

const MAX_BYTES = 8 * 1024 * 1024;   // 8 MB — telefon kamerasından gelen bir fotoğraf için yeterli, sunucuyu yormaz
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// Ürün fotoğrafını (telefondan seçilen/çekilen) Vercel Blob'a yükler ve herkese açık URL'sini döner. Bu URL
// hem uygulama içinde hem de Trendyol'a ürün yüklerken kullanılır (Trendyol görseli bir URL olarak ister).
export async function POST(req: NextRequest) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Yalnızca fotoğraf (JPEG/PNG/WEBP/HEIC) yüklenebilir." }, { status: 400 });
  }
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0) return NextResponse.json({ error: "Boş dosya." }, { status: 400 });
  if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "Fotoğraf çok büyük (en fazla 8 MB)." }, { status: 413 });

  const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
  const filename = `urunler/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(filename, buf, { access: "public", contentType, addRandomSuffix: false });
  return NextResponse.json({ url: blob.url });
}
