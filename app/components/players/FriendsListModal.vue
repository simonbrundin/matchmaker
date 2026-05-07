<script setup lang="ts">
import { playerFullName } from '~/utils'

interface Player {
  id: string
  first_name: string
  last_name: string | null
  elo: number
}

const props = defineProps<{
  player: Player
}>()

const open = ref(false)
const currentPlayer = ref<Player | null>(null)
const friends = ref<Player[]>([])
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref<Player[]>([])
const isSearching = ref(false)

const toast = useToast()

function openModal(player: Player) {
  currentPlayer.value = player
  open.value = true
  loadFriends()
}

defineExpose({ openModal })

async function loadFriends() {
  if (!currentPlayer.value?.id) return
  loading.value = true
  try {
    const result = await $fetch<{ friends: Player[] }>(`/api/admin/players/${currentPlayer.value.id}/friends`)
    friends.value = result.friends || []
  } catch {
    toast.add({ title: 'Fel', description: 'Kunde inte ladda vänner', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function searchPlayers() {
  if (!currentPlayer.value?.id || searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const result = await $fetch<{ players: Player[] }>(`/api/admin/players/${currentPlayer.value.id}/friends`, {
      method: 'POST',
      body: { name: searchQuery.value.trim() }
    })
    searchResults.value = result.players || []
  } catch {
    toast.add({ title: 'Fel', description: 'Sökningen misslyckades', color: 'error' })
  } finally {
    isSearching.value = false
  }
}

let searchTimeout: NodeJS.Timeout

function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchPlayers, 300)
}

async function addFriend(friend: Player) {
  try {
    await $fetch(`/api/admin/players/${currentPlayer.value?.id}/friends/${friend.id}`, { method: 'PUT' })
    toast.add({ title: 'Succé', description: `${playerFullName(friend)} lades till som vän`, color: 'success' })
    searchQuery.value = ''
    searchResults.value = []
    loadFriends()
  } catch {
    toast.add({ title: 'Fel', description: 'Kunde inte lägga till vän', color: 'error' })
  }
}

async function removeFriend(friendId: string, friendName: string) {
  try {
    await $fetch(`/api/admin/players/${currentPlayer.value?.id}/friends/${friendId}`, { method: 'DELETE' })
    toast.add({ title: 'Succé', description: `${friendName} togs bort från vänner`, color: 'success' })
    loadFriends()
  } catch {
    toast.add({ title: 'Fel', description: 'Kunde inte ta bort vän', color: 'error' })
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="`Vänner för ${currentPlayer ? playerFullName(currentPlayer) : ''}`">
    <template #body>
      <div class="space-y-4">
        <UInput v-model="searchQuery" @update:model-value="onSearchInput" placeholder="Sök på namn..." icon="i-lucide-search">
          <template #trailing>
            <UButton v-if="searchQuery" icon="i-lucide-x" variant="ghost" size="xs" @click="searchQuery = ''; searchResults = []" />
          </template>
        </UInput>

        <div v-if="isSearching" class="text-center py-2 text-sm text-muted">Söker...</div>
        <div v-else-if="searchResults.length > 0" class="space-y-2">
          <div class="text-sm font-medium text-muted mb-2">Sökresultat</div>
          <div v-for="player in searchResults" :key="player.id" class="flex items-center justify-between p-2 rounded hover:bg-muted/50">
            <div>
              <div class="font-medium">{{ playerFullName(player) }}</div>
              <div class="text-sm text-muted">ELO {{ player.elo }}</div>
            </div>
            <UButton label="Lägg till" variant="outline" size="xs" @click="addFriend(player)" />
          </div>
        </div>
        <div v-if="searchResults.length === 0 && searchQuery.length >= 2 && !isSearching" class="text-center py-2 text-sm text-muted">Inga spelare hittades</div>

        <hr v-if="searchResults.length > 0" class="border-border" />

        <div v-if="loading" class="text-center py-4">Laddar...</div>
        <div v-else-if="friends.length > 0">
          <div class="text-sm font-medium text-muted mb-2">Nuvarande vänner ({{ friends.length }})</div>
          <div v-for="friend in friends" :key="friend.id" class="flex items-center justify-between p-2 rounded hover:bg-muted/50">
            <div>
              <div class="font-medium">{{ playerFullName(friend) }}</div>
              <div class="text-sm text-muted">ELO {{ friend.elo }}</div>
            </div>
            <UButton icon="i-lucide-x" variant="ghost" color="error" size="xs" @click="removeFriend(friend.id, playerFullName(friend))" />
          </div>
        </div>
        <div v-else class="text-center py-4 text-sm text-muted">Inga vänner ännu</div>
      </div>
    </template>
  </UModal>
</template>
