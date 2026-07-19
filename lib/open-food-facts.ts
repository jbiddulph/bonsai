export type BarcodeProduct = {
  barcode: string;
  name: string;
  brands?: string;
  ingredientsText: string;
  allergensText?: string;
  labels?: string;
  imageUrl?: string;
  novaGroup?: number | null;
  nutriscore?: string | null;
  isVeganTagged?: boolean | null;
  isVegetarianTagged?: boolean | null;
};

type OffProductResponse = {
  status: number;
  code?: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    allergens?: string;
    allergens_from_ingredients?: string;
    labels?: string;
    image_url?: string;
    image_front_url?: string;
    nova_group?: number;
    nutriscore_grade?: string;
    ingredients_analysis_tags?: string[];
  };
};

const USER_AGENT = "BonsAI/1.0 (https://jbonsai.netlify.app; food scanner)";

/**
 * Look up a packaged product by barcode via Open Food Facts (free, no API key).
 * https://world.openfoodfacts.org/api/v2/product/{barcode}
 */
export async function lookupBarcodeProduct(
  barcode: string,
): Promise<BarcodeProduct | null> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 8) return null;

  const url = new URL(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}`,
  );
  url.searchParams.set(
    "fields",
    [
      "product_name",
      "product_name_en",
      "brands",
      "ingredients_text",
      "ingredients_text_en",
      "allergens",
      "allergens_from_ingredients",
      "labels",
      "image_url",
      "image_front_url",
      "nova_group",
      "nutriscore_grade",
      "ingredients_analysis_tags",
    ].join(","),
  );

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as OffProductResponse;
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const ingredients =
    p.ingredients_text_en?.trim() ||
    p.ingredients_text?.trim() ||
    "";

  const tags = p.ingredients_analysis_tags ?? [];
  const name =
    p.product_name_en?.trim() ||
    p.product_name?.trim() ||
    p.brands ||
    `Barcode ${code}`;

  const allergenBits = [p.allergens, p.allergens_from_ingredients]
    .filter(Boolean)
    .join(". ");

  return {
    barcode: code,
    name,
    brands: p.brands,
    ingredientsText: [
      ingredients || "(No ingredients listed on Open Food Facts)",
      allergenBits ? `Allergens: ${allergenBits}` : "",
      p.labels ? `Labels: ${p.labels}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    allergensText: allergenBits || undefined,
    labels: p.labels,
    imageUrl: p.image_front_url || p.image_url,
    novaGroup: p.nova_group ?? null,
    nutriscore: p.nutriscore_grade ?? null,
    isVeganTagged: tags.includes("en:vegan")
      ? true
      : tags.includes("en:non-vegan")
        ? false
        : null,
    isVegetarianTagged: tags.includes("en:vegetarian")
      ? true
      : tags.includes("en:non-vegetarian")
        ? false
        : null,
  };
}
