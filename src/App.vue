<template>
  <!-- <el-config-provider :size="assemblySize"> -->
  <router-view></router-view>
  <!-- </el-config-provider> -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GlobalStore } from '@/stores'
import { useTheme } from '@/hooks/useTheme'
// 使用主题
useTheme()

const globalStore = GlobalStore()
globalStore.getFfmpeg()
// 配置全局组件大小 (small/default(medium)/large)
const assemblySize = computed((): string => globalStore.assemblySize)
</script>
