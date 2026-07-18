import { auth } from "@/lib/auth/server";
import { getDatabaseUrl } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  const hasDatabaseUrl = Boolean(getDatabaseUrl());

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Signed in with Neon Auth. Your session is stored against your Neon
          Postgres database.
        </p>
      </div>

      <dl className="space-y-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Name</dt>
          <dd className="font-medium">{user?.name ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Email</dt>
          <dd className="font-medium">{user?.email ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">User ID</dt>
          <dd className="truncate font-mono text-xs">{user?.id ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Database URL</dt>
          <dd className="font-medium">
            {hasDatabaseUrl ? "Configured" : "Missing"}
          </dd>
        </div>
      </dl>

      <Link
        href="/account/settings"
        className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Account settings
      </Link>
    </main>
  );
}
