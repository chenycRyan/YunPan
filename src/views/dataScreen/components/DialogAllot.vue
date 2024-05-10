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
    <div class="row-line">
      <div class="row-left">
        <el-table :data="departmentData" row-key="id" @expand-change="expandRow">
          <el-table-column type="expand" width="30">
            <template #default="scope">
              <ExpandLine></ExpandLine>
              <el-table :data="scope.row.personList" style="width: 100%">
                <el-table-column width="55">
                  <template #header>
                    <el-checkbox
                      v-model="scope.row.checkedAll"
                      @change="changeAllSelection(scope.row.personList, scope.row.checkedAll)"
                    />
                  </template>
                  <template #default="{ row }">
                    <el-checkbox v-model="row.checked" :disabled="row.disChecked" @change="changePersonSelection(row)" />
                  </template>
                </el-table-column>
                <el-table-column label="用户名" prop="realName"></el-table-column>
                <el-table-column label="联系方式" prop="phone"></el-table-column>
              </el-table>
            </template>
          </el-table-column>
          <el-table-column label="群组名称" prop="name"></el-table-column>
          <el-table-column label="已分配成员" prop="count">
            <template #default="{ row }">
              <span style="color: #e6a23c">{{ row.count }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="row-right">
        <!-- 权限说明对照表 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item v-for="item in levelList" :key="item.value">
            <template #label> {{ item.display }} </template>
            {{ item.label }}
          </el-descriptions-item>
        </el-descriptions>
        <!-- 已分配成员列表 -->
        <template v-if="lastList.length > 0">
          <el-divider content-position="left" border-style="dashed"> 已分配成员</el-divider>
          <div class="flex-center">
            <span>批量分配权限：</span>
            <el-select v-model="lastType" placeholder="请选择" @change="changeLastType" clearable>
              <el-option v-for="item in levelList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <span class="msg_text">右键选择成员单独分配权限！</span>
          </div>
          <el-popover
            v-for="tag in lastList"
            :key="tag.id"
            placement="bottom"
            trigger="contextmenu"
            :title="`${tag.name}权限分配`"
            :width="220"
          >
            <template #reference>
              <el-tag closable @close="closeLastTag(tag)" :key="tag.id" class="tag-item">
                {{ tag.name }} <span style="color: #f56c6c">{{ filterLevel(tag.type) }}</span>
              </el-tag>
            </template>
            <el-select v-model="tag.type" placeholder="请选择">
              <el-option v-for="item in levelList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-popover>
        </template>
        <!-- 待分配成员列表 -->
        <el-divider content-position="left" border-style="dashed">待分配成员</el-divider>
        <div v-if="waitList.length > 0">
          <span>批量分配权限：</span>
          <el-select v-model="checkType" placeholder="请选择" @change="changeCheckType" clearable>
            <el-option v-for="item in levelList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <span class="msg_text">右键选择成员单独分配权限！</span>
        </div>
        <el-popover
          v-for="tag in waitList"
          :key="tag.id"
          placement="bottom"
          trigger="contextmenu"
          :title="`${tag.name}权限分配`"
          :width="220"
        >
          <template #reference>
            <el-tag :closable="tag.id !== userId" @close="closeTag(tag)" class="tag-item m-2" style="cursor: pointer">
              {{ tag.name }} <span style="color: #f56c6c">{{ filterLevel(tag.type) }}</span>
            </el-tag>
          </template>
          <el-select v-model="tag.type" placeholder="请选择">
            <el-option v-for="item in levelList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-popover>
      </div>
    </div>
    <div class="flx-end">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="btnLoading" @click="submitDialog">确定</el-button>
    </div>
  </el-dialog>
</template>
<script setup>
import { getUserList, getAdminList } from '@/api/modules/user'
import { filterParam } from '@/utils/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiFun } from '@/api/apiFun'
import { getFileUser, batchFolders, deleteUserAuth } from '@/api/modules/auth-file'
import { getSonFolder } from '@/api/modules/folder'
import { GlobalStore } from '@/stores'
import ExpandLine from '@/components/ExpandLine/index.vue'

let adminList = ref([])
//待分配列表
let waitList = ref([])
//已分配列表
let lastList = ref([])
let departments = ref([])
const checkType = ref()
const lastType = ref()
const changeCheckType = () => {
  waitList.value.forEach(ele => {
    ele.type = checkType.value
  })
}
const changeLastType = () => {
  lastList.value.forEach(ele => {
    ele.type = lastType.value
  })
  console.log(lastList.value)
}
//获取文件关联的权限列表
const getBindUser = data => {
  return getFileUser(data).then(res => {
    let departmentSet = []
    let list = res.map(item => {
      return {
        type: item.type,
        userVo: item.userVo
      }
    })
    list = [...new Set(list.map(v => JSON.stringify(v)))].map(s => JSON.parse(s))
    lastList.value = list.map(item => {
      departmentSet = [...departmentSet, ...item.userVo.departments]
      return {
        id: item.userVo.id,
        name: item.userVo.realName,
        type: item.type
      }
    })

    departments.value = [...new Set(departmentSet.map(v => JSON.stringify(v)))].map(s => JSON.parse(s))
    departments.value.forEach(m => {
      m.count = 0
      departmentSet.forEach(n => {
        if (m.id === n.id) {
          m.count++
        }
      })
    })
    // waitList.value = JSON.parse(JSON.stringify(lastList.value))
    waitList.value = []
    //待分配成员---过滤当前登录人的
    lastList.value = lastList.value.filter(item => item.id !== userId.value)
    //待分配成员---过滤超管的
    lastList.value = lastList.value.filter(item => !adminList.value.some(n => n.id === item.id))
  })
}

const globalStore = GlobalStore()
const userId = computed(() => {
  return globalStore.userInfo.user_id
})

const expandRow = (row, expandedRows) => {
  console.log(row, expandedRows)
  if (expandedRows.includes(row)) {
    let params = {
      depIds: row.id.toString()
    }
    params = filterParam(params)
    getUserList(params).then(res => {
      row.personList = res

      row.personList.forEach(m => {
        //选中当前已分配人员
        m.checked = lastList.value.some(n => n.id === m.id) || m.id === userId.value
        const isAdmin = m.roleList.some(n => n.name === 'Admin')
        //禁用当前用户和超管的权限分配
        m.disChecked = m.id === userId.value || isAdmin
      })
    })
  }
}
const departmentApi = apiFun('/departments')
const emits = defineEmits(['search'])

const levelList = ref([
  { value: 'ONE', display: '0', label: '不可见' },
  { value: 'READ_ONLY', display: '1', label: '查看' },
  { value: 'TWO', display: '2', label: '查看、上传、创建' },
  { value: 'THREE', display: '3', label: '查看、上传、创建、下载' },
  { value: 'FOUR', display: '4', label: '查看、上传、创建、下载、复制、移动、重命名' },
  { value: 'FIVE', display: '5', label: '最高权限' }
])
const filterLevel = status => {
  console.log(status)
  if (status) {
    const item = levelList.value.find(item => item.value === status)
    if (item) {
      return ' 权限' + item.display
    }
  }
}
let dialogVisible = ref(false)
let dialogTitle = ref('分配权限')
let selectRows = ref([])
const initDialog = async row => {
  dialogVisible.value = true
  selectRows.value = row
  //获取超管列表
  const res = await getAdminList()
  adminList.value = res.content
  let fileCategoryIds = []
  let fileFolderIds = []
  row.forEach(item => {
    if (item.type === 'FOLDER') {
      fileCategoryIds.push(item.id)
    } else {
      fileFolderIds.push(item.id)
    }
  })
  let params = { fileCategoryIds: fileCategoryIds.join(','), fileFolderIds: fileFolderIds.join(',') }

  console.log(params)

  await getBindUser(params)
  getDepartmentList()
}

let departmentData = ref([])
/*---------群组-------*/
const queryForm = reactive({
  name: '',
  page: 0,
  size: 20,
  isDeleted: false,
  sort: 'createdTime,DESC'
})
//获取群组列表
const getDepartmentList = () => {
  let params = {
    ...queryForm,
    isDeleted: false,
    sort: 'createdTime,DESC'
  }
  params = filterParam(params)
  departmentApi.findPage(params).then(res => {
    departmentData.value = res.content
    departmentData.value.forEach(m => {
      m.checkedAll = false
      departments.value.forEach(n => {
        if (m.id === n.id) {
          m.count = n.count
        }
      })
    })
    console.log(departments.value, departmentData.value)
  })
}

/*---------人员-------*/

let tableData = ref([])

const changeAllSelection = (list, checkedAll) => {
  console.log(list, checkedAll)
  list.forEach(item => {
    // //选中当前已分配人员

    const isCheck = lastList.value.some(n => n.id === item.id)
    if (isCheck && checkedAll) {
      ElMessage.warning(item.name + '已经已经在分配列表')
    }
    const isAdmin = item.roleList.some(n => n.name === 'Admin')
    if (isAdmin && checkedAll) {
      ElMessage.warning(item.name + '为超管，不可分配权限')
    }

    if (!(isAdmin || isCheck)) {
      item.checked = checkedAll
      changePersonSelection(item)
    }
  })
}

const changePersonSelection = row => {
  if (row.checked) {
    waitList.value.push({
      id: row.id,
      name: row.realName,
      type: checkType.value
    })
  } else {
    waitList.value = waitList.value.filter(item => item.id !== row.id)
    lastList.value = lastList.value.filter(item => item.id !== row.id)
  }

  console.log(waitList.value)
}
const closeTag = row => {
  //删除数组中当前选中的
  waitList.value = waitList.value.filter(item => item.id !== row.id)
  //同步取消表格选中
  departmentData.value.forEach(m => {
    if (m.personList && m.personList.length) {
      m.personList.forEach(n => {
        n.checked = waitList.value.some(s => s.id === n.id)
      })
    }
  })
}
const closeLastTag = async row => {
  //删除数组中当前选中的

  console.log(row)

  const folderList = selectRows.value.filter(item => item.type === 'FOLDER').map(item => item.id)

  //组装id,将当前文件夹的

  let fileCategoryIds = []
  if (folderList.length) {
    const res = await getSonFolder({ ids: folderList.toString() })
    fileCategoryIds = res.map(item => item.id).concat()
  }
  deleteUserAuth(fileCategoryIds.join(','), row.id).then(() => {
    ElMessage.success(row.name + '权限删除成功！')
    lastList.value = lastList.value.filter(item => item.id !== row.id)
    //同步取消表格选中
    departmentData.value.forEach(m => {
      if (m.personList && m.personList.length) {
        m.personList.forEach(n => {
          n.checked = lastList.value.some(s => s.id === n.id)
        })
      }
    })
  })
}
let parentIds = ref([])
//递归处理parentIds
const getParent = obj => {
  if (obj) {
    if (obj.parent) {
      getParent(obj.parent)
    }
    parentIds.value.push(obj.id)
  }
}
//提交分组管理
const submitDialog = async () => {
  let userMap = {}
  let name = ''
  const mergedArray = [...waitList.value, ...lastList.value]
  mergedArray.forEach(ele => {
    userMap[ele.id] = ele.type
    if (!ele.type) {
      name = name + ele.name + '  '
    }
  })
  if (!mergedArray.length) {
    ElMessageBox.confirm('待分配成员为空，当前操作将重置该文件的权限, 是否继续？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      submitApi(userMap)
    })
  } else if (name) {
    ElMessage.warning(`${name}还未分配权限`)
  } else {
    submitApi(userMap)
  }
}
let btnLoading = ref(false)

