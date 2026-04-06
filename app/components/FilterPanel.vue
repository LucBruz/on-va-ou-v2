<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWeatherStore } from '~/stores/weather'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const store = useWeatherStore()

// Local date state (synced to store on submit)
const startDate = ref<string>('')
const endDate = ref<string>('')
const toleranceDays = ref(0)
const advancedOpen = ref(false)

// Date constraint helpers
function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = computed(() => addDays(0))
const startMax = computed(() => addDays(11))
const endMax = computed(() => addDays(14))
const endMin = computed(() => {
  if (!startDate.value) return today.value
  const d = new Date(startDate.value)
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]
})

const tripDuration = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
})

watch(tripDuration, (newDuration) => {
  if (toleranceDays.value > newDuration) toleranceDays.value = newDuration
})

watch(startDate, () => {
  if (endDate.value && endDate.value < endMin.value) endDate.value = ''
})

const canSubmit = computed(() => !!startDate.value && !!endDate.value)

function submit() {
  store.startDate = startDate.value
  store.endDate = endDate.value
  store.toleranceDays = toleranceDays.value
  store.applyTolerance()
}

// Pays
const COUNTRIES = [
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'BE', label: '🇧🇪 Belgique' },
  { code: 'CH', label: '🇨🇭 Suisse' },
  { code: 'IT', label: '🇮🇹 Italie' },
  { code: 'ES', label: '🇪🇸 Espagne' },
  { code: 'DE', label: '🇩🇪 Allemagne' },
]

// Types de ville
const CITY_TYPES = ['Montagne', 'Plage', 'Capitale', 'Culture']

function toggleType(type: string) {
  const idx = store.selectedTypes.indexOf(type)
  if (idx === -1) store.selectedTypes.push(type)
  else store.selectedTypes.splice(idx, 1)
}

// Géolocalisation — déclenchée quand le tri passe en mode "proximite"
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

function calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function requestGeolocation() {
  if (!('geolocation' in navigator)) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      store.propositions.forEach(v => {
        v.distance = calculerDistance(latitude, longitude, v.lat, v.long)
      })
    },
    (err) => console.error('Géolocalisation impossible', err)
  )
}

// Déclenche la géolocalisation quand l'utilisateur choisit le tri par distance
watch(() => store.sortBy, (val) => {
  if (val === 'proximite') requestGeolocation()
})


</script>

