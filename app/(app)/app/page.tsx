import Link from "next/link";
import Image from "next/image";
import {
  Leaf,
  ScanLine,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

const modules = [
  {
    href: "/app/plan",
    title: "AI Meal Planner",
    blurb: "7-day plant-based plans in under 30 seconds.",
    icon: UtensilsCrossed,
    status: "Ready",
    gradient: "from-emerald-500 to-teal-600",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&fit=crop",
  },
  {
    href: "/app/scan",
    title: "AI Scanner",
    blurb: "Check labels and menus for hidden animal ingredients.",
    icon: ScanLine,
    status: "Ready",
    gradient: "from-blue-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400&q=80&fit=crop",
  },
  {
    href: "/app/groceries",
    title: "Grocery Planner",
    blurb: "Budget-aware lists from your weekly plan.",
    icon: ShoppingBasket,
    status: "Ready",
    gradient: "from-violet-500 to-purple-600",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80&fit=crop",
  },
  {
    href: "/app/pantry",
    title: "Pantry & Leftovers",
    blurb: "Cook what you already have. Waste less.",
    icon: Leaf,
    status: "Ready",
    gradient: "from-amber-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80&fit=crop",
  },
];

export default async function AppHomePage() {
  const { user, profile } = await requireOnboardedProfile();
  const name =
    profile.displayName?.split(" ")[0] ??
    user.name?.split(" ")[0] ??
    "there";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      {/* Welcome Header with Visual Banner */}
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-leaf via-leaf-deep to-sprout p-8 md:p-10">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80&fit=crop"
            alt="Fresh vegetables background"
            fill
            className="object-cover"
          />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-citrus">Grow Smarter. Eat Better.</p>
              <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-mist md:text-5xl">
                Welcome back, {name}!
              </h1>
              <p className="mt-4 max-w-2xl text-base text-mist/90 md:text-lg">
                Ready to plan your week? Start with your personalized meal plan and use our 
                other tools to shop smart, scan products, and minimize waste.
              </p>
              
              {/* User Profile Stats */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="rounded-xl bg-mist/10 px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-mist/70">Diet</p>
                  <p className="font-semibold text-mist">
                    {profile.diet.replace("_", "-")}
                  </p>
                </div>
                <div className="rounded-xl bg-mist/10 px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-mist/70">Household</p>
                  <p className="font-semibold text-mist">
                    {profile.householdSize}{" "}
                    {profile.householdSize === 1 ? "person" : "people"}
                  </p>
                </div>
                {profile.budgetWeeklyGbp && (
                  <div className="rounded-xl bg-mist/10 px-4 py-2 backdrop-blur-sm">
                    <p className="text-xs text-mist/70">Weekly Budget</p>
                    <p className="font-semibold text-mist">
                      £{profile.budgetWeeklyGbp}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app/plan"
                  className="inline-flex items-center gap-2 rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-soil transition hover:brightness-110"
                >
                  <Sparkles className="size-4" />
                  Generate this week&apos;s plan
                </Link>
                <Link
                  href="/app/settings"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-mist/30 px-6 py-3 text-sm font-medium text-mist transition hover:bg-mist/10"
                >
                  Edit preferences
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-sprout/20 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sprout/10 p-2">
              <Clock className="size-5 text-leaf" />
            </div>
            <div>
              <p className="text-sm font-semibold text-leaf-deep">Quick Start</p>
              <p className="text-xs text-foreground/60">Plans in 30 seconds</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-sprout/20 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sprout/10 p-2">
              <TrendingUp className="size-5 text-leaf" />
            </div>
            <div>
              <p className="text-sm font-semibold text-leaf-deep">Save Money</p>
              <p className="text-xs text-foreground/60">Budget-optimized meals</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-sprout/20 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sprout/10 p-2">
              <Leaf className="size-5 text-leaf" />
            </div>
            <div>
              <p className="text-sm font-semibold text-leaf-deep">Zero Waste</p>
              <p className="text-xs text-foreground/60">Use every ingredient</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div>
        <h2 className="mb-6 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
          Your tools
        </h2>
        
        <div className="grid gap-6 sm:grid-cols-2">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group relative overflow-hidden rounded-3xl border border-leaf/10 bg-white shadow-sm transition hover:shadow-xl"
            >
              {/* Feature Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={mod.image}
                  alt={mod.title}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-20 mix-blend-multiply`} />
                
                {/* Status Badge */}
                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-leaf backdrop-blur-sm">
                  {mod.status}
                </div>
                
                {/* Icon */}
                <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 p-3 backdrop-blur-sm">
                  <mod.icon className="size-6 text-leaf" />
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-leaf-deep group-hover:text-leaf">
                      {mod.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      {mod.blurb}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-leaf/50 transition group-hover:translate-x-1 group-hover:text-leaf" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Sign Out */}
      <div className="mt-8 lg:hidden">
        <SignOutButton />
      </div>
    </main>
  );
}
