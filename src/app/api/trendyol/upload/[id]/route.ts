import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/current-user";
import { sql } from "@/lib/db";
import { TrendyolApiError, uploadProductToTrendyol } from "@/lib/trendyol";

// Bir ürünü Trendyol'a yükler/günceller. DOĞRULANMAMIŞ ENTEGRASYON: gerçek bir Trendyol satıcı hesabına
// karşı test edilmedi (bkz. src/lib/trendyol.ts başındaki not). Ürün önce Trendyol'a yüklenmek için gereken
// alanlarla (barkod, kategori id, marka id) düzenlenmiş olmalı.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const [product] = await sql`select * from products where id = ${id}`;
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!product.trendyol_barcode || !product.trendyol_category_id || !product.trendyol_brand_id) {
    return NextResponse.json({ error: "Bu ürün için önce barkod, Trendyol kategori id ve marka id girilmeli." }, { status: 400 });
  }

  const [settings] = await sql`select supplier_id, api_key, api_secret from trendyol_settings where id = 1`;
  try {
    const result = await uploadProductToTrendyol(
      { supplierId: settings?.supplier_id || "", apiKey: settings?.api_key || "", apiSecret: settings?.api_secret || "" },
      {
        barcode: product.trendyol_barcode,
        title: product.name,
        categoryId: product.trendyol_category_id,
        brandId: product.trendyol_brand_id,
        quantity: Number(product.stock_quantity) || 0,
        stockCode: product.trendyol_barcode,
        price: Number(product.price) || 0,
        description: product.description || undefined,
        imageUrl: product.image_url || undefined,
      },
    );
    await sql`update products set trendyol_synced_at = now(), trendyol_sync_error = null where id = ${id}`;
    return NextResponse.json({ ok: true, batchRequestId: result.batchRequestId });
  } catch (e) {
    const msg = e instanceof TrendyolApiError ? e.message : "Trendyol'a yükleme başarısız.";
    await sql`update products set trendyol_sync_error = ${msg} where id = ${id}`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
