# Plan : Synchronisation date-range, badges et CityCard

## Contexte
Application Nuxt 4 / Pinia / Shadcn — "On va où ?"
Fichiers principaux : `app/stores/weather.ts`, `app/components/CityCard.vue`, `app/components/ResultsPanel.vue`

---

## Phase 0 : Documentation Discovery (complétée)

### Fichiers lus
- `app/stores/weather.ts` (244 lignes) — store Pinia complet
- `app/components/CityCard.vue` (213 lignes) — carte ville + sparkline
- `app/components/ResultsPanel.vue` — panneau résultats + tri
- `app/components/TravelConfigurator.vue` — formulaire dates
- `app/layouts/default.vue` — layout hero/résultats

### Problèmes identifiés

#### Store (`weather.ts`)
| Problème | Localisation | Impact |
|----------|-------------|--------|
| `badgeTemperatureCities` utilise `c.temperature_moyenne` (14j statique) | ligne 128 | Badge basé sur données hors plage |
| `badgeSoleilCities` utilise tous les codes (14j) | ligne 154 | Badge ignorance plage dates |
| Sort 'soleil' dans `filteredAndSortedPropositions` utilise 14j | ligne 197 | Tri incorrect |
| Sort 'temperature' utilise `temperature_moyenne` (14j) | ligne 192 | Tri incorrect |
| `minTemperature` filter utilise `temperature_moyenne` (14j) | ligne 176 | Filtre incorrect |
| Badges calculés sur `propositions` (pas sur liste finale filtrée) | lignes 126-160 | Non conforme au brief |

#### CityCard (`CityCard.vue`)
| Problème | Localisation | Impact |
|----------|-------------|--------|
| **Tags doublonnés** : bloc lignes 135-144 (noms bruts sans emoji) ET lignes 176-185 (avec emoji via TAG_LABELS) | deux blocs séparés | Tags affichés deux fois |
| `allDays` montre toujours 14 jours | ligne 22-31 | Pas de filtrage par plage |
| `sparklineData` utilise toujours 14j | ligne 52 | Graphique non ciblé |
| Scrollbar cachée : `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` | ligne 189 | Scroll invisible |

### APIs disponibles (vérifiées)
- `store.startIndex` / `store.endIndex` — index dans tableau combiné semaine1+semaine2
- `store.isSubmitted` — booléen gates d'affichage
- `propositions.value` — liste post-tolerance (avant filtres secondaires)
- `filteredAndSortedPropositions` — computed final (après pays/type/distance/temp)

---

## Phase 1 : Store — helpers date-range + badges sur liste finale

**Fichier :** `app/stores/weather.ts`

### 1.1 Ajouter deux helpers internes (à l'intérieur de defineStore, après les refs)

```typescript
// Helper interne : température moyenne sur la plage sélectionnée
function getCityRangeAvgTemp(city: CityProposition): number {
  if (!isSubmitted.value || startIndex.value === -1 || endIndex.value === -1) {
    return city.temperature_moyenne
  }
  const allTemps = [...city.semaine1.temperatures, ...city.semaine2.temperatures]
  const slice = allTemps.slice(startIndex.value, endIndex.value + 1)
  if (slice.length === 0) return city.temperature_moyenne
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

// Helper interne : codes météo sur la plage sélectionnée
function getCityRangeCodes(city: CityProposition): number[] {
  const allCodes = [...city.semaine1.codes, ...city.semaine2.codes]
  if (!isSubmitted.value || startIndex.value === -1 || endIndex.value === -1) {
    return allCodes
  }
  return allCodes.slice(startIndex.value, endIndex.value + 1)
}
```

Placer ces helpers juste avant `filteredAndSortedPropositions` (après `applyTolerance`).

### 1.2 Mettre à jour `filteredAndSortedPropositions`

Modifier le filtre minTemperature (ligne 176) et les deux cas de sort (lignes 192, 196-199) :

```typescript
// Filtre minTemperature — utiliser la temp sur la plage, pas la moyenne globale
if (minTemperature.value > 0) {
  result = result.filter(c => getCityRangeAvgTemp(c) >= minTemperature.value)
}

// Sort temperature — utiliser la temp sur la plage
case 'temperature':
  return dir * (getCityRangeAvgTemp(a) - getCityRangeAvgTemp(b))

// Sort soleil — compter les jours soleil sur la plage uniquement
case 'soleil': {
  const sunCount = (c: CityProposition) =>
    getCityRangeCodes(c).filter(code => SUNNY_CODES.includes(code)).length
  return dir * (sunCount(a) - sunCount(b))
}
```

### 1.3 Recalculer les badges sur `filteredAndSortedPropositions`

Remplacer les trois computed de badges (lignes 126-160) :

```typescript
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

// Badge: villes ensoleillées sur la plage sélectionnée
const badgeSoleilCities = computed(() => {
  const list = filteredAndSortedPropositions.value
  return new Set(
    list
      .filter(c => {
        const codes = getCityRangeCodes(c)
        if (codes.length === 0) return false
        const sunnyDays = codes.filter(code => SUNNY_CODES.includes(code)).length
        return sunnyDays / codes.length > 0.8
      })
      .map(c => c.name + c.country)
  )
})

// Badge: villes les plus proches dans la liste filtrée
const badgeEconomeCities = computed(() => {
  const list = filteredAndSortedPropositions.value
  const withDist = list.filter(c => c.distance !== undefined)
  if (withDist.length === 0) return new Set<string>()
  const minDist = Math.min(...withDist.map(c => c.distance!))
  const threshold = minDist * 1.10
  return new Set(
    withDist
      .filter(c => c.distance! <= threshold)
      .map(c => c.name + c.country)
  )
})
```

