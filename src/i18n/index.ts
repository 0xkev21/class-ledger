export * from './translations';

import { AppLanguage, translations, Translations } from './translations';

export function getTranslations(lang?: AppLanguage): Translations {
  if (lang === 'en') {
    return translations.en;
  }
  return translations.my;
}
