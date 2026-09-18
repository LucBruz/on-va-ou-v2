// Textes de l'interface. Clés plates : `en` est typé sur les clés de `fr`,
// donc une traduction manquante casse la compilation.

export type Locale = 'fr' | 'en'

export const fr = {
  'common.edit': 'Modifier',
  'common.km': 'km',
  'common.days': 'j',

  'lang.switch': 'Switch to English',
  'theme.toLight': 'Passer en mode clair',
  'theme.toDark': 'Passer en mode sombre',

  'hero.subtitle': 'Trouvez la destination parfaite selon la météo',
  'hero.submit': 'Trouver ma destination',

  'config.when': 'Quand ?',
  'config.dates': 'Dates',
  'config.from': 'Du',
  'config.to': 'Au',
  'config.preferences': 'Préférences',
  'config.maxDistance': 'Distance max',
  'config.unlimited': 'Illimitée',
  'config.minTemp': 'Température minimale',
  'config.minTempShort': 'Temp. minimale',
  'config.badDays': 'Jours de mauvais temps acceptés',
  'config.badDaysShort': 'Mauvais temps',
  'config.countries': 'Pays',
  'config.ambiances': 'Ambiances',

  'tag.balneaire': 'Balnéaire',
  'tag.randonnee': 'Randonnée',
  'tag.tourisme': 'Tourisme',
  'tag.montagne': 'Montagne',

  'badge.title': 'Badges',
  'badge.temperature': 'Température',
  'badge.temperatureDesc': 'parmi les destinations les plus chaudes de la sélection',
  'badge.sun': 'Soleil',
  'badge.sunDesc': 'le plus de jours ensoleillés sur votre période',
  'badge.eco': 'Économe',
  'badge.ecoDesc': 'dans un rayon de 100 km autour de la ville la plus proche (tri Proximité requis)',

  'results.search': 'Rechercher une ville…',
  'results.countOne': '{n} destination',
  'results.countMany': '{n} destinations',
  'results.countOneMatching': '{n} destination compatible',
  'results.countManyMatching': '{n} destinations compatibles',
  'results.emptyTitle': 'Aucune destination compatible',
  'results.emptyHint': "Essaie d'augmenter ta tolérance météo ou de changer les dates.",

  'sort.nom': 'Nom',
  'sort.pays': 'Pays',
  'sort.temperature': 'Température',
  'sort.proximite': 'Proximité',
  'sort.soleil': 'Soleil',

  'card.avg': 'Moy. :',
} as const

export type MessageKey = keyof typeof fr

export const en: Record<MessageKey, string> = {
  'common.edit': 'Edit',
  'common.km': 'km',
  'common.days': 'd',

  'lang.switch': 'Passer en français',
  'theme.toLight': 'Switch to light mode',
  'theme.toDark': 'Switch to dark mode',

  'hero.subtitle': 'Find the perfect destination based on the weather',
  'hero.submit': 'Find my destination',

  'config.when': 'When?',
  'config.dates': 'Dates',
  'config.from': 'From',
  'config.to': 'To',
  'config.preferences': 'Preferences',
  'config.maxDistance': 'Max distance',
  'config.unlimited': 'Unlimited',
  'config.minTemp': 'Minimum temperature',
  'config.minTempShort': 'Min. temp.',
  'config.badDays': 'Bad weather days accepted',
  'config.badDaysShort': 'Bad weather',
  'config.countries': 'Countries',
  'config.ambiances': 'Vibes',

  'tag.balneaire': 'Seaside',
  'tag.randonnee': 'Hiking',
  'tag.tourisme': 'Sightseeing',
  'tag.montagne': 'Mountains',

  'badge.title': 'Badges',
  'badge.temperature': 'Temperature',
  'badge.temperatureDesc': 'among the warmest destinations in the selection',
  'badge.sun': 'Sun',
  'badge.sunDesc': 'the most sunny days over your dates',
  'badge.eco': 'Thrifty',
  'badge.ecoDesc': 'within 100 km of the closest city (requires Distance sort)',

  'results.search': 'Search a city…',
  'results.countOne': '{n} destination',
  'results.countMany': '{n} destinations',
  'results.countOneMatching': '{n} matching destination',
  'results.countManyMatching': '{n} matching destinations',
  'results.emptyTitle': 'No matching destination',
  'results.emptyHint': 'Try raising your bad-weather tolerance or changing the dates.',

  'sort.nom': 'Name',
  'sort.pays': 'Country',
  'sort.temperature': 'Temperature',
  'sort.proximite': 'Distance',
  'sort.soleil': 'Sun',

  'card.avg': 'Avg:',
}

export const messages: Record<Locale, Record<MessageKey, string>> = { fr, en }
