<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  min?: string
  max?: string
  disabled?: boolean
  /** Padding resserré pour la sidebar. */
  compact?: boolean
}>()

const input = ref<HTMLInputElement | null>(null)

// L'icône native ne couvre que quelques pixels : sans ça, un clic sur le texte
// du champ ne fait que poser le curseur. Elle est étirée sur tout le champ par
// le CSS global, et `showPicker` couvre le clavier et les navigateurs qui
// ignorent ce pseudo-élément.
function showPicker() {
  if (!input.value || input.value.disabled) return
  try { input.value.showPicker() } catch { input.value.focus() }
}

defineExpose({ showPicker })
</script>

<template>
  <div class="relative">
    <input
      ref="input"
      v-model="model"
      type="date"
      :min="min"
      :max="max"
      :disabled="disabled"
      class="w-full rounded-lg text-sm border disabled:opacity-50"
      :class="compact ? 'px-2 py-1.5 pr-8' : 'px-3 py-2 pr-9'"
      :style="{
        background: 'rgb(var(--color-bg))',
        borderColor: 'rgb(var(--color-border))',
        color: 'rgb(var(--color-text))',
      }"
      @click="showPicker"
    />
    <!-- Icône dessinée par nous : elle suit la couleur du texte du thème, là où
         l'icône native reste peinte par le navigateur. -->
    <svg
      class="pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4"
      :class="[compact ? 'right-2' : 'right-3', { 'opacity-50': disabled }]"
      :style="{ color: 'rgb(var(--color-text))' }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  </div>
</template>
