<script setup lang="ts">
import { playerFullName } from '~/utils'

interface Message {
  id: string
  booking_id: string | null
  player_id: string
  direction: 'incoming' | 'outgoing'
  content: string
  sent_at: string
  response_received_at: string | null
  response: string | null
  scheduled_date?: string
  scheduled_time?: string
}

interface Player {
  id: string
  first_name: string
  last_name: string | null
  phone: string
  elo: number
}

interface MessagesResponse {
  messages: Message[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const props = defineProps<{
  player: Player
}>()

const emit = defineEmits<{
  close: []
}>()

const messages = ref<Message[]>([])
const isLoading = ref(false)
const activeTab = ref<'all' | 'incoming' | 'outgoing'>('all')
const hasMore = ref(false)
const total = ref(0)

const tabs = [
  { key: 'all', label: 'Alla' },
  { key: 'incoming', label: 'Inkommande' },
  { key: 'outgoing', label: 'Utgående' }
]

async function loadMessages(direction?: 'incoming' | 'outgoing') {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('limit', '50')
    if (direction && direction !== 'all') {
      params.set('direction', direction)
    }
    
    const result = await $fetch<MessagesResponse>(
      `/api/admin/players/${props.player.id}/messages?${params.toString()}`
    )
    
    messages.value = result.messages
    total.value = result.total
    hasMore.value = result.hasMore
  } catch (error) {
    console.error('Failed to load messages:', error)
    messages.value = []
  } finally {
    isLoading.value = false
  }
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('sv-SE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: '2-digit'
  })
}

function groupByDate(msgs: Message[]): Record<string, Message[]> {
  const grouped: Record<string, Message[]> = {}
  for (const msg of msgs) {
    const dateKey = formatDate(msg.sent_at)
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(msg)
  }
  return grouped
}

watch(activeTab, (newTab) => {
  const direction = newTab === 'all' ? undefined : newTab as 'incoming' | 'outgoing'
  loadMessages(direction)
})

onMounted(() => {
  loadMessages()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold">Meddelanden</h2>
          <p class="text-muted">
            {{ playerFullName(player) }} &bull; {{ player.phone }}
          </p>
        </div>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          size="sm"
          @click="emit('close')"
        />
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-4 border-b border-default">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-4 py-2 text-sm font-medium transition-colors -mb-px"
        :class="activeTab === tab.key
          ? 'border-b-2 border-primary-500 text-primary-600'
          : 'text-muted hover:text-foreground'"
        @click="activeTab = tab.key as typeof activeTab"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'all'" class="ml-1 text-xs">({{ total }})</span>
      </button>
    </div>

    <!-- Messages -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <LoadingState label="Laddar meddelanden..." />
    </div>

    <div v-else-if="messages.length === 0" class="text-center py-12 text-muted">
      <UIcon name="i-lucide-message-circle" class="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Inga meddelanden hittades</p>
    </div>

    <div v-else class="space-y-4 max-h-[60vh] overflow-y-auto">
      <template v-for="(dayMessages, date) in groupByDate(messages)" :key="date">
        <!-- Date separator -->
        <div class="text-xs text-muted font-medium sticky top-0 bg-background py-2">
          {{ date }}
        </div>

        <!-- Messages for this date -->
        <div class="space-y-3">
          <div
            v-for="msg in dayMessages"
            :key="msg.id"
            class="flex gap-3"
          >
            <!-- Direction indicator -->
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              :class="msg.direction === 'outgoing' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'"
            >
              <UIcon
                :name="msg.direction === 'outgoing' ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-left'"
                class="w-4 h-4"
              />
            </div>

            <!-- Message bubble -->
            <div class="flex-1 min-w-0">
              <div
                class="p-3 rounded-2xl"
                :class="msg.direction === 'outgoing'
                  ? 'bg-blue-600 text-white rounded-tl-sm'
                  : 'bg-green-600 text-white rounded-tr-sm'"
              >
                <p class="text-sm whitespace-pre-wrap break-words">{{ msg.content }}</p>
              </div>

              <!-- Meta info -->
              <div class="flex items-center gap-2 mt-1 text-xs text-muted">
                <span>{{ new Date(msg.sent_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) }}</span>
                <span v-if="msg.booking_id && msg.scheduled_date" class="text-muted">
                  &bull; Booking {{ formatDate(msg.scheduled_date) }} {{ msg.scheduled_time }}
                </span>
                <span v-if="msg.direction === 'outgoing' && msg.response_received_at" class="text-green-600">
                  &bull; Svar {{ formatDateTime(msg.response_received_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Load more indicator -->
    <div v-if="hasMore" class="text-center pt-4">
      <UButton variant="ghost" size="sm" disabled>
        Laddar fler...
      </UButton>
    </div>
  </div>
</template>
