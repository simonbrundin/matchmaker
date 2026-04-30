<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Bokningar</h1>
      <p class="text-muted">Alla padelbokningar</p>
    </div>

    <UCard>
      <UTable :data="bookings" :columns="columns">
        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle">
            {{ row.original.status }}
          </UBadge>
        </template>
        <template #players-cell="{ row }">
          <div v-if="!row.original.booked_players || row.original.booked_players.filter((bp: any) => bp.status === 'confirmed').length === 0" class="text-muted">
            0/4
          </div>
          <div v-else class="flex flex-wrap gap-1">
            <UBadge
              v-for="bp in row.original.booked_players.filter((bp: any) => bp.status === 'confirmed')"
              :key="bp.id"
              color="success"
              variant="subtle"
              size="xs"
            >
              {{ bp.player ? playerFullName(bp.player) : 'Okänd' }}
            </UBadge>
          </div>
        </template>
        <template #actions-cell="{ row }">
          <UButton icon="i-lucide-eye" variant="ghost" size="xs" @click="viewDetails(row.original)" />
        </template>
      </UTable>
      <div v-if="bookings.length === 0" class="text-center py-8 text-muted">
        Inga bokningar
      </div>
    </UCard>

    <UModal v-model:open="isModalOpen" title="Bokningsdetaljer">
      <template #body>
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

          <div class="border-t border-default my-4"></div>

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
      </template>

      <template #footer>
        <UButton label="Stäng" @click="isModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { playerFullName } from '~/utils'
import { UBadge, UButton } from '#components'
import type { TableColumn } from '@nuxt/ui'
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
const isModalOpen = ref(false)

function viewDetails(booking: Booking) {
  selectedBooking.value = booking
  isModalOpen.value = true
}
const columns: TableColumn<Booking>[] = [
  {
    accessorKey: 'scheduled_date',
    header: 'Datum',
    cell: ({ row }) => formatDate(row.original.scheduled_date)
  },
  {
    accessorKey: 'scheduled_time',
    header: 'Tid'
  },
  {
    id: 'status',
    header: 'Status'
  },
  {
    id: 'host',
    header: 'Host',
    cell: ({ row }) => getHostName(row.original)
  },
  {
    id: 'players',
    header: 'Spelare'
  },
  {
    id: 'actions',
    header: ''
  }
]
async function loadBookings() {
  const { data } = await useFetch('/api/admin/bookings')
  if (data.value?.bookings) {
    bookings.value = data.value.bookings as Booking[]
  }
}
function getHostName(booking: Booking): string {
  if (!booking.booked_players || booking.booked_players.length === 0) return 'Okänd'
  const host = booking.booked_players[0]
  return host?.player ? playerFullName(host.player) : 'Okänd'
}
function formatDate(dateStr: string): string {
  return dateStr || ''
}
function statusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error',
    completed: 'neutral'
  }
  return colors[status] || 'neutral'
}
function playerStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'success',
    invited: 'warning',
    declined: 'error',
    waitlist: 'neutral'
  }
  return colors[status] || 'neutral'
}
onMounted(loadBookings)
</script>