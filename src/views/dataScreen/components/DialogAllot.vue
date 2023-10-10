<template>
  <el-dialog v-model="dialogVisible" @close="closeDialog" :title="dialogTitle" width="1000px">
    <div class="row-line">
      <div class="row-left">
        <el-table :data="depData" row-key="id" @expand-change="expandRow">
          <el-table-column type="expand" width="30">
            <template #default="scope">
              <ExpandLine></ExpandLine>
              <el-table :data="scope.row.personList" style="width: 100%">
                <el-table-column width="55">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.checked" @change="changePersonSelection(row)" />
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
        <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="100px">
          <el-form-item label="权限等级：" prop="type">
            <el-select v-model="ruleForm.type" placeholder="请选择">
              <el-option v-for="item in levelList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-divider border-style="dashed" />
        <el-tag v-for="tag in checkList" @close="closeTag(tag)" :key="tag.id" class="tag-item" closable>
          {{ tag.name }}{{ filterLevel(tag.type) }}
        </el-tag>
      </div>
    </div>
    <div class="flx-end">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="submitDialog">确定</el-button>
    </div>
  </el-dialog>
</template>
<script lang="ts" setup>
import { getUserPage, getUserList } from '@/api/modules/user'
import { filterParam } from '@/utils/index'
import { ElMessage } from 'element-plus'
import { apiFun } from '@/api/apiFun'
import { getFileUser, batchFolderByUser, batchFileByUser } from '@/api/modules/auth-file'
import { getSonFolder } from '@/api/modules/folder'
import { GlobalStore } from '@/stores'
import ExpandLine from '@/components/ExpandLine/index.vue'
import type { FormInstance, FormRules } from 'element-plus'
let checkList = ref<FileSpace.IdNameItf[]>([])
let departments = ref([])
//获取文件关联的权限列表
const getBindUser = (data: any) => {
  return getFileUser(data).then((res: any) => {
    // @ts-expect-error
    let depList = []
    let list = res.map(item => {
      return {
        type: item.type,
        userVo: item.userVo
      }
    })
    list = [...new Set(list.map(v => JSON.stringify(v)))].map(s => JSON.parse(s))
    checkList.value = list.map((item: any) => {
      // @ts-expect-error
      depList = [...depList, ...item.userVo.departments]
      return {
        id: item.userVo.id,
        name: item.userVo.realName,
        type: item.type
      }
    })
    // @ts-expect-error
    departments.value = [...new Set(depList.map(v => JSON.stringify(v)))].map(s => JSON.parse(s))
    departments.value.forEach((m: any) => {
      m.count = 0
      // @ts-expect-error
      depList.forEach(n => {
        if (m.id === n.id) {
          m.count++
        }
      })
    })
    console.log(checkList.value)
    console.log(departments.value)
  })
}
// @ts-expect-error
const expandRow = (row, expandedRows) => {
  console.log(row, expandedRows)
  if (expandedRows.includes(row)) {
    let params: TableSpace.paramObj = {
      depIds: row.id.toString()
    }
    params = filterParam(params)
    getUserList(params).then(res => {
      row.personList = res
      row.personList.forEach(m => {
        m.checked = checkList.value.some(n => n.id === m.id)
      })
    })
  }
}

// @ts-expect-error
const changePersonSelection = row => {
  const list1 = [
    {
      id: row.id,
      name: row.realName
    }
  ]

  const list2 = checkList.value.concat(list1)
  checkList.value = [...new Set(list2.map(v => JSON.stringify(v)))].map(s => JSON.parse(s))
  console.log(checkList.value)
}

const globalStore = GlobalStore()
const userId = computed(() => {
  return globalStore.userInfo.user_id
})
const departmentApi = apiFun('/departments')
const emits = defineEmits(['search'])
const ruleForm = reactive({
  type: ''
})
const rules = reactive<FormRules>({
  type: [{ required: true, message: '请选择权限等级', trigger: 'change' }]
})
const ruleFormRef = ref<FormInstance>()

