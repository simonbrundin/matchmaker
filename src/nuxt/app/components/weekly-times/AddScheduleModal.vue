<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { playerFullName } from '~/utils'

const open = ref(false)
const loading = ref(false)

const { data: sportsData } = await useFetch<{ sports: Array<{ id: string; name: string; slug: string }> }>('/api/admin/sports', { default: () => ({ sports: [] }) })
const { data: hallsData, refresh: refreshHalls } = await useFetch<{ halls: Array<{ id: string; name: string; sport_id: string; city: string | null }> }>('/api/admin/halls', { default: () => ({ halls: [] }) })

const schema = z.object({
  player_id: z.string().min(1, 'Välj en spelare'),
  sport_id: z.string().min(1, 'Välj en sport'),
  hall_id: z.string().min(1, 'Välj en hall'),
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
  sport_id: '',
  hall_id: '',
  time: '18:00',
  type: 'weekly',
  weekday: 1,
  week_parity: 'all',
  interval_days: undefined,
  start_date: new Date().toISOString().split('T')[0],
  is_active: true
})

const selectedPlayer = ref<{ id: string; first_name: string; last_name: string | null; phone: string } | null>(null)
const playerSelectRef = ref<any>(null)

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

const sportOptions = computed(() =>
  (sportsData.value?.sports ?? []).map((s) => ({ value: s.id, label: s.name }))
)

const hallOptions = computed(() =>
  (hallsData.value?.halls ?? [])
    .filter((h) => !state.sport_id || h.sport_id === state.sport_id)
    .map((h) => ({
      value: h.id,
      label: h.city ? `${h.name} (${h.city})` : h.name,
    }))
)

// If the selected hall no longer matches the sport (or none selected), clear it.
watch(
  () => state.sport_id,
  () => {
    if (state.hall_id && !hallOptions.value.some((h) => h.value === state.hall_id)) {
      state.hall_id = ''
    }
  }
)

watch(selectedPlayer, (player) => {
  state.player_id = player?.id || ''
})

function openModal() {
  state.player_id = ''
  state.sport_id = ''
  state.hall_id = ''
  state.time = '18:00'
  state.type = 'weekly'
  state.weekday = 1
  state.week_parity = 'all'
  state.interval_days = undefined
  state.start_date = new Date().toISOString().split('T')[0]
  state.is_active = true
  selectedPlayer.value = null
  refreshHalls()
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
      sport_id: state.sport_id,
      hall_id: state.hall_id,
      time: state.time,
      type: state.type,
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
      description: `Tid skapad för ${selectedPlayer.value ? playerFullName(selectedPlayer.value) : ''}`,
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
  <UModal v-model:open="open" title="Anslut spelare" description="Skapa en återkommande tid för en spelare" class="">
    <UButton icon="i-lucide-plus" label="Anslut spelare" size="sm" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Spelare" name="player_id" required>
          <PlayerSelect ref="playerSelectRef" v-model="selectedPlayer" placeholder="Sök spelare..." />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Sport" name="sport_id" required>
            <USelect v-model="state.sport_id" :items="sportOptions" class="w-full" placeholder="Välj sport" />
          </UFormField>

          <UFormField label="Hall" name="hall_id" required>
            <USelect
              v-model="state.hall_id"
              :items="hallOptions"
              class="w-full"
              placeholder="Välj hall"
              :disabled="!state.sport_id"
            />
          </UFormField>
        </div>

        <UFormField label="Tid" name="time" required>
          <UInput v-model="state.time" type="time" class="w-full" />
        </UFormField>

        <UFormField label="Startdatum" name="start_date">
          <UInput v-model="state.start_date" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Typ" name="type">
          <USelect v-model="state.type"
            :items="[{ label: 'Veckobaserad', value: 'weekly' }, { label: 'Intervall', value: 'interval' }]"
            class="w-full" />
        </UFormField>

        <template v-if="state.type === 'weekly'">
          <UFormField label="Dag" name="weekday">
            <USelect v-model="state.weekday" :items="dayOptions" class="w-full" />
          </UFormField>

          <UFormField label="Paritet" name="week_parity">
            <URadioGroup v-model="state.week_parity" :items="parityOptions" orientation="horizontal" />
          </UFormField>
        </template>

        <template v-if="state.type === 'interval'">
          <UFormField label="Antal dagar mellan" name="interval_days">
            <UInput v-model="state.interval_days" type="number" min="1" placeholder="t.ex. 12" class="w-full" />
          </UFormField>
        </template>

        <UFormField label="Aktiv" name="is_active">
          <UCheckbox v-model="state.is_active" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton label="Avbryt" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Skapa" color="primary" type="submit" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
