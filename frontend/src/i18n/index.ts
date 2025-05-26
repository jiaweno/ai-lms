import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 语言资源
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN', // Default language
    debug: process.env.NODE_ENV === 'development', // Enable debug in dev mode
    
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      // Keys or params to lookup language from
      caches: ['localStorage'], // Cache user language selection
    },
    
    react: {
      useSuspense: false, // Set to false if you don't want to use Suspense for translations
    },
  })

export default i18n
