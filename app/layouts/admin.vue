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