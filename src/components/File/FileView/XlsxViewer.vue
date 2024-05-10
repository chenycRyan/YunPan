<template>
  <div id="luckysheet"></div>
  <el-icon v-if="showLoading" class="is-loading">
    <Loading />
  </el-icon>
</template>

<script setup>
import LuckyExcel from 'luckyexcel'
import { downloadFile } from '@/api/modules/file'
import { GlobalStore } from '@/stores'
const globalStore = GlobalStore()
const props = defineProps({
  fileId: Number,
  full: Boolean
})
let file = ref(null)
let showLoading = ref(false)
watch(
  () => props.fileId,
  val => {
    // 挂载时，加载文件内容，并初始化luckysheet
    if (val) {
      showLoading.value = true
      downloadFile(val)
        .then(res => {
          luckysheet.create({
            container: 'luckysheet'
          })
          file.value = res
          loadExcel(res)
          setTimeout(() => {
            showLoading.value = false
            let domElement = document.getElementById('luckysheet')
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
      loadExcel(file.value)
    }
  }
)

const loadExcel = file => {
  // luckysheetfile
  LuckyExcel.transformExcelToLucky(file, function (exportJson) {
    if (exportJson.sheets == null || exportJson.sheets.length == 0) {
      alert('Failed to read the content of the excel file, currently does not support xls files!')
      return
    }
    console.log('exportJson', exportJson)

    window.luckysheet.destroy()

    window.luckysheet.create({
      container: 'luckysheet', //luckysheet is the container id
      showinfobar: false,
      data: exportJson.sheets
    })
  })
}
</script>

<style scoped>
#luckysheet {
  margin: 0px;
  padding: 0px;
  position: absolute;
  width: 100%;
  left: 0px;
  top: 50px;
  bottom: 0px;
  overflow: hidden;
}

#uploadBtn {
  font-size: 16px;
}

#tip {
  position: absolute;
  z-index: 1000000;
  left: 0px;
  top: 0px;
  bottom: 0px;
  right: 0px;
  background: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 40px;
  align-items: center;
  justify-content: center;
  display: flex;
}
.is-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