const submitApi = async userMap => {
  try {
    btnLoading.value = true
    if (selectRows.value.length === 0) return
    const folderList = selectRows.value.filter(item => item.type === 'FOLDER').map(item => item.id)

    parentIds.value = []
    //组装id,将当前文件夹的
    getParent(selectRows.value[0].parent)
    let fileCategoryIds = []
    if (folderList.length) {
      const res = await getSonFolder({ ids: folderList.toString() })
      fileCategoryIds = res.map(item => item.id).concat(parentIds.value)
    }

    if (fileCategoryIds.length) {
      batchFolders({
        userAuthMap: userMap,
        fileCurrentCategoryIds: folderList,
        fileCategoryIds: fileCategoryIds
      }).then(() => {
        btnLoading.value = false
        ElMessage.success('权限分配成功！')
        emits('search')
        closeDialog()
      })
    }
  } catch (error) {
    btnLoading.value = false
  }
}
const closeDialog = () => {
  departmentData.value = []
  waitList.value = []
  tableData.value = []
  checkType.value = undefined
  lastType.value = undefined
  dialogVisible.value = false
}
defineExpose({ initDialog })
</script>
<style lang="scss" scoped>
.msg_text {
  margin-left: 10px;
  font-size: 12px;
  color: #e6a23c;
}
:deep(.el-table__expanded-cell) {
  padding: 20px 20px 20px 50px !important;
}
.row-line {
  display: flex;
  flex-wrap: nowrap;
  :deep(.el-divider--vertical) {
    height: 31em;
  }
  .form-item {
    display: flex;
    align-items: center;
    span {
      width: 100px;
    }
  }
  .row-left {
    display: flex;
    flex-direction: column;
    padding-left: 10px;
    width: 360px;
    overflow: hidden;
    .column {
      display: flex;
      flex-direction: column;
    }
  }
  .row-right {
    border-left: 1px solid #eeeeee;
    padding-left: 10px;
    margin-left: 10px;
    width: calc(100% - 380px);
    .tag-item {
      margin: 5px;
      margin-top: 10px;
    }
  }
}
</style>
