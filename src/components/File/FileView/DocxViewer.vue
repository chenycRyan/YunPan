<template>
  <div ref="docsRef" id="fileView" class="docx">
    <div id="user"></div>
  </div>
  <el-icon v-if="showLoading" class="is-loading">
    <Loading />
  </el-icon>
</template>
<script setup>
import { renderAsync } from 'docx-preview'
import { downloadFile } from '@/api/modules/file'
import { GlobalStore } from '@/stores'
const globalStore = GlobalStore()
const docsRef = ref()
const props = defineProps({
  fileId: Number,
  full: Boolean
})
let file = ref(null)
let showLoading = ref(false)
watch(
  () => props.fileId,
  val => {
    // 挂载时，加载文件内容，并初始化
    if (val) {
      showLoading.value = true
      downloadFile(val)
        .then(res => {
          renderDocx(res)
          file.value = res
          setTimeout(() => {
            showLoading.value = false
            let domElement = document.querySelector('.docx-wrapper')
            let domCreate = domElement.firstChild
            let domItem = document.createElement('div')
            domItem.id = 'userName'
            domItem.setAttribute('class', 'resize-drag')
            // 从父组件传过来的水印内容
            domItem.innerText = globalStore.userInfo.real_name
            domItem.style.cssText =
              'position:absolute;top:100px;right:150px; color:#e6984d;font-size:40px;opacity:0.5;padding-top:10px;z-index:999;font-style:italic'
            domCreate.appendChild(domItem)
          }, 1000)
        })
        .catch(() => {
          showLoading.value = false
        })
    }
  },
  { immediate: true }
)
watch(
  () => props.full,
  () => {
    if (file.value) {
      renderDocx(file.value)
    }
  }
)
//初始化渲染
const renderDocx = file => {
  renderAsync(file, docsRef.value, null, {
    className: 'docx', // 默认和文档样式类的类名/前缀
    inWrapper: true, // 启用围绕文档内容渲染包装器
    ignoreWidth: false, // 禁止页面渲染宽度
    ignoreHeight: false, // 禁止页面渲染高度
    ignoreFonts: false, // 禁止字体渲染
    breakPages: true, // 在分页符上启用分页
    ignoreLastRenderedPageBreak: true, //禁用lastRenderedPageBreak元素的分页
    experimental: false, //启用实验性功能（制表符停止计算）
    trimXmlDeclaration: true, //如果为真，xml声明将在解析之前从xml文档中删除
    debug: true // 启用额外的日志记录
  })
}
</script>
<style lang="scss" scoped>
:deep(.docx-wrapper) {
  background: transparent;
  width: 100%;
  height: 100%;
}
:deep(.docx) {
  width: 80% !important;
  height: 100%;
}

.is-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
