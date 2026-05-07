<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { playerFullName } from '~/utils'

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

function openModal() {
  state.player_id = ''
  state.time = '18:00'
  state.type = 'weekly'
  state.weekday = 1
  state.week_parity = 'all'
  state.interval_days = undefined
  state.start_date = new Date().toISOString().split('T')[0]
  state.is_active = true
  selectedPlayer.value = null
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
