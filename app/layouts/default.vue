<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: '/admin',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Spelare',
  icon: 'i-lucide-users',
  to: '/admin/players',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Bokningar',
  icon: 'i-lucide-calendar',
  to: '/admin/bookings',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Sidor',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-3 px-2" :class="collapsed ? 'justify-center' : ''">
          <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">
            M
          </div>
          <span v-if="!collapsed" class="font-semibold">Matchmaker</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <div v-if="collapsed" class="flex justify-center py-2">
          <UAvatar icon="i-lucide-user" />
        </div>
        <div v-else class="flex items-center gap-3 px-2 py-2">
          <UAvatar icon="i-lucide-user" />
          <div class="text-sm">
            <div class="font-medium">Admin</div>
            <div class="text-muted">Admin</div>
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
