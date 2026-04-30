<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Meddelanden</h1>
      <p class="text-muted">Alla meddelanden skickade till spelare</p>
    </div>

    <UCard>
      <UTable :data="bookings" :columns="columns">
        <template #scheduled_date-cell="{ row }">
          {{ formatDate(row.original?.scheduled_date ?? row.scheduled_date) }}
        </template>
        <template #scheduled_time-cell="{ row }">
          {{ row.original?.scheduled_time ?? row.scheduled_time }}
        </template>
        <template #fill-cell="{ row }">
          <UBadge
            :color="fillStatusColor((row.original ?? row).fill_status)"
            variant="subtle"
            size="md"
          >
            {{ (row.original ?? row).confirmed_count }}/4
          </UBadge>
        </template>
        <template #invites-cell="{ row }">
          <span v-if="(row.original ?? row).invited_rounds">
            {{ (row.original ?? row).invited_rounds }}/{{ (row.original ?? row).max_rounds }}
          </span>
          <span v-else class="text-muted">-</span>
        </template>
        <template #players-cell="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="pm in Object.values((row.original ?? row).player_messages).filter((pm: any) => pm.status === 'confirmed')"
              :key="pm.player?.id ?? Math.random()"
              color="success"
              variant="subtle"
              size="md"
            >
              {{ pm.player ? playerFullName(pm.player) : 'Okänd' }}
            </UBadge>
          </div>
        </template>
        <template #message_count-cell="{ row }">
          {{ (row.original ?? row).message_count }}
        </template>
        <template #actions-cell="{ row }">
          <UButton icon="i-lucide-eye" variant="ghost" size="md" @click="viewMessages(row.original ?? row)" />
        </template>
      </UTable>
      <div v-if="bookings.length === 0" class="text-center py-8 text-muted">
        Inga meddelanden hittades
      </div>
    </UCard>

    <UModal v-model:open="isModalOpen" title="Meddelanden" :ui="{ width: 'max-w-2xl' }">
      <template #body>
        <div v-if="selectedBooking" class="space-y-6">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div class="text-muted">Datum</div>
              <div class="font-medium">{{ formatDate(selectedBooking.scheduled_date) }}</div>
            </div>
            <div>
              <div class="text-muted">Tid</div>
              <div class="font-medium">{{ selectedBooking.scheduled_time }}</div>
            </div>
            <div>
              <div class="text-muted">Status</div>
              <UBadge :color="ballStatus(selectedBooking!).color" size="md">
                {{ ballStatus(selectedBooking!).label }}
              </UBadge>
            </div>
          </div>

          <div class="border-t border-default my-4"></div>

          <div class="space-y-4">
            <div v-for="(pm, playerId) in selectedBooking.player_messages" :key="playerId"
              class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="font-medium">{{ pm.player ? playerFullName(pm.player) : 'Okänd' }}</div>
              </div>

              <div class="space-y-3">
                <div v-for="msg in pm.messages" :key="msg.id" class="flex gap-3">
                  <div class="flex-1 p-3 rounded-2xl text-900"
                    :class="msg.direction === 'outgoing' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'">
                    <div class="flex items-center gap-2 mb-1">
                      <UIcon :name="msg.direction === 'outgoing' ? 'i-lucide-arrow-right' : 'i-lucide-arrow-left'"
                        class="w-4 h-4" :class="msg.direction === 'outgoing' ? 'text-blue-200' : 'text-green-200'" />
                      <span class="text-xs text-muted">
                        {{ msg.direction === 'outgoing' ? 'Skickat' : 'Svar' }}
                      </span>
                      <span class="text-xs text-muted ml-auto">
                        {{ formatDateTime(msg.sent_at) }}
                      </span>
                    </div>
                    <div class="text-sm">{{ msg.content }}</div>
                  </div>
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
import { playerFullName } from '~/utils'
interface Message {
  id: string
  direction: 'outgoing' | 'incoming'
  content: string
  sent_at: string
  response_received_at: string | null
  response: string | null
}

interface PlayerMessages {
  player: { id: string; first_name: string; last_name: string | null; phone: string }
  status: string
  response: string | null
  messages: Message[]
}

interface Booking {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  host_player_id: string
  player_messages: Record<string, PlayerMessages>
  message_count: number
  confirmed_count: number
  fill_status: 'green' | 'yellow' | 'red'
  invited_rounds: number
  max_rounds: number
}

const bookings = ref<Booking[]>([])
const selectedBooking = ref<Booking | null>(null)
const isModalOpen = ref(false)

function viewMessages(booking: Booking) {
  selectedBooking.value = booking
  isModalOpen.value = true
}

const columns = [
  { key: 'scheduled_date', accessorKey: 'scheduled_date', header: 'Datum' },
  { key: 'scheduled_time', accessorKey: 'scheduled_time', header: 'Tid' },
  { key: 'fill', accessorKey: 'fill', header: 'Platser' },
  { key: 'invites', accessorKey: 'invites', header: 'Inbjudningar' },
  { key: 'players', accessorKey: 'players', header: 'Spelare' },
  { key: 'message_count', accessorKey: 'message_count', header: 'Antal' },
  { key: 'actions', accessorKey: 'actions', header: 'Åtgärder' }
]

async function loadBookings() {
  const { data } = await useFetch('/api/admin/messages')
  if (data.value?.messages) {
    bookings.value = data.value.messages as Booking[]
  }
}

function formatDate(dateStr: string | undefined): string {
  return dateStr || ''
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('sv-SE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function bookingStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'yellow',
    confirmed: 'green',
    cancelled: 'red',
    completed: 'gray'
  }
  return colors[status] || 'gray'
}

function ballStatus(booking: Booking) {
  const count = booking.confirmed_count || 0
  if (count >= 4) return { label: 'Full boll', color: 'success' }
  if (count >= 2) return { label: 'Delvis full', color: 'warning' }
  return { label: 'Tom', color: 'error' }
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

function fillStatusColor(status: string) {
  const colors: Record<string, string> = {
    green: 'success',
    yellow: 'warning',
    red: 'error'
  }
  return colors[status] || 'neutral'
}

onMounted(loadBookings)
</script>
