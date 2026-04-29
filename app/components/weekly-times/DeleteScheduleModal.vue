<script setup lang="ts">
interface ScheduleData {
  id: string
  player_name: string
  schedule: string
  time_display: string
}

const props = defineProps<{
  schedule?: ScheduleData
}>()

const open = ref(false)
const loading = ref(false)

function openModal(schedule: ScheduleData) {
  open.value = true
}

defineExpose({ openModal })

const toast = useToast()
const emit = defineEmits(['deleted'])

async function onDelete() {
  if (!props.schedule?.id) return

  loading.value = true
  try {
    await $fetch(`/api/admin/weekly-times/${props.schedule.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Succé',
      description: `Schema för ${props.schedule.player_name} har tagits bort`,
      color: 'success'
    })
    open.value = false
    emit('deleted')
  } catch (err: any) {
    toast.add({
      title: 'Fel',
      description: err.data?.message || 'Kunde inte ta bort schema',
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
    :title="`Ta bort schema`"
    :description="`Är du säker på att du vill ta bort schemat för ${props.schedule?.player_name}?`"
  >
    <template #body>
      <div class="py-4">
        <div v-if="props.schedule" class="text-sm text-muted">
          <div><span class="font-medium">{{ props.schedule.schedule }}</span> kl. {{ props.schedule.time_display }}</div>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <UButton
          label="Avbryt"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Ta bort"
          color="error"
          variant="solid"
          :loading="loading"
          @click="onDelete"
        />
      </div>
    </template>
  </UModal>
</template>