<template>
  <div class="space-y-6">

    <!-- Dates -->
    <div class="space-y-2">
      <label class="text-sm font-medium" style="color: rgb(var(--color-text))">Date de départ</label>
      <input
        v-model="startDate"
        type="date"
        :min="today"
        :max="startMax"
        class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        style="background-color: rgb(var(--color-bg)); border-color: rgb(var(--color-border)); color: rgb(var(--color-text));"
      />
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium" :style="{ color: !startDate ? 'rgb(var(--color-text-muted))' : 'rgb(var(--color-text))' }">
        Date de fin
      </label>
      <input
        v-model="endDate"
        type="date"
        :min="endMin"
        :max="endMax"
        :disabled="!startDate"
        class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style="background-color: rgb(var(--color-bg)); border-color: rgb(var(--color-border)); color: rgb(var(--color-text));"
      />
    </div>

    <!-- Bouton filtres avancés (mobile only) -->
    <Button
      variant="outline"
      class="w-full md:hidden"
      @click="advancedOpen = true"
    >
      Filtres avancés
    </Button>

    <!-- Zone avancée desktop (visible toujours sur md+) -->
    <div class="hidden md:block space-y-6">
      <!-- Tolérance météo -->
      <div class="space-y-3">
        <label class="text-sm font-medium" style="color: rgb(var(--color-text))">Mauvais temps accepté</label>
        <div class="flex items-center gap-3">
          <Slider
            :model-value="[toleranceDays]"
            :max="tripDuration || 14"
            :step="1"
            :disabled="!canSubmit"
            class="flex-1"
            @update:model-value="(v: number[]) => toleranceDays = v[0]"
          />
          <span class="w-8 text-center text-sm font-bold tabular-nums" style="color: rgb(var(--color-accent))">{{ toleranceDays }}</span>
        </div>
        <p class="text-xs" style="color: rgb(var(--color-text-muted))">{{ toleranceDays }} jour{{ toleranceDays > 1 ? 's' : '' }} sur {{ tripDuration || '–' }}</p>
      </div>

      <!-- Pays -->
      <div class="space-y-2">
        <label class="text-sm font-medium" style="color: rgb(var(--color-text))">Pays</label>
        <select
          v-model="store.selectedCountries"
          multiple
          class="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
          style="background-color: rgb(var(--color-bg)); border-color: rgb(var(--color-border)); color: rgb(var(--color-text)); height: 8rem;"
        >
          <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.label }}</option>
        </select>
        <p class="text-xs" style="color: rgb(var(--color-text-muted))">Ctrl+clic pour sélectionner plusieurs pays</p>
      </div>

      <!-- Type de ville -->
      <div class="space-y-2">
        <label class="text-sm font-medium" style="color: rgb(var(--color-text))">Type de ville</label>
        <div class="flex flex-wrap gap-1.5">
          <Button
            v-for="t in CITY_TYPES"
            :key="t"
            size="sm"
            :variant="store.selectedTypes.includes(t) ? 'default' : 'outline'"
            class="text-xs h-7 px-2"
            @click="toggleType(t)"
          >{{ t }}</Button>
        </div>
      </div>

    </div>

    <!-- Sheet mobile -->
    <Sheet v-model:open="advancedOpen">
      <SheetContent side="bottom" class="h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader class="pb-4">
          <SheetTitle>Filtres avancés</SheetTitle>
        </SheetHeader>
        <div class="space-y-6">
          <!-- Tolérance météo -->
          <div class="space-y-3">
            <label class="text-sm font-medium" style="color: rgb(var(--color-text))">Mauvais temps accepté</label>
            <div class="flex items-center gap-3">
              <Slider
                :model-value="[toleranceDays]"
                :max="tripDuration || 14"
                :step="1"
                :disabled="!canSubmit"
                class="flex-1"
                @update:model-value="(v: number[]) => toleranceDays = v[0]"
              />
              <span class="w-8 text-center text-sm font-bold tabular-nums" style="color: rgb(var(--color-accent))">{{ toleranceDays }}</span>
            </div>
            <p class="text-xs" style="color: rgb(var(--color-text-muted))">{{ toleranceDays }} jour{{ toleranceDays > 1 ? 's' : '' }} sur {{ tripDuration || '–' }}</p>
          </div>

          <!-- Pays -->
          <div class="space-y-2">
            <label class="text-sm font-medium" style="color: rgb(var(--color-text))">Pays</label>
            <div class="flex flex-wrap gap-1.5">
              <Button
                v-for="c in COUNTRIES"
                :key="c.code"
                size="sm"
                :variant="store.selectedCountries.includes(c.code) ? 'default' : 'outline'"
                class="text-xs h-7 px-2"
                @click="toggleCountry(c.code)"
              >{{ c.label }}</Button>
            </div>
          </div>

          <!-- Type de ville -->
          <div class="space-y-2">
            <label class="text-sm font-medium" style="color: rgb(var(--color-text))">Type de ville</label>
            <div class="flex flex-wrap gap-1.5">
              <Button
                v-for="t in CITY_TYPES"
                :key="t"
                size="sm"
                :variant="store.selectedTypes.includes(t) ? 'default' : 'outline'"
                class="text-xs h-7 px-2"
                @click="toggleType(t)"
              >{{ t }}</Button>
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>

    <!-- Submit -->
    <Button
      class="w-full font-semibold"
      :disabled="!canSubmit"
      style="background-color: rgb(var(--color-accent)); color: white;"
      @click="submit"
    >
      Trouver ma destination
    </Button>

  </div>
</template>
