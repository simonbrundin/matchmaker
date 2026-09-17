<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

interface Sport {
  id: string
  name: string
  slug: string
}

interface VenueResult {
  id: string
  name: string
  city?: string
  url: string
  system: "court22" | "matchi"
}

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
  default_capacity: z.number().min(1).default(4),
  default_court_duration_minutes: z.number().min(15).default(90),
  notes: z.string().optional(),
  is_active: z.boolean().default(true)
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

function openModal() {
  state.sport_id = ''
  state.name = ''
  state.booking_system = undefined
  state.city = ''
  state.address = ''
  state.court22_venue_id = ''
  state.court22_slug = ''
  state.matchi_url = ''
  state.matchi_facility_id = ''
  state.default_capacity = 4
  state.default_court_duration_minutes = 90
  state.notes = ''
  state.is_active = true
  open.value = true
}

defineExpose({ openModal })

function onVenueSelected(venue: VenueResult) {
  if (venue.system === 'court22') {
    state.booking_system = 'court22'
    state.court22_venue_id = venue.id
    // Extract slug from URL: https://www.court22.com/sv/venues/{id}/{slug}
    const slug = venue.url.split('/').pop() ?? venue.id
    state.court22_slug = slug
  } else {
    state.booking_system = 'matchi'
    state.matchi_facility_id = venue.id
    state.matchi_url = venue.url
  }
}

const toast = useToast()
const emit = defineEmits(['created'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/admin/halls', {
      method: 'POST',
      body: {
        ...state,
        booking_system: state.booking_system || null
      }
    })

    toast.add({
      title: 'Succé',
      description: `Hall "${state.name}" har skapats`,
      color: 'success'
    })
    open.value = false
    emit('created')
  } catch (err: any) {
    toast.add({
      title: 'Fel',
      description: err.data?.message || 'Kunde inte skapa hall',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Lägg till hall" description="Registrera en ny sportanläggning för bokningssystem">
    <UButton icon="i-lucide-plus" label="Lägg till hall" size="sm" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Sport" name="sport_id" required>
            <USelect v-model="state.sport_id" :items="sportOptions" class="w-full" placeholder="Välj sport" />
          </UFormField>

          <UFormField label="Bokningssystem" name="booking_system" description="Välj system för availability-kontroll">
            <USelect v-model="state.booking_system" :items="systemOptions" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Namn" name="name" required>
          <UInput v-model="state.name" placeholder="t.ex. Borlänge Padelcenter" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Stad" name="city">
            <UInput v-model="state.city" placeholder="Borlänge" class="w-full" />
          </UFormField>

          <UFormField label="Adress" name="address">
            <UInput v-model="state.address" placeholder="Storgatan 1" class="w-full" />
          </UFormField>
        </div>

        <template v-if="state.booking_system === 'court22'">
          <div class="flex gap-2 items-end">
            <div class="grid grid-cols-2 gap-3 flex-1">
              <UFormField label="Court22 venue-id" name="court22_venue_id">
                <UInput v-model="state.court22_venue_id" placeholder="UUID..." class="w-full" />
              </UFormField>
              <UFormField label="Court22 slug" name="court22_slug">
                <UInput v-model="state.court22_slug" placeholder="borlange-padelcenter" class="w-full" />
              </UFormField>
            </div>
            <UButton
              icon="i-lucide-search"
              label="Sök"
              variant="outline"
              size="sm"
              @click="searchModal?.openModal()"
            />
          </div>
          <p class="text-xs text-muted -mt-1">Sök efter en anläggning på Court22 för att auto-fylla fälten.</p>
        </template>

        <template v-if="state.booking_system === 'matchi'">
          <div class="flex gap-2 items-end">
            <div class="grid grid-cols-2 gap-3 flex-1">
              <UFormField label="Matchi facility-id" name="matchi_facility_id">
                <UInput v-model="state.matchi_facility_id" placeholder="t.ex. 531" class="w-full" />
              </UFormField>
              <UFormField label="Matchi URL" name="matchi_url">
                <UInput v-model="state.matchi_url" placeholder="https://www.matchi.se/..." class="w-full" />
              </UFormField>
            </div>
            <UButton
              icon="i-lucide-search"
              label="Sök"
              variant="outline"
              size="sm"
              @click="searchModal?.openModal()"
            />
          </div>
          <p class="text-xs text-muted -mt-1">Sök efter en anläggning på Matchi för att auto-fylla fälten.</p>
        </template>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Spelare/bokning" name="default_capacity">
            <UInput v-model.number="state.default_capacity" type="number" min="1" placeholder="4" class="w-full" />
          </UFormField>
          <UFormField label="Banlängd (min)" name="default_court_duration_minutes">
            <UInput v-model.number="state.default_court_duration_minutes" type="number" min="15" step="15" placeholder="90" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Anteckningar" name="notes">
          <UTextarea v-model="state.notes" :rows="2" placeholder="Intern info om hallen..." class="w-full" />
        </UFormField>

        <UFormField label="Aktiv" name="is_active">
          <UCheckbox v-model="state.is_active" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton label="Avbryt" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Skapa" color="primary" type="submit" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>

  <HallSearchModal ref="searchModal" @update:model-value="onVenueSelected" />
</template>
