import Link from "next/link";
import { UserButton } from "@neondatabase/auth-ui";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession();
  const signedIn = Boolean(session?.user);

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold tracking-tight text-mist md:text-3xl"
        >
          BonsAI
        </Link>
        <nav className="flex items-center gap-3">
          {signedIn ? (
            <>
              <Link
                href="/app"
                className="rounded-full bg-mist/95 px-4 py-2 text-sm font-medium text-leaf-deep transition hover:bg-white"
              >
                Open app
              </Link>
              <UserButton size="icon" />
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="px-3 py-2 text-sm font-medium text-mist/90 transition hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-soil transition hover:brightness-110"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>
      {children}
    </>
  );
}
