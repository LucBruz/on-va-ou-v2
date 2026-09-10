<script setup lang="ts">
import type { CityTag } from '~/data/cities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{ compact?: boolean }>()
const store = useWeatherStore()

const startDate = ref(store.startDate ?? '')
const endDate = ref(store.endDate ?? '')
const toleranceDays = ref([store.toleranceDays])
const maxDistance = ref([store.maxDistance])
const minTemperature = ref([store.minTemperature])

const today = new Date().toISOString().split('T')[0]!

const startMax = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 11)
  return d.toISOString().split('T')[0]!
})

const endMin = computed(() => {
  if (!startDate.value) return today
  const d = new Date(startDate.value)
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]!
})

const endMax = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]!
})

const canSubmit = computed(() => !!startDate.value && !!endDate.value)

const endDateInput = ref<{ showPicker: () => void } | null>(null)

// Sync dates vers le store immédiatement (pour que startIndex/endIndex soient réactifs)
watch(startDate, (v) => {
  store.startDate = v || null
  if (v) {
    // DateField encapsule déjà le repli sur focus() si showPicker n'existe pas.
    nextTick(() => endDateInput.value?.showPicker())
  }
})
watch(endDate, (v) => { store.endDate = v || null })

// Sync sliders vers le store immédiatement (filteredAndSortedPropositions est réactif)
watch(maxDistance, (v) => { store.maxDistance = v[0]! })
watch(minTemperature, (v) => { store.minTemperature = v[0]! })

// applyTolerance avec debounce — attend que l'utilisateur ait fini d'interagir
let applyTimer: ReturnType<typeof setTimeout> | null = null
function scheduleApply() {
  if (applyTimer) clearTimeout(applyTimer)
  applyTimer = setTimeout(() => {
    if (!canSubmit.value) return
    store.toleranceDays = toleranceDays.value[0]!
    store.applyTolerance()
  }, 400)
}

// En mode compact (sidebar) : auto-apply avec debounce
// En mode hero : c'est le bouton "Confirmer" qui déclenche
watch([startDate, endDate], () => {
  if (props.compact) scheduleApply()
})
watch(toleranceDays, () => {
  store.toleranceDays = toleranceDays.value[0]!
  if (props.compact) scheduleApply()
})

function confirmSearch() {
  store.toleranceDays = toleranceDays.value[0]!
  store.maxDistance = maxDistance.value[0]!
  store.minTemperature = minTemperature.value[0]!
  store.applyTolerance()
}

const COUNTRIES = ['FR', 'BE', 'CH', 'IT', 'ES', 'DE']

const AMBIANCES: { key: CityTag; emoji: string; label: string }[] = [
  { key: 'balneaire', emoji: '🏖️', label: 'Balnéaire' },
  { key: 'randonnee', emoji: '🥾', label: 'Randonnée' },
  { key: 'tourisme', emoji: '🏛️', label: 'Tourisme' },
  { key: 'montagne', emoji: '⛰️', label: 'Montagne' },
]

function toggleCountry(code: string) {
  const idx = store.selectedCountries.indexOf(code)
  if (idx === -1) store.selectedCountries.push(code)
  else store.selectedCountries.splice(idx, 1)
}

function toggleType(tag: CityTag) {
  const idx = store.selectedTypes.indexOf(tag)
  if (idx === -1) store.selectedTypes.push(tag)
  else store.selectedTypes.splice(idx, 1)
}

</script>

