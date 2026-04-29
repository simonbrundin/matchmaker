<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const open = ref(false)
const loading = ref(false)

const schema = z.object({
  player_id: z.string().min(1, 'Välj en spelare'),
  time: z.string().min(1, 'Ange en tid'),
  type: z.enum(['weekly', 'interval']),
  weekday: z.number().optional(),
  week_parity: z.enum(['all', 'odd', 'even']).optional(),
  interval_days: z.number().optional(),
  start_date: z.string().optional(),
  is_active: z.boolean().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  player_id: '',
  time: '18:00',
  type: 'weekly',
  weekday: 1,
  week_parity: 'all',
  interval_days: undefined,
  start_date: new Date().toISOString().split('T')[0],
  is_active: true
})

const players = ref<{ id: string; name: string; phone: string }[]>([])
const playerSearch = ref('')
const showDropdown = ref(false)
const playerSearchInput = ref<any>(null)

const dayNames: Record<number, string> = {
  1: 'Måndag',
  2: 'Tisdag',
  3: 'Onsdag',
  4: 'Torsdag',
  5: 'Fredag',
  6: 'Lördag',
  7: 'Söndag'
}

const dayOptions = Object.entries(dayNames).map(([value, label]) => ({
  value: Number(value),
  label
}))

const parityOptions = [
  { value: 'all', label: 'Alla veckor' },
  { value: 'odd', label: 'Udda veckor' },
  { value: 'even', label: 'Jämna veckor' }
]

const filteredPlayers = computed(() => {
  const search = playerSearch.value.toLowerCase().trim()
  if (!search) return players.value.slice(0, 10)
  return players.value.filter(p =>
    p.name.toLowerCase().includes(search) ||
    (p.phone && p.phone.includes(search))
  ).slice(0, 10)
})

const selectedPlayer = computed(() =>
  players.value.find(p => p.id === state.player_id)
)

async function loadPlayers() {
  try {
    const data: any = await $fetch('/api/admin/players?active=true')
    if (data?.players) {
      players.value = data.players
    }
  } catch (err) {
    console.error('loadPlayers error:', err)
  }
}

watch(() => open.value, (isOpen) => {
  if (isOpen && players.value.length === 0) {
    loadPlayers()
  }
  if (isOpen) {
    nextTick(() => {
      const input = playerSearchInput.value
      if (input) {
        const el = input.$el?.querySelector?.('input') || input.$el || input
        el?.focus?.()
      }
    })
  }
})

let blurTimeout: ReturnType<typeof setTimeout> | null = null

function onFocus() {
  showDropdown.value = true
}

function onBlur() {
  blurTimeout = setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

function onInput(e: Event) {
  if (!showDropdown.value) {
    showDropdown.value = true
  }
}

function selectPlayer(player: { id: string; name: string; phone: string }) {
  if (blurTimeout) {
    clearTimeout(blurTimeout)
    blurTimeout = null
  }
  state.player_id = player.id
  playerSearch.value = player.name
  nextTick(() => {
    showDropdown.value = false
  })
}

function closeDropdown() {
  showDropdown.value = false
}

function openModal() {
  state.player_id = ''
  state.time = '18:00'
  state.type = 'weekly'
  state.weekday = 1
  state.week_parity = 'all'
  state.interval_days = undefined
  state.start_date = new Date().toISOString().split('T')[0]
  state.is_active = true
  playerSearch.value = ''
  loadPlayers()
  open.value = true
}

defineExpose({ openModal })

const toast = useToast()
const emit = defineEmits(['created'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const payload: any = {
      player_id: state.player_id,
      time: state.time,
      is_active: state.is_active ?? true
    }

    if (state.type === 'weekly') {
      payload.weekday = state.weekday
      payload.week_parity = state.week_parity || 'all'
    } else {
      payload.interval_days = state.interval_days || 7
    }

    if (state.start_date) {
      payload.start_date = state.start_date
    }

    await $fetch('/api/admin/weekly-times-add', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Succé',
      description: `Tid skapad för ${selectedPlayer.value?.name}`,
      color: 'success'
    })
    open.value = false
    emit('created')
  } catch (err: any) {
    toast.add({
      title: 'Fel',
      description: err.data?.message || 'Kunde inte skapa tid',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Anslut spelare" description="Skapa en återkommande tid för en spelare" class="w-96">
    <UButton icon="i-lucide-plus" label="Anslut spelare" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Spelare" name="player_id" required>
          <div class="relative">
            <UInput
              ref="playerSearchInput"
              v-model="playerSearch"
              placeholder="Sök spelare..."
              class="w-full"
              @focus="onFocus"
              @blur="onBlur"
              @input="onInput"
            />
            <div
              v-if="showDropdown && filteredPlayers.length > 0"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-muted rounded-md shadow-lg max-h-60 overflow-auto"
            >
              <div
                v-for="player in filteredPlayers"
                :key="player.id"
                class="px-3 py-2 hover:bg-muted cursor-pointer"
                @mousedown.prevent="selectPlayer(player)"
              >
                <div class="font-medium">{{ player.name }}</div>
                <div class="text-sm text-muted">{{ player.phone || 'Inget nummer' }}</div>
              </div>
            </div>
          </div>
          <div v-if="selectedPlayer && !showDropdown" class="text-sm text-muted mt-1">
            Vald: {{ selectedPlayer.name }}
          </div>
        </UFormField>

        <UFormField label="Tid" name="time" required>
          <UInput v-model="state.time" type="time" class="w-full" />
        </UFormField>

        <UFormField label="Startdatum" name="start_date">
          <UInput v-model="state.start_date" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Typ" name="type">
          <USelect
            v-model="state.type"
            :items="[{ label: 'Veckobaserad', value: 'weekly' }, { label: 'Intervall', value: 'interval' }]"
            class="w-full"
          />
        </UFormField>

        <template v-if="state.type === 'weekly'">
          <UFormField label="Dag" name="weekday">
            <USelect
              v-model="state.weekday"
              :items="dayOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Paritet" name="week_parity">
            <URadioGroup
              v-model="state.week_parity"
              :items="parityOptions"
              orientation="horizontal"
            />
          </UFormField>
        </template>

        <template v-if="state.type === 'interval'">
          <UFormField label="Antal dagar mellan" name="interval_days">
            <UInput
              v-model="state.interval_days"
              type="number"
              min="1"
              placeholder="t.ex. 12"
              class="w-full"
            />
          </UFormField>
        </template>

        <UFormField label="Aktiv" name="is_active">
          <UCheckbox v-model="state.is_active" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Avbryt"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="Skapa"
            color="primary"
            type="submit"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>