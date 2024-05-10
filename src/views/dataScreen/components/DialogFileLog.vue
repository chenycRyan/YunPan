<template>
  <div>
    <el-dialog
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :title="dialogTitle"
      width="50%"
    >
      <el-table stripe :data="logList" style="width: 100%">
        <el-table-column prop="createdTime" width="180" align="center">
          <template #header>
            <el-icon>
              <Calendar />
            </el-icon>
            <span>操作时间</span>
          </template>
          <template #default="scope">
            <div>
              {{ scope.row.createdTime }}
            </div>
          </template>
        </el-table-column>
        <el-table-column width="220" align="center">
          <template #header>
            <el-icon><Operation /></el-icon>
            <span>操作类型</span>
          </template>
          <template #default="scope">
            <div>
              {{ scope.row.type }}
            </div>
          </template>
        </el-table-column>
        <el-table-column>
          <template #header>
            <el-icon>
              <Document />
            </el-icon>
            <span>操作内容</span>
          </template>
          <template #default="scope">
            <div>
              {{ scope.row.message }}
            </div>
          </template>
        </el-table-column>
      </el-table>
      <Pages :total="total" @search="searchData"></Pages>
    </el-dialog>
  </div>
</template>
<script setup>
import { getfileLogPage } from '@/api/modules/file'
import { dateToString } from '@/utils/dateTool'
const dialogVisible = ref(false)
let queryForm = reactive({
  fileFolderId: '',
  page: 0,
  size: 10,
  sort: 'createdTime,DESC'
})
let dialogTitle = ref('文件日志')
const searchData = params => {
  queryForm.value.page = params.page
  queryForm.value.size = params.size
  initData()
}
let logList = ref([])
let total = ref(0)
const initData = () => {
  getfileLogPage({ ...queryForm, isDeleted: false, sort: 'createdTime,DESC' }).then(res => {
    if (res && res.content && res.content.length) {
      res.content.forEach(ele => {
        ele.createdTime = dateToString(ele.createdTime)
        ele.lastUpdatedTime = dateToString(ele.lastUpdatedTime)
        ele.type = opreationType.value[ele.type]
      })
    }
    total = res.totalElements
    logList.value = res.content
  })
}
let opreationType = ref({
  CREATE_FILE: '上传文件',
  DOWN_LOAD_FILE: '下载文件',
  DELETE_FILE: '删除文件',
  RESTORE_FILE: '恢复文件',
  COPY_FILE: '复制文件',
  MOVE_FILE: '移动文件',
  AUTH_FILE: '赋予权限',
  CREATE_CATEGORY: '上传文件夹',
  DELETE_CATEGORY: '删除文件夹',
  RESTORE_CATEGORY: '恢复文件夹',
  COPY_CATEGORY: '复制文件夹',
  MOVE_CATEGORY: '移动文件夹',
  AUTH_CATEGORY: '赋予权限',
  RENAME_CATEGORY: '重命名文件夹',
  RENAME_FILE: '重命名文件'
})
const openDialog = row => {
  if (row.type === 'FOLDER') {
    queryForm.fileCategoryId = row.id
    delete queryForm.fileFolderId
  } else {
    queryForm.fileFolderId = row.id
    delete queryForm.fileCategoryId
  }
  dialogTitle.value = row.name + ' - 日志详情'

  initData()
  dialogVisible.value = true
}
defineExpose({ openDialog })
</script>
<style lang="scss" scoped></style>
