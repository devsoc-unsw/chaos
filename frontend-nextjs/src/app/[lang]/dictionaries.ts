import "server-only";

const dictionaries = {
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
  "zh-CN": () => import("@/dictionaries/zh.json").then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  // Type assertion to check if the locale is a valid key
  if (locale in dictionaries) {
    return dictionaries[locale as keyof typeof dictionaries]();
  }
  // Fallback to 'en' if the locale is not found
  return dictionaries["en"]();
};
