/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'], // английский и испанский
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  localeDetection: true, // автоопределение языка по браузеру
};
