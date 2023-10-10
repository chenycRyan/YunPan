<template>
  <div class="content">
    <div class="dialog-scroll markdown-body" v-html="markdownHtml"></div>
  </div>
</template>

<script setup>
import { marked } from 'marked'
import { computed, onMounted, onUpdated, ref } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'github-markdown-css'
import { getFileOrion } from '@/api/modules/file'

let props = defineProps({
  fileId: Number
})

const fileContent = ref('')
watch(
  () => props.fileId,
  val => {
    // 挂载时，加载文件内容，并初始化
    if (val) {
      getFileOrion(val).then(res => {
        fileContent.value = res
        initMonaco()
      })
    }
  },
  { immediate: true }
)

let markdownHtml = computed(() => {
  // url 新窗口打开.
  let renderer = new marked.Renderer()
  renderer.link = function () {
    let link = marked.Renderer.prototype.link.apply(this, arguments)
    return link.replace('<a', "<a target='_blank'")
  }
  marked.setOptions({
    renderer: renderer
  })

  return marked(fileContent.value, {
    highlight: function (code) {
      return hljs.highlightAuto(code).value
    }
  })
})
</script>

<style scoped>
.content {
  padding: 10px 20px;
}

.content .markdown-body >>> pre {
  margin-right: 20px;
}

.content .markdown-body >>> pre:hover .copy-btn {
  opacity: 1;
}

.dialog-scroll {
  height: calc(80vh);
  overflow-y: auto;
  overflow-x: hidden;
  margin: 0;
}

.content >>> .code-copy-added {
  position: relative;
}
</style>
