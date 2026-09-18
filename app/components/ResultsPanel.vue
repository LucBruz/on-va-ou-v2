<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWeatherStore } from '~/stores/weather'
import CityCard from '~/components/CityCard.vue'
import { Button } from '@/components/ui/button'

const SORT_KEYS = ['nom', 'pays', 'temperature', 'proximite', 'soleil'] as const

const store = useWeatherStore()
const { t } = useI18n()

// computed : les libellés doivent suivre le changement de langue
const SORT_OPTIONS = computed(() =>
  SORT_KEYS.map(key => ({ key, label: t(`sort.${key}`) })),
)

const countLabel = computed(() => {
  const n = displayPropositions.value.length
  if (store.isSubmitted) return t(n > 1 ? 'results.countManyMatching' : 'results.countOneMatching', { n })
  return t(n > 1 ? 'results.countMany' : 'results.countOne', { n })
})

onMounted(async () => {
  if (store.propositions.length === 0) {
    const data = await $fetch('/api/weather')
    store.formatData(data as any)
  }
})

const searchQuery = ref('')

// Géolocalisation déclenchée quand l'utilisateur trie par proximité
let geoRequested = false
watch(() => store.sortBy, (val) => {
  if (val === 'proximite' && !geoRequested && 'geolocation' in navigator) {
    geoRequested = true
    navigator.geolocation.getCurrentPosition(
      (pos) => store.setDistances(pos.coords.latitude, pos.coords.longitude),
      () => { geoRequested = false },
    )
  }
})

const displayPropositions = computed(() => {
  if (!searchQuery.value.trim()) return store.filteredAndSortedPropositions
  const q = searchQuery.value.toLowerCase()
  return store.filteredAndSortedPropositions.filter(v => v.name.toLowerCase().includes(q))
})
</script>

<template>
  <div class="space-y-4">

    <!-- Header sticky avec recherche + tri -->
    <div
      class="sticky top-0 z-10 backdrop-blur-md border-b"
      style="background: rgb(var(--color-bg) / 0.85); border-color: rgb(var(--color-border))"
    >
      <div class="max-w-7xl mx-auto px-6 py-3">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('results.search')"
          class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style="background-color: rgb(var(--color-bg)); border-color: rgb(var(--color-border)); color: rgb(var(--color-text));"
        />
        <div class="flex flex-wrap gap-1 mt-2">
          <Button
            v-for="opt in SORT_OPTIONS"
            :key="opt.key"
            size="sm"
            :variant="store.sortBy === opt.key ? 'default' : 'outline'"
            class="text-xs h-7 px-2"
            @click="store.sortBy === opt.key
              ? (store.sortOrder = store.sortOrder === 'asc' ? 'desc' : 'asc')
              : (store.sortBy = opt.key, store.sortOrder = 'asc')"
          >
            {{ opt.label }}
            <span v-if="store.sortBy === opt.key" class="ml-0.5">
              {{ store.sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </Button>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Compteur de résultats -->
      <p class="text-sm" style="color: rgb(var(--color-text-muted))">
        {{ countLabel }}
      </p>

      <!-- État vide -->
      <div
        v-if="store.isSubmitted && displayPropositions.length === 0"
        class="text-center py-16 space-y-2"
      >
        <p class="text-2xl">☁️</p>
        <p class="font-medium" style="color: rgb(var(--color-text))">{{ t('results.emptyTitle') }}</p>
        <p class="text-sm" style="color: rgb(var(--color-text-muted))">
          {{ t('results.emptyHint') }}
        </p>
      </div>

      <!-- Grille de villes -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        <CityCard
          v-for="ville in displayPropositions"
          :key="ville.name + ville.country"
          :ville="ville"
        />
      </div>
    </div>

  </div>
</template>
