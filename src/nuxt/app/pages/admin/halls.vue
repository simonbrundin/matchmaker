<script setup lang="ts">
import AddHallModal from '~/components/halls/AddHallModal.vue'
import EditHallModal from '~/components/halls/EditHallModal.vue'
import DeleteHallModal from '~/components/halls/DeleteHallModal.vue'
import AvailabilityModal from '~/components/halls/AvailabilityModal.vue'

definePageMeta({ layout: 'default' })

interface Hall {
  id: string
  sport_id: string
  name: string
  booking_system: 'court22' | 'matchi' | null
  slug: string | null
  city: string | null
  address: string | null
  court22_venue_id: string | null
  court22_slug: string | null
  matchi_url: string | null
  matchi_facility_id: string | null
  default_capacity: number
  default_court_duration_minutes: number
  is_active: boolean
  notes: string | null
  sport?: { id: string; name: string; slug: string } | null
}

interface Sport {
  id: string
  name: string
  slug: string
}

const isLoading = ref(false)
const halls = ref<Hall[]>([])
const sports = ref<Sport[]>([])
const sportFilter = ref<string | null>(null)
const statusFilter = ref<'all' | 'active' | 'inactive'>('active')
const addModal = ref<any>(null)
const editModal = ref<any>(null)
const deleteModal = ref<any>(null)
const availabilityModal = ref<any>(null)
const selectedHall = ref<Hall | null>(null)
const key = ref(0)

const columns = computed(() => [
  { id: 'name', header: 'Namn', accessorKey: 'name' },
  { id: 'sport', header: 'Sport', accessorKey: 'sport_name' },
  { id: 'city', header: 'Stad', accessorKey: 'city' },
  { id: 'capacity', header: 'Kapacitet', accessorKey: 'capacity' },
  { id: 'duration', header: 'Banlängd', accessorKey: 'duration' },
  { id: 'booking_system', header: 'System', accessorKey: 'booking_system' },
  { id: 'court22', header: 'Koppling', accessorKey: 'court22' },
  {
    id: 'is_active',
    header: 'Status',
    accessorKey: 'is_active',
    cell: ({ row }: any) =>
      (row.original?.is_active ?? row.is_active) ? 'Aktiv' : 'Inaktiv'
  },
  { id: 'actions', header: '', accessorKey: 'actions' }
])

async function loadData() {
  isLoading.value = true
  try {
    const [hallsRes, sportsRes] = await Promise.all([
      $fetch<{ halls: Hall[] }>('/api/admin/halls'),
      $fetch<{ sports: Sport[] }>('/api/admin/sports')
    ])
    sports.value = sportsRes.sports

    halls.value = hallsRes.halls
      .filter((h) => {
        if (sportFilter.value && h.sport_id !== sportFilter.value) return false
        if (statusFilter.value === 'active' && !h.is_active) return false
        if (statusFilter.value === 'inactive' && h.is_active) return false
        return true
      })
      .map((h) => ({
        ...h,
        sport_name: h.sport?.name || '—',
        capacity: `${h.default_capacity} spelare`,
        duration: `${h.default_court_duration_minutes} min`,
        booking_system: h.booking_system || null,
        court22: (h.booking_system === 'court22' ? h.court22_slug || h.court22_venue_id : h.booking_system === 'matchi' ? h.matchi_facility_id || 'Matchi' : '—')
      }))
    key.value++
  } finally {
    isLoading.value = false
  }
}

watch([sportFilter, statusFilter], loadData)

onMounted(loadData)

const sportFilterOptions = computed(() => [
  { value: null, label: 'Alla sporter' },
  ...sports.value.map((s) => ({ value: s.id, label: s.name }))
])

function openEditModal(row: any) {
  const hall: Hall = row.original || row
  selectedHall.value = hall
  nextTick(() => editModal.value?.openModal(hall))
}

function openDeleteModal(row: any) {
  const hall: Hall = row.original || row
  selectedHall.value = hall
  nextTick(() => deleteModal.value?.openModal(hall))
}

function openAvailabilityModal(row: any) {
  const hall: Hall = row.original || row
  selectedHall.value = hall
  nextTick(() => availabilityModal.value?.openModal(hall))
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Hallar</h1>
        <p class="text-muted">Sportanläggningar för Court22-bokningar</p>
      </div>
      <AddHallModal ref="addModal" @created="loadData" />
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6">
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-primary">
            {{ halls.filter((h) => h.is_active).length }}
          </div>
          <div class="text-sm text-muted">Aktiva hallar</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-500">{{ sports.length }}</div>
          <div class="text-sm text-muted">Sporter registrerade</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-500">
            {{ halls.filter((h) => h.court22_slug || h.court22_venue_id).length }}
          </div>
          <div class="text-sm text-muted">Kopplade till Court22</div>
        </div>
      </UCard>
    </div>

    <UCard>
      <div class="flex gap-4 mb-4">
        <div class="flex-1">
          <USelect
            v-model="sportFilter"
            :items="sportFilterOptions"
            placeholder="Filtrera på sport"
            class="w-full"
          />
        </div>
        <div class="flex-1">
          <USelect
            v-model="statusFilter"
            :items="[
              { value: 'active', label: 'Endast aktiva' },
              { value: 'inactive', label: 'Endast inaktiva' },
              { value: 'all', label: 'Alla' }
            ]"
            class="w-full"
          />
        </div>
      </div>

      <LoadingState v-if="isLoading" label="Laddar hallar..." />
      <UTable
        v-else
        :key="key"
        :data="halls"
        :columns="columns"
        :row-key="(row: any) => row.id"
      >
        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton
              v-if="['court22', 'matchi'].includes(row.original?.booking_system ?? row.booking_system)"
              icon="i-lucide-calendar-check"
              variant="outline"
              size="xs"
              label="Lediga tider"
              @click="openAvailabilityModal(row)"
            />
            <UButton
              label="Redigera"
              variant="outline"
              size="xs"
              @click="openEditModal(row)"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              @click="openDeleteModal(row)"
            />
          </div>
        </template>
      </UTable>
      <div v-if="!isLoading && halls.length === 0" class="text-center py-8 text-muted">
        Inga hallar hittades. Lägg till din första hall ovan.
      </div>
    </UCard>

    <AvailabilityModal
      v-if="selectedHall"
      ref="availabilityModal"
      :hall="selectedHall"
    />
    <EditHallModal
      v-if="selectedHall"
      ref="editModal"
      :hall="selectedHall"
      @updated="loadData"
    />
    <DeleteHallModal
      v-if="selectedHall"
      ref="deleteModal"
      :hall="selectedHall"
      @deleted="loadData"
    />
  </div>
</template>
