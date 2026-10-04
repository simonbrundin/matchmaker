<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const router = useRouter()
const error = ref('')

async function handleLogin() {
  error.value = ''
  // TODO: Replace with real authentication
  // e.g., call /api/auth/login with credentials
  error.value = 'Auth not implemented yet — set SKIP_AUTH=true in .env for development'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold mb-6 text-gray-800">Matchmaker Admin</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Lösenord</label>
          <input
            type="password"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Logga in
        </button>
      </form>
    </div>
  </div>
</template>
