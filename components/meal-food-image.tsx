"use client";

import Image from "next/image";
import { foodImageForMeal, type FoodImage } from "@/lib/food-images";

type Props = {
  mealName: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  className?: string;
};

export function MealFoodImage({
  mealName,
  imageUrl,
  imageAlt,
  className = "",
}: Props) {
  const fallback = foodImageForMeal(mealName);
  const src = imageUrl || fallback.url;
  const alt = imageAlt || fallback.alt || mealName;

  return (
    <div
      className={`relative min-h-[120px] overflow-hidden rounded-lg bg-leaf/10 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 320px"
        className="object-cover"
        unoptimized={src.includes("images.unsplash.com")}
      />
    </div>
  );
}

export function ProduceStrip({ images }: { images: FoodImage[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-2xl">
      {images.map((img) => (
        <div key={img.url} className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={img.url}
            alt={img.alt}
            fill
            sizes="25vw"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
