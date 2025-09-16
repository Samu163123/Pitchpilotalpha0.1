"use client"

import { useLanguageStore, type LanguageCode } from "./store"

export type TranslationDict = Record<string, string>

// Minimal dictionary; extend as needed. Keys are semantic identifiers used across UI.
const dictionaries: Record<LanguageCode, TranslationDict> = {
  en: {
    nav_training: "Training",
    nav_history: "History",
    nav_challenges: "Challenges",
    nav_profile: "Profile",
    start_training: "Start Training",
    login: "Log in",
    logout: "Sign out",
    logged_in_as: "Logged in as",
    choose_language: "Choose your language",
    choose_language_desc: "You can change this later from the top bar.",
    save: "Save",
    cancel: "Cancel",
  },
  es: {
    nav_training: "Entrenamiento",
    nav_history: "Historial",
    nav_challenges: "Desafíos",
    nav_profile: "Perfil",
    start_training: "Comenzar entrenamiento",
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
    logged_in_as: "Conectado como",
    choose_language: "Elige tu idioma",
    choose_language_desc: "Puedes cambiarlo más tarde en la barra superior.",
    save: "Guardar",
    cancel: "Cancelar",
  },
  fr: {
    nav_training: "Entraînement",
    nav_history: "Historique",
    nav_challenges: "Défis",
    nav_profile: "Profil",
    start_training: "Commencer l'entraînement",
    login: "Se connecter",
    logout: "Se déconnecter",
    logged_in_as: "Connecté en tant que",
    choose_language: "Choisissez votre langue",
    choose_language_desc: "Vous pourrez la changer plus tard depuis la barre supérieure.",
    save: "Enregistrer",
    cancel: "Annuler",
  },
  zh: {
    nav_training: "训练",
    nav_history: "历史",
    nav_challenges: "挑战",
    nav_profile: "个人资料",
    start_training: "开始训练",
    login: "登录",
    logout: "退出登录",
    logged_in_as: "已登录：",
    choose_language: "选择你的语言",
    choose_language_desc: "你可以稍后在顶部栏更改。",
    save: "保存",
    cancel: "取消",
  },
  hi: {
    nav_training: "प्रशिक्षण",
    nav_history: "इतिहास",
    nav_challenges: "चुनौतियाँ",
    nav_profile: "प्रोफ़ाइल",
    start_training: "प्रशिक्षण शुरू करें",
    login: "लॉग इन",
    logout: "लॉग आउट",
    logged_in_as: "के रूप में लॉग इन",
    choose_language: "अपनी भाषा चुनें",
    choose_language_desc: "आप इसे बाद में शीर्ष बार से बदल सकते हैं।",
    save: "सहेजें",
    cancel: "रद्द करें",
  },
  ar: {
    nav_training: "التدريب",
    nav_history: "السجل",
    nav_challenges: "التحديات",
    nav_profile: "الملف الشخصي",
    start_training: "ابدأ التدريب",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    logged_in_as: "مسجل الدخول باسم",
    choose_language: "اختر لغتك",
    choose_language_desc: "يمكنك تغييره لاحقًا من الشريط العلوي.",
    save: "حفظ",
    cancel: "إلغاء",
  },
  bn: {}, pt: {}, ru: {}, ur: {}, id: {}, de: {}, ja: {}, tr: {}, ko: {}, vi: {}, it: {}, fa: {}, th: {}, sw: {}, tl: {}, pl: {}, uk: {}, nl: {}, hu: {}, cs: {}, sv: {}, el: {}, he: {}, fi: {}, da: {}, no: {},
}

export function useI18n() {
  const lang = useLanguageStore((s) => s.language)
  const dict = dictionaries[lang] || dictionaries.en
  const t = (key: string) => dict[key] || dictionaries.en[key] || key
  return { t, lang }
}

