/**
 * Food photography for meal cards.
 *
 * Default: curated Unsplash CDN URLs (no API key required).
 * Optional: set UNSPLASH_ACCESS_KEY for live Unsplash search.
 * https://unsplash.com/documentation
 */

export type FoodImage = {
  url: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
  source: "unsplash" | "curated";
};

type CuratedPhoto = {
  /** Unsplash images CDN path segment after `photo-` */
  path: string;
  keywords: string[];
  alt: string;
  photographer: string;
  photographerPath: string;
};

/** Stable plant-food Unsplash photos (hotlink-friendly CDN). */
const CURATED: CuratedPhoto[] = [
  {
    path: "1493770348161-369560ae357d",
    keywords: ["oat", "oatmeal", "porridge", "breakfast", "overnight"],
    alt: "Bowl of oatmeal with fruit",
    photographer: "Brooke Lark",
    photographerPath: "brookelark",
  },
  {
    path: "1512621776951-a57141f2eefd",
    keywords: ["salad", "bowl", "buddha", "greens", "lunch", "veg"],
    alt: "Fresh green salad bowl",
    photographer: "Anna Pelzer",
    photographerPath: "annapelzer",
  },
  {
    path: "1455619452474-d2be8b1e70cd",
    keywords: ["curry", "lentil", "coconut", "stew", "dinner", "satay", "chili"],
    alt: "Spiced vegetable curry",
    photographer: "Eiliv Aceron",
    photographerPath: "eilivaceron",
  },
  {
    path: "1546069901-ba9599a7e63c",
    keywords: ["tofu", "stir", "noodle", "asian", "bowl"],
    alt: "Colourful plant-based bowl",
    photographer: "Anh Nguyen",
    photographerPath: "outofnothing",
  },
  {
    path: "1565299624946-b28f40a0ae38",
    keywords: ["taco", "bean", "wrap", "tortilla"],
    alt: "Fresh tacos with toppings",
    photographer: "Chad Montano",
    photographerPath: "briewilly",
  },
  {
    path: "1621996346565-e3dbc646d9a9",
    keywords: ["pasta", "chickpea", "tomato", "noodles"],
    alt: "Pasta with tomato sauce",
    photographer: "Sorin Gheorghita",
    photographerPath: "sorino",
  },
  {
    path: "1476124369491-e7addf5db371",
    keywords: ["risotto", "mushroom", "barley", "rice"],
    alt: "Mushroom risotto",
    photographer: "Monika Grabkowska",
    photographerPath: "moniqa",
  },
  {
    path: "1610832958506-aa56368176cf",
    keywords: ["fruit", "apple", "berry", "snack", "peanut"],
    alt: "Fresh fruit",
    photographer: "Ampersand Design Studio",
    photographerPath: "ampersand",
  },
  {
    path: "1540420773420-3366772f4999",
    keywords: ["vegetable", "produce", "market", "carrot", "plant"],
    alt: "Colourful fresh vegetables",
    photographer: "Louis Hansel",
    photographerPath: "louishansel",
  },
  {
    path: "1490645935967-10de6ba17061",
    keywords: ["smoothie", "avocado", "green"],
    alt: "Avocado and greens",
    photographer: "Brooke Lark",
    photographerPath: "brookelark",
  },
  {
    path: "1547592166-23ac45744acd",
    keywords: ["soup", "broth"],
    alt: "Vegetable soup",
    photographer: "Calum Lewis",
    photographerPath: "calumlewis",
  },
  {
    path: "1525351484163-7529414344d8",
    keywords: ["bread", "toast", "avocado"],
    alt: "Avocado toast",
    photographer: "Joseph Gonzalez",
    photographerPath: "miracletwentyone",
  },
  {
    path: "1592924357228-91b4edc3c5c0",
    keywords: ["tomato", "mediterranean", "olive"],
    alt: "Tomatoes and mediterranean produce",
    photographer: "Mockup Graphics",
    photographerPath: "mockupgraphics",
  },
];

function curatedToImage(photo: CuratedPhoto, width = 800): FoodImage {
  return {
    url: `https://images.unsplash.com/photo-${photo.path}?auto=format&fit=crop&w=${width}&q=80`,
    alt: photo.alt,
    photographer: photo.photographer,
    photographerUrl: `https://unsplash.com/@${photo.photographerPath}?utm_source=bonsai&utm_medium=referral`,
    source: "curated",
  };
}

function scorePhoto(photo: CuratedPhoto, haystack: string): number {
  let score = 0;
  for (const kw of photo.keywords) {
    if (haystack.includes(kw)) score += kw.length > 4 ? 3 : 2;
  }
  return score;
}

/** Pick a curated produce/meal image from a dish name (sync, no network). */
export function foodImageForMeal(
  mealName: string,
  extras: string[] = [],
): FoodImage {
  const haystack = [mealName, ...extras].join(" ").toLowerCase();
  let best = CURATED[8]; // produce default
  let bestScore = -1;

  for (const photo of CURATED) {
    const score = scorePhoto(photo, haystack);
    if (score > bestScore) {
      bestScore = score;
      best = photo;
    }
  }

  return curatedToImage(best);
}

export function produceGalleryImages(): FoodImage[] {
  return [CURATED[8], CURATED[7], CURATED[1], CURATED[12]].map((p) =>
    curatedToImage(p, 640),
  );
}

type UnsplashSearchResult = {
  results?: {
    urls?: { regular?: string; small?: string };
    alt_description?: string | null;
    description?: string | null;
    user?: { name?: string; links?: { html?: string } };
  }[];
};

/**
 * Optional live Unsplash search. Falls back to curated matching on any failure.
 */
export async function resolveFoodImage(
  mealName: string,
  extras: string[] = [],
): Promise<FoodImage> {
  const fallback = foodImageForMeal(mealName, extras);
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return fallback;

  const query = ["plant based food", mealName, ...extras.slice(0, 2)]
    .filter(Boolean)
    .join(" ")
    .slice(0, 100);

  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 86_400 },
    });

    if (!res.ok) return fallback;

    const data = (await res.json()) as UnsplashSearchResult;
    const hit = data.results?.[0];
    const imageUrl = hit?.urls?.regular ?? hit?.urls?.small;
    if (!hit || !imageUrl) return fallback;

    return {
      url: imageUrl,
      alt: hit.alt_description || hit.description || mealName,
      photographer: hit.user?.name,
      photographerUrl: hit.user?.links?.html
        ? `${hit.user.links.html}?utm_source=bonsai&utm_medium=referral`
        : undefined,
      source: "unsplash",
    };
  } catch {
    return fallback;
  }
}

export async function attachMealImages<
  T extends {
    name: string;
    description?: string;
    ingredients?: { item: string }[];
  },
>(meal: T): Promise<T & { imageUrl: string; imageAlt: string }> {
  const extras = [
    meal.description ?? "",
    ...(meal.ingredients ?? []).slice(0, 3).map((i) => i.item),
  ];
  const image = await resolveFoodImage(meal.name, extras);
  return {
    ...meal,
    imageUrl: image.url,
    imageAlt: image.alt,
  };
}
