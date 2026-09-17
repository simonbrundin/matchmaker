<script setup lang="ts">
interface HallData {
  id: string
  name: string
  city: string | null
}

const props = defineProps<{
  hall?: HallData
}>()

const open = ref(false)
const loading = ref(false)

function openModal(_hall: HallData) {
  open.value = true
}

defineExpose({ openModal })

const toast = useToast()
const emit = defineEmits(['deleted'])

async function onDelete() {
  if (!props.hall?.id) return

  loading.value = true
  try {
    await $fetch(`/api/admin/halls/${props.hall.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Succé',
      description: `Hall "${props.hall.name}" har tagits bort`,
      color: 'success'
    })
    open.value = false
    emit('deleted')
  } catch (err: any) {
    toast.add({
      title: 'Fel',
      description: err.data?.message || 'Kunde inte ta bort hall',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Ta bort hall"
    :description="`Är du säker på att du vill ta bort ${props.hall?.name}?`"
  >
    <template #body>
      <div class="py-4">
        <div v-if="props.hall" class="text-sm text-muted">
          <div>
            <span class="font-medium">{{ props.hall.name }}</span>
            <span v-if="props.hall.city"> ({{ props.hall.city }})</span>
          </div>
          <div class="mt-2 text-xs">
            Om hallen används av weekly_times måste du först avlänka dem. Annars avbryts borttagningen automatiskt.
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <UButton label="Avbryt" color="neutral" variant="subtle" @click="open = false" />
        <UButton label="Ta bort" color="error" variant="solid" :loading="loading" @click="onDelete" />
      </div>
    </template>
  </UModal>
</template>