// Map language code to a representative ISO 3166-1 alpha-2 country code for flags
export const langToCountry: Record<LanguageCode, string> = {
  en: "gb",
  zh: "cn",
  hi: "in",
  es: "es",
  fr: "fr",
  ar: "sa",
  bn: "bd",
  pt: "pt",
  ru: "ru",
  ur: "pk",
  id: "id",
  de: "de",
  ja: "jp",
  tr: "tr",
  ko: "kr",
  vi: "vn",
  it: "it",
  fa: "ir",
  th: "th",
  sw: "ke",
  tl: "ph",
  pl: "pl",
  uk: "ua",
  nl: "nl",
  hu: "hu",
  cs: "cz",
  sv: "se",
  el: "gr",
  he: "il",
  fi: "fi",
  da: "dk",
  no: "no",
}

export function flagUrlFor(code: LanguageCode, size: 20 | 24 | 28 | 32 | 40 | 48 = 24) {
  const cc = (langToCountry[code] || "gb").toLowerCase()
  return `https://flagcdn.com/w${size}/${cc}.png`
}

export function countryCodeFor(code: LanguageCode): string {
  return (langToCountry[code] || "gb").toLowerCase()
}

export const languageOptions: Array<{
  code: LanguageCode
  label: string
  flag: string
  note?: string
}> = [
  { code: "en", label: "English", flag: "🇬🇧", note: "~1.5B · global lingua franca" },
  { code: "zh", label: "中文 (Mandarin)", flag: "🇨🇳", note: "~1.2B · China/Taiwan/overseas" },
  { code: "hi", label: "हिंदी (Hindi)", flag: "🇮🇳", note: "~600M · India, diaspora" },
  { code: "es", label: "Español", flag: "🇪🇸", note: "~500M · ES/LatAm/US" },
  { code: "fr", label: "Français", flag: "🇫🇷", note: "~300M · FR/Africa/Canada" },
  { code: "ar", label: "العربية", flag: "🇸🇦", note: "~300M · MENA" },
  { code: "bn", label: "বাংলা (Bengali)", flag: "🇧🇩", note: "~250M · BD/IN" },
  { code: "pt", label: "Português", flag: "🇵🇹", note: "~250M · BR/PT/Africa" },
  { code: "ru", label: "Русский", flag: "🇷🇺", note: "~250M · RU/CIS" },
  { code: "ur", label: "اردو (Urdu)", flag: "🇵🇰", note: "~230M · PK/IN" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", note: "~200M · ID/MY/BN" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", note: "~90M · DE/AT/CH" },
  { code: "ja", label: "日本語", flag: "🇯🇵", note: "~125M · Japan" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", note: "~85M · TR/CY/ diaspora" },
  { code: "ko", label: "한국어", flag: "🇰🇷", note: "~80M · KR" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", note: "~85M · Vietnam" },
  { code: "it", label: "Italiano", flag: "🇮🇹", note: "~65M · IT/CH" },
  { code: "fa", label: "فارسی", flag: "🇮🇷", note: "~70M · IR/AF/TJ" },
  { code: "th", label: "ไทย", flag: "🇹🇭", note: "~60M · Thailand" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪", note: "~60M · East Africa" },
  { code: "tl", label: "Tagalog", flag: "🇵🇭", note: "~50M · Philippines" },
  { code: "pl", label: "Polski", flag: "🇵🇱", note: "~40M · Poland" },
  { code: "uk", label: "Українська", flag: "🇺🇦", note: "~30M · Ukraine" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", note: "~25M · NL/BE/Suriname" },
  { code: "hu", label: "Magyar", flag: "🇭🇺", note: "~13M · Hungary" },
  { code: "cs", label: "Čeština", flag: "🇨🇿", note: "~10M · Czechia" },
  { code: "sv", label: "Svenska", flag: "🇸🇪", note: "~10M · SE/FI" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷", note: "~10M · GR/CY" },
  { code: "he", label: "עברית", flag: "🇮🇱", note: "~9M · Israel" },
  { code: "fi", label: "Suomi", flag: "🇫🇮", note: "~5M · Finland" },
  { code: "da", label: "Dansk", flag: "🇩🇰", note: "~5M · Denmark" },
  { code: "no", label: "Norsk", flag: "🇳🇴", note: "~5M · Norway" },
]
