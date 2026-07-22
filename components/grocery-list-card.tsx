"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, ClipboardCopy, Plus, Trash2 } from "lucide-react";
import {
  addGroceryItem,
  removeGroceryItem,
  type ShopItem,
} from "@/app/actions/grocery";

type ListProps = {
  listId: string;
  title: string;
  supermarket: string | null;
  estimatedSpendGbp: string | null;
  items: ShopItem[];
  pantryNames: string[];
  defaultExpanded?: boolean;
};

function storageKey(listId: string) {
  return `bonsai-grocery-checked:${listId}`;
}

export function GroceryListCard({
  listId,
  title,
  supermarket,
  estimatedSpendGbp,
  items: initialItems,
  pantryNames,
  defaultExpanded = false,
}: ListProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hidePantry, setHidePantry] = useState(true);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [newItem, setNewItem] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newAisle, setNewAisle] = useState("Other");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pantrySet = useMemo(
    () => new Set(pantryNames.map((n) => n.toLowerCase())),
    [pantryNames],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(listId));
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // ignore
    }
  }, [listId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(listId), JSON.stringify(checked));
    } catch {
      // ignore
    }
  }, [checked, listId]);

  const rows = initialItems.map((item, index) => {
    const key = `${item.item}-${item.amount}-${index}`;
    const inPantry = [...pantrySet].some(
      (p) =>
        item.item.toLowerCase().includes(p) ||
        p.includes(item.item.toLowerCase()),
    );
    return { ...item, key, inPantry, index };
  });

  const visible = hidePantry ? rows.filter((r) => !r.inPantry) : rows;
  const byAisle = visible.reduce<Record<string, typeof rows>>((acc, item) => {
    const aisle = item.aisle || "Other";
    acc[aisle] = acc[aisle] ? [...acc[aisle], item] : [item];
    return acc;
  }, {});

  const checkedCount = visible.filter((r) => checked[r.key]).length;
  const progress =
    visible.length === 0 ? 0 : Math.round((checkedCount / visible.length) * 100);

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function copyList() {
    const lines = visible.map((r) => {
      const mark = checked[r.key] ? "✓" : "○";
      return `${mark} ${r.amount} ${r.item} (${r.aisle})`;
    });
    await navigator.clipboard.writeText(`${title}\n\n${lines.join("\n")}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-leaf/10 bg-mist p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="flex-1 text-left group"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-leaf-deep group-hover:text-leaf">
                {title}
              </h2>
              <p className="mt-1 text-sm text-foreground/55">
                {supermarket ?? "Any shop"}
                {estimatedSpendGbp ? ` · ~£${estimatedSpendGbp}` : ""}
                {` · ${visible.length} items`}
              </p>
            </div>
            {isExpanded ? (
              <ChevronUp className="size-5 text-leaf-deep mt-1 flex-shrink-0" />
            ) : (
              <ChevronDown className="size-5 text-leaf-deep mt-1 flex-shrink-0" />
            )}
          </div>
        </button>
        {isExpanded && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHidePantry((v) => !v)}
              className="rounded-full border border-leaf/15 px-3 py-1.5 text-xs font-medium text-leaf-deep hover:bg-leaf/5"
            >
              {hidePantry ? "Show pantry staples" : "Hide pantry staples"}
            </button>
            <button
              type="button"
              onClick={() => void copyList()}
              className="inline-flex items-center gap-1.5 rounded-full border border-leaf/15 px-3 py-1.5 text-xs font-medium text-leaf-deep hover:bg-leaf/5"
            >
              {copied ? <Check className="size-3.5" /> : <ClipboardCopy className="size-3.5" />}
              {copied ? "Copied" : "Copy list"}
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-foreground/55">
              <span>Shopping progress</span>
              <span>
                {checkedCount}/{visible.length} · {progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-leaf/10">
              <div
                className="h-full rounded-full bg-sprout transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 text-sm text-foreground/60">
              {initialItems.length === 0
                ? "List is empty — add items below or generate a meal plan."
                : "Everything left is already in your pantry. Nice."}
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Object.entries(byAisle).map(([aisle, aisleItems]) => (
                <div key={aisle}>
                  <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
                    {aisle}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-foreground/75">
                    {aisleItems.map((item) => (
                      <li key={item.key} className="group flex items-start gap-2">
                        <label className="flex flex-1 cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(checked[item.key])}
                            onChange={() => toggle(item.key)}
                            className="mt-1 accent-leaf"
                          />
                          <span
                            className={
                              checked[item.key]
                                ? "text-foreground/40 line-through"
                                : undefined
                            }
                          >
                            {item.amount} {item.item}
                            {item.inPantry && (
                              <span className="ml-1 text-xs text-sprout">
                                (pantry)
                              </span>
                            )}
                          </span>
                        </label>
                        <button
                          type="button"
                          title="Remove"
                          disabled={pending}
                          onClick={() => {
                            setError(null);
                            startTransition(async () => {
                              const res = await removeGroceryItem({
                                listId,
                                itemKey: item.key,
                              });
                              if (!res.ok) setError(res.error);
                              else router.refresh();
                            });
                          }}
                          className="opacity-0 transition group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5 text-foreground/40 hover:text-red-600" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <form
            className="mt-6 flex flex-wrap items-end gap-2 border-t border-leaf/10 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newItem.trim()) return;
              setError(null);
              startTransition(async () => {
                const res = await addGroceryItem({
                  listId,
                  item: newItem,
                  amount: newAmount,
                  aisle: newAisle,
                });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setNewItem("");
                setNewAmount("");
                router.refresh();
              });
            }}
          >
            <div className="min-w-[8rem] flex-1">
              <label className="text-xs text-foreground/55">Item</label>
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="e.g. Spinach"
                className="mt-1 w-full rounded-lg border border-leaf/15 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
              />
            </div>
            <div className="w-24">
              <label className="text-xs text-foreground/55">Amount</label>
              <input
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="200g"
                className="mt-1 w-full rounded-lg border border-leaf/15 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-foreground/55">Aisle</label>
              <select
                value={newAisle}
                onChange={(e) => setNewAisle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-leaf/15 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
              >
                {[
                  "Produce",
                  "Chilled",
                  "Dry goods",
                  "Tins",
                  "Bakery",
                  "Frozen",
                  "Other",
                ].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
            >
              <Plus className="size-4" />
              Add
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </>
      )}
    </section>
  );
}
