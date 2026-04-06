<script setup lang="ts">
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

const store = useWeatherStore()
const drawerOpen = ref(false)
</script>

<template>
  <!-- HERO MODE: configurator full-screen before search -->
  <template v-if="!store.isSubmitted">
    <TravelConfigurator />
  </template>

  <!-- RESULTS MODE: sidebar + main content -->
  <template v-else>
    <div
      class="flex h-screen overflow-hidden"
      :style="{ background: 'rgb(var(--color-bg))' }"
    >
      <!-- Desktop sidebar (md+) -->
      <aside
        class="hidden md:flex md:flex-col w-72 shrink-0 h-full overflow-y-auto border-r"
        :style="{
          background: 'rgb(var(--color-surface))',
          borderColor: 'rgb(var(--color-border))',
        }"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b shrink-0"
          :style="{ borderColor: 'rgb(var(--color-border))' }"
        >
          <h1
            class="text-lg font-bold"
            :style="{ color: 'rgb(var(--color-text))' }"
          >
            🌍 On va où ?
          </h1>
          <Button
            variant="ghost"
            size="sm"
            class="text-xs"
            @click="store.isSubmitted = false"
          >
            ✏️ Modifier
          </Button>
        </div>
        <div class="p-5 flex-1 overflow-y-auto">
          <TravelConfigurator :compact="true" />
        </div>
      </aside>

      <!-- Mobile top bar -->
      <div
        class="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b backdrop-blur-md"
        :style="{
          background: 'rgb(var(--color-bg) / 0.85)',
          borderColor: 'rgb(var(--color-border))',
        }"
      >
        <Button variant="ghost" size="sm" @click="drawerOpen = true">☰</Button>
        <span
          class="font-bold text-sm"
          :style="{ color: 'rgb(var(--color-text))' }"
        >🌍 On va où ?</span>
        <Button
          variant="ghost"
          size="sm"
          class="text-xs"
          @click="store.isSubmitted = false"
        >
          ✏️
        </Button>
      </div>

      <!-- Mobile drawer -->
      <Drawer v-model:open="drawerOpen" direction="left">
        <DrawerContent
          class="w-80 h-full overflow-y-auto"
          :style="{ background: 'rgb(var(--color-surface))' }"
        >
          <DrawerHeader>
            <DrawerTitle :style="{ color: 'rgb(var(--color-text))' }">
              🌍 On va où ?
            </DrawerTitle>
          </DrawerHeader>
          <div class="p-4">
            <TravelConfigurator :compact="true" />
          </div>
        </DrawerContent>
      </Drawer>

      <!-- Main content area -->
      <main class="flex-1 h-full overflow-y-auto pt-14 md:pt-0">
        <slot />
      </main>
    </div>
  </template>
</template>
