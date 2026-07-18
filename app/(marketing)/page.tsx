import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative flex min-h-screen flex-col justify-end px-6 pb-16 pt-28 md:px-10 md:pb-20">
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,#12352a_0%,#1f4d3a_42%,#2f6b4f_70%,#d4a017_140%)]"
          aria-hidden
        />
        <div
          className="animate-drift absolute -right-16 top-24 -z-10 h-72 w-72 rounded-full bg-sprout/25 blur-3xl md:h-[28rem] md:w-[28rem]"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 35%), radial-gradient(circle at 80% 60%, rgba(212,160,23,0.25), transparent 40%)",
          }}
          aria-hidden
        />

        <div className="mx-auto w-full max-w-5xl">
          <p className="animate-rise mb-4 font-[family-name:var(--font-fraunces)] text-lg text-citrus md:text-xl">
            BonsAI
          </p>
          <h1 className="animate-rise max-w-3xl font-[family-name:var(--font-fraunces)] text-5xl leading-[1.05] font-semibold tracking-tight text-mist md:text-7xl">
            Grow Smarter. Eat Better.
          </h1>
          <p className="animate-rise-delay mt-5 max-w-xl text-base leading-relaxed text-mist/85 md:text-lg">
            Your AI-powered plant-based food assistant. Personalized meal plans
            in under 30 seconds — less waste, lower spend, better eating.
          </p>
          <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/sign-up"
              className="rounded-full bg-mist px-6 py-3 text-sm font-semibold text-leaf-deep transition hover:bg-white"
            >
              Plan my week free
            </Link>
            <Link
              href="/auth/sign-in"
              className="rounded-full border border-mist/40 px-6 py-3 text-sm font-medium text-mist transition hover:border-mist hover:bg-mist/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-mist px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf-deep md:text-4xl">
              Meal planning is the product.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/75">
              Scanner, swaps, and grocery tools exist to make your weekly plan
              stick — and to make Premium worth it.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-foreground/80">
            <li className="border-l-2 border-sprout pl-4">
              AI meal plans tuned for budget, protein, time, and leftovers
            </li>
            <li className="border-l-2 border-sprout pl-4">
              Smart shopping lists with estimated spend
            </li>
            <li className="border-l-2 border-sprout pl-4">
              Label scanner for hidden animal ingredients
            </li>
            <li className="border-l-2 border-sprout pl-4">
              Pantry + leftover AI to cut food waste
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-leaf-deep px-6 py-16 text-mist md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold">
              Free to start. Premium when you&apos;re hooked.
            </h2>
            <p className="mt-2 text-mist/75">
              5 meal plans / month free · Premium from £7.99/month
            </p>
          </div>
          <Link
            href="/auth/sign-up"
            className="rounded-full bg-citrus px-6 py-3 text-sm font-semibold text-soil transition hover:brightness-110"
          >
            Create your account
          </Link>
        </div>
      </section>
    </main>
  );
}
