<template>
  <div id="luckysheet"></div>
</template>

<script setup>
import LuckyExcel from 'luckyexcel'
import { downloadFile } from '@/api/modules/file'
import { GlobalStore } from '@/stores'
const globalStore = GlobalStore()
const props = defineProps({
  fileId: Number
})
watch(
  () => props.fileId,
  val => {
    // 挂载时，加载文件内容，并初始化
    if (val) {
      downloadFile(val).then(res => {
        luckysheet.create({
          container: 'luckysheet'
        })
        loadExcel(res)
        setTimeout(() => {
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
    }
  },
  { immediate: true }
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
</style>
