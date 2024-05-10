<template>
  <div class="page-container">
    <Department
      ref="departmentRef"
      :id="depId"
      :name="depName"
      @search-person="searchPerson"
      @reset="tableData = []"
      @add-person="handleAdd"
    />
    <el-card class="person">
      <el-form>
        <div class="form-line">
          <el-form-item label="登录名">
            <el-input v-model.trim="queryForm.name" clearable placeholder="请输入" />
          </el-form-item>
          <el-form-item label="真实姓名">
            <el-input v-model.trim="queryForm.realName" clearable placeholder="请输入" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model.trim="queryForm.phone" clearable placeholder="请输入" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="queryForm.roleIds" multiple placeholder="请选择">
              <el-option label="超级管理员" :value="103041" />
              <el-option label="管理员" :value="103043" />
              <el-option label="普通用户" :value="103042" />
            </el-select>
          </el-form-item>

          <el-form-item label="账号状态">
            <el-select v-model="queryForm.isDeleted" placeholder="请选择">
              <el-option label="未冻结" :value="false" />
              <el-option label="已冻结" :value="true" />
            </el-select>
          </el-form-item>
          <el-button type="primary" @click="pageInit">查询</el-button>
          <el-button type="primary" @click="resetSearch">重置</el-button>
        </div>
      </el-form>
      <!-- 表格控件 -->
      <el-table v-loading="tableLoading" border :row-class-name="tableRowClassName" :data="tableData">
        <el-table-column align="center" label="序号" type="index" width="80" />
        <el-table-column align="center" label="登录名" prop="name"> </el-table-column>
        <el-table-column align="center" label="真实姓名" prop="realName"> </el-table-column>
        <el-table-column align="center" label="联系方式" prop="phone"> </el-table-column>
        <el-table-column align="center" label="角色信息" min-width="100">
          <template #default="{ row }">
            <div class="flex-wrap">
              <div v-for="item in row.roleList" class="mr-2" :key="item.id">
                <el-tag type="success" v-if="item.name === 'Admin'"> {{ item.description }}</el-tag>
                <el-tag type="warning" v-else-if="item.name === 'Manage'"> {{ item.description }}</el-tag>
                <el-tag v-else> {{ item.description }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column align="center" label="冻结账号">
          <template #default="{ row }">
            <el-switch
              v-model="row.isDeleted"
              @change="handleLock(row)"
              style="--el-switch-on-color: #ff4949; --el-switch-off-color: #13ce66"
            />
          </template>
        </el-table-column>

        <el-table-column align="center" label="操作" width="300">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleAllot(row)" v-if="isAdmin">分配角色</el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" size="small" @click="handleRestPassword(row)" v-if="isAdmin || isManage">
              重置密码
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <Pages :total="tableTotal" @search="searchData"></Pages>
    </el-card>
    <el-dialog v-model="dialogShow" :close-on-click-modal="false" :close-on-press-escape="false" title="分配权限" width="25%">
      <el-form>
        <el-form-item label="分配人员" prop="name">
          {{ selectRow.realName }}
        </el-form-item>
        <el-form-item label="权限分配" prop="name">
          <el-checkbox-group v-model="checkList">
            <el-checkbox :label="103041">超级管理员</el-checkbox>
            <el-checkbox :label="103043">管理员</el-checkbox>
            <el-checkbox :label="103042">普通用户</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div class="flex-center just-center">
        <el-button @click="dialogShow = false">取消</el-button>
        <el-button type="primary" @click="submitAllot">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="closeDialog"
      :title="dialogTitle"
      width="25%"
    >
      <el-form :model="dialogForm" ref="dialogRef" :rules="formRules">
        <el-form-item label="用户名称" prop="name">
          <el-input v-model="dialogForm.name" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="dialogForm.realName" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="联系方式" prop="phone">
          <el-input v-model="dialogForm.phone" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="所属部门：" prop="depIds">
          <el-select v-model="dialogForm.depIds" multiple placeholder="请选择" style="width: 100%">
            <el-option v-for="item in departmentList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="flex-center just-center">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitDialog">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { getUserPage, restPassword, modifyUserInfo, addUser, setRoles, lockUser, unLockUser } from '@/api/modules/user'
import { getAuthDepartment } from '@/api/modules/department'
import Department from './components/department.vue'
import { filterParam } from '@/utils/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import { GlobalStore } from '@/stores'
import { apiFun } from '@/api/apiFun'
const departmentApi = apiFun('/departments')
const globalStore = GlobalStore()
const { isAdmin, isManage } = storeToRefs(globalStore)
onMounted(() => {
  if (isAdmin.value) {
    pageInit()
    getDepartment()
  } else {
    //非最高管理员
    manageInit()
    getDepartment()
  }
})

let depId = ref(-1)
let depName = ref('全部用户')
//获取自己有权限的部门
const manageInit = () => {
  getAuthDepartment().then(res => {
    if (res.length > 0) {
      queryForm.depIds = res[0].id
      depId.value = res[0].id

      depName.value = res[0].name

      pageInit()
    }
  })
}
//编辑用户的部门列表
let departmentList = ref([])
const getDepartment = () => {
  let params = {
    page: 0,
    size: 100
  }
  departmentApi.findPage(params).then(res => {
    departmentList.value = res.content
  })
}
let dialogShow = ref(false)
let checkList = ref([])
let selectRow = ref({})
//表格颜色
const tableRowClassName = ({ row }) => {
  if (row.roleList.some(item => item.name === 'Admin')) {
    return 'admin-row'
  }
  if (row.roleList.some(item => item.name === 'Manage')) {
    return 'manage-row'
  }

  return ''
}

const handleAllot = row => {
  selectRow.value = row
  checkList.value = row.roleList.map(item => item.id)
  console.log(checkList.value)
  dialogShow.value = true
}
const submitAllot = () => {
  const data = {
    userId: selectRow.value.id,
    roleIds: checkList.value
  }
  setRoles(selectRow.value.id, data).then(() => {
    pageInit()
    dialogShow.value = false
    ElMessage.success('设置成功！')
  })
}
const handleLock = async row => {
  row.isDeleted ? await lockUser(row.id) : await unLockUser(row.id)
  ElMessage.success('设置成功！')
  pageInit()
}
//重置查询
const departmentRef = ref()
const resetSearch = () => {
  Object.assign(queryForm, { name: '', depIds: null, phone: '', roleIds: '' })
  departmentRef.value.depIds = ''
  departmentRef.value.depName = ''
  pageInit()
}

const queryForm = reactive({
  name: '',
  roleIds: [],
  depIds: '',
  phone: '',
  isDeleted: false
})
let tableTotal = ref(0)
let tableData = ref([])
let tableLoading = ref(false)
const searchPerson = depIds => {
  if (depIds === -1) {
    delete queryForm.depIds
  } else {
    queryForm.depIds = depIds
  }

  pageInit()
}
//分页查询

const searchData = params => {
  queryForm.page = params.page
  queryForm.size = params.size
  pageInit()
}
const pageInit = () => {
  tableLoading.value = true
  let params = {
    ...queryForm,
    sort: 'createdTime,DESC'
  }
  params = filterParam(params)
  if (params.roleIds && params.roleIds.length) {
    params.roleIds = params.roleIds.join(',')
  }

  getUserPage(params)
    .then(res => {
      tableLoading.value = false
      tableData.value = res.content
      tableTotal.value = res.totalElements
    })
    .catch(() => {
      tableLoading.value = false
    })
}

const handleRestPassword = row => {
  ElMessageBox.confirm(`该操作将重置 “${row.realName}” 密码, 是否继续？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    restPassword(row.id).then(res => {
      pageInit()
      ElMessageBox({
        title: '重置成功！',
        message: h('p', null, [
          h('span', null, '用户'),
          h('span', { style: 'color: #18689e' }, ` ${row.name} `),
          h('span', null, `重置密码成功，重置为 ${res}`)
        ]),
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
    })
  })
}

let dialogTitle = ref()
let dialogVisible = ref(false)
let dialogForm = reactive({
  name: '',
  realName: '',
  phone: null
})
const reg_tel_phone = /(^((\+86)|(86))?(1[3-9])\d{9}$)|(^(0\d{2,3})-?(\d{7,8})$)/
const formRules = {
  name: [
    { required: true, message: '请输入登录名', trigger: 'blur' },
    {
      min: 3,
      max: 20,
      message: '长度在 3 到 20 个字符',
      trigger: 'blur'
    }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    {
      min: 2,
      max: 20,
      message: '长度在 2 到 20 个字符',
      trigger: 'blur'
    }
  ],

  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: reg_tel_phone, message: '请输入正确的手机号或座机号', trigger: ['blur', 'change'] }
  ]
}
const handleAdd = id => {
  dialogForm.depIds = id && id > 0 ? [id] : null

  dialogVisible.value = true
  dialogTitle.value = '新增用户'
}
const handleEdit = row => {
  Object.assign(dialogForm, row)
  dialogForm.depIds = row.departments.map(item => item.id)
  dialogVisible.value = true
  dialogTitle.value = '修改用户'
}
const dialogRef = ref()
const submitDialog = () => {
  dialogRef.value.validate(valid => {
    if (valid) {
      if (dialogTitle.value.includes('新增')) {
        const params = {
          email: `${new Date().getTime()}qq.com`,
          employerIds: [1],
          idCardNo: new Date().getTime(),
          name: dialogForm.name,
          password: 'a123456',
          phone: dialogForm.phone,
          depIds: dialogForm.depIds,
          realName: dialogForm.realName,
          sex: 'MALE',
          userTenantDtos: [
            {
              profession: 'TEACHER',
              tenantId: 1,
              type: 'COMMON'
            }
          ]
        }
        addUser(params).then(() => {
          ElMessage.success('添加成功')
          closeDialog()
          pageInit()
        })
      } else {
        const userTenantDtos = dialogForm.userTenants.map(item => {
          return {
            profession: item.userTenantProfession,
            tenantId: item.tenant.id,
            type: item.userTenantType
          }
        })
        let params = {
          name: dialogForm.name,
          realName: dialogForm.realName,
          phone: dialogForm.phone,
          idCardNo: dialogForm.idCardNo,
          email: dialogForm.email,
          sex: dialogForm.sex,
          depIds: dialogForm.depIds,
          userTenantDtos
        }
        modifyUserInfo(dialogForm.id, params).then(() => {
          ElMessage.success('修改成功')
          closeDialog()
          pageInit()
        })
      }
    }
  })
}

const closeDialog = () => {
  dialogRef.value.resetFields()
  dialogVisible.value = false
  dialogTitle.value = '新增用户'
  Object.assign(dialogForm, {
    id: null,
    name: '',
    realName: '',
    phone: null,
    depIds: []
  })
}
</script>
<style>
.el-table .admin-row {
  --el-table-tr-bg-color: #d7edcc;
}
.el-table .manage-row {
  --el-table-tr-bg-color: #fff6ea;
}
.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell {
  background-color: transparent !important;
}
</style>
<style lang="scss" scoped>
@import './index.scss';

.mr-2 {
  margin-right: 2px;
}
.flex-wrap {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.form-line {
  display: flex;
  // flex-wrap: wrap;
  width: 100%;
  .el-form-item {
    margin: 0 2px 22px;
    width: 20%;
  }
  :deep(.el-form-item__label) {
    padding: 0 6px 0 0 !important;
  }
}
</style>
