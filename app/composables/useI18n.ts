import { messages, type Locale, type MessageKey } from '~/i18n/messages'

const COOKIE_NAME = 'locale'

const FALLBACK_LOCALE: Locale = 'en'

// Première langue prise en charge dans la liste de préférences du navigateur,
// dans l'ordre de priorité (q). Aucune prise en charge → anglais.
function pickLocale(preferred: string[]): Locale {
  for (const lang of preferred) {
    const base = lang.trim().toLowerCase().split('-')[0]
    if (base === 'fr' || base === 'en') return base
  }
  return FALLBACK_LOCALE
}

// "fr-FR,fr;q=0.9,en;q=0.8" → ['fr-FR', 'fr', 'en'], trié par q décroissant
function parseAcceptLanguage(header: string | undefined): string[] {
  if (!header) return []
  return header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.find(p => p.trim().startsWith('q='))
      return { tag: tag!, q: q ? Number(q.trim().slice(2)) || 0 : 1 }
    })
    .filter(l => l.tag && l.tag !== '*' && l.q > 0)
    .sort((a, b) => b.q - a.q)
    .map(l => l.tag)
}

// Langue initiale : cookie s'il existe (choix explicite via le bouton), sinon
// langue du navigateur, repli anglais. Résolu côté serveur puis transmis au
// client via le payload de useState → pas d'écart d'hydratation.
function detectLocale(): Locale {
  const cookie = useCookie<Locale | undefined>(COOKIE_NAME)
  if (cookie.value === 'fr' || cookie.value === 'en') return cookie.value

  const preferred = import.meta.server
    ? parseAcceptLanguage(useRequestHeaders(['accept-language'])['accept-language'])
    : [...navigator.languages]
  return pickLocale(preferred)
}

export function useI18n() {
  // useState (et non useCookie) : une seule ref partagée par tous les composants.
  const locale = useState<Locale>('locale', detectLocale)

  const dateLocale = computed(() => (locale.value === 'en' ? 'en-GB' : 'fr-FR'))

  function t(key: MessageKey, params?: Record<string, string | number>): string {
    const text = messages[locale.value][key] ?? messages.fr[key]
    if (!params) return text
    return text.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
    )
  }

  function setLocale(value: Locale) {
    locale.value = value
    // Écrit ici plutôt que via un watch : un seul point d'écriture, quel que soit
    // le nombre de composants qui appellent useI18n().
    useCookie<Locale>(COOKIE_NAME, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' }).value = value
  }

  return { locale, dateLocale, t, setLocale }
}
