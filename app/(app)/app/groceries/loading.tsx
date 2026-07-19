import { LoadingSprout } from "@/components/loading-sprout";

export default function GroceriesLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4">
      <LoadingSprout label="Loading groceries…" />
    </main>
  );
}
