export function getTwitchLocale(): string {
  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    return htmlLang;
  }

  return navigator.language;
}
