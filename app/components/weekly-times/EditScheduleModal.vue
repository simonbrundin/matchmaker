<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { playerFullName } from '~/utils'

interface ScheduleData {
  id: string
  player_id: string
  player_name: string
  time: string
  weekday: number | null
  week_parity: string | null
  interval_days: number | null
  start_date: string | null
  is_active: boolean
}

withDefaults(defineProps<{
  schedule?: ScheduleData
}>(), {})

const open = ref(false)
const loading = ref(false)
const currentScheduleId = ref<string | null>(null)

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

watch(selectedPlayer, (player) => {
  state.player_id = player?.id || ''
})

function openModal(schedule: ScheduleData) {
  currentScheduleId.value = schedule.id
  state.player_id = schedule.player_id
  state.time = schedule.time || '18:00'
  state.type = schedule.interval_days ? 'interval' : 'weekly'
  state.weekday = schedule.weekday || 1
  state.week_parity = (schedule.week_parity as any) || 'all'
  state.interval_days = schedule.interval_days || undefined
  state.start_date = schedule.start_date || new Date().toISOString().split('T')[0]
  state.is_active = schedule.is_active
  selectedPlayer.value = { id: schedule.player_id, first_name: schedule.player_name.split(' ')[0] || '', last_name: schedule.player_name.split(' ').slice(1).join(' ') || null, phone: '' }
  open.value = true
}

defineExpose({ openModal })

const toast = useToast()
const emit = defineEmits(['updated'])

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

    await $fetch(`/api/admin/weekly-times/${currentScheduleId.value}`, {
      method: 'PUT',
      body: payload
    })

    toast.add({
      title: 'Succé',
      description: `Tid uppdaterad för ${selectedPlayer.value ? playerFullName(selectedPlayer.value) : ''}`,
      color: 'success'
    })
    open.value = false
    emit('updated')
  } catch (err: any) {
    toast.add({
      title: 'Fel',
      description: err.data?.message || 'Kunde inte uppdatera tid',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Redigera schema" description="Uppdatera återkommande tid för en spelare" class="w-96">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Spelare" name="player_id" required>
          <PlayerSelect
            ref="playerSelectRef"
            v-model="selectedPlayer"
            placeholder="Sök spelare..."
          />
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
            label="Spara"
            color="primary"
            type="submit"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>