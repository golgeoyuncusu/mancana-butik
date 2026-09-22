import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/current-user";
import { sql } from "@/lib/db";

export async function GET() {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await sql`select * from products order by category, lower(name)`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const name = (b.name || "").trim();
  if (!name) return NextResponse.json({ error: "Ürün adı gerekli." }, { status: 400 });
  try {
    const [row] = await sql`
      insert into products (name, category, sku, price, stock_quantity, description, image_url)
      values (${name}, ${b.category || "Diğer"}, ${b.sku || null}, ${b.price ?? 0}, ${b.stockQuantity ?? 0}, ${b.description || null}, ${b.imageUrl || null})
      returning *
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Bu isimde bir ürün zaten var." }, { status: 409 });
    }
    throw e;
  }
}
