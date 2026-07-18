import Link from "next/link";

export default function ScanPlaceholderPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf-deep">
        AI Scanner
      </h1>
      <p className="mt-3 text-foreground/70">
        Upload labels and menus to check vegan status, allergens, and better
        alternatives.
      </p>
      <Link
        href="/app"
        className="mt-8 inline-flex text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </main>
  );
}
