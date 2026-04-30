<script setup lang="ts">
const route = useRoute()

const { data: allPages } = await useAsyncData('all-doc-pages', () =>
  queryCollection('docs').all()
)

const slug = computed(() => {
  const path = route.path
  const match = path.match(/\/admin\/dokumentation\/(.+)/)
  return match ? match[1] : 'meddelandeflode'
})

const { data: page } = await useAsyncData(
  `doc-${slug.value}`,
  () => queryCollection('docs').path(`/admin/dokumentation/${slug.value}`).first()
)

useSeoMeta({
  title: page.value?.title || 'Dokumentation',
  description: page.value?.description
})

const breadcrumbItems = computed(() => [
  { label: 'Hem', to: '/admin' },
  { label: 'Dokumentation', to: '/admin/dokumentation/meddelandeflode' },
  { label: page.value?.title || slug.value }
])
</script>

<template>
  <div class="p-6" v-if="page">
    <UBreadcrumb :items="breadcrumbItems" class="mb-6" />

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3">
        <article class="prose prose-slate max-w-none">
          <ContentRenderer v-if="page" :value="page" />
        </article>

        <div class="mt-8 pt-6 border-t">
          <UButton
            to="/admin/dokumentation/meddelandeflode"
            variant="outline"
            color="gray"
            icon="i-heroicons-arrow-left"
          >
            Tillbaka till Dokumentation
          </UButton>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="sticky top-6">
          <UCard>
            <template #header>
              <span class="font-semibold">Innehåll</span>
            </template>
            <nav v-if="page.body?.toc?.links?.length">
              <ul class="space-y-2">
                <li
                  v-for="link in page.body.toc.links"
                  :key="link.id"
                >
                  <NuxtLink
                    :to="`#${link.id}`"
                    class="text-sm text-gray-600 hover:text-gray-900 block py-1"
                  >
                    {{ link.text }}
                  </NuxtLink>
                  <ul v-if="link.children?.length" class="ml-4 space-y-1">
                    <li v-for="child in link.children" :key="child.id">
                      <NuxtLink
                        :to="`#${child.id}`"
                        class="text-sm text-gray-500 hover:text-gray-700 block py-1"
                      >
                        {{ child.text }}
                      </NuxtLink>
                    </li>
                  </ul>
                </li>
              </ul>
            </nav>
            <p v-else class="text-sm text-gray-500">Ingen innehållsförteckning</p>
          </UCard>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="p-6">
    <UBreadcrumb :items="[{ label: 'Hem', to: '/admin' }, { label: 'Dokumentation' }]" class="mb-6" />
    <UCard>
      <template #header>
        <span class="text-red-500">Sida hittades inte</span>
      </template>
      <p class="text-gray-600 mb-4">
        Dokumentationen du söker finns inte.
      </p>
      <UButton to="/admin" variant="outline" color="gray">
        Gå till Dashboard
      </UButton>
    </UCard>
  </div>
</template>