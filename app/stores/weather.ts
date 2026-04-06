// app/stores/weather.ts
import { defineStore } from 'pinia'
import type { CityWeather, CityProposition } from '~/types/weather'
import { CITIES_META } from '~/data/cities'
import type { CityTag } from '~/data/cities'

// WMO codes considered "bad weather" — port from original store.js codesIntolerables
const BAD_WEATHER_CODES = [51, 53, 55, 61, 63, 65, 95, 96, 99, 71, 73, 75, 80]

const SUNNY_CODES = [0, 1]

export const useWeatherStore = defineStore('weather', () => {
  // State
  const rawData = ref<CityWeather[]>([])
  const propositions = ref<CityProposition[]>([])
  const initialPropositions = ref<CityProposition[]>([])

  const startDate = ref<string | null>(null)
  const endDate = ref<string | null>(null)
  const toleranceDays = ref(0)

  const isSubmitted = ref(false)

  // Calculés réactivement dès que startDate/endDate changent
  const startIndex = computed<number>(() => {
    if (!startDate.value || initialPropositions.value.length === 0) return -1
    const allDates = [
      ...initialPropositions.value[0]!.semaine1.dates,
      ...initialPropositions.value[0]!.semaine2.dates,
    ]
    return allDates.indexOf(startDate.value)
  })

  const endIndex = computed<number>(() => {
    if (!endDate.value || startIndex.value === -1 || initialPropositions.value.length === 0) return -1
    const allDates = [
      ...initialPropositions.value[0]!.semaine1.dates,
      ...initialPropositions.value[0]!.semaine2.dates,
    ]
    for (let i = startIndex.value + 3; i < allDates.length; i++) {
      if (allDates[i] === endDate.value) return i
    }
    return -1
  })

  const selectedCountries = ref<string[]>([])   // [] = tous
  const selectedTypes = ref<CityTag[]>([])        // [] = tous
  const sortBy = ref<'nom' | 'pays' | 'temperature' | 'soleil' | 'proximite'>('nom')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const maxDistance = ref<number>(1500)
  const minTemperature = ref<number>(0)

  // Computed: true if trip > 7 days (used for card height — port of modificationcss())
  const isLongTrip = computed(() =>
    isSubmitted.value && (endIndex.value - startIndex.value) > 7
  )

  // Port of formaterDonneesPourAffichage() from original store.js
  // Reads rawData and transforms into CityProposition[] format
  function formatData(data: CityWeather[]) {
    rawData.value = data
    const formatted = data.map(item => {
      const formatWeek = (weekNum: 1 | 2) => {
        const weekData = item.forecast.find(f => f.semaine === weekNum)
        if (!weekData) return { temperatures: [], codes: [], dates: [] }
        return {
          temperatures: weekData.daily.map(d => d.temperature),
          codes: weekData.daily.map(d => d.weather_code),
          dates: weekData.daily.map(d => d.date),
        }
      }

      return {
        name: item.name,
        country: item.country,
        type: CITIES_META.find(
          m => m.name === item.name && m.country === item.country
        )?.tags ?? [],
        lat: item.lat,
        long: item.long,
        temperature_moyenne: item.temperature_moyenne,
        semaine1: formatWeek(1),
        semaine2: formatWeek(2),
        semaineSelectionnee: 1 as const,
      } satisfies CityProposition
    })

    propositions.value = formatted
    initialPropositions.value = JSON.parse(JSON.stringify(formatted))
  }

  // Port of getDebut() from original store.js
  // Finds the index of startDate in the combined dates array (week1 + week2)
  function getStartIndex(allDates: string[]): number {
    for (let i = 0; i < allDates.length; i++) {
      if (allDates[i] === startDate.value) return i
    }
    return -1
  }

  // Port of getFin() from original store.js
  // Finds the index of endDate starting from fromIndex+3 (minimum 3-day trip enforced here)
  function getEndIndex(allDates: string[], fromIndex: number): number {
    for (let i = fromIndex + 3; i < allDates.length; i++) {
      if (allDates[i] === endDate.value) return i
    }
    return -1
  }

  // Port of meteoRespecteTolerance() from original store.js
  // Sets isSubmitted, filters propositions by tolerance within the date range
  function applyTolerance() {
    isSubmitted.value = true

    // Reset to full list before filtering
    propositions.value = JSON.parse(JSON.stringify(initialPropositions.value))

    if (propositions.value.length === 0) return

    if (startIndex.value === -1 || endIndex.value === -1) return

    // Filter: remove cities with more bad-weather days than tolerance
    for (let i = propositions.value.length - 1; i >= 0; i--) {
      const city = propositions.value[i]!
      const allCodes = [...city.semaine1.codes, ...city.semaine2.codes]

      let badDays = 0
      for (let j = startIndex.value; j <= endIndex.value; j++) {
        if (BAD_WEATHER_CODES.includes(allCodes[j] ?? -1)) badDays++
      }

      if (badDays > toleranceDays.value) {
        propositions.value.splice(i, 1)
      }
    }
  }

  // Helper interne : température moyenne sur la plage sélectionnée (ou globale si pas soumis)
  function getCityRangeAvgTemp(city: CityProposition): number {
    if (!isSubmitted.value || startIndex.value === -1 || endIndex.value === -1) {
      return city.temperature_moyenne
    }
    const allTemps = [...city.semaine1.temperatures, ...city.semaine2.temperatures]
    const slice = allTemps.slice(startIndex.value, endIndex.value + 1)
    if (slice.length === 0) return city.temperature_moyenne
    return slice.reduce((a, b) => a + b, 0) / slice.length
  }

  // Helper interne : codes météo sur la plage sélectionnée (ou tous si pas soumis)
  function getCityRangeCodes(city: CityProposition): number[] {
    const allCodes = [...city.semaine1.codes, ...city.semaine2.codes]
    if (!isSubmitted.value || startIndex.value === -1 || endIndex.value === -1) {
      return allCodes
    }
    return allCodes.slice(startIndex.value, endIndex.value + 1)
  }

  // Getter: liste filtrée et triée des propositions
  const filteredAndSortedPropositions = computed(() => {
    let result = [...propositions.value]

    if (selectedCountries.value.length > 0) {
      result = result.filter(c => selectedCountries.value.includes(c.country))
    }

    if (selectedTypes.value.length > 0) {
      result = result.filter(c =>
        selectedTypes.value.every(t => c.type.includes(t))
      )
    }

    if (minTemperature.value > 0) {
      result = result.filter(c => getCityRangeAvgTemp(c) >= minTemperature.value)
    }

    if (maxDistance.value < 1500 && result.some(c => c.distance !== undefined)) {
      result = result.filter(c => c.distance === undefined || c.distance <= maxDistance.value)
    }

    const dir = sortOrder.value === 'asc' ? 1 : -1
    result.sort((a, b) => {
      switch (sortBy.value) {
        case 'nom':
          return dir * a.name.localeCompare(b.name, 'fr')
        case 'pays':
          return dir * (a.country.localeCompare(b.country) || a.name.localeCompare(b.name, 'fr'))
        case 'temperature':
          return dir * (getCityRangeAvgTemp(a) - getCityRangeAvgTemp(b))
        case 'proximite':
          return dir * ((a.distance ?? Infinity) - (b.distance ?? Infinity))
        case 'soleil': {
          const sunCount = (c: CityProposition) =>
            getCityRangeCodes(c).filter(code => SUNNY_CODES.includes(code)).length
          return dir * (sunCount(a) - sunCount(b))
        }
      }
    })

    return result
  })

  // Badge: température max dans la liste filtrée, sur la plage sélectionnée
  const badgeTemperatureCities = computed(() => {
    const list = filteredAndSortedPropositions.value
    if (list.length === 0) return new Set<string>()
    const maxTemp = Math.max(...list.map(c => getCityRangeAvgTemp(c)))
    return new Set(
      list
        .filter(c => maxTemp - getCityRangeAvgTemp(c) <= 0.5)
        .map(c => c.name + c.country)
    )
  })

  // Badge: villes les plus proches dans la liste filtrée
  const badgeEconomeCities = computed(() => {
    const list = filteredAndSortedPropositions.value
    const withDist = list.filter(c => c.distance !== undefined)
    if (withDist.length === 0) return new Set<string>()
    const minDist = Math.min(...withDist.map(c => c.distance!))
    const threshold = minDist + 100
    return new Set(
      withDist
        .filter(c => c.distance! <= threshold)
        .map(c => c.name + c.country)
    )
  })

  // Badge: villes les plus ensoleillées (relatif — même logique que température)
  const badgeSoleilCities = computed(() => {
    const list = filteredAndSortedPropositions.value
    if (list.length === 0) return new Set<string>()
    const sunCount = (c: CityProposition) =>
      getCityRangeCodes(c).filter(code => SUNNY_CODES.includes(code)).length
    const maxSunny = Math.max(...list.map(sunCount))
    if (maxSunny === 0) return new Set<string>()
    return new Set(
      list
        .filter(c => maxSunny - sunCount(c) <= 1)
        .map(c => c.name + c.country)
    )
  })

  // Calcule et persiste les distances (Haversine) sur initialPropositions + propositions
  // Doit être appelé via setDistances plutôt que directement sur propositions
  // pour que les distances survivent aux resets de applyTolerance()
  function setDistances(userLat: number, userLon: number) {
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
    for (const c of initialPropositions.value) {
      c.distance = haversine(userLat, userLon, c.lat, c.long)
    }
    for (const c of propositions.value) {
      c.distance = haversine(userLat, userLon, c.lat, c.long)
    }
  }

  // Reset to initial state (for search reset)
  function resetPropositions() {
    propositions.value = JSON.parse(JSON.stringify(initialPropositions.value))
  }

  return {
    // State
    rawData,
    propositions,
    initialPropositions,
    startDate,
    endDate,
    toleranceDays,
    startIndex,
    endIndex,
    isSubmitted,
    // Computed
    isLongTrip,
    // Actions
    formatData,
    applyTolerance,
    resetPropositions,
    setDistances,
    BAD_WEATHER_CODES,
    // Nouveaux états
    selectedCountries,
    selectedTypes,
    sortBy,
    sortOrder,
    maxDistance,
    minTemperature,
    // Nouveaux getters
    badgeTemperatureCities,
    badgeEconomeCities,
    badgeSoleilCities,
    filteredAndSortedPropositions,
    SUNNY_CODES,
  }
})
