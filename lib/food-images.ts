/**
 * Food photography via Unsplash.
 *
 * Set UNSPLASH_ACCESS_KEY (Application Access Key / Client ID).
 * UNSPLASH_SECRET_KEY is only for OAuth user login — not used for photo search.
 * https://unsplash.com/documentation
 */

export type FoodImage = {
  url: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
  downloadLocation?: string;
  source: "unsplash" | "curated";
};

type CuratedPhoto = {
  path: string;
  keywords: string[];
  alt: string;
  photographer: string;
  photographerPath: string;
};

/** Fallback when the API key is missing or Unsplash is unreachable. */
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

export function hasUnsplashAccessKey(): boolean {
  return Boolean(process.env.UNSPLASH_ACCESS_KEY?.trim());
}

/** Sync curated fallback (no network). */
export function foodImageForMeal(
  mealName: string,
  extras: string[] = [],
): FoodImage {
  const haystack = [mealName, ...extras].join(" ").toLowerCase();
  let best = CURATED[8];
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

export function produceGalleryImagesFallback(): FoodImage[] {
  return [CURATED[8], CURATED[7], CURATED[1], CURATED[12]].map((p) =>
    curatedToImage(p, 640),
  );
}

type UnsplashPhoto = {
  id?: string;
  urls?: { regular?: string; small?: string; raw?: string };
  alt_description?: string | null;
  description?: string | null;
  links?: { download_location?: string };
  user?: {
    name?: string;
    links?: { html?: string };
  };
};

type UnsplashSearchResult = {
  results?: UnsplashPhoto[];
};

function unsplashHeaders(): HeadersInit {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY missing");
  return {
    Authorization: `Client-ID ${key}`,
    "Accept-Version": "v1",
  };
}

/** Unsplash requires triggering download_location when a photo is used. */
async function trackUnsplashDownload(downloadLocation?: string) {
  if (!downloadLocation || !hasUnsplashAccessKey()) return;
  try {
    await fetch(downloadLocation, {
      headers: unsplashHeaders(),
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
  } catch {
    // Non-fatal — display still works.
  }
}

function photoToFoodImage(photo: UnsplashPhoto, fallbackAlt: string): FoodImage | null {
  const url = photo.urls?.regular ?? photo.urls?.small;
  if (!url) return null;
  return {
    url,
    alt: photo.alt_description || photo.description || fallbackAlt,
    photographer: photo.user?.name,
    photographerUrl: photo.user?.links?.html
      ? `${photo.user.links.html}?utm_source=bonsai&utm_medium=referral`
      : undefined,
    downloadLocation: photo.links?.download_location,
    source: "unsplash",
  };
}

async function searchUnsplash(
  query: string,
  perPage = 1,
): Promise<FoodImage[]> {
  if (!hasUnsplashAccessKey()) return [];

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query.slice(0, 100));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url, {
    headers: unsplashHeaders(),
    signal: AbortSignal.timeout(2500),
    next: { revalidate: 86_400, tags: [`unsplash:${query.slice(0, 40)}`] },
  });

  if (!res.ok) {
    console.error("[unsplash] search failed", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as UnsplashSearchResult;
  const images: FoodImage[] = [];
  for (const photo of data.results ?? []) {
    const img = photoToFoodImage(photo, query);
    if (img) images.push(img);
  }
  return images;
}

/**
 * Live Unsplash search for a meal. Falls back to curated matching.
 * Triggers Unsplash download tracking when a live photo is chosen.
 */
export async function resolveFoodImage(
  mealName: string,
  extras: string[] = [],
): Promise<FoodImage> {
  const fallback = foodImageForMeal(mealName, extras);
  if (!hasUnsplashAccessKey()) return fallback;

  const query = ["plant based", mealName.replace(/#\d+/g, "").trim(), ...extras.slice(0, 2)]
    .filter(Boolean)
    .join(" ");

  try {
    const [hit] = await searchUnsplash(query, 1);
    if (!hit) return fallback;
    void trackUnsplashDownload(hit.downloadLocation);
    return hit;
  } catch (error) {
    console.error("[unsplash] resolveFoodImage", error);
    return fallback;
  }
}

export async function produceGalleryImages(): Promise<FoodImage[]> {
  const fallback = produceGalleryImagesFallback();
  if (!hasUnsplashAccessKey()) return fallback;

  try {
    const queries = [
      "fresh vegetables market",
      "fresh fruit platter",
      "healthy salad bowl",
      "tomato basil produce",
    ];
    const results = await Promise.all(
      queries.map(async (q) => {
        const [img] = await searchUnsplash(q, 1);
        return img;
      }),
    );
    const live = results.filter(Boolean) as FoodImage[];
    if (live.length >= 3) {
      for (const img of live) void trackUnsplashDownload(img.downloadLocation);
      return live;
    }
  } catch (error) {
    console.error("[unsplash] produceGalleryImages", error);
  }
  return fallback;
}

export function mealImageCacheKey(mealName: string): string {
  return mealName.replace(/#\d+/g, "").trim().toLowerCase();
}

type MealLike = {
  name: string;
  description?: string;
  ingredients?: { item: string }[];
  imageUrl?: string;
  imageAlt?: string;
};

/**
 * Attach Unsplash (or curated) images to every meal in a plan.
 * Dedupes by dish name so a week only needs a handful of API calls.
 */
export async function enrichMealsWithImages<T extends MealLike>(
  meals: T[],
): Promise<T[]> {
  const cache = new Map<string, FoodImage>();
  const unique = new Map<string, T>();

  for (const meal of meals) {
    const key = mealImageCacheKey(meal.name);
    if (!unique.has(key)) unique.set(key, meal);
  }

  await Promise.all(
    [...unique.entries()].map(async ([key, meal]) => {
      const extras = [
        meal.description ?? "",
        ...(meal.ingredients ?? []).slice(0, 3).map((i) => i.item),
      ];
      cache.set(key, await resolveFoodImage(meal.name, extras));
    }),
  );

  return meals.map((meal) => {
    const img = cache.get(mealImageCacheKey(meal.name)) ?? foodImageForMeal(meal.name);
    return {
      ...meal,
      imageUrl: img.url,
      imageAlt: img.alt,
    };
  });
}

export async function attachMealImages<T extends MealLike>(
  meal: T,
): Promise<T & { imageUrl: string; imageAlt: string }> {
  const [enriched] = await enrichMealsWithImages([meal]);
  return enriched as T & { imageUrl: string; imageAlt: string };
}
