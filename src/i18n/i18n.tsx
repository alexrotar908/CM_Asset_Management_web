// src/i18n/i18n.tsx
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Carga autom. de JSON de páginas y componentes
const modsPages = import.meta.glob("../pages/**/i18n/*.json", { eager: true });
const modsComponents = import.meta.glob("../components/**/i18n/*.json", { eager: true });

const resources: Record<string, Record<string, any>> = { es: {}, en: {} };

function load(mods: Record<string, any>, base: "pages" | "components") {
  for (const path in mods) {
    const m = path.match(new RegExp(`${base}\\/([^/]+)\\/i18n\\/(es|en)\\.json$`));
    if (!m) continue;
    const namespace = m[1];     // p.ej. "home" o "navbar"
    const lang = m[2] as "es" | "en";
    resources[lang][namespace] = (mods[path] as any).default;
  }
}
load(modsPages, "pages");
load(modsComponents, "components");

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    debug: false,
    interpolation: { escapeValue: false },
    resources,
    react: {
      useSuspense: false,   // 👈 evita pantalla en blanco
    },
  });

export default i18n;
