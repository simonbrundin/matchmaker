<script setup lang="ts">
definePageMeta({ layout: 'default' })

const config = ref<{
  phone_number: string
  check_command: string
  shortcode: string
} | null>(null)

const balance = ref<{
  balance: number
  currency: string
  checked_at: string
  raw_response: string | null
} | null>(null)

const isLoading = ref(true)
const isSaving = ref(false)
const isChecking = ref(false)
const isManualEntry = ref(false)
const saveMessage = ref('')
const checkMessage = ref('')
const manualBalance = ref('')
const manualCurrency = ref('SEK')

const form = ref({
  phone_number: '',
  check_command: '',
  shortcode: ''
})

const columns = [
  { id: 'checked_at', key: 'checked_at', label: 'Datum' },
  { id: 'balance', key: 'balance', label: 'Saldo' },
  { id: 'currency', key: 'currency', label: 'Valuta' },
  { id: 'raw_response', key: 'raw_response', label: 'Rådata' }
]

async function loadData() {
  isLoading.value = true
  try {
    const data: any = await $fetch('/api/admin/cashcard/balance')
    if (data?.config) {
      config.value = data.config
      form.value = {
        phone_number: data.config.phone_number || '',
        check_command: data.config.check_command || '',
        shortcode: data.config.shortcode || ''
      }
    }
    if (data?.balance) {
      balance.value = data.balance
    }
  } catch (e) {
    console.error('Failed to load cashcard data:', e)
  } finally {
    isLoading.value = false
  }
}

async function saveConfig() {
  isSaving.value = true
  saveMessage.value = ''
  try {
    await $fetch('/api/admin/cashcard/config', {
      method: 'PUT',
      body: form.value
    })
    saveMessage.value = 'Inställningar sparade!'
    await loadData()
  } catch (e: any) {
    saveMessage.value = `Fel: ${e.message || 'Kunde inte spara'}`
  } finally {
    isSaving.value = false
  }
}

async function checkBalance() {
  isChecking.value = true
  checkMessage.value = ''
  try {
    const data: any = await $fetch('/api/admin/cashcard/check', { method: 'POST' })
    checkMessage.value = data.message || 'Saldo-förfrågan skickad!'
  } catch (e: any) {
    checkMessage.value = `Fel: ${e.message || 'Kunde inte skicka förfrågan'}`
  } finally {
    isChecking.value = false
  }
}

async function checkBundle() {
  isChecking.value = true
  checkMessage.value = ''
  try {
    const data: any = await $fetch('/api/admin/cashcard/check', {
      method: 'POST',
      body: { command: 'PAKET 2', shortcode: '3535' }
    })
    checkMessage.value = data.message || 'PAKET 2 sent!'
  } catch (e: any) {
    checkMessage.value = 'Error: ' + (e.message || 'Could not send')
  } finally {
    isChecking.value = false
  }
}

async function checkBundleOption(option: string) {
  isChecking.value = true
  checkMessage.value = ''
  try {
    const data: any = await $fetch('/api/admin/cashcard/check', {
      method: 'POST',
      body: { command: option, shortcode: '3535' }
    })
    checkMessage.value = data.message || 'Sent!'
  } catch (e: any) {
    checkMessage.value = 'Error: ' + (e.message || 'Could not send')
  } finally {
    isChecking.value = false
  }
}

