<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Hem (Publika sidan)',
  icon: 'i-lucide-home',
  to: '/index-landing'
}, {
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: '/admin'
}, {
  label: 'Spelare',
  icon: 'i-lucide-users',
  to: '/admin/players'
}, {
  label: 'Bokningar',
  icon: 'i-lucide-calendar',
  to: '/admin/bookings'
}, {
  label: 'Meddelanden',
  icon: 'i-lucide-message-circle',
  to: '/admin/messages'
}, {
  label: 'Återkommande tider',
  icon: 'i-lucide-repeat',
  to: '/admin/weekly-times'
}, {
  label: 'Hallar',
  icon: 'i-lucide-building',
  to: '/admin/halls'
}, {
  label: 'Kontantkort',
  icon: 'i-lucide-credit-card',
  to: '/admin/cashcard'
}, {
  label: 'Tester',
  icon: 'i-lucide-flask-conical',
  children: [
    { label: 'SMS', to: '/admin/tester/sms-test', icon: 'i-lucide-message-square' },
    { label: 'Telegram', to: '/admin/tester/telegram-test', icon: 'i-lucide-send' }
  ]
}, {
  label: 'Dokumentation',
  icon: 'i-lucide-book-open',
  to: '/admin/dokumentation'
}, {
  label: 'Affisch',
  icon: 'i-lucide-file-image',
  to: '/poster'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Sidor',
  items: links.flat()
}])
</script>

<template>
  <div class="admin-wrapper">
    <!-- Background Effects -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-grid"></div>
    
    <UDashboardGroup unit="rem" class="h-screen admin-group">
      <UDashboardSidebar
        id="default"
        v-model:open="open"
        collapsible
        resizable
        class="admin-sidebar"
        :ui="{ footer: 'lg:border-t lg:border-white/10' }"
      >
        <template #header="{ collapsed }">
          <div class="flex items-center gap-3 px-2" :class="collapsed ? 'justify-center' : ''">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-lg">
              M
            </div>
            <span v-if="!collapsed" class="font-semibold text-white">Matchmaker</span>
          </div>
        </template>

        <template #default="{ collapsed }">
          <UDashboardSearchButton :collapsed="collapsed" :label="'Sök...'" class="bg-white/5 ring-white/10 hover:bg-white/10" />

          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[0]"
            orientation="vertical"
            class="nav-menu"
          />
        </template>

        <template #footer="{ collapsed }">
          <div v-if="collapsed" class="flex justify-center py-2">
            <UAvatar icon="i-lucide-user" class="bg-white/10" />
          </div>
          <div v-else class="flex items-center gap-3 px-2 py-2">
            <UAvatar icon="i-lucide-user" class="bg-white/10" />
            <div class="text-sm">
              <div class="font-medium text-white">Admin</div>
              <div class="text-slate-400">Administratör</div>
            </div>
          </div>
        </template>
      </UDashboardSidebar>

      <UDashboardSearch :groups="groups" placeholder="Sök..." class="admin-search" />

      <div class="overflow-auto flex-1 bg-slate-900/50">
        <slot />
      </div>
    </UDashboardGroup>
  </div>
</template>

<style>
/* Admin Page Styles */
.admin-wrapper {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  position: relative;
}

/* Background Effects */
.admin-wrapper .bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.admin-wrapper .bg-orb-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.admin-wrapper .bg-orb-2 {
  width: 300px;
  height: 300px;
  bottom: 20%;
  left: -100px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  opacity: 0.2;
}

.admin-wrapper .bg-grid {
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

/* Sidebar Override */
.admin-group {
  position: relative;
  z-index: 1;
}

.admin-sidebar {
  background: rgba(15, 23, 42, 0.8) !important;
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Navigation Menu Override */
.nav-menu :deep(.hover\:bg-elevated:hover) {
  background: rgba(59, 130, 246, 0.2) !important;
}

.nav-menu :deep(a[data-active="true"]) {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), transparent) !important;
  border-left: 3px solid #3b82f6 !important;
}

.nav-menu :deep(a) {
  color: #94a3b8 !important;
}

.nav-menu :deep(a:hover) {
  color: #f1f5f9 !important;
}

/* Search Override */
.admin-search :deep(input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #f1f5f9 !important;
}

.admin-search :deep(input::placeholder) {
  color: #64748b !important;
}

/* Card Override */
:deep(.ucard) {
  background: rgba(30, 41, 59, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(8px);
}

:deep(.ucard-header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #f1f5f9 !important;
}

:deep(.ucard-body) {
  color: #e2e8f0 !important;
}

/* Table Override */
:deep(.utable) {
  background: transparent !important;
}

:deep(.utable-thead) {
  background: rgba(15, 23, 42, 0.5) !important;
}

:deep(.utable-th) {
  color: #94a3b8 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.utable-td) {
  color: #e2e8f0 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

:deep(.utable-tr:hover) {
  background: rgba(59, 130, 246, 0.1) !important;
}

/* Badge Colors */
:deep(.ubadge-success) {
  background: rgba(34, 197, 94, 0.2) !important;
  color: #4ade80 !important;
}

:deep(.ubadge-warning), :deep(.ubadge-yellow) {
  background: rgba(250, 204, 21, 0.2) !important;
  color: #fbbf24 !important;
}

:deep(.ubadge-error), :deep(.ubadge-red) {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #f87171 !important;
}

/* Form Inputs */
:deep(input), :deep(textarea), :deep(select) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #f1f5f9 !important;
}

:deep(input::placeholder), :deep(textarea::placeholder) {
  color: #64748b !important;
}

/* Button Overrides */
:deep(.ubutton-primary) {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  color: white !important;
}

:deep(.ubutton:hover) {
  transform: translateY(-1px);
}

/* Typography */
:deep(h1), :deep(h2), :deep(h3), :deep(h4) {
  color: #f1f5f9 !important;
}

:deep(.text-muted) {
  color: #94a3b8 !important;
}

/* Modal/Dialog */
:deep(.umodal) {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.umodal-header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.umodal-footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Tabs */
:deep(.utabs-list) {
  background: rgba(255, 255, 255, 0.03) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.utab) {
  color: #94a3b8 !important;
}

:deep(.utab[data-active="true"]) {
  color: #3b82f6 !important;
  border-bottom-color: #3b82f6 !important;
}
</style>
