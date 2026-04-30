<script setup lang="ts">
const route = useRoute()

const { data: navigation } = await useAsyncData('admin-nav', () =>
  queryCollection('admin/dokumentation').order('path', 'ASC').all()
)

const isDokumentationActive = computed(() =>
  route.path.startsWith('/admin/dokumentation')
)

const filteredNav = computed(() => {
  if (!navigation.value) return []
  return navigation.value.map((item: any) => ({
    label: item.title || item.path.split('/').pop(),
    to: item.path
  }))
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/admin" class="text-xl font-bold text-gray-800">Matchmaker Admin</NuxtLink>
            <div class="ml-10 flex space-x-4">
              <NuxtLink to="/admin" class="px-3 py-2 rounded-md text-sm font-medium" :class="$route.path === '/admin' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'">Dashboard</NuxtLink>
              <NuxtLink to="/admin/players" class="px-3 py-2 rounded-md text-sm font-medium" :class="$route.path.startsWith('/admin/players') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'">Spelare</NuxtLink>
              <NuxtLink to="/admin/bookings" class="px-3 py-2 rounded-md text-sm font-medium" :class="$route.path.startsWith('/admin/bookings') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'">Bokningar</NuxtLink>
              <NuxtLink to="/admin/messages" class="px-3 py-2 rounded-md text-sm font-medium" :class="$route.path.startsWith('/admin/messages') ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'">Meddelanden</NuxtLink>

              <UDropdown :items="[{ label: 'Dokumentation', children: filteredNav }]" :popper="{ placement: 'bottom-start' }">
                <NuxtLink to="/admin/dokumentation/meddelandeflode" class="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1" :class="isDokumentationActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:text-gray-900'">
                  Dokumentation
                  <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
                </NuxtLink>
              </UDropdown>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>