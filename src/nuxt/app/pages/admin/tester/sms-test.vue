<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">SMS Test</h1>
      <p class="text-muted">Testa SMS Gateway-konfigurationen</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard>
        <template #header>Konfigurationsstatus</template>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <UIcon
              :name="status?.hasUrl ? 'i-heroicons-check-circle text-green-500' : 'i-heroicons-x-circle text-red-500'"
              class="w-6 h-6"
            />
            <div>
              <div class="font-medium">Gateway URL</div>
              <div class="text-sm text-muted">
                {{ status?.url || 'Ej konfigurerad' }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <UIcon
              :name="status?.hasCredentials ? 'i-heroicons-check-circle text-green-500' : 'i-heroicons-x-circle text-red-500'"
              class="w-6 h-6"
            />
            <div>
              <div class="font-medium">Användarnamn</div>
              <div class="text-sm text-muted font-mono">
                {{ status?.usernamePreview || 'Ej konfigurerad' }}
              </div>
            </div>
          </div>

          <div v-if="status?.hasUrl && status?.hasCredentials" class="flex items-center gap-3">
            <UIcon
              :name="status?.hasConnection ? 'i-heroicons-check-circle text-green-500' : 'i-heroicons-x-circle text-red-500'"
              class="w-6 h-6"
            />
            <div>
              <div class="font-medium">Anslutning</div>
              <div class="text-sm text-muted">
                {{ status?.hasConnection ? 'Upprättad' : status?.connectionError || 'Kunde inte ansluta' }}
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
          <UFormField label="Mottagare">
            <PlayerSelect
              v-model="selectedPlayer"
              placeholder="Sök spelare..."
            />
            <div v-if="selectedPlayer?.phone" class="text-sm text-muted mt-1">
              Telefon: {{ selectedPlayer.phone }}
            </div>
          </UFormField>

          <UFormField label="Meddelande">
            <UTextarea
              v-model="message"
              placeholder="Skriv ett testmeddelande..."
              :rows="3"
              :disabled="sending"
            />
          </UFormField>

          <UButton
            :loading="sending"
            :disabled="!status?.hasUrl || !status?.hasCredentials || !selectedPlayer?.phone || !message"
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
              :description="`Message ID: ${result.messageId}`"
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
const { data: status, refresh: refreshStatus } = await useFetch('/api/admin/sms/status')

interface Player {
  id: string
  first_name: string
  last_name: string | null
  phone: string | null
}

const selectedPlayer = ref<Player | null>(null)
const message = ref('Hej från Matchmaker! Detta är ett testmeddelande.')
const sending = ref(false)
const result = ref<{ success: boolean; messageId?: string; error?: string } | null>(null)

async function sendTest() {
  if (!selectedPlayer.value?.phone) return

  sending.value = true
  result.value = null

  try {
    const response = await $fetch('/api/admin/sms/test', {
      method: 'POST',
      body: { phoneNumber: selectedPlayer.value.phone, message: message.value }
    })
    result.value = { success: true, messageId: response.messageId }
  } catch (err: any) {
    result.value = { success: false, error: err.data?.message || err.message }
  } finally {
    sending.value = false
  }
}
</script>