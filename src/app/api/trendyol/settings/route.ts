import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser, isOwner } from "@/lib/current-user";
import { sql } from "@/lib/db";

// API Key/Secret gibi hassas bilgiler GET yanıtında asla ham olarak dönmez — yalnızca "kayıtlı mı" bilgisi
// (Oteloji'deki HotelRunner token alanıyla aynı yaklaşım).
export async function GET() {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [row] = await sql`select supplier_id, (api_key is not null and api_key != '') as has_api_key, (api_secret is not null and api_secret != '') as has_api_secret from trendyol_settings where id = 1`;
  return NextResponse.json({ supplierId: row?.supplier_id || "", hasApiKey: !!row?.has_api_key, hasApiSecret: !!row?.has_api_secret });
}

export async function POST(req: NextRequest) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isOwner(me.role)) return NextResponse.json({ error: "Bu işlem için yetkiniz yok (yalnızca işletme sahibi)." }, { status: 403 });
  const b = await req.json();
  const [current] = await sql`select * from trendyol_settings where id = 1`;
  await sql`
    update trendyol_settings set
      supplier_id = ${b.supplierId !== undefined ? b.supplierId : current?.supplier_id},
      api_key = ${b.apiKey !== undefined && b.apiKey !== "" ? b.apiKey : current?.api_key},
      api_secret = ${b.apiSecret !== undefined && b.apiSecret !== "" ? b.apiSecret : current?.api_secret},
      updated_at = now()
    where id = 1
  `;
  return NextResponse.json({ ok: true });
}
