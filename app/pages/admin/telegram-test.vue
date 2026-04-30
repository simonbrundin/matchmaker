<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Telegram Test</h1>
      <p class="text-muted">Testa telegramkonfigurationen</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard>
        <template #header>Konfigurationsstatus</template>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <UIcon
              :name="status?.hasBotToken ? 'i-heroicons-check-circle text-green-500' : 'i-heroicons-x-circle text-red-500'"
              class="w-6 h-6"
            />
            <div>
              <div class="font-medium">Bot Token</div>
              <div class="text-sm text-muted">
                {{ status?.hasBotToken ? 'Konfigurerad' : 'Ej konfigurerad' }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <UIcon
              :name="status?.hasAdminChatId ? 'i-heroicons-check-circle text-green-500' : 'i-heroicons-x-circle text-red-500'"
              class="w-6 h-6"
            />
            <div>
              <div class="font-medium">Admin Chat ID</div>
              <div class="text-sm text-muted">
                {{ status?.hasAdminChatId ? status?.adminChatId : 'Ej konfigurerad' }}
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <UButton variant="outline" @click="refreshStatus">
            Uppdatera status
          </UButton>
        </template>
      </UCard>

      <UCard>
        <template #header>Skicka testmeddelande</template>
        <div class="space-y-4">
          <UFormField label="Meddelande">
            <UInput
              v-model="message"
              placeholder="Skriv ett testmeddelande..."
              :disabled="sending"
            />
          </UFormField>

          <UButton
            :loading="sending"
            :disabled="!status?.hasBotToken || !status?.hasAdminChatId"
            @click="sendTest"
          >
            Skicka
          </UButton>

          <div v-if="result" class="mt-4">
            <UAlert
              v-if="result.success"
              color="green"
              variant="subtle"
              title="Meddelande skickat!"
            />
            <UAlert
              v-else
              color="red"
              variant="subtle"
              :title="result.error || 'Misslyckades'"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: status, refresh: refreshStatus } = await useFetch('/api/admin/telegram/status')

const message = ref('Hej från Matchmaker! Detta är ett testmeddelande.')
const sending = ref(false)
const result = ref<{ success: boolean; error?: string } | null>(null)

async function sendTest() {
  sending.value = true
  result.value = null

  try {
    await $fetch('/api/admin/telegram/test', {
      method: 'POST',
      body: { message: message.value }
    })
    result.value = { success: true }
  } catch (err: any) {
    result.value = { success: false, error: err.data?.message || err.message }
  } finally {
    sending.value = false
  }
}
</script>