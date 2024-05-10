<template>
  <div style="border: 1px solid #ccc; min-height: 300px" id="richEditor" v-if="props.innerVisible">
    <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
    <Editor
      style="min-height: 350px; overflow-y: hidden"
      v-model="descStr"
      @on-change="lisChange($event)"
      :defaultConfig="editorConfig"
      :mode="mode"
      @on-created="onCreated"
    />
  </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { GlobalStore } from '@/stores'
import { getUploadUrl, getDownloadUrl } from '@/api/modules/file'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const props = defineProps({
  description: {
    type: String,
    default: ''
  },
  innerVisible: {
    type: Boolean,
    default: false
  }
})
let descStr = ref('')
watch(
  () => props.innerVisible,
  val => {
    // console.log(getUploadUrl(), getDownloadUrl(123))
    if (!val) {
      descStr.value = ''
    } else {
      descStr.value = props.description
    }
  },
  {
    immediate: true
  }
)
// 用于修改父组件传递的属性的值
const emit = defineEmits(['update:description'])

const valueHtml = ref('')
const editorRef = shallowRef()
// const html = ref('<p>hello</p>')
const toolbarConfig = ref({})
const editorConfig = ref({ MENU_CONF: {}, placeholder: '请输入内容...' })
const globalStore = GlobalStore()
const token = computed(() => globalStore.token)

editorConfig.value.MENU_CONF['uploadImage'] = {
  // 上传图片的配置
  server: getUploadUrl(),
  fieldName: 'file',
  timeout: 5 * 1000, // 5s
  meta: {},
  headers: { Authorization: `Bearer ${token.value}` },
  metaWithUrl: false, // join params to url
  maxFileSize: 10 * 1024 * 1024, // 10M
  // base64LimitSize: 5 * 1024, // insert base64 format, if file's size less than 5kb
  customInsert(res, insertFn) {
    console.log(res)
    if (!res) throw new Error(`Image url is empty`)
    // const url = window.appsettings.baseUrl_JAVA + '/sao/files/' + res + '/download'
    const url = getDownloadUrl(res)
    const alt = ''
    const href = ''
    insertFn(url, alt, href)
  }
}
editorConfig.value.MENU_CONF['uploadVideo'] = {
  // 上传视频的配置
  server: getUploadUrl(),
  timeout: 5 * 1000, // 5s
  meta: {},
  headers: { Authorization: `Bearer ${token.value}` },
  fieldName: 'file',
  metaWithUrl: false, // join params to url
  customInsert(res, insertFn) {
    const url = getDownloadUrl(res)
    const poster = ''
    insertFn(url, poster)
  }
}
const mode = ref('default')
const onCreated = editor => {
  editorRef.value = Object.seal(editor) // 一定要用 Object.seal() ，否则会报错
  editorRef.value.focus(true)
}
const lisChange = e => {
  valueHtml.value = e.getHtml()
  // 修改父组件传递的属性的值
  emit('update:description', valueHtml.value)
}

onBeforeUnmount(() => {
  descStr.value = ''
  const Editor = editorRef.value
  if (!Editor) return
  Editor.destroy() // 组件销毁时，及时销毁编辑器
})
</script>

<style></style>
