import { en } from "./en";
import { ja } from "./ja";
import type { TranslationMap } from "./en";
import type { Language } from "../types";

const translations: Record<Language, TranslationMap> = { en, ja };

export function getTranslations(lang: Language): TranslationMap {
  return translations[lang];
}

export type Translations = TranslationMap;