async function submitManualBalance() {
  if (!manualBalance.value) return
  isManualEntry.value = true
  try {
    await $fetch('/api/admin/cashcard/balance', {
      method: 'POST',
      body: {
        balance: parseFloat(manualBalance.value),
        currency: manualCurrency.value,
        raw_response: `Manuell inmatning: ${manualBalance.value} ${manualCurrency.value}`
      }
    })
    manualBalance.value = ''
    await loadData()
    checkMessage.value = 'Saldo sparat!'
  } catch (e: any) {
    checkMessage.value = `Fel: ${e.message || 'Kunde inte spara'}`
  } finally {
    isManualEntry.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Kontantkort</h1>
      <p class="text-muted">Hantera Lyca Mobile-inställningar och saldo</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Settings Card -->
      <UCard>
        <template #header>Inställningar</template>
        <LoadingState v-if="isLoading" label="Laddar..." />
        <div v-else class="space-y-4">
          <UFormField label="Ditt Lyca-nummer" help="Telefonnumret som är kopplat till kontantkortet">
            <UInput v-model="form.phone_number" placeholder="+46 769 734 169" />
          </UFormField>
          
          <UFormField label="Kommando" help="SMS-kommandot för att kolla saldo (t.ex. SALDO)">
            <UInput v-model="form.check_command" placeholder="SALDO" />
          </UFormField>
          
          <UFormField label="Shortcode" help="Numret dit SMS:et skickas (t.ex. 1750)">
            <UInput v-model="form.shortcode" placeholder="1750" />
          </UFormField>
          
          <div class="flex items-center gap-4 pt-4">
            <UButton :loading="isSaving" @click="saveConfig">
              Spara inställningar
            </UButton>
            <UButton :loading="isChecking" variant="outline" @click="checkBalance">
              💳 Kolla saldo
            </UButton>
            <UButton :loading="isChecking" variant="outline" @click="checkBundle">
              📋 Lista abonnemang
            </UButton>
            <span class="text-sm text-muted ml-2">Svara med:</span>
            <UButton size="xs" :loading="isChecking" variant="ghost" @click="checkBundleOption('0')">0</UButton>
            <UButton size="xs" :loading="isChecking" variant="ghost" @click="checkBundleOption('1')">1</UButton>
            <UButton size="xs" :loading="isChecking" variant="ghost" @click="checkBundleOption('2')">2</UButton>
          </div>
          
          <p v-if="saveMessage" class="text-sm" :class="saveMessage.startsWith('Fel') ? 'text-red-500' : 'text-green-500'">
            {{ saveMessage }}
          </p>
          <p v-if="checkMessage" class="text-sm" :class="checkMessage.startsWith('Fel') ? 'text-red-500' : 'text-green-500'">
            {{ checkMessage }}
          </p>
        </div>
      </UCard>

      <!-- Current Balance Card -->
      <UCard>
        <template #header>Aktuellt saldo</template>
        <LoadingState v-if="isLoading" label="Laddar..." />
        <div v-else-if="balance">
          <div class="text-4xl font-bold text-primary mb-4">
            {{ balance.balance.toFixed(2) }} {{ balance.currency }}
          </div>
          <p class="text-sm text-muted mb-2">
            Kontrollerat: {{ new Date(balance.checked_at).toLocaleString('sv-SE') }}
          </p>
          <div v-if="balance.raw_response" class="mt-4 p-3 bg-muted rounded text-xs font-mono">
            <strong>Rådata:</strong> {{ balance.raw_response }}
          </div>
        </div>
        <div v-else class="text-muted">
          <p>Ingen saldodata ännu.</p>
          <p class="text-sm mt-1">Använd manuell inmatning nedan.</p>
        </div>

        <!-- Manual Balance Entry -->
        <div class="mt-6 pt-4 border-t">
          <h3 class="text-sm font-medium mb-2">Manuell inmatning</h3>
          <p class="text-xs text-muted mb-3">
            Kolla ditt saldo på Lyca-appen eller via *102# och mata in här.
          </p>
          <div class="flex gap-2">
            <UInput
              v-model="manualBalance"
              type="number"
              step="0.01"
              placeholder="Saldo (t.ex. 150.00)"
              class="w-40"
            />
            <USelect
              v-model="manualCurrency"
              :items="[{ label: 'SEK', value: 'SEK' }]"
              class="w-24"
            />
            <UButton :loading="isManualEntry" @click="submitManualBalance">
              Spara
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Webhook Info -->
    <UCard class="mt-6">
      <template #header>📡 Automatisk uppdatering</template>
      <p class="text-sm text-muted mb-2">
        För automatisk uppdatering behöver SMS Gateway-appen en webhook. 
        Detta kräver antingen ngrok eller en publik server.
      </p>
      <p class="text-xs text-muted">
        Webhook-URL: <code class="bg-muted px-1 rounded">https://din-server/api/webhook/sms</code>
      </p>
    </UCard>
  </div>
</template>
