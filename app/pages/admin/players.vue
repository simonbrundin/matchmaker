<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Spelare</h1>
        <p class="text-muted">Hantera spelare i systemet</p>
      </div>
      <UButton label="Lägg till spelare" icon="i-lucide-plus" @click="showAddModal = true" />
    </div>

    <div class="mb-4">
      <UInput
        v-model="search"
        @update:model-value="debouncedSearch"
        placeholder="Sök på namn eller telefon..."
        icon="i-lucide-search"
      >
        <template #trailing>
          <UButton
            v-if="search"
            icon="i-lucide-x"
            variant="ghost"
            size="xs"
            @click="search = ''; loadPlayers()"
          />
        </template>
      </UInput>
    </div>

    <UCard>
      <UTable :data="players" :columns="columns">
        <template #elo-cell="{ row }">
          <UBadge color="primary" variant="subtle">{{ row.elo }}</UBadge>
        </template>
        <template #is_active-cell="{ row }">
          <UBadge :color="row.is_active ? 'green' : 'red'" variant="subtle">
            {{ row.is_active ? 'Aktiv' : 'Inaktiv' }}
          </UBadge>
        </template>
        <template #total_matches_played-cell="{ row }">
          {{ row.total_matches_played || 0 }}
        </template>
        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton
              :icon="row.is_active ? 'i-lucide-user-x' : 'i-lucide-user-check'"
              variant="ghost"
              size="xs"
              @click="toggleActive(row)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              @click="deletePlayer(row)"
            />
          </div>
        </template>
      </UTable>
      <div v-if="players.length === 0" class="text-center py-8 text-muted">
        Inga spelare hittades
      </div>
    </UCard>

    <UModal v-model="showAddModal" title="Lägg till spelare">
      <div class="p-4 space-y-4">
        <UFormField label="Namn">
          <UInput v-model="newPlayer.name" placeholder="Förnamn Efternamn" />
        </UFormField>
        <UFormField label="Telefon">
          <UInput v-model="newPlayer.phone" placeholder="+46701234567" />
        </UFormField>
        <UFormField label="ELO">
          <UInput v-model.number="newPlayer.elo" type="number" placeholder="1200" />
        </UFormField>
      </div>

      <template #footer>
        <UButton label="Avbryt" variant="outline" @click="showAddModal = false" />
        <UButton label="Lägg till" color="primary" @click="addPlayer" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface Player {
  id: string
  name: string
  phone: string
  elo: number
  is_active: boolean
  total_matches_played: number
}

const players = ref<Player[]>([])
const search = ref('')
const showAddModal = ref(false)
const newPlayer = ref({ name: '', phone: '', elo: 1200 })

const columns = [
  { key: 'name', accessorKey: 'name', label: 'Namn' },
  { key: 'phone', accessorKey: 'phone', label: 'Telefon' },
  { key: 'elo', accessorKey: 'elo', label: 'ELO' },
  { key: 'is_active', accessorKey: 'is_active', label: 'Status' },
  { key: 'total_matches_played', accessorKey: 'total_matches_played', label: 'Matcher' },
  { key: 'actions', accessorKey: 'actions', label: '' }
]

let searchTimeout: NodeJS.Timeout

async function loadPlayers() {
  const query = search.value ? `?search=${search.value}` : ''
  const { data } = await useFetch(`/api/admin/players${query}`)
  if (data.value?.players) {
    players.value = data.value.players as Player[]
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadPlayers, 300)
}

async function addPlayer() {
  await useFetch('/api/admin/players', {
    method: 'POST',
    body: newPlayer.value
  })
  showAddModal.value = false
  newPlayer.value = { name: '', phone: '', elo: 1200 }
  loadPlayers()
}

async function toggleActive(player: Player) {
  await useFetch(`/api/admin/players/${player.id}`, {
    method: 'PUT',
    body: { is_active: !player.is_active }
  })
  loadPlayers()
}

async function deletePlayer(player: Player) {
  if (!confirm(`Ta bort ${player.name}?`)) return
  await useFetch(`/api/admin/players/${player.id}`, { method: 'DELETE' })
  loadPlayers()
}

onMounted(loadPlayers)
</script>