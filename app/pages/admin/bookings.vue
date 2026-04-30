<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Bokningar</h1>
      <p class="text-muted">Alla padelbokningar</p>
    </div>

    <UCard>
      <UTable :data="bookings" :columns="columns" />
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

      <template #footer>
        <UButton label="Stäng" @click="selectedBooking = null" />
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(UBadge, {
      color: statusColor(row.original.status),
      variant: 'subtle'
    }, () => row.original.status)
  },
  {
    id: 'host',
    header: 'Host',
    cell: ({ row }) => getHostName(row.original)
  },
  {
    id: 'players',
    header: 'Spelare',
    cell: ({ row }) => {
      const booking = row.original
      if (!booking.booked_players) {
        return h('span', { class: 'text-muted' }, '0/4')
      }
      return booking.booked_players.map((bp: any) =>
        h(UBadge, {
          color: playerStatusColor(bp.status),
          variant: 'subtle',
          size: 'xs',
          class: 'mr-1'
        }, () => bp.player ? playerFullName(bp.player) : 'Okänd')
      )
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h(UButton, {
      icon: 'i-lucide-eye',
      variant: 'ghost',
      size: 'xs',
      onClick: () => viewDetails(row.original)
    })
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