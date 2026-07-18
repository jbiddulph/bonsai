import Link from "next/link";
import { UserButton } from "@neondatabase/auth-ui";
import { getCurrentProfile } from "@/app/actions/profile";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/plan", label: "Meal plan" },
  { href: "/app/scan", label: "Scanner" },
  { href: "/app/pantry", label: "Pantry" },
  { href: "/app/groceries", label: "Groceries" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Profile" },
];

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getCurrentProfile();
  const ready = Boolean(profile?.onboardingCompleted);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-leaf/10 bg-mist px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <Link
            href={ready ? "/app" : "/app/onboarding"}
            className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-leaf-deep"
          >
            BonsAI
          </Link>
          {ready && (
            <nav className="hidden gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm text-foreground/70 transition hover:bg-leaf/5 hover:text-leaf-deep"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <UserButton size="icon" />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
