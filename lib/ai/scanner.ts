export type ScanAnalysis = {
  summary: string;
  isVegan: boolean;
  isVegetarian: boolean;
  healthScore: number;
  ultraProcessedScore: number;
  animalIngredients: string[];
  allergens: string[];
  concerningAdditives: string[];
  betterAlternatives: string[];
  provider: "rules" | "openai";
  warning?: string;
};

const ANIMAL_MARKERS: { pattern: RegExp; label: string; vegan: boolean; vegetarian: boolean }[] =
  [
    { pattern: /\bwhey\b/i, label: "whey", vegan: false, vegetarian: true },
    { pattern: /\bcasein\b/i, label: "casein", vegan: false, vegetarian: true },
    { pattern: /\blactose\b/i, label: "lactose", vegan: false, vegetarian: true },
    { pattern: /\bmilk\b/i, label: "milk", vegan: false, vegetarian: true },
    { pattern: /\bbutter\b/i, label: "butter", vegan: false, vegetarian: true },
    { pattern: /\bcream\b/i, label: "cream", vegan: false, vegetarian: true },
    { pattern: /\bcheese\b/i, label: "cheese", vegan: false, vegetarian: true },
    { pattern: /\byoghurt\b|\byogurt\b/i, label: "yoghurt", vegan: false, vegetarian: true },
    { pattern: /\begg\b|\beggs\b|\balbumen\b/i, label: "egg", vegan: false, vegetarian: true },
    { pattern: /\bhoney\b/i, label: "honey", vegan: false, vegetarian: true },
    { pattern: /\bgelatin\b|\bgelatine\b/i, label: "gelatine", vegan: false, vegetarian: false },
    { pattern: /\blard\b|\btallow\b/i, label: "animal fat", vegan: false, vegetarian: false },
    { pattern: /\banchov/i, label: "anchovy", vegan: false, vegetarian: false },
    { pattern: /\bfish\b|\bcod\b|\bsalmon\b/i, label: "fish", vegan: false, vegetarian: false },
    { pattern: /\bchicken\b|\bbeef\b|\bpork\b|\blamb\b|\bmeat\b/i, label: "meat", vegan: false, vegetarian: false },
    { pattern: /\bshellfish\b|\bshrimp\b|\bcrab\b/i, label: "shellfish", vegan: false, vegetarian: false },
    { pattern: /\brennet\b/i, label: "rennet", vegan: false, vegetarian: false },
    { pattern: /\bisinglass\b/i, label: "isinglass", vegan: false, vegetarian: false },
    { pattern: /\bcarmine\b|\bcochineal\b|\be120\b/i, label: "carmine (E120)", vegan: false, vegetarian: false },
  ];

const ALLERGEN_MARKERS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bgluten\b|\bwheat\b|\bbarley\b|\brye\b/i, label: "gluten" },
  { pattern: /\bmilk\b|\blactose\b|\bwhey\b|\bcasein\b/i, label: "milk" },
  { pattern: /\begg\b/i, label: "eggs" },
  { pattern: /\bpeanut\b/i, label: "peanuts" },
  { pattern: /\balmond\b|\bhazelnut\b|\bwalnut\b|\bcashew\b|\bpistachio\b|\btree nut/i, label: "tree nuts" },
  { pattern: /\bsoya\b|\bsoy\b/i, label: "soya" },
  { pattern: /\bsesame\b/i, label: "sesame" },
  { pattern: /\bcelery\b/i, label: "celery" },
  { pattern: /\bmustard\b/i, label: "mustard" },
  { pattern: /\bsulphite\b|\bsulfite\b/i, label: "sulphites" },
  { pattern: /\blupin\b/i, label: "lupin" },
  { pattern: /\bmollusc\b|\bshellfish\b|\bcrustacean\b/i, label: "shellfish" },
];

const UP_MARKERS = [
  /\bpalmitate\b/i,
  /\bmonosodium glutamate\b|\bmsg\b/i,
  /\bhydrogenated\b/i,
  /\bhigh fructose\b/i,
  /\bflavouring\b|\bflavoring\b/i,
  /\bemulsifier\b/i,
  /\bcolour\b|\bcolor\b/i,
  /\be\d{3}\b/i,
];

const VEGAN_SWAPS: Record<string, string> = {
  milk: "oat or soya milk",
  whey: "pea protein",
  casein: "plant protein blend",
  butter: "olive oil or vegan block",
  cream: "oat cream / coconut cream",
  cheese: "nutritional yeast or vegan cheese",
  yoghurt: "soya or coconut yoghurt",
  egg: "flax egg or aquafaba",
  honey: "maple syrup or agave",
  gelatine: "agar agar",
  meat: "tofu, tempeh, or beans",
  fish: "hearty mushrooms or jackfruit",
  anchovy: "miso + seaweed",
  rennet: "microbial / vegan rennet cheese",
};

