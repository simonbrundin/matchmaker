<script setup lang="ts">
const { data: pages } = await useAsyncData('doc-pages', () =>
  queryCollection('docs').all()
)

const docPages = computed(() => {
  if (!pages.value) return []
  return pages.value.map(p => ({
    title: p.title,
    description: p.description,
    path: p.path
  }))
})

useSeoMeta({
  title: 'Dokumentation',
  description: 'Dokumentation för Matchmaker-systemet'
})
</script>

<template>
  <div class="p-6">
    <UBreadcrumb :items="[{ label: 'Hem', to: '/admin' }, { label: 'Dokumentation' }]" class="mb-6" />

    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Dokumentation</h1>
      <p class="text-gray-600">Välj en dokumentationssida nedan</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="page in docPages"
        :key="page.path"
        class="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer"
        :ui="{ base: 'h-full' }"
      >
        <template #header>
          <NuxtLink :to="page.path" class="font-semibold text-lg hover:text-primary-500">
            {{ page.title }}
          </NuxtLink>
        </template>
        <p class="text-gray-600 text-sm">
          {{ page.description || 'Ingen beskrivning' }}
        </p>
        <template #footer>
          <NuxtLink :to="page.path" class="text-primary-500 text-sm font-medium hover:underline">
            Läs mer →
          </NuxtLink>
        </template>
      </UCard>
    </div>
  </div>
</template>