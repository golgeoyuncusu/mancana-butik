import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/current-user";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const rows = from && to
    ? await sql`select * from sales where sold_at between ${from} and ${to} order by sold_at desc, created_at desc`
    : await sql`select * from sales order by sold_at desc, created_at desc limit 500`;
  return NextResponse.json(rows);
}

// Bir satış kaydedilince, bağlıysa ilgili ürünün stok miktarı AYNI transaction içinde düşürülür — satış
// kaydedilip stok güncellenmemesi (ya da tam tersi) gibi bir tutarsızlık oluşmaz.
export async function POST(req: NextRequest) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const quantity = Number(b.quantity) || 1;
  const unitPrice = Number(b.unitPrice) || 0;
  let productName = (b.productName || "").trim();
  if (!b.productId && !productName) return NextResponse.json({ error: "Ürün seçin ya da ürün adı girin." }, { status: 400 });

  const row = await sql.begin(async (tx) => {
    if (b.productId) {
      const [product] = await tx`select id, name, stock_quantity from products where id = ${b.productId}`;
      if (product) {
        productName = productName || product.name;
        await tx`update products set stock_quantity = greatest(0, stock_quantity - ${quantity}), updated_at = now() where id = ${product.id}`;
      }
    }
    const [sale] = await tx`
      insert into sales (product_id, product_name, quantity, unit_price, total, payment_method, note, sold_at, created_by)
      values (${b.productId || null}, ${productName}, ${quantity}, ${unitPrice}, ${quantity * unitPrice}, ${b.paymentMethod || "Nakit"}, ${b.note || null}, ${b.soldAt || new Date().toISOString().slice(0, 10)}, ${me.id})
      returning *
    `;
    return sale;
  });
  return NextResponse.json(row, { status: 201 });
}
