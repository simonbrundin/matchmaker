<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Bokningar</h1>
      <p class="text-muted">Alla padelbokningar</p>
    </div>

    <UCard>
      <UTable :data="bookings" :columns="columns">
        <template #scheduled_date-cell="{ row }">
          {{ formatDate(row.scheduled_date) }}
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ row.status }}
          </UBadge>
        </template>
        <template #host-cell="{ row }">
          {{ getHostName(row) }}
        </template>
        <template #players-cell="{ row }">
          <div v-if="row.booked_players" class="flex flex-wrap gap-1">
            <UBadge
              v-for="bp in row.booked_players"
              :key="bp.id"
              :color="playerStatusColor(bp.status)"
              variant="subtle"
              size="xs"
            >
              {{ bp.player ? playerFullName(bp.player) : 'Okänd' }}
            </UBadge>
          </div>
          <span v-else class="text-muted">0/4</span>
        </template>
        <template #actions-cell="{ row }">
          <UButton icon="i-lucide-eye" variant="ghost" size="xs" @click="viewDetails(row)" />
        </template>
      </UTable>
      <div v-if="bookings.length === 0" class="text-center py-8 text-muted">
        Inga bokningar
      </div>
    </UCard>

    <UModal v-model="selectedBooking" title="Bokningsdetaljer">
      <div v-if="selectedBooking" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-muted">Datum</div>
            <div class="font-medium">{{ formatDate(selectedBooking.scheduled_date) }}</div>
          </div>
          <div>
            <div class="text-sm text-muted">Tid</div>
            <div class="font-medium">{{ selectedBooking.scheduled_time }}</div>
          </div>
          <div>
            <div class="text-sm text-muted">Status</div>
            <UBadge :color="statusColor(selectedBooking.status)">
              {{ selectedBooking.status }}
            </UBadge>
          </div>
          <div>
            <div class="text-sm text-muted">Host</div>
            <div class="font-medium">{{ getHostName(selectedBooking) }}</div>
          </div>
        </div>

        <UDivider />

        <div>
          <div class="text-sm font-medium mb-2">Spelare</div>
          <div class="space-y-2">
            <div
              v-for="bp in selectedBooking.booked_players"
              :key="bp.id"
              class="flex items-center justify-between p-2 rounded bg-elevated"
            >
              <div>
                <div class="font-medium">{{ bp.player ? playerFullName(bp.player) : 'Okänd' }}</div>
                <div class="text-xs text-muted">{{ bp.player?.phone }}</div>
              </div>
              <div class="text-right">
                <UBadge :color="playerStatusColor(bp.status)" size="xs">{{ bp.status }}</UBadge>
                <div v-if="bp.response" class="text-xs mt-1">Svar: {{ bp.response }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <UButton label="Stäng" @click="selectedBooking = null" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { playerFullName } from '~/utils'
interface Booking {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  host_player_id: string
  booked_players: any[]
}

const bookings = ref<Booking[]>([])
const selectedBooking = ref<Booking | null>(null)

const columns = [
  { id: 'scheduled_date', key: 'scheduled_date', label: 'Datum' },
  { id: 'scheduled_time', key: 'scheduled_time', label: 'Tid' },
  { id: 'status', key: 'status', label: 'Status' },
  { id: 'host', key: 'host', label: 'Host' },
  { id: 'players', key: 'players', label: 'Spelare' },
  { id: 'actions', key: 'actions', label: '' }
]

async function loadBookings() {
  const { data } = await useFetch('/api/admin/bookings')
  if (data.value?.bookings) {
    bookings.value = data.value.bookings as Booking[]
  }
}

function getHostName(booking: Booking): string {
  const host = booking.booked_players?.find(bp => bp.player_id === booking.host_player_id)
  return host?.player ? playerFullName(host.player) : 'Okänd'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE')
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'yellow',
    confirmed: 'green',
    cancelled: 'red',
    completed: 'gray'
  }
  return colors[status] || 'gray'
}

function playerStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'green',
    invited: 'yellow',
    declined: 'red',
    waitlist: 'gray'
  }
  return colors[status] || 'gray'
}

function viewDetails(booking: Booking) {
  selectedBooking.value = booking
}

onMounted(loadBookings)
</script>