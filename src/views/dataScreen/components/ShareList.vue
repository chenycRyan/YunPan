<template>
  <div>
    <el-table ref="multipleTableRef" :data="tableData" style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" :selectable="selectEnable" />
      <el-table-column label="是否失效">
        <template #default="scope">
          <el-tag :type="scope.row.flag ? '' : 'danger'" disable-transitions>{{ scope.row.flag ? '未失效' : '已失效' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分享类型">
        <template #default="scope">{{ timeLimit(scope.row.status) }}</template>
      </el-table-column>
      <el-table-column label="分享文件">
        <template #default="scope">
          <span style="color: #e6a23c" v-for="item in scope.row.fileFolderVo" :key="item.id"> {{ item.originName }}</span>
        </template>
      </el-table-column>

      <el-table-column property="verCode" label="验证码" />
      <el-table-column property="deadTime" label="失效日期" />
      <el-table-column property="deadTime" label="复制链接">
        <template #default="{ row }">
          <el-button v-copy="getLink(row)" size="small">
            <el-icon><CopyDocument /></el-icon>复制
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-button v-if="multipleSelection.length" class="share_btn" type="primary" @click="handleLose()">取消分享</el-button>
    <Pages :total="tableTotal" @search="searchData"></Pages>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { filterParam } from '@/utils/index'
import { getSharePage, loseShare } from '@/api/modules/share'
import { GlobalStore } from '@/stores'
import dayjs from 'dayjs'
const globalStore = GlobalStore()
const user_id = computed(() => globalStore.userInfo.user_id)
const user_name = computed(() => globalStore.userInfo.user_name)

onMounted(() => {
  pageInit()
})
const multipleTableRef = ref()
const multipleSelection = ref([])

const handleSelectionChange = val => {
  multipleSelection.value = val
}

let tableData = ref([])
let tableTotal = ref(0)
const queryForm = reactive({
  userId: user_id.value,
  page: 0,
  size: 10
})
const searchData = params => {
  queryForm.userId = user_id.value
  queryForm.page = params.page
  queryForm.size = params.size
  pageInit()
}
const pageInit = () => {
  let params = {
    ...queryForm,
    isDeleted: false,
    sort: 'createdTime,DESC'
  }
  //   if (user_name.value === 'admin') delete params.userId
  params = filterParam(params)
  getSharePage(params).then(res => {
    tableData.value = res.content
    tableData.value.forEach(item => {
      item.deadTime = dayjs(item.deadTime).format('YYYY-MM-DD HH:mm:ss')
    })

    tableTotal.value = res.totalElements
  })
}
function handleLose() {
  const ids = multipleSelection.value.map(item => item.id)
  ElMessageBox.confirm('该操作将取消分享, 是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loseShare({ ids }).then(() => {
      ElMessage.success('取消分享成功！')
      pageInit()
    })
  })
}
function selectEnable(row) {
  return row.flag
}
function timeLimit(val) {
  const obj = {
    A_DAY: '一天',
    SEVEN_DAYS: '一周',
    ONE_MONTH: '一月',
    PERMANENT: '永久'
  }
  return obj[val]
}
function getLink(row) {
  return `${window.location.href.split('#')[0]}#/share?id=${row.id}`
}
</script>
<style lang="scss" scoped>
.share_btn {
  float: left;
  margin-top: 10px;
}
</style>
