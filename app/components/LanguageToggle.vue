<script setup lang="ts">
const { locale, t, setLocale } = useI18n()

function toggle() {
  setLocale(locale.value === 'fr' ? 'en' : 'fr')
}
</script>

<template>
  <!-- Affiche la langue vers laquelle on bascule. Texte plutôt que drapeau :
       Windows affiche les emoji drapeaux comme deux lettres. -->
  <button
    class="rounded-lg px-1.5 py-1 text-xs font-semibold transition-colors"
    :style="{
      color: 'rgb(var(--color-text-muted))',
      background: 'transparent',
    }"
    :title="t('lang.switch')"
    :aria-label="t('lang.switch')"
    @click="toggle"
  >
    {{ locale === 'fr' ? 'EN' : 'FR' }}
  </button>
</template>
