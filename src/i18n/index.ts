import { en } from "./en.ts";
import { ja } from "./ja.ts";
import type { Language } from "../types/index.ts";

const translations = { en, ja } as const;

export function getTranslations(lang: Language) {
  return translations[lang];
}

export type Translations = typeof en;
