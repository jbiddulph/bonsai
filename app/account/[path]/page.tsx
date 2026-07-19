import Link from "next/link";
import { AccountView } from "@neondatabase/auth-ui";
import { accountViewPaths } from "@neondatabase/auth-ui/server";
import { ArrowLeft } from "lucide-react";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <Link
        href="/app"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to app
      </Link>
      <AccountView path={path} />
    </main>
  );
}
