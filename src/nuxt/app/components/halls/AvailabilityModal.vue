<script setup lang="ts">
interface Slot {
  /** Time in HH:MM format */
  time: string
  /** Number of available courts (for both systems) */
  courts: number
  /** Price in SEK (0 for Matchi since it's not exposed in listSlots) */
  price: number
}

interface AvailabilityData {
  hallId: string
  hallName: string
  date: string
  system: "court22" | "matchi" | null
  slots: Slot[]
  error?: string
  fetchedAt: string
}

const props = defineProps<{ hall?: { id: string; name: string; booking_system?: string | null } }>()

const open = ref(false)
const loading = ref(false)
const data = ref<AvailabilityData | null>(null)

const selectedDate = ref(new Date().toISOString().split("T")[0])

watch(open, async (val) => {
  if (val && props.hall) {
    await loadAvailability()
  }
})

async function loadAvailability() {
  if (!props.hall) return
  loading.value = true
  data.value = null
  try {
    data.value = await $fetch<AvailabilityData>(
      `/api/admin/halls/${props.hall.id}/availability?date=${selectedDate.value}`
    )
  } catch {
    data.value = {
      hallId: props.hall.id,
      hallName: props.hall.name,
      date: selectedDate.value,
      system: null,
      slots: [],
      error: "Kunde inte hämta tillgänglighet",
    }
  } finally {
    loading.value = false
  }
}

function openModal(hall: { id: string; name: string; booking_system?: string | null }) {
  selectedDate.value = new Date().toISOString().split("T")[0]
  data.value = null
  open.value = true
}

defineExpose({ openModal })

const freeSlots = computed(() =>
  (data.value?.slots ?? []).filter((s) => s.courts > 0)
)

const busySlots = computed(() =>
  (data.value?.slots ?? []).filter((s) => s.courts === 0)
)
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Lediga tider – ${props.hall?.name ?? ''}`"
    class="max-w-2xl"
  >
    <template #body>
      <!-- Date picker -->
      <div class="mb-4 flex items-center gap-3">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="text-muted" />
          <input
            v-model="selectedDate"
            type="date"
            class="rounded border border-default bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            @change="loadAvailability"
          />
        </div>
        <UButton
          v-if="data"
          size="xs"
          icon="i-lucide-refresh-cw"
          label="Uppdatera"
          variant="outline"
          @click="loadAvailability"
        />
        <div v-if="data?.system" class="ml-auto flex items-center gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-globe" class="text-xs" />
          <span>{{ data.system === 'court22' ? 'Court22' : 'Matchi' }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-muted" />
        <span class="ml-2 text-muted">Hämtar tillgänglighet...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="data?.error"
        class="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {{ data.error }}
      </div>

      <!-- Empty -->
      <div
        v-else-if="data && data.slots.length === 0"
        class="py-8 text-center text-muted"
      >
        Inga tider för detta datum.
      </div>

      <!-- Slots grid -->
      <div v-else-if="data" class="space-y-4">
        <!-- Summary bar -->
        <div class="flex gap-6 text-sm">
          <div class="flex items-center gap-1.5">
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            <span>{{ freeSlots.length }} tider med lediga banor</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
            <span>{{ busySlots.length }} fullbokade</span>
          </div>
          <div v-if="data.system === 'matchi'" class="text-xs text-muted">
            Matchi: visar antal lediga banor per tid
          </div>
        </div>

        <!-- Time slots -->
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          <div
            v-for="slot in data.slots"
            :key="slot.time"
            :class="[
              'flex flex-col items-center justify-center rounded-lg border px-2 py-3 text-sm',
              slot.courts > 0
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
            ]"
          >
            <span class="font-mono font-medium">{{ slot.time }}</span>
            <span class="mt-0.5 text-xs opacity-70">
              {{ slot.courts > 0 ? `${slot.courts} ban${slot.courts === 1 ? "a" : "or"}` : "Full" }}
            </span>
            <span v-if="slot.price > 0" class="mt-0.5 text-xs opacity-60">
              {{ slot.price }} kr
            </span>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
