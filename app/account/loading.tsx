import { LoadingSprout } from "@/components/loading-sprout";

export default function AccountLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6">
      <LoadingSprout label="Loading account…" />
    </main>
  );
}
