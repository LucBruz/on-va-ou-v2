<script setup lang="ts">
import { computed } from 'vue'
import { useWeatherStore } from '~/stores/weather'
import { getWeatherIcon } from '~/utils/weatherIcons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CityProposition } from '~/types/weather'

const props = defineProps<{ ville: CityProposition }>()

const store = useWeatherStore()

// Clé unique pour les Sets de badges
const key = computed(() => props.ville.name + props.ville.country)

// Badges peloton de tête
const hasTemperatureBadge = computed(() => store.badgeTemperatureCities.has(key.value))
const hasEconomeBadge = computed(() => store.badgeEconomeCities.has(key.value))
const hasSoleilBadge = computed(() => store.badgeSoleilCities.has(key.value))

// Jours à afficher : filtrés sur la plage sélectionnée après soumission
const allDays = computed(() => {
  const temps = [...props.ville.semaine1.temperatures, ...props.ville.semaine2.temperatures]
  const codes = [...props.ville.semaine1.codes, ...props.ville.semaine2.codes]
  const dates = [...props.ville.semaine1.dates, ...props.ville.semaine2.dates]
  const all = dates.map((date, i) => ({ date, temp: temps[i], code: codes[i] }))
  if (store.startIndex === -1 || store.endIndex === -1) return all
  return all.slice(store.startIndex, store.endIndex + 1)
})

// Affichage du jour abrégé en français
function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)
}

// Température moyenne sur la plage sélectionnée ou globale
const displayTemp = computed(() => {
  if (store.startIndex === -1 || store.endIndex === -1) {
    return props.ville.temperature_moyenne
  }
  const allTemps = [...props.ville.semaine1.temperatures, ...props.ville.semaine2.temperatures]
  const slice = allTemps.slice(store.startIndex, store.endIndex + 1)
  if (slice.length === 0) return props.ville.temperature_moyenne
  const avg = slice.reduce((a, b) => a + b, 0) / slice.length
  return Math.round(avg * 10) / 10
})

// Sparkline SVG : area + polyline sur la plage sélectionnée
const sparklineData = computed(() => {
  let allTemps = [...props.ville.semaine1.temperatures, ...props.ville.semaine2.temperatures]
  if (store.startIndex !== -1 && store.endIndex !== -1) {
    allTemps = allTemps.slice(store.startIndex, store.endIndex + 1)
  }
  if (allTemps.length < 2) return { points: '', areaPath: '' }

  const W = 200, H = 40, PAD = 2
  const min = Math.min(...allTemps)
  const max = Math.max(...allTemps)
  const range = max - min || 1

  const coords = allTemps.map((t, i) => ({
    x: PAD + (i / (allTemps.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (t - min) / range) * (H - PAD * 2),
  }))

  const points = coords.map(p => `${p.x},${p.y}`).join(' ')
  const areaPath = [
    `M ${coords[0]!.x},${H - PAD}`,
    ...coords.map(p => `L ${p.x},${p.y}`),
    `L ${coords[coords.length - 1]!.x},${H - PAD}`,
    'Z',
  ].join(' ')

  return { points, areaPath }
})

const gradientId = computed(() =>
  `sg-${props.ville.name}-${props.ville.country}`.replace(/[^a-zA-Z0-9-]/g, '')
)

const TAG_LABELS: Record<string, string> = {
  balneaire: '🏖️ Balnéaire',
  randonnee: '🥾 Randonnée',
  tourisme: '🏛️ Tourisme',
  montagne: '⛰️ Montagne',
}

// Labels pays
const countryLabels: Record<string, string> = {
  FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭',
  IT: '🇮🇹', ES: '🇪🇸', DE: '🇩🇪',
}
</script>

<template>
  <Card
    class="w-full transition-shadow hover:shadow-md"
    style="background-color: rgb(var(--color-surface)); border-color: rgb(var(--color-border))"
  >
    <CardHeader class="pb-2">

      <!-- En-tête ville -->
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="text-xl leading-tight" style="color: rgb(var(--color-text))">
          {{ ville.name }}
        </CardTitle>
        <span class="text-lg shrink-0">{{ countryLabels[ville.country] ?? ville.country }}</span>
      </div>

      <!-- Badges peloton de tête -->
      <div v-if="hasTemperatureBadge || hasEconomeBadge || hasSoleilBadge" class="flex flex-wrap gap-1 mt-1">
        <Badge
          v-if="hasTemperatureBadge"
          class="text-xs border"
          style="background-color: rgb(var(--badge-warm-bg)); color: rgb(var(--badge-warm-text)); border-color: rgb(var(--badge-warm-border));"
        >
          🌡️ Température
        </Badge>
        <Badge
          v-if="hasEconomeBadge"
          class="text-xs border"
          style="background-color: rgb(var(--badge-eco-bg)); color: rgb(var(--badge-eco-text)); border-color: rgb(var(--badge-eco-border));"
        >
          🚗 Économe
        </Badge>
        <Badge
          v-if="hasSoleilBadge"
          class="text-xs border"
          style="background-color: rgb(var(--badge-sun-bg)); color: rgb(var(--badge-sun-text)); border-color: rgb(var(--badge-sun-border));"
        >
          ☀️ Soleil
        </Badge>
      </div>


    </CardHeader>

    <CardContent class="space-y-3">

      <!-- Température moyenne -->
      <div class="flex items-center gap-2">
        <span class="text-sm" style="color: rgb(var(--color-text-muted))">Moy. :</span>
        <span class="font-semibold text-sm" style="color: rgb(var(--color-accent))">{{ displayTemp }}°C</span>
      </div>

      <!-- Sparkline SVG -->
      <svg viewBox="0 0 200 40" class="w-full h-10">
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgb(var(--color-accent))" stop-opacity="0.35" />
            <stop offset="100%" stop-color="rgb(var(--color-accent))" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path :d="sparklineData.areaPath" :fill="`url(#${gradientId})`" />
        <polyline
          :points="sparklineData.points"
          fill="none"
          stroke="rgb(var(--color-accent))"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Tags type de ville (sous la sparkline) -->
      <div v-if="ville.type?.length" class="flex flex-wrap gap-1 mt-2">
        <Badge
          v-for="tag in ville.type"
          :key="tag"
          variant="secondary"
          class="text-xs px-1.5 py-0.5"
        >
          {{ TAG_LABELS[tag] ?? tag }}
        </Badge>
      </div>

      <!-- Scroll horizontal 14 jours -->
      <div
        class="flex gap-2 overflow-x-auto scroll-smooth pb-2"
        style="scroll-snap-type: x mandatory;"
      >
        <div
          v-for="day in allDays"
          :key="day.date"
          class="shrink-0 flex flex-col items-center gap-0.5 w-10"
          style="scroll-snap-align: start;"
        >
          <span class="text-[10px]" style="color: rgb(var(--color-text-muted))">
            {{ formatDay(day.date) }}
          </span>
          <i :class="getWeatherIcon(day.code)" class="text-base" style="color: rgb(var(--color-text-muted))" />
          <span class="text-xs font-medium" style="color: rgb(var(--color-text))">{{ day.temp }}°</span>
        </div>
      </div>

      <!-- Distance (si disponible) -->
      <p v-if="ville.distance !== undefined" class="text-xs" style="color: rgb(var(--color-text-muted))">
        {{ Math.round(ville.distance) }} km
      </p>

    </CardContent>
  </Card>
</template>
