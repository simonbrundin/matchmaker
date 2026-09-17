<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

interface Sport {
  id: string
  name: string
  slug: string
}

interface HallData {
  id: string
  sport_id: string
  name: string
  booking_system: 'court22' | 'matchi' | null
  city: string | null
  address: string | null
  court22_venue_id: string | null
  court22_slug: string | null
  matchi_url: string | null
  matchi_facility_id: string | null
  default_capacity: number
  default_court_duration_minutes: number
  notes: string | null
  is_active: boolean
  sport?: Sport | null
}

interface VenueResult {
  id: string
  name: string
  city?: string
  url: string
  system: "court22" | "matchi"
}

const props = defineProps<{
  hall?: HallData
}>()

const open = ref(false)
const loading = ref(false)
const searchModal = ref<{ openModal: () => void } | null>(null)

const { data: sportsData } = await useFetch<{ sports: Sport[] }>('/api/admin/sports', { default: () => ({ sports: [] }) })

const schema = z.object({
  sport_id: z.string().min(1, 'Välj en sport'),
  name: z.string().min(1, 'Ange hallens namn'),
  booking_system: z.enum(['court22', 'matchi']).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  court22_venue_id: z.string().optional(),
  court22_slug: z.string().optional(),
  matchi_url: z.string().optional(),
  matchi_facility_id: z.string().optional(),
  default_capacity: z.number().min(1),
  default_court_duration_minutes: z.number().min(15),
  notes: z.string().optional(),
  is_active: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  sport_id: '',
  name: '',
  booking_system: undefined,
  city: '',
  address: '',
  court22_venue_id: '',
  court22_slug: '',
  matchi_url: '',
  matchi_facility_id: '',
  default_capacity: 4,
  default_court_duration_minutes: 90,
  notes: '',
  is_active: true
})

const sportOptions = computed(() =>
  (sportsData.value?.sports ?? []).map((s) => ({ value: s.id, label: s.name }))
)

const systemOptions = [
  { value: 'court22', label: 'Court22' },
  { value: 'matchi', label: 'Matchi' }
]

function openModal(hall: HallData) {
  state.sport_id = hall.sport_id
  state.name = hall.name
  state.booking_system = hall.booking_system ?? undefined
  state.city = hall.city ?? ''
  state.address = hall.address ?? ''
  state.court22_venue_id = hall.court22_venue_id ?? ''
  state.court22_slug = hall.court22_slug ?? ''
  state.matchi_url = hall.matchi_url ?? ''
  state.matchi_facility_id = hall.matchi_facility_id ?? ''
  state.default_capacity = hall.default_capacity
  state.default_court_duration_minutes = hall.default_court_duration_minutes
  state.notes = hall.notes ?? ''
  state.is_active = hall.is_active
  open.value = true
}

defineExpose({ openModal })

function onVenueSelected(venue: VenueResult) {
  // Only auto-fill if the venue's system matches the hall's current booking system
  // (or if the hall has no booking system set yet)
  if (!state.booking_system || venue.system === state.booking_system) {
    if (venue.system === 'court22') {
      state.booking_system = 'court22'
      state.court22_venue_id = venue.id
      state.court22_slug = venue.url.split('/').pop() ?? venue.id
    } else {
      state.booking_system = 'matchi'
      state.matchi_facility_id = venue.id
      state.matchi_url = venue.url
    }
  } else {
    // Venue system differs from current — just update the ID fields
    if (venue.system === 'court22') {
      state.court22_venue_id = venue.id
      state.court22_slug = venue.url.split('/').pop() ?? venue.id
    } else {
      state.matchi_facility_id = venue.id
      state.matchi_url = venue.url
    }
  }
}

const toast = useToast()
const emit = defineEmits(['updated'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.hall?.id) return
  loading.value = true
  try {
    await $fetch(`/api/admin/halls/${props.hall.id}`, {
      method: 'PUT',
      body: {
        ...state,
        booking_system: state.booking_system || null
      }
    })

    toast.add({
      title: 'Succé',
      description: `Hall "${state.name}" har uppdaterats`,
      color: 'success'
    })
    open.value = false
    emit('updated')
  } catch (err: any) {
    toast.add({
      title: 'Fel',
      description: err.data?.message || 'Kunde inte uppdatera hall',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Redigera hall" description="Uppdatera hallinformation">
    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Sport" name="sport_id" required>
            <USelect v-model="state.sport_id" :items="sportOptions" class="w-full" placeholder="Välj sport" />
          </UFormField>
          <UFormField label="Bokningssystem" name="booking_system">
            <USelect v-model="state.booking_system" :items="systemOptions" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Namn" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Stad" name="city">
            <UInput v-model="state.city" class="w-full" />
          </UFormField>
          <UFormField label="Adress" name="address">
            <UInput v-model="state.address" class="w-full" />
          </UFormField>
        </div>

        <template v-if="state.booking_system === 'court22'">
          <div class="flex gap-2 items-end">
            <div class="grid grid-cols-2 gap-3 flex-1">
              <UFormField label="Court22 venue-id" name="court22_venue_id">
                <UInput v-model="state.court22_venue_id" class="w-full" />
              </UFormField>
              <UFormField label="Court22 slug" name="court22_slug">
                <UInput v-model="state.court22_slug" class="w-full" />
              </UFormField>
            </div>
            <UButton icon="i-lucide-search" label="Sök" variant="outline" size="sm" @click="searchModal?.openModal()" />
          </div>
          <p class="text-xs text-muted -mt-1">Sök efter en anläggning på Court22 för att auto-fylla fälten.</p>
        </template>

        <template v-if="state.booking_system === 'matchi'">
          <div class="flex gap-2 items-end">
            <div class="grid grid-cols-2 gap-3 flex-1">
              <UFormField label="Matchi facility-id" name="matchi_facility_id">
                <UInput v-model="state.matchi_facility_id" class="w-full" />
              </UFormField>
              <UFormField label="Matchi URL" name="matchi_url">
                <UInput v-model="state.matchi_url" class="w-full" />
              </UFormField>
            </div>
            <UButton icon="i-lucide-search" label="Sök" variant="outline" size="sm" @click="searchModal?.openModal()" />
          </div>
          <p class="text-xs text-muted -mt-1">Sök efter en anläggning på Matchi för att auto-fylla fälten.</p>
        </template>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Spelare/bokning" name="default_capacity">
            <UInput v-model.number="state.default_capacity" type="number" min="1" class="w-full" />
          </UFormField>
          <UFormField label="Banlängd (min)" name="default_court_duration_minutes">
            <UInput v-model.number="state.default_court_duration_minutes" type="number" min="15" step="15" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Anteckningar" name="notes">
          <UTextarea v-model="state.notes" :rows="2" class="w-full" />
        </UFormField>

        <UFormField label="Aktiv" name="is_active">
          <UCheckbox v-model="state.is_active" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton label="Avbryt" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Spara" color="primary" type="submit" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>

  <HallSearchModal ref="searchModal" @update:model-value="onVenueSelected" />
</template>