> **Note dépendances circulaires** : `filteredAndSortedPropositions` ne dépend pas des badges. Les badges dépendent de `filteredAndSortedPropositions`. Pas de circularité.

> **Ordre dans le fichier** : les badges doivent être déclarés APRÈS `filteredAndSortedPropositions` car ils y font référence.

### Vérification Phase 1
- [ ] `grep -n "temperature_moyenne" app/stores/weather.ts` — ne doit plus apparaître dans les badges ni les sorts (seulement dans `formatData`, `getCityRangeAvgTemp` et le fallback)
- [ ] `grep -n "semaine1.codes" app/stores/weather.ts` — ne doit plus apparaître dans les badges (seulement dans `getCityRangeCodes` et `applyTolerance`)
- [ ] `npm run build` sans erreur TypeScript

### Anti-patterns Phase 1
- Ne pas exporter `getCityRangeAvgTemp` / `getCityRangeCodes` — helpers internes uniquement
- Ne pas modifier `applyTolerance()` — logique déjà correcte (filtre par startIndex/endIndex)
- Ne pas changer le type de retour de `filteredAndSortedPropositions`

---

## Phase 2 : CityCard — nettoyage tags, scroll, filtrage jours

**Fichier :** `app/components/CityCard.vue`

### 2.1 Supprimer le bloc de tags doublonnés (lignes 135-144)

Supprimer ce bloc entier du `<CardHeader>` :

```html
<!-- SUPPRIMER CE BLOC ENTIER -->
<div v-if="ville.type && ville.type.length > 0" class="flex flex-wrap gap-1 mt-1">
  <Badge
    v-for="tag in ville.type"
    :key="tag"
    variant="secondary"
    class="text-xs"
  >
    {{ tag }}
  </Badge>
</div>
```

Conserver uniquement le bloc avec `TAG_LABELS` et emojis (lignes 175-185) sous la sparkline.

### 2.2 Filtrer `allDays` selon la plage sélectionnée

Remplacer le computed `allDays` (lignes 22-31) :

```typescript
const allDays = computed(() => {
  const temps = [...props.ville.semaine1.temperatures, ...props.ville.semaine2.temperatures]
  const codes = [...props.ville.semaine1.codes, ...props.ville.semaine2.codes]
  const dates = [...props.ville.semaine1.dates, ...props.ville.semaine2.dates]
  const days = dates.map((date, i) => ({
    date,
    temp: temps[i],
    code: codes[i],
  }))

  if (store.isSubmitted && store.startIndex !== -1 && store.endIndex !== -1) {
    return days.slice(store.startIndex, store.endIndex + 1)
  }
  return days
})
```

### 2.3 Filtrer `sparklineData` selon la plage sélectionnée

Remplacer le computed `sparklineData` (lignes 51-74) :

```typescript
const sparklineData = computed(() => {
  const allTemps = [...props.ville.semaine1.temperatures, ...props.ville.semaine2.temperatures]
  const temps =
    store.isSubmitted && store.startIndex !== -1 && store.endIndex !== -1
      ? allTemps.slice(store.startIndex, store.endIndex + 1)
      : allTemps

  if (temps.length < 2) return { points: '', areaPath: '' }

  const W = 200, H = 40, PAD = 2
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = max - min || 1

  const coords = temps.map((t, i) => ({
    x: PAD + (i / (temps.length - 1)) * (W - PAD * 2),
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
```

### 2.4 Restaurer la scrollbar horizontale

Ligne 189 du template — supprimer les classes qui masquent la scrollbar :

```html
<!-- AVANT -->
class="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

<!-- APRÈS -->
class="flex gap-2 overflow-x-auto scroll-smooth pb-2"
```

### Vérification Phase 2
- [ ] Avant soumission : 14 jours affichés avec scrollbar visible
- [ ] Après soumission : seuls les jours de la plage dans le scroll ET dans la sparkline
- [ ] Tags n'apparaissent qu'une fois (en bas, avec emojis)
- [ ] `grep -n "scrollbar" app/components/CityCard.vue` — ne doit rien retourner

### Anti-patterns Phase 2
- Ne pas supprimer `overflow-x-auto` — garder le scroll horizontal, juste le rendre visible
- Ne pas modifier `displayTemp` — déjà correct (utilise startIndex/endIndex)

---

## Phase 3 : Layout — marges et sticky search (vérification)

**Fichier :** `app/components/ResultsPanel.vue`

### 3.1 Vérifier le container mx-auto

Le conteneur principal du grid doit avoir `container mx-auto` :

```html
<div class="container mx-auto px-4 py-4">
  <!-- grid de CityCard -->
</div>
```

Si absent, l'ajouter autour du grid.

### 3.2 Vérifier la sticky search bar avec flou

La barre sticky doit avoir `backdrop-blur-sm` et `bg-.../80` :

```html
<div class="sticky top-0 z-10 backdrop-blur-sm ... border-b">
  <!-- search + sort buttons -->
</div>
```

Si `backdrop-blur` manque, l'ajouter.

### Vérification Phase 3
- [ ] En scrollant les résultats, la barre de recherche reste sticky avec effet de flou
- [ ] Les cartes respectent des marges uniformes mobile/desktop

---

## Séquence d'exécution

1. **Phase 1** — store (logique pure, valider via TypeScript build)
2. **Phase 2** — CityCard (UI, valider visuellement)
3. **Phase 3** — vérifications layout mineures

## Commandes

```bash
npm run build   # Validation TypeScript
npm run dev     # Vérification visuelle à http://localhost:3000
```
