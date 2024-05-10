<template>
  <el-dialog
    v-model="dialogVisible"
    @close="closeDialog"
    top="2vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :title="dialogTitle"
    width="1000px"
  >
    <div v-show="showInfo">
      <div class="title">文件数量统计</div>
      <div class="flex-center just-center">
        <div class="row-item">
          <span class="label">文件夹总数：</span>
          <span class="num">{{ client.categoryNum }}</span>
        </div>
        <el-divider direction="vertical"></el-divider>
        <div class="row-item">
          <span class="label"> 文件总数：</span>
          <span class="num"> {{ client.fileFolderNum }}</span>
        </div>
        <el-divider direction="vertical"></el-divider>
        <div class="row-item">
          <span class="label"> 图片总数：</span>
          <span class="num"> {{ client.picNum }}</span>
        </div>
        <el-divider direction="vertical"></el-divider>
        <div class="row-item">
          <span class="label"> 文档总数：</span>
          <span class="num"> {{ client.docNum }}</span>
        </div>
        <el-divider direction="vertical"></el-divider>
        <div class="row-item">
          <span class="label"> 视频总数：</span>
          <span class="num"> {{ client.videoNum }}</span>
        </div>
      </div>
      <el-divider class="detail-divider"></el-divider>
    </div>

    <div class="title">文件权限查看</div>
    <el-descriptions :column="2" border>
      <el-descriptions-item v-for="item in levelList" :key="item.value">
        <template #label> {{ item.display }} </template>
        {{ item.label }}
      </el-descriptions-item>
    </el-descriptions>
    <el-form :model="queryForm" inline class="mt-10">
      <el-form-item label="权限等级">
        <el-select v-model="queryForm.type" placeholder="请选择权限等级" clearable @change="searchTable">
          <el-option label="查看全部" :value="0"> </el-option>
          <el-option v-for="item in levelList" :key="item.id" :label="'权限 ' + item.display" :value="item.value"> </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="所属部门">
        <el-select v-model="queryForm.department" placeholder="请选择所属部门" clearable @change="searchTable">
          <el-option label="查看全部" :value="0"> </el-option>
          <el-option v-for="item in departmentList" :key="item.id" :label="item.name" :value="item.name"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <el-table :data="tableData" border max-height="300px">
      <el-table-column label="用户名称" prop="realName"></el-table-column>
      <el-table-column label="所属部门" prop="departments"></el-table-column>
      <el-table-column label="角色" prop="roles"> </el-table-column>
      <el-table-column label="权限">
        <template #default="{ row }">
          <el-tag type="info"> 权限 {{ row.display }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
<script setup>
import { getFileUser } from '@/api/modules/auth-file'
import { calculateFolder } from '@/api/modules/folder'
import { apiFun } from '@/api/apiFun'

const departmentApi = apiFun('/departments')
let dialogVisible = ref()
let dialogTitle = ref()
let queryForm = reactive({
  type: null,
  department: null
})
let client = reactive({
  categoryNum: 0,
  fileFolderNum: 0,
  picNum: 0,
  docNum: 0,
  videoNum: 0
})
const closeDialog = () => {}
const levelList = ref([
  { value: 'ONE', display: '0', label: '不可见' },
  { value: 'READ_ONLY', display: '1', label: '查看' },
  { value: 'TWO', display: '2', label: '查看、上传、创建' },
  { value: 'THREE', display: '3', label: '查看、上传、创建、下载' },
  { value: 'FOUR', display: '4', label: '查看、上传、创建、下载、复制、移动、重命名' },
  { value: 'FIVE', display: '5', label: '最高权限' }
])
let tableData = ref([])
let departmentList = ref([])
let dataSet = ref([])
const getDepartment = () => {
  departmentApi.findList().then(res => {
    departmentList.value = res
  })
}
const getClient = id => {
  calculateFolder(id).then(res => {
    Object.assign(client, res)
  })
}
const filterLevel = status => {
  if (status) {
    const item = levelList.value.find(item => item.value === status)
    if (item) {
      return item.display
    }
  }
}

const searchTable = () => {
  tableData.value = JSON.parse(JSON.stringify(dataSet.value))
  if (queryForm.type) {
    tableData.value = dataSet.value.filter(item => item.type === queryForm.type)
  }
  if (queryForm.department) {
    tableData.value = dataSet.value.filter(item => item.departments.includes(queryForm.department))
  }
}
//获取文件关联的权限列表
const getBindUser = data => {
  return getFileUser(data).then(res => {
    let list = res.map(item => {
      return {
        type: item.type,
        userId: item.userVo.id,
        realName: item.userVo.realName,
        departments: item.userVo.departments.map(m => m.name).join(','),
        roles: item.userVo.roleList.map(n => n.description).join(',')
      }
    })

    list = [...new Set(list.map(v => JSON.stringify(v)))].map(s => JSON.parse(s))
    list.forEach(item => {
      item.display = filterLevel(item.type)
    })
    list = list.sort((a, b) => a.display - b.display)
    dataSet.value = JSON.parse(JSON.stringify(list))
    tableData.value = JSON.parse(JSON.stringify(list))
  })
}
let showInfo = ref(false)
const initDialog = async row => {
  showInfo.value = row.type === 'FOLDER'

  dialogVisible.value = true
  dialogTitle.value = '文件详情查看'
  let fileCategoryIds = row.type === 'FOLDER' ? row.id : ''
  let fileFolderIds = row.type !== 'FOLDER' ? row.id : ''
  let params = { fileCategoryIds: fileCategoryIds, fileFolderIds: fileFolderIds }

  console.log(params)

  await getBindUser(params)
  getDepartment()
  if (row.type === 'FOLDER') {
    getClient(row.id)
  }
}
defineExpose({ initDialog })
</script>

<style lang="scss" scoped>
.detail-divider {
  margin: 10px 0 20px !important;
}

.just-center {
  justify-content: space-between;
  margin-top: 10px;
  padding-left: 5px;
}
.row-item {
  display: flex;
  align-items: center;
  // justify-content: center;
  width: 130px;
  line-height: 36px;

  .label {
    font-weight: bold;
    color: #909399;
  }
  .num {
    color: #67c23a;
  }
}
.title {
  display: flex;
  margin-bottom: 20px;
  margin-top: 10px;
  font-size: 18px;
  line-height: 18px;
  &::before {
    border-radius: 4px;
    background-color: #409eff;
    width: 4px;
    height: 20px;
    margin: 0 4px;
    color: #409eff;
    content: '.';
  }
}
</style>
