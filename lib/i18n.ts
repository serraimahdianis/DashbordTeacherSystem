import { cookies } from "next/headers";
import type enMessages from "@/dictionaries/en.json";

export type Dictionary = typeof enMessages;

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
  fr: () => import("@/dictionaries/fr.json").then((m) => m.default as unknown as Dictionary),
  ar: () => import("@/dictionaries/ar.json").then((m) => m.default as unknown as Dictionary),
};

export async function getDictionary(): Promise<Dictionary> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const loader = dictionaries[locale] || dictionaries.en;
  return loader();
}

export async function getLocale(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("locale")?.value || "en";
}
