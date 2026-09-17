<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Återkommande tider</h1>
        <p class="text-muted">Spelare med stående tider</p>
      </div>
      <div class="flex items-center gap-4">
        <USwitch v-model="showAll" label="Visa inaktiva" />
        <WeeklyTimesAddScheduleModal ref="addModal" @created="loadData" />
      </div>
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
      <LoadingState v-if="isLoading" label="Laddar återkommande tider..." />
      <UTable v-else :key="key" :data="schedules" :columns="columns" :row-key="(row: any) => row.id">
        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton icon="i-lucide-users" variant="ghost" size="xs" @click="openFriendsModal(row)" />
            <UButton label="Redigera" variant="outline" size="xs" @click="openEditModal(row)" />
            <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" @click="openDeleteModal(row)" />
          </div>
        </template>
      </UTable>
      <div v-if="!isLoading && schedules.length === 0" class="text-center py-8 text-muted">
        Inga återkommande tider hittades
      </div>
    </UCard>

    <EditScheduleModal ref="editModal" @updated="loadData" />
    <DeleteScheduleModal ref="deleteModal" :schedule="selectedSchedule" @deleted="loadData" />
    <FriendsListModal v-if="friendsPlayer" ref="friendsModal" :player="friendsPlayer" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })


import { playerFullName } from '~/utils'
import FriendsListModal from '~/components/players/FriendsListModal.vue'
import WeeklyTimesAddScheduleModal from '~/components/weekly-times/AddScheduleModal.vue'
import EditScheduleModal from '~/components/weekly-times/EditScheduleModal.vue'
import DeleteScheduleModal from '~/components/weekly-times/DeleteScheduleModal.vue'
interface Summary {
  activePlayers: number
  weekdaySchedules: number
  intervalSchedules: number
  timesPerWeek: number
}

const columns = [
  { id: 'player_name', header: 'Spelare', accessorKey: 'player_name' },
  { id: 'sport_name', header: 'Sport', accessorKey: 'sport_name' },
  { id: 'hall_name', header: 'Hall', accessorKey: 'hall_name' },
  { id: 'type', header: 'Typ', accessorKey: 'type' },
  { id: 'schedule', header: 'Schema', accessorKey: 'schedule' },
  { id: 'parity', header: 'Paritet', accessorKey: 'parity' },
  { id: 'time_display', header: 'Tid', accessorKey: 'time_display' },
  { id: 'start_date', header: 'Start', accessorKey: 'start_date' },
  {
    id: 'is_active',
    header: 'Status',
    accessorKey: 'is_active',
    cell: ({ row }: any) => (row.original?.is_active ?? row.is_active) ? 'Aktiv' : 'Inaktiv'
  },
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
const showAll = ref(false)
const isLoading = ref(false)
const schedules = ref<any[]>([])
const summary = ref<Summary | null>(null)
const addModal = ref<any>(null)
const editModal = ref<any>(null)
const deleteModal = ref<any>(null)
const selectedSchedule = ref<any>(null)
const friendsModal = ref<any>(null)
const friendsPlayer = ref<{ id: string; first_name: string; last_name: string | null; elo: number } | null>(null)

async function loadData() {
  isLoading.value = true
  try {
    const query = showAll.value ? '?active=all' : ''
    const data: any = await $fetch(`/api/admin/weekly-times${query}`)
    if (data?.schedules) {
      schedules.value = data.schedules.map((s: any) => ({
        id: s.id,
        player_id: s.player?.id || '',
        weekday: s.weekday,
        week_parity: s.week_parity,
        interval_days: s.interval_days,
        start_date: s.start_date,
        is_active: Boolean(s.is_active),
        sport_id: s.sport_id || s.sport?.id || null,
        hall_id: s.hall_id || s.hall?.id || null,
        sport_name: s.sport?.name || '—',
        hall_name: s.hall?.name || '—',
        sport: s.sport || null,
        hall: s.hall || null,
        player_name: s.player ? playerFullName(s.player) : '',
        player_phone: s.player?.phone || '',
        player_elo: s.player?.elo || 0,
        player: s.player,
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
  } finally {
    isLoading.value = false
  }
}

watch(showAll, loadData)

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
    is_active: Boolean(schedule.is_active),
    sport_id: schedule.sport_id || null,
    hall_id: schedule.hall_id || null,
    sport: schedule.sport || null,
    hall: schedule.hall || null
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

function openFriendsModal(row: any) {
  const schedule = row.original || row
  friendsPlayer.value = {
    id: schedule.player?.id || schedule.player_id || '',
    first_name: schedule.player?.first_name || '',
    last_name: schedule.player?.last_name || null,
    elo: schedule.player?.elo || 0
  }
  nextTick(() => {
    friendsModal.value?.openModal(friendsPlayer.value)
  })
}
</script>