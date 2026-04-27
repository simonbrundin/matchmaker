<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-12 px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Matchmaker</h1>
      <p class="text-gray-600 mb-8">
        Automatiserat padelbokningssystem
      </p>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Systemstatus</h2>
        <div v-if="health" class="space-y-2">
          <p>Status: <span :class="health.status === 'ok' ? 'text-green-600' : 'text-red-600'">{{ health.status }}</span></p>
          <p>Databas: {{ health.database }}</p>
          <p>Senaste kontroll: {{ new Date(health.timestamp).toLocaleString() }}</p>
        </div>
        <div v-else class="text-gray-500">Laddar...</div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">API Endpoints</h2>
        <ul class="space-y-2 text-sm">
          <li><code class="bg-gray-100 px-2 py-1 rounded">POST /api/cron/create-bookings</code> - Skapa bokningar för morgondagen</li>
          <li><code class="bg-gray-100 px-2 py-1 rounded">POST /api/cron/process-followups</code> - Skicka uppföljningsmeddelanden</li>
          <li><code class="bg-gray-100 px-2 py-1 rounded">POST /api/webhook/sms</code> - Ta emot inkommande SMS</li>
          <li><code class="bg-gray-100 px-2 py-1 rounded">GET /api/health</code> - Health check</li>
          <li><code class="bg-gray-100 px-2 py-1 rounded">GET /api/admin/players</code> - Lista spelare</li>
          <li><code class="bg-gray-100 px-2 py-1 rounded">POST /api/admin/players</code> - Lägg till spelare</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const health = ref<{ status: string; database: string; timestamp: string } | null>(null)

onMounted(async () => {
  try {
    const { data } = await useFetch('/api/health')
    health.value = data.value as any
  } catch (e) {
    health.value = { status: 'error', database: 'unknown', timestamp: new Date().toISOString() }
  }
})
</script>