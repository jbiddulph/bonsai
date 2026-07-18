import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

/** Server-side auth gate (Node runtime) — avoids Netlify Edge crashes from auth.middleware(). */
export async function requireAuthSession() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  return session;
}
