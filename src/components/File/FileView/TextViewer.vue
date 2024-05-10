<template>
  <div id="zfile-monaco-editor" class="editor" />
  <el-icon v-if="showLoading" class="is-loading">
    <Loading />
  </el-icon>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

// import * as monaco from 'monaco-editor';
// 按需加载核心 api
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
// 按需加载语法高亮
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution'
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/scss/scss.contribution'
import 'monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution'
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution'
import 'monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution'
import 'monaco-editor/esm/vs/basic-languages/ini/ini.contribution'
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution'
import 'monaco-editor/esm/vs/basic-languages/less/less.contribution'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution'
import 'monaco-editor/esm/vs/basic-languages/mysql/mysql.contribution'
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution'
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js'
// import 'monaco-editor/esm/vs/editor/contrib/codeAction/browser/codeAction.js'

import { getFileOrion } from '@/api/modules/file'
// 组件接收的属性：
const props = defineProps({
  fileId: Number,
  fileName: String
})
let showLoading = ref(false)
watch(
  () => props.fileId,
  val => {
    // 挂载时，加载文件内容，并初始化
    if (val) {
      showLoading.value = true
      getFileOrion(val)
        .then(res => {
          fileContent.value = res
          showLoading.value = false
          initMonaco()
        })
        .catch(() => {
          showLoading.value = false
        })
    }
  },
  { immediate: true }
)
// 文件内容
const fileContent = ref('')

// 关闭时销毁所有组件
onUnmounted(() => {
  monaco.editor.getModels().forEach(item => {
    item.dispose()
  })
})

const isNotMobile = ref(true)

// 初始化编辑器
let initMonaco = () => {
  let model = monaco.editor.createModel(fileContent.value, undefined, monaco.Uri.parse(props.fileName))

  monaco.editor.create(document.getElementById('zfile-monaco-editor'), {
    model: model,
    // table 个数
    tabSize: 4,
    // 自动布局
    automaticLayout: true,
    // 底部滚动超出
    scrollBeyondLastLine: false,
    // 自动换行
    wordWrap: true,
    // 只读
    readOnly: true,
    minimap: {
      enabled: isNotMobile.value
    },
    lineNumbers: isNotMobile.value ? 'on' : 'off'
  })
}
</script>

<style lang="scss" scoped>
#zfile-monaco-editor {
  height: 80vh;
}
.is-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
