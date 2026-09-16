<script setup lang="ts">
definePageMeta({ layout: 'default' })

const stats = ref({ activePlayers: 0, pendingBookings: 0, confirmedToday: 0 })
const isLoading = ref(true)
const recentBookings = ref<any[]>([])

// Cashcard balance
const cashcardBalance = ref<{ balance: number | null; currency: string; checked_at: string } | null>(null)
const isCheckingBalance = ref(false)
const balanceMessage = ref('')

const dashboardStats = [
  { key: 'activePlayers', label: 'Aktiva spelare' },
  { key: 'pendingBookings', label: 'Väntande bokningar' },
  { key: 'confirmedToday', label: 'Bekräftade idag' }
] as const

const columns = [
  { id: 'scheduled_date', key: 'scheduled_date', label: 'Datum' },
  { id: 'scheduled_time', key: 'scheduled_time', label: 'Tid' },
  { id: 'status', key: 'status', label: 'Status' },
  { id: 'players', key: 'players', label: 'Spelare' }
]

onMounted(async () => {
  try {
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
  } finally {
    isLoading.value = false
  }
  
  // Load cashcard balance
  await loadCashcardBalance()
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

async function checkCashcardBalance() {
  isCheckingBalance.value = true
  balanceMessage.value = ''
  try {
    const { data } = await useFetch('/api/admin/cashcard/check', { method: 'POST' })
    if (data.value?.success) {
      balanceMessage.value = data.value.message
    }
  } catch (e: any) {
    balanceMessage.value = 'Kunde inte skicka saldo-förfrågan'
  } finally {
    isCheckingBalance.value = false
  }
}

async function loadCashcardBalance() {
  try {
    const { data } = await useFetch('/api/admin/cashcard/balance')
    if (data.value?.balance) {
      cashcardBalance.value = data.value.balance
    }
  } catch (e) {
    // Silently fail
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Översikt</h1>
      <p class="text-muted">Systemstatistik för Matchmaker</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <UCard v-for="stat in dashboardStats" :key="stat.key">
        <template #header>{{ stat.label }}</template>
        <LoadingState v-if="isLoading" label="Laddar..." />
        <div v-else class="text-3xl font-bold">{{ stats[stat.key] }}</div>
      </UCard>
      
      <!-- Cashcard Balance Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span>Kontantkort</span>
            <UButton
              size="xs"
              icon="i-heroicons-arrow-path"
              :loading="isCheckingBalance"
              @click="checkCashcardBalance"
            >
              Kolla
            </UButton>
          </div>
        </template>
        <LoadingState v-if="isLoading" label="Laddar..." />
        <div v-else-if="cashcardBalance">
          <div class="text-3xl font-bold text-primary">
            {{ cashcardBalance.balance.toFixed(2) }} {{ cashcardBalance.currency }}
          </div>
          <p class="text-xs text-muted mt-1">
            Uppdaterat: {{ new Date(cashcardBalance.checked_at).toLocaleString('sv-SE') }}
          </p>
        </div>
        <div v-else class="text-muted">
          <p>Ingen data</p>
          <p class="text-xs mt-1">Klicka "Kolla" för att hämta saldo</p>
        </div>
        <p v-if="balanceMessage" class="text-xs text-success mt-2">{{ balanceMessage }}</p>
      </UCard>
    </div>

    <UCard>
      <template #header>Senaste bokningar</template>
      <LoadingState v-if="isLoading" label="Laddar bokningar..." />
      <UTable v-else :data="recentBookings" :columns="columns">
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
