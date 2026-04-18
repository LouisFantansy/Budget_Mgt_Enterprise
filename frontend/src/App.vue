<template>
  <MainLayout v-if="layout === 'main'" />
  <BlankLayout v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'

const route = useRoute()

const layout = computed(() => {
  return (route.meta.layout as string) || 'main'
})
</script>
