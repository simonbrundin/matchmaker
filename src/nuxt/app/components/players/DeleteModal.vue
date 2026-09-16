<script setup lang="ts">
interface PlayerData {
  id: string
  name: string
}

const props = defineProps<{
  player?: PlayerData
}>()

const open = ref(false)
const loading = ref(false)

function openModal(player: PlayerData) {
  open.value = true
}

defineExpose({ openModal })

const toast = useToast()
const emit = defineEmits(['deleted'])

async function onDelete() {
  if (!props.player?.id) return

  loading.value = true
  try {
    await $fetch(`/api/admin/players/${props.player.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Succé',
      description: `${props.player.name} har tagits bort`,
      color: 'success'
    })
    open.value = false
    emit('deleted')
  } catch (err: any) {
    toast.add({
      title: 'Fel',
      description: err.data?.message || 'Kunde inte ta bort spelare',
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
    :title="`Ta bort spelare`"
    :description="`Är du säker på att du vill ta bort ${props.player?.name}?`"
  >
    <template #body>
      <div class="py-4">
        <div v-if="props.player" class="text-sm text-muted">
          <div>Telefon och ELO kommer också att tas bort.</div>
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