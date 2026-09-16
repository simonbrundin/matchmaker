<template>
  <div class="flex items-center justify-center gap-2 py-8 text-muted">
    <UIcon name="i-lucide-loader-circle" class="h-5 w-5 animate-spin" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>
