import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/current-user";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();
  const [current] = await sql`select * from products where id = ${id}`;
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const [row] = await sql`
      update products set
        name = ${b.name ?? current.name},
        category = ${b.category ?? current.category},
        sku = ${b.sku !== undefined ? b.sku : current.sku},
        price = ${b.price ?? current.price},
        stock_quantity = ${b.stockQuantity ?? current.stock_quantity},
        description = ${b.description !== undefined ? b.description : current.description},
        image_url = ${b.imageUrl !== undefined ? b.imageUrl : current.image_url},
        trendyol_category_id = ${b.trendyolCategoryId !== undefined ? b.trendyolCategoryId : current.trendyol_category_id},
        trendyol_brand_id = ${b.trendyolBrandId !== undefined ? b.trendyolBrandId : current.trendyol_brand_id},
        trendyol_barcode = ${b.trendyolBarcode !== undefined ? b.trendyolBarcode : current.trendyol_barcode},
        updated_at = now()
      where id = ${id}
      returning *
    `;
    return NextResponse.json(row);
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Bu isim ya da barkod başka bir üründe zaten var." }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await sql`delete from products where id = ${id}`;
  return NextResponse.json({ ok: true });
}
