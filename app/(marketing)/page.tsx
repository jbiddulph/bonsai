import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth/server";
import {
  Sparkles,
  ScanLine,
  ShoppingBasket,
  ChefHat,
  Clock,
  Wallet,
  Leaf,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { data: session } = await auth.getSession();
  const signedIn = Boolean(session?.user);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero Section with Image */}
      <section className="relative flex min-h-screen flex-col justify-center px-6 pb-16 pt-28 md:px-10 md:pb-20">
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,#12352a_0%,#1f4d3a_42%,#2f6b4f_70%,#d4a017_140%)]"
          aria-hidden
        />
        
        {/* Hero Image Overlay */}
        <div className="absolute inset-0 -z-10 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920&q=80&fit=crop"
            alt="Fresh colorful plant-based meal"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div
          className="animate-drift absolute -right-16 top-24 -z-10 h-72 w-72 rounded-full bg-sprout/25 blur-3xl md:h-[28rem] md:w-[28rem]"
          aria-hidden
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="relative z-10">
            <p className="animate-rise mb-4 font-[family-name:var(--font-fraunces)] text-lg text-citrus md:text-xl">
              BonsAI
            </p>
            <h1 className="animate-rise max-w-3xl font-[family-name:var(--font-fraunces)] text-5xl leading-[1.05] font-semibold tracking-tight text-mist md:text-7xl">
              Grow Smarter. Eat Better.
            </h1>
            <p className="animate-rise-delay mt-5 max-w-xl text-base leading-relaxed text-mist/90 md:text-lg">
              Your AI-powered plant-based food assistant. Personalized meal plans
              in under 30 seconds — less waste, lower spend, better eating.
            </p>
            <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
              {signedIn ? (
                <>
                  <Link
                    href="/app/plan"
                    className="inline-flex items-center gap-2 rounded-full bg-mist px-6 py-3 text-sm font-semibold text-leaf-deep transition hover:bg-white"
                  >
                    <Sparkles className="size-4" />
                    Open meal planner
                  </Link>
                  <Link
                    href="/app"
                    className="inline-flex items-center gap-2 rounded-full border border-mist/40 px-6 py-3 text-sm font-medium text-mist transition hover:border-mist hover:bg-mist/10"
                  >
                    Go to my app
                    <ArrowRight className="size-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center gap-2 rounded-full bg-mist px-6 py-3 text-sm font-semibold text-leaf-deep transition hover:bg-white"
                  >
                    <Sparkles className="size-4" />
                    Plan my week free
                  </Link>
                  <Link
                    href="/auth/sign-in"
                    className="inline-flex items-center gap-2 rounded-full border border-mist/40 px-6 py-3 text-sm font-medium text-mist transition hover:border-mist hover:bg-mist/10"
                  >
                    I already have an account
                    <ArrowRight className="size-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-mist/20 pt-8">
              <div>
                <div className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-citrus md:text-3xl">
                  30s
                </div>
                <div className="mt-1 text-sm text-mist/70">Plan created</div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-citrus md:text-3xl">
                  7 days
                </div>
                <div className="mt-1 text-sm text-mist/70">Full week</div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-citrus md:text-3xl">
                  100%
                </div>
                <div className="mt-1 text-sm text-mist/70">Plant-based</div>
              </div>
            </div>
          </div>

          {/* Hero Food Image Card */}
          <div className="animate-rise-delay relative hidden md:block">
            <div className="relative h-[500px] overflow-hidden rounded-3xl border-4 border-mist/20 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80&fit=crop"
                alt="Delicious plant-based bowl"
                fill
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-leaf-deep/90 to-transparent p-6">
                <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-mist">
                  AI-crafted meals you&apos;ll love
                </p>
                <p className="mt-2 text-sm text-mist/80">
                  Budget-friendly, protein-packed, and ready in minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-mist px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep md:text-5xl">
              Everything you need to eat well
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              Four powerful tools working together to transform your plant-based journey
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:gap-10">
            {/* Feature 1: Meal Planner */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg transition hover:shadow-xl">
              <div className="relative h-56">
                <Image
                  src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80&fit=crop"
                  alt="Fresh salad bowl"
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
                <div className="absolute right-4 top-4 rounded-full bg-leaf-deep/90 p-3">
                  <ChefHat className="size-6 text-citrus" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
                  AI Meal Planner
                </h3>
                <p className="mt-3 leading-relaxed text-foreground/70">
                  Get a complete 7-day meal plan in 30 seconds. Tailored to your budget, 
                  dietary needs, and time constraints. No more decision fatigue.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    <Clock className="size-3" />
                    Under 30s
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    <Wallet className="size-3" />
                    Budget-aware
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 2: Scanner */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg transition hover:shadow-xl">
              <div className="relative h-56">
                <Image
                  src="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800&q=80&fit=crop"
                  alt="Food label scanning"
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
                <div className="absolute right-4 top-4 rounded-full bg-leaf-deep/90 p-3">
                  <ScanLine className="size-6 text-citrus" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
                  AI Scanner
                </h3>
                <p className="mt-3 leading-relaxed text-foreground/70">
                  Scan product labels and restaurant menus to detect hidden animal 
                  ingredients. Shop confidently and stay true to your values.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    <Sparkles className="size-3" />
                    AI-powered
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    <Leaf className="size-3" />
                    100% accurate
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 3: Grocery Planner */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg transition hover:shadow-xl">
              <div className="relative h-56">
                <Image
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&fit=crop"
                  alt="Fresh vegetables"
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
                <div className="absolute right-4 top-4 rounded-full bg-leaf-deep/90 p-3">
                  <ShoppingBasket className="size-6 text-citrus" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
                  Smart Grocery Lists
                </h3>
                <p className="mt-3 leading-relaxed text-foreground/70">
                  Auto-generated shopping lists from your meal plan with estimated costs. 
                  Organized by category, optimized for your budget.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    <Wallet className="size-3" />
                    Cost estimates
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    Auto-organized
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 4: Pantry */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg transition hover:shadow-xl">
              <div className="relative h-56">
                <Image
                  src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80&fit=crop"
                  alt="Kitchen pantry"
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
                <div className="absolute right-4 top-4 rounded-full bg-leaf-deep/90 p-3">
                  <Leaf className="size-6 text-citrus" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
                  Pantry & Leftovers
                </h3>
                <p className="mt-3 leading-relaxed text-foreground/70">
                  Turn what you already have into delicious meals. Reduce food waste 
                  and save money by cooking smart with your existing ingredients.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    <Leaf className="size-3" />
                    Zero waste
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sprout/10 px-3 py-1 text-xs font-medium text-leaf">
                    Save money
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Process */}
      <section className="bg-leaf-deep px-6 py-20 text-mist md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold md:text-5xl">
              Your weekly routine, simplified
            </h2>
            <p className="mt-4 text-lg text-mist/75">
              From plan to plate in three simple steps
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-citrus/20 text-2xl font-bold text-citrus">
                1
              </div>
              <h3 className="mt-6 font-[family-name:var(--font-fraunces)] text-xl font-semibold">
                Get Your Plan
              </h3>
              <p className="mt-3 text-mist/75">
                Answer a few questions about your preferences, budget, and schedule. 
                AI generates your personalized 7-day meal plan instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-citrus/20 text-2xl font-bold text-citrus">
                2
              </div>
              <h3 className="mt-6 font-[family-name:var(--font-fraunces)] text-xl font-semibold">
                Shop Smart
              </h3>
              <p className="mt-3 text-mist/75">
                Use your auto-generated grocery list with cost estimates. 
                Scan labels at the store to verify ingredients are plant-based.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-citrus/20 text-2xl font-bold text-citrus">
                3
              </div>
              <h3 className="mt-6 font-[family-name:var(--font-fraunces)] text-xl font-semibold">
                Cook & Enjoy
              </h3>
              <p className="mt-3 text-mist/75">
                Follow simple recipes designed for your skill level. 
                Use leftover ingredients with pantry AI to minimize waste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-mist px-6 py-20 md:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep md:text-5xl">
            Free to start. Premium when you&apos;re hooked.
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            5 meal plans per month free · Premium from £7.99/month
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={signedIn ? "/app/plan" : "/auth/sign-up"}
              className="inline-flex items-center gap-2 rounded-full bg-leaf px-8 py-4 text-base font-semibold text-mist transition hover:bg-leaf-deep"
            >
              <Sparkles className="size-5" />
              {signedIn ? "Plan this week" : "Start for free"}
            </Link>
            {!signedIn && (
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center gap-2 rounded-full border-2 border-leaf/20 px-8 py-4 text-base font-medium text-leaf-deep transition hover:border-leaf/40 hover:bg-leaf/5"
              >
                Sign in
                <ArrowRight className="size-5" />
              </Link>
            )}
          </div>

          {/* Social Proof */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-leaf/10 bg-white p-6">
              <div className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf">
                30 seconds
              </div>
              <p className="mt-2 text-sm text-foreground/60">
                Average time to create a full week meal plan
              </p>
            </div>
            <div className="rounded-2xl border border-leaf/10 bg-white p-6">
              <div className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf">
                £40+ saved
              </div>
              <p className="mt-2 text-sm text-foreground/60">
                Average weekly savings from smart meal planning
              </p>
            </div>
            <div className="rounded-2xl border border-leaf/10 bg-white p-6">
              <div className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf">
                Zero waste
              </div>
              <p className="mt-2 text-sm text-foreground/60">
                Use every ingredient with pantry AI recommendations
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
