<script setup lang="ts">
interface VenueResult {
  id: string
  name: string
  city?: string
  url: string
  system: "court22" | "matchi"
}

const props = defineProps<{
  modelValue?: VenueResult | null
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: VenueResult | null): void
  (e: "close"): void
}>()

const open = ref(false)
const system = ref<"court22" | "matchi">("court22")
const query = ref("")
const results = ref<VenueResult[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedSystem = ref<"court22" | "matchi">("court22")

watch(open, async (val) => {
  if (val) {
    query.value = ""
    results.value = []
    error.value = null
    selectedSystem.value = system.value
    await doSearch()
  }
})

async function doSearch() {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const data = await $fetch<{ results: VenueResult[] }>(
      `/api/admin/halls/search-venues?system=${selectedSystem.value}&query=${encodeURIComponent(query.value)}`
    )
    results.value = data.results
    if (results.value.length === 0) {
      error.value = "Inga anläggningar hittades"
    }
  } catch {
    error.value = "Sökningen misslyckades"
    results.value = []
  } finally {
    loading.value = false
  }
}

async function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault()
    await doSearch()
  }
}

function selectVenue(venue: VenueResult) {
  emit("update:modelValue", venue)
  open.value = false
}

function openModal() {
  open.value = true
}

defineExpose({ openModal })
</script>

<template>
  <UModal v-model:open="open" title="Sök anläggning" class="max-w-md">
    <template #body>
      <div class="space-y-3">
        <!-- System selector -->
        <div class="flex gap-2">
          <UButton
            :variant="selectedSystem === 'court22' ? 'solid' : 'outline'"
            :color="selectedSystem === 'court22' ? 'primary' : 'neutral'"
            label="Court22"
            size="sm"
            @click="selectedSystem = 'court22'; doSearch()"
          />
          <UButton
            :variant="selectedSystem === 'matchi' ? 'solid' : 'outline'"
            :color="selectedSystem === 'matchi' ? 'primary' : 'neutral'"
            label="Matchi"
            size="sm"
            @click="selectedSystem = 'matchi'; doSearch()"
          />
        </div>

        <!-- Search input -->
        <div class="flex gap-2">
          <UInput
            v-model="query"
            placeholder="Sök på anläggningsnamn..."
            class="flex-1"
            @keydown="handleKeydown"
          />
          <UButton
            icon="i-lucide-search"
            @click="doSearch"
            :loading="loading"
          />
        </div>

        <!-- Error -->
        <div v-if="error" class="text-sm text-muted text-center py-2">
          {{ error }}
        </div>

        <!-- Results -->
        <div v-else-if="results.length > 0" class="space-y-1 max-h-80 overflow-y-auto">
          <button
            v-for="venue in results"
            :key="`${venue.system}-${venue.id}`"
            type="button"
            class="w-full text-left px-3 py-2 rounded hover:bg-primary/10 transition-colors"
            @click="selectVenue(venue)"
          >
            <div class="font-medium text-sm">{{ venue.name }}</div>
            <div v-if="venue.city" class="text-xs text-muted">{{ venue.city }}</div>
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-else-if="loading" class="py-6 text-center text-muted text-sm">
          Söker...
        </div>

        <!-- Empty state -->
        <div v-else class="py-6 text-center text-muted text-sm">
          Tryck Enter eller klicka på ikonen för att söka
        </div>
      </div>
    </template>
  </UModal>
</template>