const levelList = ref([
  { value: 'ONE', label: '无权限-不可见' },
  { value: 'TWO', label: '可查看、下载' },
  { value: 'THREE', label: '可查看、下载、上传、创建文件夹' },
  { value: 'FOUR', label: '可查看、下载、上传、创建、复制、移动、重命名文件夹/文件' },
  { value: 'FIVE', label: '最高权限-任意操作' }
])
const filterLevel = (status: string) => {
  if (status) {
    const item = levelList.value.find(item => item.value === status)
    if (item) {
      return '-' + item.label
    }
  }
}
let dialogVisible = ref(false)
let dialogTitle = ref('分配权限')
let selectRows = ref<FileSpace.RowItf[]>([])
const initDialog = async (row: FileSpace.RowItf[]) => {
  dialogVisible.value = true
  selectRows.value = row
  await getBindUser({ fileFolderIds: row.map(item => item.id).toString() })
  getDepartmentList()
}
let depTotal = ref(0)
let depData = ref<FileSpace.IdNameItf[]>([])
/*---------群组-------*/
const queryForm = reactive({
  name: '',
  page: 0,
  size: 10,
  isDeleted: false,
  sort: 'createdTime,DESC'
})
//分页查询
const searchData = (params: any) => {
  queryForm.page = params.page
  queryForm.size = params.size
  getDepartmentList()
}
//获取群组列表
const getDepartmentList = () => {
  let params: { [key: string]: any } = {
    ...queryForm,
    isDeleted: false,
    sort: 'createdTime,DESC'
  }

  params = filterParam(params)

  departmentApi.findPage(params).then(res => {
    depData.value = res.content
    depData.value.forEach(m => {
      departments.value.forEach(n => {
        // @ts-expect-error
        if (m.id === n.id) {
          // @ts-expect-error
          m.count = n.count
        }
      })
    })
    console.log(departments.value, depData.value)

    depTotal.value = res.totalElements
  })
}

/*---------人员-------*/
const personForm = reactive<TableSpace.IPage>({
  page: 0,
  size: 10
})
let tableData = ref([])
let tableTotal = ref(0)
const searchPerson = (params: TableSpace.IPage) => {
  personForm.page = params.page
  personForm.size = params.size
  getPerson()
}
//获取人员列表
const getPerson = () => {
  if (checkList.value.length) {
    let params: TableSpace.paramObj = {
      ...personForm,
      depIds: checkList.value.map(item => item.id).toString(),
      isDeleted: false,
      sort: 'createdTime,DESC'
    }

    params = filterParam(params)
    getUserPage<TableSpace.PageItf>(params).then(res => {
      tableData.value = res.content
      tableTotal.value = res.totalElements
    })
  } else {
    tableData.value = []
    tableTotal.value = 0
  }
}

const closeTag = (row: FileSpace.IdNameItf) => {
  checkList.value = checkList.value.filter(item => item.id !== row.id)
}
let parentIds = ref<number[]>([])
//递归处理parentIds
const getParent = (obj: FileSpace.IdNameItf) => {
  if (obj) {
    if (obj.parent) {
      getParent(obj.parent)
    }
    parentIds.value.push(obj.id)
  }
}
//提交分组管理
const submitDialog = async () => {
  const userIds = checkList.value.map(item => item.id)
  if (!userIds.length) {
    ElMessage.warning('至少选择一个人员！')
    return
  }
  if (!ruleFormRef.value) return
  ruleFormRef.value.validate(async valid => {
    if (valid) {
      if (selectRows.value.length === 0) return
      const folderList = selectRows.value.filter(item => item.type === 'FOLDER').map(item => item.id)
      const fileList = selectRows.value.filter(item => item.type !== 'FOLDER').map(item => item.id)
      parentIds.value = []
      //组装id,将当前文件夹的
      getParent(selectRows.value[0].parent as FileSpace.RowItf)
      let fileCategoryIds: number[] = []
      if (folderList.length) {
        const res = await getSonFolder<FileSpace.RowItf[]>({ ids: folderList.toString() })
        fileCategoryIds = res.map(item => item.id).concat(parentIds.value)
      }

      let p1, p2
      p1 = new Promise<void>(resolve => {
        if (fileCategoryIds.length) {
          batchFolderByUser({
            userIds: userIds,
            fileCategoryIds: fileCategoryIds,
            type: ruleForm.type
          }).then(() => {
            //保留当前登录管理员的最高文件夹权限
            batchFolderByUser({
              userIds: [userId.value],
              fileCategoryIds: fileCategoryIds,
              type: 'FIVE'
            }).then(() => {
              resolve()
            })
          })
        } else resolve()
      })
      //文件
      p2 = new Promise<void>(resolve => {
        if (fileList.length) {
          batchFileByUser({
            userIds: userIds,
            fileFolderIds: fileList,
            type: ruleForm.type
          }).then(() => {
            //保留当前登录管理员的最高文件夹权限
            batchFileByUser({ userIds: [userId.value], fileFolderIds: fileList, type: 'FIVE' }).then(() => {
              resolve()
            })
          })
        } else resolve()
      })
      Promise.all([p1, p2]).then(() => {
        ElMessage.success('权限分配成功！')
        emits('search')
        closeDialog()
      })
    } else {
      ElMessage.warning('请选择权限等级')
    }
  })
}
const closeDialog = () => {
  depData.value = []
  checkList.value = []
  tableData.value = []
  if (!ruleFormRef.value) return
  ruleFormRef.value.resetFields()
  dialogVisible.value = false
}
defineExpose({ initDialog })
</script>
<style lang="scss" scoped>
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
    width: 400px;
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
    width: 320px;
    max-height: 400px;
    .tag-item {
      margin: 5px;
    }
  }
}
</style>
