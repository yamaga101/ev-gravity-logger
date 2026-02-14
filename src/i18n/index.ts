import { en } from "./en.ts";
import { ja } from "./ja.ts";
import type { TranslationMap } from "./en.ts";
import type { Language } from "../types/index.ts";

const translations: Record<Language, TranslationMap> = { en, ja };

export function getTranslations(lang: Language): TranslationMap {
  return translations[lang];
}

export type Translations = TranslationMap;