<template>
  <!-- HERO MODE -->
  <div
    v-if="!compact"
    class="h-screen overflow-y-auto"
    :style="{ background: 'rgb(var(--color-bg))' }"
  >
    <div class="min-h-full flex items-center justify-center px-4 py-2">
    <div
      class="w-full max-w-2xl rounded-2xl p-5 sm:p-8 shadow-xl border relative"
      :style="{
        background: 'rgb(var(--color-surface))',
        borderColor: 'rgb(var(--color-border))',
      }"
    >
      <!-- Toggle thème -->
      <div class="absolute top-3 right-3">
        <ThemeToggle />
      </div>

      <!-- Header -->
      <div class="text-center mb-3">
        <div class="text-2xl mb-1">🌍</div>
        <h1
          class="text-2xl font-bold"
          :style="{ color: 'rgb(var(--color-text))' }"
        >
          On va où ?
        </h1>
        <p
          class="mt-1 text-sm"
          :style="{ color: 'rgb(var(--color-text-muted))' }"
        >
          Trouvez la destination parfaite selon la météo
        </p>
      </div>

      <!-- Form content -->
      <div class="space-y-4">
        <!-- Dates -->
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wide mb-2"
            :style="{ color: 'rgb(var(--color-text-muted))' }"
          >Quand ?</label>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-xs mb-1" :style="{ color: 'rgb(var(--color-text-muted))' }">Du</label>
              <DateField
                v-model="startDate"
                :min="today"
                :max="startMax"
              />
            </div>
            <div class="flex-1">
              <label class="block text-xs mb-1" :style="{ color: 'rgb(var(--color-text-muted))' }">Au</label>
              <DateField
                ref="endDateInput"
                v-model="endDate"
                :min="endMin"
                :max="endMax"
                :disabled="!startDate"
              />
            </div>
          </div>
        </div>

        <!-- Sliders -->
        <div class="space-y-3">
          <label
            class="block text-xs font-semibold uppercase tracking-wide"
            :style="{ color: 'rgb(var(--color-text-muted))' }"
          >Préférences</label>

          <!-- Distance -->
          <div>
            <div class="flex justify-between text-xs mb-2" :style="{ color: 'rgb(var(--color-text))' }">
              <span>Distance max</span>
              <span class="font-medium">{{ maxDistance[0] === 1500 ? 'Illimitée' : `${maxDistance[0]} km` }}</span>
            </div>
            <Slider v-model="maxDistance" :min="0" :max="1500" :step="50" />
          </div>

          <!-- Température -->
          <div>
            <div class="flex justify-between text-xs mb-2" :style="{ color: 'rgb(var(--color-text))' }">
              <span>Température minimale</span>
              <span class="font-medium">{{ minTemperature[0] }}°C</span>
            </div>
            <Slider v-model="minTemperature" :min="-5" :max="35" :step="1" />
          </div>

          <!-- Tolérance -->
          <div>
            <div class="flex justify-between text-xs mb-2" :style="{ color: 'rgb(var(--color-text))' }">
              <span>Jours de mauvais temps acceptés</span>
              <span class="font-medium">{{ toleranceDays[0] }} j</span>
            </div>
            <Slider v-model="toleranceDays" :min="0" :max="14" :step="1" />
          </div>
        </div>

        <!-- Pays -->
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wide mb-2"
            :style="{ color: 'rgb(var(--color-text-muted))' }"
          >Pays</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="code in COUNTRIES"
              :key="code"
              class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
              :style="store.selectedCountries.includes(code)
                ? { background: 'rgb(var(--color-accent))', color: 'white', borderColor: 'rgb(var(--color-accent))' }
                : { background: 'rgb(var(--color-bg))', color: 'rgb(var(--color-text))', borderColor: 'rgb(var(--color-border))' }"
              @click="toggleCountry(code)"
            >
              {{ code }}
            </button>
          </div>
        </div>

        <!-- Ambiances -->
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wide mb-2"
            :style="{ color: 'rgb(var(--color-text-muted))' }"
          >Ambiances</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="a in AMBIANCES"
              :key="a.key"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              :style="store.selectedTypes.includes(a.key)
                ? { background: 'rgb(var(--color-accent))', color: 'white', borderColor: 'rgb(var(--color-accent))' }
                : { background: 'rgb(var(--color-bg))', color: 'rgb(var(--color-text))', borderColor: 'rgb(var(--color-border))' }"
              @click="toggleType(a.key)"
            >
              {{ a.emoji }} {{ a.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bouton confirmation -->
      <Button
        class="w-full mt-5 py-2.5 text-base font-semibold"
        :disabled="!canSubmit"
        @click="confirmSearch"
      >
        Trouver ma destination
      </Button>

    </div>
    </div>
  </div>

  <!-- COMPACT MODE (sidebar) -->
  <div v-else class="space-y-3">
    <!-- Dates -->
    <div>
      <label
        class="block text-xs font-semibold uppercase tracking-wide mb-1"
        :style="{ color: 'rgb(var(--color-text-muted))' }"
      >Dates</label>
      <div class="space-y-1.5">
        <div>
          <label class="block text-xs mb-0.5" :style="{ color: 'rgb(var(--color-text-muted))' }">Du</label>
          <DateField
            v-model="startDate"
            :min="today"
            :max="startMax"
            compact
          />
        </div>
        <div>
          <label class="block text-xs mb-0.5" :style="{ color: 'rgb(var(--color-text-muted))' }">Au</label>
          <DateField
            v-model="endDate"
            :min="endMin"
            :max="endMax"
            :disabled="!startDate"
            compact
          />
        </div>
      </div>
    </div>

    <!-- Distance -->
    <div>
      <div class="flex justify-between text-xs mb-1" :style="{ color: 'rgb(var(--color-text))' }">
        <span>Distance max</span>
        <span class="font-medium">{{ maxDistance[0] === 1500 ? 'Illimitée' : `${maxDistance[0]} km` }}</span>
      </div>
      <Slider v-model="maxDistance" :min="0" :max="1500" :step="50" />
    </div>

    <!-- Température -->
    <div>
      <div class="flex justify-between text-xs mb-1" :style="{ color: 'rgb(var(--color-text))' }">
        <span>Temp. minimale</span>
        <span class="font-medium">{{ minTemperature[0] }}°C</span>
      </div>
      <Slider v-model="minTemperature" :min="-5" :max="35" :step="1" />
    </div>

    <!-- Tolérance -->
    <div>
      <div class="flex justify-between text-xs mb-1" :style="{ color: 'rgb(var(--color-text))' }">
        <span>Mauvais temps</span>
        <span class="font-medium">{{ toleranceDays[0] }} j</span>
      </div>
      <Slider v-model="toleranceDays" :min="0" :max="14" :step="1" />
    </div>

    <!-- Pays -->
    <div>
      <label
        class="block text-xs font-semibold uppercase tracking-wide mb-1"
        :style="{ color: 'rgb(var(--color-text-muted))' }"
      >Pays</label>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="code in COUNTRIES"
          :key="code"
          class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors"
          :style="store.selectedCountries.includes(code)
            ? { background: 'rgb(var(--color-accent))', color: 'white', borderColor: 'rgb(var(--color-accent))' }
            : { background: 'rgb(var(--color-bg))', color: 'rgb(var(--color-text))', borderColor: 'rgb(var(--color-border))' }"
          @click="toggleCountry(code)"
        >
          {{ code }}
        </button>
      </div>
    </div>

    <!-- Ambiances -->
    <div>
      <label
        class="block text-xs font-semibold uppercase tracking-wide mb-1"
        :style="{ color: 'rgb(var(--color-text-muted))' }"
      >Ambiances</label>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="a in AMBIANCES"
          :key="a.key"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors"
          :style="store.selectedTypes.includes(a.key)
            ? { background: 'rgb(var(--color-accent))', color: 'white', borderColor: 'rgb(var(--color-accent))' }
            : { background: 'rgb(var(--color-bg))', color: 'rgb(var(--color-text))', borderColor: 'rgb(var(--color-border))' }"
          @click="toggleType(a.key)"
        >
          {{ a.emoji }} {{ a.label }}
        </button>
      </div>
    </div>

    <!-- Légende des badges -->
    <div
      class="rounded-xl p-2.5 space-y-1.5 border"
      :style="{ background: 'rgb(var(--color-bg))', borderColor: 'rgb(var(--color-border))' }"
    >
      <p class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'rgb(var(--color-text-muted))' }">
        Badges
      </p>
      <div class="space-y-1.5">
        <div class="flex items-start gap-2 text-xs" :style="{ color: 'rgb(var(--color-text))' }">
          <span class="shrink-0">🌡️</span>
          <span><strong>Température</strong> — parmi les destinations les plus chaudes de la sélection</span>
        </div>
        <div class="flex items-start gap-2 text-xs" :style="{ color: 'rgb(var(--color-text))' }">
          <span class="shrink-0">☀️</span>
          <span><strong>Soleil</strong> — le plus de jours ensoleillés sur votre période</span>
        </div>
        <div class="flex items-start gap-2 text-xs" :style="{ color: 'rgb(var(--color-text))' }">
          <span class="shrink-0">🚗</span>
          <span><strong>Économe</strong> — dans un rayon de 100 km autour de la ville la plus proche (tri Proximité requis)</span>
        </div>
      </div>
    </div>

  </div>
</template>
