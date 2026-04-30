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
      <UInput v-model="search" @update:model-value="debouncedSearch" placeholder="Sök på namn eller telefon..."
        icon="i-lucide-search">
        <template #trailing>
          <UButton v-if="search" icon="i-lucide-x" variant="ghost" size="xs" @click="search = ''; loadPlayers()" />
        </template>
      </UInput>
    </div>

    <UCard>
      <UTable v-model:sorting="sorting" :data="players" :columns="columns">
        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton label="Redigera" variant="outline" size="xs" @click="openEditModal(row)" />
            <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="xs" @click="openDeleteModal(row)" />
          </div>
        </template>
      </UTable>
      <div v-if="players.length === 0" class="text-center py-8 text-muted">
        Inga spelare hittades
      </div>
    </UCard>

    <UModal v-model:open="showAddModal" title="Lägg till spelare">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Förnamn">
            <UInput v-model="newPlayer.first_name" placeholder="Förnamn" />
          </UFormField>
          <UFormField label="Efternamn">
            <UInput v-model="newPlayer.last_name" placeholder="Efternamn (valfritt)" />
          </UFormField>
          <UFormField label="Telefon">
            <UInput v-model="newPlayer.phone" placeholder="+46701234567" />
          </UFormField>
          <UFormField label="ELO">
            <UInput v-model="newPlayer.elo" type="number" placeholder="1200" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <UButton label="Avbryt" variant="outline" @click="showAddModal = false" />
        <UButton label="Lägg till" color="primary" @click="addPlayer" />
      </template>
    </UModal>

    <UModal v-model:open="showEditModal" title="Redigera spelare">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Förnamn">
            <UInput v-model="editData.first_name" placeholder="Förnamn" />
          </UFormField>
          <UFormField label="Efternamn">
            <UInput v-model="editData.last_name" placeholder="Efternamn (valfritt)" />
          </UFormField>
          <UFormField label="Telefon">
            <UInput v-model="editData.phone" placeholder="+46701234567" />
          </UFormField>
          <UFormField label="ELO">
            <UInput v-model="editData.elo" type="number" placeholder="1200" />
          </UFormField>
          <UFormField label="Aktiv">
            <USwitch v-model="editData.is_active" @click.stop />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <UButton label="Avbryt" variant="outline" type="button" @click="showEditModal = false" />
        <UButton label="Spara" color="primary" type="button" @click="saveEdit" />
      </template>
    </UModal>

    <PlayersDeleteModal ref="deleteModal" :player="deleteData" @deleted="loadPlayers" />
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { playerFullName } from '~/utils'

interface Player {
  id: string
  first_name: string
  last_name: string | null
  phone: string
  elo: number
  is_active: boolean
  total_matches_played: number
}

