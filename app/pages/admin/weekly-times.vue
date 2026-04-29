<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Återkommande tider</h1>
      <p class="text-muted">Spelare med stående tider</p>
    </div>

    <div class="flex justify-end mb-4">
      <WeeklyTimesAddScheduleModal ref="addModal" @created="loadData" />
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
      <UTable :key="key" :data="schedules" :columns="columns" :row-key="(row: any) => row.id">
        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton label="Redigera" variant="outline" size="xs" @click="openEditModal(row)" />
            <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" @click="openDeleteModal(row)" />
          </div>
        </template>
      </UTable>
      <div v-if="schedules.length === 0" class="text-center py-8 text-muted">
        Inga återkommande tider hittades
      </div>
    </UCard>

    <WeeklyTimesEditScheduleModal ref="editModal" @updated="loadData" />
    <WeeklyTimesDeleteScheduleModal ref="deleteModal" :schedule="selectedSchedule" @deleted="loadData" />
  </div>
</template>

<script setup lang="ts">
interface Summary {
  activePlayers: number
  weekdaySchedules: number
  intervalSchedules: number
  timesPerWeek: number
}

const columns = [
  { id: 'player_name', header: 'Spelare', accessorKey: 'player_name' },
  { id: 'type', header: 'Typ', accessorKey: 'type' },
  { id: 'schedule', header: 'Schema', accessorKey: 'schedule' },
  { id: 'parity', header: 'Paritet', accessorKey: 'parity' },
  { id: 'time_display', header: 'Tid', accessorKey: 'time_display' },
  { id: 'start_date', header: 'Start', accessorKey: 'start_date' },
  { id: 'is_active', header: 'Status', accessorKey: 'is_active', cell: ({ row }: any) => row.is_active ? 'Aktiv' : 'Inaktiv' },
  { id: 'actions', header: '', accessorKey: 'actions' }
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

const parityNames: Record<string, string> = {
  all: 'Alla',
  odd: 'Udda',
  even: 'Jämna'
}

function formatWeekday(weekday: number | null): string {
  if (!weekday) return '-'
  return dayNames[weekday] || `Dag ${weekday}`
}

function formatParity(parity: string | null): string {
  if (!parity) return '-'
  return parityNames[parity] || parity
}

const key = ref(0)
const schedules = ref<any[]>([])
const summary = ref<Summary | null>(null)
const addModal = ref<any>(null)
const editModal = ref<any>(null)
const deleteModal = ref<any>(null)
const selectedSchedule = ref<any>(null)

async function loadData() {
  const data: any = await $fetch('/api/admin/weekly-times')
  if (data?.schedules) {
    schedules.value = data.schedules.map((s: any) => ({
      id: s.id,
      player_id: s.player?.id || '',
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
        : formatWeekday(s.weekday),
      parity: s.interval_days ? '-' : formatParity(s.week_parity)
    }))
  }
  if (data?.summary) {
    summary.value = data.summary
  }
  key.value++
}

onMounted(loadData)

function openEditModal(row: any) {
  const schedule = row.original || row
  editModal.value?.openModal({
    id: schedule.id,
    player_id: schedule.player_id || '',
    player_name: schedule.player_name || '',
    time: schedule.time_display || '18:00',
    weekday: schedule.weekday || null,
    week_parity: schedule.week_parity || 'all',
    interval_days: schedule.interval_days || null,
    start_date: schedule.start_date || null,
    is_active: schedule.is_active === 'Aktiv'
  })
}

function openDeleteModal(row: any) {
  const schedule = row.original || row
  selectedSchedule.value = {
    id: schedule.id,
    player_name: schedule.player_name || '',
    schedule: schedule.schedule || '',
    time_display: schedule.time_display || ''
  }
  deleteModal.value?.openModal(selectedSchedule.value)
}
</script>