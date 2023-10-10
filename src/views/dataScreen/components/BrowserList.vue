<template>
  <div style="text-align: left">
    <el-form :inline="true">
      <el-form-item label="操作类型:">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择操作类型"
          @change="pageInit()"
          style="margin-bottom: 12px; margin-right: 12px"
        >
          <el-option label="全部" value="" />
          <el-option v-for="(value, key) in opreationType" :key="key" :label="value" :value="key" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-table stripe :data="tableData" style="width: 100%">
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
      <!-- <el-table-column label="操作" width="160">
        <template #default="scope">
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column> -->
    </el-table>
    <div class="page-container">
      <el-pagination
        v-model:current-page="pageInfo.page"
        v-model:page-size="pageInfo.size"
        background
        :page-sizes="[10, 15, 20, 25]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pageInfo.totalNum"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { dateToString } from '@/utils/dateTool'
import { getfileLogPage, getfileLogList } from '@/api/modules/file'
import { GlobalStore } from '@/stores'
const globalStore = GlobalStore()
onMounted(() => {
  pageInit()
})
let queryParams = ref({
  endTime: '',
  fileFolderId: '',
  level: '',
  message: '',
  createdBy: globalStore.userInfo.user_id,
  page: 0,
  size: 10,
  sort: 'createdTime,DESC',
  startTime: '',
  type: ''
})
let pageInfo = ref({
  totalNum: 0,
  page: 1,
  size: 10
})
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
  AUTH_CATEGORY: '赋予权限'
})
let tableData = ref([])
const pageInit = () => {
  const query = {}
  Object.keys(queryParams.value).forEach(key => {
    if (queryParams.value[key] !== '' && queryParams.value[key] !== undefined) {
      query[key] = queryParams.value[key]
    }
  })
  getfileLogPage(query).then(res => {
    if (res && res.content && res.content.length) {
      res.content.forEach(ele => {
        ele.createdTime = dateToString(ele.createdTime)
        ele.lastUpdatedTime = dateToString(ele.lastUpdatedTime)
        ele.type = opreationType.value[ele.type]
        console.log(ele.type)
      })
    }
    pageInfo.value.totalNum = res.totalElements
    tableData.value = res.content
  })
}
function handleSizeChange(val) {
  queryParams.value.size = val
  pageInit()
}
function handleCurrentChange(val) {
  queryParams.value.page = val - 1
  pageInit()
}
</script>
<style lang="scss" scoped>
.share_btn {
  float: left;
  margin-top: 10px;
}
.main {
  margin-top: 40px;
  margin-bottom: 40px;
}
.page-container {
  width: fit-content;
  margin: 0 auto;
  margin-top: 24px;
}
.query-condition {
  display: flex;
}
:deep() {
  .el-table__header-wrapper .el-icon {
    font-size: 1rem;
    line-height: 1.5rem;
    top: 0.125rem;
    margin-right: 0.5rem;
  }
  .el-table .warning-row {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
  }
  .el-table .success-row {
    --el-table-tr-bg-color: var(--el-color-success-light-9);
  }
}
</style>
