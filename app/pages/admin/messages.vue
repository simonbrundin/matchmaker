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
          <span
            class="inline-flex items-center justify-center w-12 h-8 rounded-full text-sm font-bold"
            :class="fillBgClass((row.original ?? row).fill_status)"
          >
            {{ (row.original ?? row).confirmed_count }}/4
          </span>
        </template>
        <template #players-cell="{ row }">
          <div class="flex flex-col gap-1">
            <div
              v-for="(pm, playerId) in (row.original ?? row).player_messages"
              :key="playerId"
              class="flex items-center gap-2"
            >
              <UBadge :color="playerStatusColor(pm.status)" variant="subtle" size="xs">
                {{ pm.player ? playerFullName(pm.player) : 'Okänd' }}
              </UBadge>
              <span v-if="pm.response" class="text-xs text-muted">
                ({{ pm.response }})
              </span>
            </div>
          </div>
        </template>
        <template #message_count-cell="{ row }">
          <UBadge color="blue" variant="soft" size="sm">
            {{ (row.original ?? row).message_count }} meddelanden
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <UButton icon="i-lucide-eye" variant="ghost" size="xs" @click="viewMessages(row.original ?? row)" />
        </template>
      </UTable>
      <div v-if="bookings.length === 0" class="text-center py-8 text-muted">
        Inga meddelanden hittades
      </div>
    </UCard>

    <UModal v-model="selectedBooking" title="Meddelanden" :ui="{ width: 'max-w-2xl' }">
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
            <UBadge :color="bookingStatusColor(selectedBooking.status)" size="xs">
              {{ selectedBooking.status }}
            </UBadge>
          </div>
        </div>

        <div class="border-t border-default my-4"></div>

        <div class="space-y-4">
          <div
            v-for="(pm, playerId) in selectedBooking.player_messages"
            :key="playerId"
            class="border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="font-medium">{{ pm.player ? playerFullName(pm.player) : 'Okänd' }}</div>
              <div class="flex items-center gap-2">
                <UBadge :color="playerStatusColor(pm.status)" size="xs">{{ pm.status }}</UBadge>
                <span v-if="pm.response" class="text-sm text-muted">Svar: {{ pm.response }}</span>
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="msg in pm.messages"
                :key="msg.id"
                class="flex gap-3"
              >
                <div
                  class="flex-1 p-3 rounded-lg"
                  :class="msg.direction === 'outgoing' ? 'bg-blue-50' : 'bg-green-50'"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <UIcon
                      :name="msg.direction === 'outgoing' ? 'i-lucide-arrow-right' : 'i-lucide-arrow-left'"
                      class="w-4 h-4"
                      :class="msg.direction === 'outgoing' ? 'text-blue-500' : 'text-green-500'"
                    />
                    <span class="text-xs text-muted">
                      {{ msg.direction === 'outgoing' ? 'Skickat' : 'Svar' }}
                    </span>
                    <span class="text-xs text-muted ml-auto">
                      {{ formatDateTime(msg.sent_at) }}
                    </span>
                  </div>
                  <div class="text-sm">{{ msg.content }}</div>
                  <div v-if="msg.response && msg.direction === 'outgoing'" class="mt-2 pt-2 border-t text-sm">
                    <span class="text-muted">Svar: </span>
                    <span class="font-medium">{{ msg.response }}</span>
                  </div>
                </div>
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
}

const bookings = ref<Booking[]>([])
const selectedBooking = ref<Booking | null>(null)

const columns = [
  { id: 'scheduled_date', key: 'scheduled_date', label: 'Datum' },
  { id: 'scheduled_time', key: 'scheduled_time', label: 'Tid' },
  { id: 'fill', key: 'fill', label: 'Fyllning' },
  { id: 'players', key: 'players', label: 'Spelare' },
  { id: 'message_count', key: 'message_count', label: 'Antal' },
  { id: 'actions', key: 'actions', label: '' }
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

function playerStatusColor(status: string) {
  const colors: Record<string, string> = {
    confirmed: 'green',
    invited: 'yellow',
    declined: 'red',
    waitlist: 'gray'
  }
  return colors[status] || 'gray'
}

function fillBgClass(status: string) {
  const classes: Record<string, string> = {
    green: 'bg-green-500 text-white font-bold',
    yellow: 'bg-yellow-500 text-black font-bold',
    red: 'bg-red-600 text-white font-bold'
  }
  return classes[status] || 'bg-gray-500 text-white'
}

function viewMessages(booking: Booking) {
  selectedBooking.value = booking
}

onMounted(loadBookings)
</script>