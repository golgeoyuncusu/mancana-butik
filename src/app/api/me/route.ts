import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/current-user";

export async function GET() {
  const me = await getOrCreateCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(me);
}