export function analyzeLabelWithRules(rawText: string): ScanAnalysis {
  const text = rawText.trim();
  const animalIngredients: string[] = [];
  let isVegan = true;
  let isVegetarian = true;

  for (const marker of ANIMAL_MARKERS) {
    if (marker.pattern.test(text)) {
      if (!animalIngredients.includes(marker.label)) {
        animalIngredients.push(marker.label);
      }
      if (!marker.vegan) isVegan = false;
      if (!marker.vegetarian) isVegetarian = false;
    }
  }

  const allergens = ALLERGEN_MARKERS.filter((a) => a.pattern.test(text)).map(
    (a) => a.label,
  );

  const concerningAdditives = UP_MARKERS.filter((p) => p.test(text)).map((p) =>
    p.source.replace(/\\b/g, "").replace(/\|.*/, "").slice(0, 40),
  );

  const ultraProcessedScore = Math.min(
    100,
    concerningAdditives.length * 18 + (text.length > 400 ? 15 : 0),
  );

  let healthScore = 78;
  healthScore -= animalIngredients.length * 6;
  healthScore -= allergens.length * 2;
  healthScore -= Math.round(ultraProcessedScore / 5);
  if (/\bwholegrain\b|\bfibre\b|\bfiber\b|\blegume\b|\bpulse\b/i.test(text)) {
    healthScore += 8;
  }
  healthScore = Math.max(5, Math.min(98, healthScore));

  const betterAlternatives = [
    ...new Set(
      animalIngredients
        .map((ing) => VEGAN_SWAPS[ing])
        .filter(Boolean) as string[],
    ),
  ].slice(0, 5);

  if (betterAlternatives.length === 0 && isVegan) {
    betterAlternatives.push(
      "Looks plant-based — pair with fresh veg for a fuller meal.",
    );
  }

  const summary = isVegan
    ? "Looks vegan-friendly on the text provided — still double-check for trace ingredients."
    : isVegetarian
      ? "Not vegan (dairy/egg/honey markers found), but may be vegetarian."
      : "Contains animal-derived ingredients — not vegetarian.";

  return {
    summary,
    isVegan,
    isVegetarian,
    healthScore,
    ultraProcessedScore,
    animalIngredients,
    allergens: [...new Set(allergens)],
    concerningAdditives: [...new Set(concerningAdditives)].slice(0, 8),
    betterAlternatives,
    provider: "rules",
  };
}

function shouldCallOpenAISync(): boolean {
  if (!process.env.OPENAI_API_KEY) return false;
  if (process.env.OPENAI_SCAN_SYNC === "0") return false;
  if (process.env.OPENAI_SCAN_SYNC === "1") return true;
  if (process.env.NETLIFY === "true") return false;
  return true;
}

export async function analyzeLabelText(
  rawText: string,
): Promise<ScanAnalysis> {
  const fallback = analyzeLabelWithRules(rawText);
  if (!rawText.trim()) {
    return {
      ...fallback,
      summary: "Paste ingredient list or menu text to analyse.",
      healthScore: 0,
    };
  }

  if (!shouldCallOpenAISync()) {
    return {
      ...fallback,
      warning:
        process.env.NETLIFY === "true"
          ? "Fast rule-based scan (live AI optional via OPENAI_SCAN_SYNC=1)."
          : undefined,
    };
  }

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      timeout: 4_000,
      maxRetries: 0,
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4_000);

    try {
      const response = await client.responses.create(
        {
          model: process.env.OPENAI_SCAN_MODEL ?? "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "You analyse UK food labels and menus for plant-based eaters. Return strict JSON only.",
            },
            {
              role: "user",
              content: `Analyse this label/menu text. JSON keys: summary (string), isVegan (bool), isVegetarian (bool), healthScore (0-100), ultraProcessedScore (0-100), animalIngredients (string[]), allergens (string[]), concerningAdditives (string[]), betterAlternatives (string[]).\n\nTEXT:\n${rawText.slice(0, 4000)}`,
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "scan_analysis",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: [
                  "summary",
                  "isVegan",
                  "isVegetarian",
                  "healthScore",
                  "ultraProcessedScore",
                  "animalIngredients",
                  "allergens",
                  "concerningAdditives",
                  "betterAlternatives",
                ],
                properties: {
                  summary: { type: "string" },
                  isVegan: { type: "boolean" },
                  isVegetarian: { type: "boolean" },
                  healthScore: { type: "number" },
                  ultraProcessedScore: { type: "number" },
                  animalIngredients: {
                    type: "array",
                    items: { type: "string" },
                  },
                  allergens: { type: "array", items: { type: "string" } },
                  concerningAdditives: {
                    type: "array",
                    items: { type: "string" },
                  },
                  betterAlternatives: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        { signal: controller.signal },
      );

      const parsed = JSON.parse(response.output_text || "{}") as Omit<
        ScanAnalysis,
        "provider" | "warning"
      >;
      return { ...parsed, provider: "openai" };
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("[scanner] OpenAI failed:", error);
    return {
      ...fallback,
      warning: "AI scan unavailable — showing rule-based analysis.",
    };
  }
}
