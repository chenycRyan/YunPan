<template>
  <div class="zfile-pdf-viewer">
    <div class="app-header">
      <div v-if="isLoading">加载页数中...</div>
      <div v-else>
        <span v-if="showAllPages"> 共 {{ pageCount }} 页 </span>

        <span v-else>
          <button :disabled="page <= 1" @click="page--">❮</button>
          {{ page }} / {{ pageCount }}
          <button :disabled="page >= pageCount" @click="page++">❯</button>
        </span>
      </div>

      <span>
        <button class="btn" @click="pdfViewCanvasWidthNum -= 5">-</button>
        <span>
          <span class="hidden sm:inline">缩放比例</span>
          {{ pdfViewCanvasWidthNum }} %
        </span>
        <button class="btn" @click="pdfViewCanvasWidthNum += 5">+</button>
      </span>

      <label :class="isLoading ? 'invisible' : 'visible'">
        <input v-model="showAllPages" type="checkbox" />
        显示所有页
      </label>
    </div>

    <div class="app-content">
      <vue-pdf-embed ref="pdfRef" :source="pdfSource" :page="page" @rendered="handleDocumentRender" />
    </div>
  </div>
</template>

<script setup>
import VuePdfEmbed from 'vue-pdf-embed'
import { downloadFile } from '@/api/modules/file'
const props = defineProps({
  fileId: Number
})
// 文件下载路径或Blob对象
let pdfSource = ref()
watch(
  () => props.fileId,
  val => {
    // 挂载时，加载文件内容，并初始化
    if (val) {
      downloadFile(val).then(res => {
        pdfSource.value = window.URL.createObjectURL(new Blob([res]))
      })
    }
  },
  { immediate: true }
)

const pdfRef = ref()

const pdfViewCanvasWidthNum = ref(100)

let isLoading = ref(true)
let page = ref(null)
let pageCount = ref(1)

let showAllPages = ref(true)

watch(
  () => showAllPages.value,
  () => {
    page.value = showAllPages.value ? null : 1
  }
)

const handleDocumentRender = () => {
  isLoading.value = false
  pageCount.value = pdfRef.value.pageCount
}

import { useMagicKeys } from '@vueuse/core'
const { ArrowLeft, ArrowRight, NumpadAdd, NumpadSubtract } = useMagicKeys()

// 支持按键翻页
watch(
  () => [ArrowLeft.value, ArrowRight.value],
  value => {
    if (isLoading.value) return
    if (showAllPages.value) return
    if (value[0] && page.value > 1) {
      page.value--
    }
    if (value[1] && page.value < pageCount.value) {
      page.value++
    }
  }
)

// 支持按键缩放
watch(
  () => [NumpadSubtract.value, NumpadAdd.value],
  value => {
    if (value[0]) {
      pdfViewCanvasWidthNum.value -= 5
    }
    if (value[1]) {
      pdfViewCanvasWidthNum.value += 5
    }
  }
)
</script>

<style scoped lang="scss">
.app-header {
  box-shadow: 0 2px 8px 4px rgb(0 0 0 / 10%);
  background-color: #555;
  color: #ddd;
  display: flex;
  align-content: space-between;
  -webkit-box-pack: justify;
  justify-content: space-between;
  --tw-bg-opacity: 1;
  background-color: rgb(75 85 99 / 1);
  padding: 1rem;
  .btn {
    padding-left: 1rem;
    padding-right: 1rem;
    background: transparent;
    background-color: transparent;
    background-image: none;
    font-family: inherit;
    font-size: 100%;
    font-weight: inherit;
    color: inherit;
    border: none;
    cursor: pointer;
  }
}
</style>
