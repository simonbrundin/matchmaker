<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Återkommande tider</h1>
      <p class="text-muted">Spelare med stående tider</p>
    </div>

    <div v-if="summary" class="grid grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-primary">{{ summary.activePlayers }}</div>
          <div class="text-sm text-muted">Aktiva spelare</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-500">{{ summary.weekdaySchedules }}</div>
          <div class="text-sm text-muted">Veckobaserade</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-500">{{ summary.intervalSchedules }}</div>
          <div class="text-sm text-muted">Intervall</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-500">{{ summary.timesPerWeek }}</div>
          <div class="text-sm text-muted">Tider/vecka</div>
        </div>
      </UCard>
    </div>

    <UCard>
      <UTable :key="key" :data="schedules" :columns="columns" :row-key="(row: any) => row.id" />
      <div v-if="schedules.length === 0" class="text-center py-8 text-muted">
        Inga återkommande tider hittades
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface Summary {
  activePlayers: number
  weekdaySchedules: number
  intervalSchedules: number
  timesPerWeek: number
}

import { h } from 'vue'

const columns = [
  { id: 'player_name', header: 'Spelare', accessorKey: 'player_name' },
  { id: 'type', header: 'Typ', accessorKey: 'type' },
  { id: 'schedule', header: 'Schema', accessorKey: 'schedule' },
  { id: 'time_display', header: 'Tid', accessorKey: 'time_display' },
  { id: 'start_date', header: 'Start', accessorKey: 'start_date' },
  { id: 'is_active', header: 'Status', accessorKey: 'is_active', cell: ({ row }: any) => row.is_active ? 'Aktiv' : 'Inaktiv' }
]

const dayNames: Record<number, string> = {
  1: 'Måndag',
  2: 'Tisdag',
  3: 'Onsdag',
  4: 'Torsdag',
  5: 'Fredag',
  6: 'Lördag',
  7: 'Söndag'
}

function formatWeekday(weekday: number | null): string {
  if (!weekday) return '-'
  return dayNames[weekday] || `Dag ${weekday}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE')
}

const key = ref(0)
const schedules = ref<any[]>([])
const summary = ref<Summary | null>(null)

async function loadData() {
  const data: any = await $fetch('/api/admin/weekly-times')
  if (data?.schedules) {
    schedules.value = data.schedules.map((s: any) => ({
      id: s.id,
      weekday: s.weekday,
      week_parity: s.week_parity,
      interval_days: s.interval_days,
      start_date: s.start_date,
      is_active: s.is_active ? 'Aktiv' : 'Inaktiv',
      player_name: s.player?.name || '',
      player_phone: s.player?.phone || '',
      time_display: s.time?.substring(0, 5) || '',
      type: s.interval_days ? 'Intervall' : 'Veckobaserad',
      schedule: s.interval_days 
        ? `Var ${s.interval_days}:e dag`
        : formatWeekday(s.weekday)
    }))
  }
  if (data?.summary) {
    summary.value = data.summary
  }
  key.value++
}

onMounted(loadData)

</script>