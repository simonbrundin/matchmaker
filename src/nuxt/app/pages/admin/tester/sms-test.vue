<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">SMS Test</h1>
      <p class="text-muted">Testa SMS Gateway-konfigurationen</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Gateway Configuration Card -->
      <UCard>
        <template #header>Gateway-inställningar</template>
        <div class="space-y-4">
          <UFormField label="Gateway URL" required>
            <UInput
              v-model="settingsForm.url"
              placeholder="https://sms.example.com"
              :disabled="savingSettings"
            />
          </UFormField>

          <UFormField label="Användarnamn" required>
            <UInput
              v-model="settingsForm.username"
              placeholder="api_user"
              :disabled="savingSettings"
            />
          </UFormField>

          <UFormField label="Lösenord" required>
            <UInput
              v-model="settingsForm.password"
              type="password"
              placeholder="••••••••"
              :disabled="savingSettings"
            />
          </UFormField>

          <div class="flex gap-2">
            <UButton
              :loading="savingSettings"
              :disabled="!canSaveSettings"
              @click="saveSettings"
            >
              Spara inställningar
            </UButton>
            <UButton
              v-if="settingsSaved"
              variant="outline"
              disabled
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4" />
              Sparat
            </UButton>
          </div>

          <UAlert
            v-if="settingsError"
            color="red"
            variant="subtle"
            :title="settingsError"
          />
        </div>
      </UCard>

      <!-- Connection Status Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <span>Konfigurationsstatus</span>
            <UButton
              variant="ghost"
              size="sm"
              :loading="refreshingStatus"
              @click="refreshAll"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>
        </template>
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

          <div class="flex items-center gap-3">
            <UIcon
              :name="status?.hasConnection ? 'i-heroicons-check-circle text-green-500' : 'i-heroicons-x-circle text-red-500'"
              :class="status?.hasConnection ? 'text-green-500' : 'text-yellow-500'"
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
          <p class="text-xs text-muted">
            Inställningar sparas i databasen. Environment variables används som fallback.
          </p>
        </template>
      </UCard>

      <!-- Send Test Message Card -->
      <UCard class="md:col-span-2">
        <template #header>Skicka testmeddelande</template>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <UButton
            :loading="sending"
            :disabled="!status?.hasUrl || !status?.hasCredentials || !selectedPlayer?.phone || !message"
            @click="sendTest"
          >
            Skicka testmeddelande
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
const { data: dbSettings, refresh: refreshSettings } = await useFetch('/api/admin/settings')

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

// Settings form
const settingsForm = ref({
  url: '',
  username: '',
  password: ''
})
const savingSettings = ref(false)
const settingsSaved = ref(false)
const settingsError = ref<string | null>(null)
const refreshingStatus = ref(false)

// Initialize form with current database settings
watch(dbSettings, (settings) => {
  if (settings) {
    settingsForm.value.url = settings.sms_gateway_url || ''
    settingsForm.value.username = settings.sms_gateway_username || ''
    // Don't pre-fill password - user must re-enter it
    settingsForm.value.password = ''
  }
}, { immediate: true })

const canSaveSettings = computed(() => {
  return settingsForm.value.url.trim() !== '' &&
         settingsForm.value.username.trim() !== '' &&
         settingsForm.value.password.trim() !== ''
})

async function saveSettings() {
  if (!canSaveSettings.value) return

  savingSettings.value = true
  settingsError.value = null
  settingsSaved.value = false

  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        sms_gateway_url: settingsForm.value.url,
        sms_gateway_username: settingsForm.value.username,
        sms_gateway_password: settingsForm.value.password
      }
    })
    settingsSaved.value = true
    // Clear password field after save
    settingsForm.value.password = ''
    // Refresh status to reflect new settings
    await refreshStatus()
    // Clear saved indicator after 3 seconds
    setTimeout(() => {
      settingsSaved.value = false
    }, 3000)
  } catch (err: any) {
    settingsError.value = err.data?.message || err.message || 'Kunde inte spara inställningar'
  } finally {
    savingSettings.value = false
  }
}

async function refreshAll() {
  refreshingStatus.value = true
  await Promise.all([
    refreshStatus(),
    refreshSettings()
  ])
  refreshingStatus.value = false
}

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
