import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

// Tek işletme (Oteloji'nin aksine çoklu otel/kiracı yok), bu yüzden AppUser'da hotelId gibi bir alan yok.
export type AppRole = "owner" | "staff";
export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  role: AppRole;
};

export function isOwner(role: AppRole) {
  return role === "owner";
}

function normUser(r: Record<string, unknown>): AppUser {
  return {
    id: r.id as string,
    name: r.name as string,
    email: (r.email as string) ?? null,
    role: r.role as AppRole,
  };
}

/** Ensures a `users` row exists for the signed-in Clerk user. Uygulamayı ilk açan kişi otomatik "owner" olur
 * (onboarding akışı yok — tek işletme olduğu için buna gerek görülmedi); sonraki kayıt olanlar "staff" olur. */
export async function getOrCreateCurrentUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [existing] = await sql`select id, name, email, role from users where id = ${userId}`;
  if (existing) return normUser(existing);

  const cu = await currentUser();
  const email = cu?.primaryEmailAddress?.emailAddress || cu?.emailAddresses?.[0]?.emailAddress || null;
  const name = [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || email || "Kullanıcı";

  const [{ count }] = await sql`select count(*)::int as count from users`;
  const role = count === 0 ? "owner" : "staff";

  const [created] = await sql`
    insert into users (id, name, email, role)
    values (${userId}, ${name}, ${email}, ${role})
    on conflict (id) do update set id = excluded.id
    returning id, name, email, role
  `;
  return normUser(created);
}
