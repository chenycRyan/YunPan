<template>
  <el-card>
    <div class="query-condition">
      <el-form :inline="true">
        <el-form-item label="操作类型:">
          <el-select v-model="queryParams.type" placeholder="请选择操作类型" clearable @change="getLogList">
            <el-option label="全部" value="" />
            <el-option v-for="(value, key) in opreationType" :key="key" :label="value" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="日志类型:">
          <el-select v-model="queryParams.level" placeholder="请选择日志类型" clearable @change="getLogList">
            <el-option label="全部" value="" />
            <el-option label="记录" value="INFO" />
            <el-option label="异常" value="ERROR" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门:" v-if="isAdmin || isManage">
          <el-select v-model="depId" placeholder="请选择所属部门" @change="getUser" clearable>
            <el-option v-for="item in depList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人员:" v-if="(isAdmin || isManage) && depId">
          <div class="pom">
            <el-select
              v-model="queryParams.createdBy"
              placeholder="请选择操作人员"
              @change="getLogList"
              clearable
              :class="depId && !queryParams.createdBy ? 'border-red' : ''"
            >
              <el-option v-for="item in userList" :key="item.id" :label="item.realName" :value="item.id" />
            </el-select>
            <div class="tip" v-if="depId && !queryParams.createdBy">选择部门后，请选择人员！</div>
          </div>
        </el-form-item>
        <el-form-item><el-button type="primary" class="ml-10" @click="getLogList">查询</el-button></el-form-item>
      </el-form>
    </div>
    <el-table stripe :data="logList" v-loading="tableLoading" style="width: 100%">
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

      <el-table-column width="150" align="center">
        <template #header>
          <el-icon><User /></el-icon>
          <span>操作人员</span>
        </template>
        <template #default="scope">
          <div>
            {{ scope.row.createdByName }}
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
  </el-card>
</template>

<script setup>
import { ElMessage, vLoading, ElMessageBox } from 'element-plus'
import { getAuthDepartment } from '@/api/modules/department'
import { getUserList } from '@/api/modules/user'
import { dateToString } from '@/utils/dateTool'
import { getfileLogPage, deletefileLogById } from '@/api/modules/file'
import { GlobalStore } from '@/stores'
const globalStore = GlobalStore()
const { isAdmin, isManage } = storeToRefs(globalStore)
let fileTraceUrl = ref('')
let headers = ref({
  Authorization: ''
})

let queryParams = ref({
  createdBy: null,
  endTime: '',
  fileFolderId: '',
  level: '',
  message: '',
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

onMounted(() => {
  fileTraceUrl.value = window.appsetings.base_URL + '/file/get/file-type'
  headers.value.Authorization = 'Bearer' + globalStore.token
  getLogList()
  getDepartment()
})
let depId = ref('')
let depList = ref([])
const getDepartment = () => {
  getAuthDepartment().then(res => {
    depList.value = res
  })
}
let userList = ref([])
const getUser = () => {
  queryParams.value.createdBy = ''

  getUserList({ depIds: depId.value }).then(res => {
    userList.value = res
  })
}

let logList = ref([])
let tableLoading = ref(true)
const getLogList = () => {
  const query = {}
  Object.keys(queryParams.value).forEach(key => {
    if (queryParams.value[key] !== '' && queryParams.value[key] !== undefined) {
      query[key] = queryParams.value[key]
    }
  })
  tableLoading.value = true
  getfileLogPage({ ...query, isDeleted: false, sort: 'createdTime,DESC' })
    .then(res => {
      tableLoading.value = false
      if (res && res.content && res.content.length) {
        res.content.forEach(ele => {
          ele.createdTime = dateToString(ele.createdTime)
          ele.lastUpdatedTime = dateToString(ele.lastUpdatedTime)
          ele.type = opreationType.value[ele.type]
          console.log(ele.type)
        })
      }
      pageInfo.value.totalNum = res.totalElements
      logList.value = res.content
      console.log(logList)
    })
    .catch(() => {
      tableLoading.value = false
    })
}
function handleDelete(row) {
  ElMessageBox.confirm('确定删除此条日志么?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      deletefileLogById(row.id).then(() => {
        ElMessage.success('删除成功')
        getLogList()
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消删除'
      })
    })
}
function handleSizeChange(val) {
  queryParams.value.size = val
  getLogList()
}
function handleCurrentChange(val) {
  queryParams.value.page = val - 1
  getLogList()
}
</script>

<style scoped lang="scss">
.border-red {
  border: 1px solid red;
}
.pom {
  position: relative;
}
.tip {
  font-size: 12px;
  position: absolute;
  bottom: -28px;
  color: red;
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
