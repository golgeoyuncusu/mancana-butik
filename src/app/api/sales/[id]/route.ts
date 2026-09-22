import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/current-user";
import { sql } from "@/lib/db";

// Bir satış silinince (yanlış girildiyse), bağlıysa ürünün stok miktarı satılan kadar geri eklenir.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await sql.begin(async (tx) => {
    const [sale] = await tx`select * from sales where id = ${id}`;
    if (!sale) return;
    if (sale.product_id) {
      await tx`update products set stock_quantity = stock_quantity + ${sale.quantity}, updated_at = now() where id = ${sale.product_id}`;
    }
    await tx`delete from sales where id = ${id}`;
  });
  return NextResponse.json({ ok: true });
}
