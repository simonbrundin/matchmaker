<script setup lang="ts">
import { playerFullName } from '~/utils'

interface Player {
  id: string
  first_name: string
  last_name: string | null
  phone: string | null
}

const props = withDefaults(defineProps<{
  modelValue?: Player | null
  placeholder?: string
}>(), {
  placeholder: 'Sök spelare...'
})

const emit = defineEmits<{
  'update:modelValue': [player: Player | null]
}>()

const players = ref<Player[]>([])
const search = ref('')
const showDropdown = ref(false)
const searchInput = ref<any>(null)
const debounceTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const filteredPlayers = computed(() => {
  const term = search.value.toLowerCase().trim()
  if (!term) return players.value.slice(0, 10)
  return players.value.filter(p =>
    playerFullName(p).toLowerCase().includes(term) ||
    (p.phone && p.phone.includes(term))
  ).slice(0, 10)
})

async function loadPlayers() {
  try {
    const data: any = await $fetch('/api/admin/players')
    if (data?.players) {
      players.value = data.players
    }
  } catch (err) {
    console.error('loadPlayers error:', err)
  }
}

function onFocus() {
  showDropdown.value = true
  if (players.value.length === 0) {
    loadPlayers()
  }
}

function onBlur() {
  debounceTimeout.value = setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

function onInput() {
  if (!showDropdown.value) {
    showDropdown.value = true
  }
}

function selectPlayer(player: Player) {
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = null
  }
  emit('update:modelValue', player)
  search.value = playerFullName(player)
  nextTick(() => {
    showDropdown.value = false
  })
}

function clearSelection() {
  emit('update:modelValue', null)
  search.value = ''
  players.value = []
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    search.value = playerFullName(newVal)
  } else {
    search.value = ''
  }
}, { immediate: true })

defineExpose({ clearSelection })
</script>

<template>
  <div class="relative">
    <UInput
      ref="searchInput"
      v-model="search"
      :placeholder="placeholder"
      class="w-full"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    >
      <template #trailing v-if="modelValue">
        <UButton
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          @click.stop="clearSelection"
        />
      </template>
    </UInput>
    <div
      v-if="showDropdown && filteredPlayers.length > 0"
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-muted rounded-md shadow-lg max-h-60 overflow-auto"
    >
      <div
        v-for="player in filteredPlayers"
        :key="player.id"
        class="px-3 py-2 hover:bg-muted cursor-pointer"
        :class="{ 'bg-primary-500/10': modelValue?.id === player.id }"
        @mousedown.prevent="selectPlayer(player)"
      >
        <div class="font-medium">{{ playerFullName(player) }}</div>
        <div class="text-sm text-muted">{{ player.phone || 'Inget nummer' }}</div>
      </div>
    </div>
  </div>
</template>