const players = ref<Player[]>([])
const search = ref('')
const sorting = ref<{ id: string; desc: boolean }[]>([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const deleteModal = ref()
const deleteData = ref<{ id: string; name: string }>()
const newPlayer = ref({ first_name: '', last_name: '', phone: '', elo: 1200 })
const editData = reactive({ id: '', first_name: '', last_name: '', phone: '', elo: 1200, is_active: true })

const columns: ColumnDef<Player>[] = [
  {
    accessorFn: (row: Player) => playerFullName(row),
    id: 'name',
    enableSorting: true,
    header: ({ column }) => h(resolveComponent('UButton'), {
      variant: 'ghost',
      onClick: () => { column.toggleSorting() },
      label: 'Namn',
      trailingIcon: column.getIsSorted() === 'asc'
        ? 'i-lucide-arrow-up'
        : column.getIsSorted() === 'desc'
          ? 'i-lucide-arrow-down'
          : 'i-lucide-arrow-up-down'
    }),
    cell: ({ row }) => playerFullName(row.original)
  },
  {
    accessorKey: 'phone',
    enableSorting: true,
    header: ({ column }) => h(resolveComponent('UButton'), {
      variant: 'ghost',
      onClick: () => column.toggleSorting(),
      label: 'Telefon',
      trailingIcon: column.getIsSorted() === 'asc'
        ? 'i-lucide-arrow-up'
        : column.getIsSorted() === 'desc'
          ? 'i-lucide-arrow-down'
          : 'i-lucide-arrow-up-down'
    })
  },
  {
    accessorKey: 'elo',
    enableSorting: true,
    header: ({ column }) => h(resolveComponent('UButton'), {
      variant: 'ghost',
      onClick: () => column.toggleSorting(),
      label: 'ELO',
      trailingIcon: column.getIsSorted() === 'asc'
        ? 'i-lucide-arrow-up'
        : column.getIsSorted() === 'desc'
          ? 'i-lucide-arrow-down'
          : 'i-lucide-arrow-up-down'
    })
  },
  {
    accessorKey: 'is_active',
    enableSorting: true,
    header: ({ column }) => h(resolveComponent('UButton'), {
      variant: 'ghost',
      onClick: () => column.toggleSorting(),
      label: 'Status',
      trailingIcon: column.getIsSorted() === 'asc'
        ? 'i-lucide-arrow-up'
        : column.getIsSorted() === 'desc'
          ? 'i-lucide-arrow-down'
          : 'i-lucide-arrow-up-down'
    }),
    cell: ({ row }) => h(resolveComponent('UBadge'), {
      color: row.original.is_active ? 'success' : 'error',
      variant: 'subtle',
      size: 'xs'
    }, () => row.original.is_active ? 'Aktiv' : 'Inaktiv')
  },
  {
    accessorKey: 'total_matches_played',
    enableSorting: true,
    header: ({ column }) => h(resolveComponent('UButton'), {
      variant: 'ghost',
      onClick: () => column.toggleSorting(),
      label: 'Matcher',
      trailingIcon: column.getIsSorted() === 'asc'
        ? 'i-lucide-arrow-up'
        : column.getIsSorted() === 'desc'
          ? 'i-lucide-arrow-down'
          : 'i-lucide-arrow-up-down'
    }),
    cell: ({ row }) => row.original.total_matches_played || 0
  },
  {
    accessorKey: 'actions',
    header: ''
  }
]

let searchTimeout: NodeJS.Timeout

async function loadPlayers() {
  const params = new URLSearchParams()
  if (search.value) params.set('search', search.value)
  if (sorting.value.length > 0) {
    const s = sorting.value[0]
    const keyToColumn: Record<string, string> = {
      name: 'last_name',
      phone: 'phone',
      elo: 'elo',
      is_active: 'is_active',
      total_matches_played: 'total_matches_played'
    }
    params.set('sort', keyToColumn[s.id] || 'last_name')
    params.set('direction', s.desc ? 'desc' : 'asc')
  }
  const result = await $fetch<{ players: Player[] }>(`/api/admin/players?${params.toString()}`)
  if (result?.players) {
    players.value = result.players
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadPlayers, 300)
}

async function addPlayer() {
  await $fetch('/api/admin/players', {
    method: 'POST',
    body: {
      first_name: newPlayer.value.first_name,
      last_name: newPlayer.value.last_name || null,
      phone: newPlayer.value.phone,
      elo: newPlayer.value.elo
    }
  })
  showAddModal.value = false
  newPlayer.value = { first_name: '', last_name: '', phone: '', elo: 1200 }
  loadPlayers()
}

function openDeleteModal(row: any) {
  const player = row.original || row
  deleteData.value = { id: player.id, name: playerFullName(player) }
  deleteModal.value?.openModal(deleteData.value)
}

function editPlayer(row: any) {
  const player = row.original || row
  editData.id = String(player.id)
  editData.first_name = String(player.first_name || '')
  editData.last_name = player.last_name != null ? String(player.last_name) : ''
  editData.phone = player.phone != null ? String(player.phone) : ''
  editData.elo = player.elo != null ? Number(player.elo) : ''
  editData.is_active = Boolean(player.is_active)
  showEditModal.value = true
}

function openEditModal(row: any) {
  editPlayer(row)
}

async function saveEdit() {
  try {
    const payload: any = {
      first_name: editData.first_name,
      last_name: editData.last_name || null,
      phone: editData.phone || null,
      elo: editData.elo === '' ? null : editData.elo,
      is_active: editData.is_active
    }
    const result = await $fetch(`/api/admin/players/${editData.id}`, {
      method: 'PUT',
      body: payload
    })
    showEditModal.value = false
    loadPlayers()
  } catch (err: any) {
    console.error('Failed to save:', err)
    const message = err?.data?.message || err?.message || 'Okänt fel'
    alert('Kunde inte spara: ' + message)
  }
}

onMounted(loadPlayers)

watch(sorting, () => {
  loadPlayers()
}, { deep: true })
</script>