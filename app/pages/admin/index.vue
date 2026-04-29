<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Översikt</h1>
      <p class="text-muted">Systemstatistik för Matchmaker</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <UCard>
        <template #header>Aktiva spelare</template>
        <div class="text-3xl font-bold">{{ stats.activePlayers }}</div>
      </UCard>
      <UCard>
        <template #header>Väntande bokningar</template>
        <div class="text-3xl font-bold">{{ stats.pendingBookings }}</div>
      </UCard>
      <UCard>
        <template #header>Bekräftade idag</template>
        <div class="text-3xl font-bold">{{ stats.confirmedToday }}</div>
      </UCard>
    </div>

    <UCard>
      <template #header>Senaste bokningar</template>
      <UTable :data="recentBookings" :columns="columns">
        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ row.status }}
          </UBadge>
        </template>
        <template #players-cell="{ row }">
          {{ row.booked_players?.length || 0 }}/4
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const stats = ref({ activePlayers: 0, pendingBookings: 0, confirmedToday: 0 })
const recentBookings = ref<any[]>([])

const columns = [
  { id: 'scheduled_date', key: 'scheduled_date', label: 'Datum' },
  { id: 'scheduled_time', key: 'scheduled_time', label: 'Tid' },
  { id: 'status', key: 'status', label: 'Status' },
  { id: 'players', key: 'players', label: 'Spelare' }
]

onMounted(async () => {
  const { data: players } = await useFetch('/api/admin/players?active=true')
  const { data: bookingsData } = await useFetch('/api/admin/bookings')
  
  if (players.value?.players) {
    stats.value.activePlayers = players.value.players.length
  }
  if (bookingsData.value?.bookings) {
    recentBookings.value = bookingsData.value.bookings.slice(0, 10)
    stats.value.pendingBookings = bookingsData.value.bookings.filter((b: any) => b.status === 'pending').length
    const today = new Date().toISOString().split('T')[0]
    stats.value.confirmedToday = bookingsData.value.bookings.filter((b: any) => b.scheduled_date === today && b.status === 'confirmed').length
  }
})

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'yellow',
    confirmed: 'green',
    cancelled: 'red',
    completed: 'gray'
  }
  return colors[status] || 'gray'
}
</script>