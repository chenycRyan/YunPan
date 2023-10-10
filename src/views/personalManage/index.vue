<template>
  <div class="page-container">
    <Department @search-person="searchPerson" @add-person="handleAdd" />
    <el-card class="person">
      <el-form>
        <div class="form-line">
          <el-form-item label="用户名称：">
            <el-input v-model.trim="queryForm.name" clearable placeholder="请输入" />
          </el-form-item>
          <el-button type="primary" @click="pageInit">查询</el-button>
        </div>
      </el-form>
      <!-- 表格控件 -->
      <el-table v-loading="tableLoading" border :data="tableData" stripe>
        <el-table-column align="center" label="序号" type="index" width="80" />
        <el-table-column align="center" label="用户名称" prop="name"> </el-table-column>
        <el-table-column align="center" label="真实姓名" prop="realName"> </el-table-column>
        <el-table-column align="center" label="联系方式" prop="phone"> </el-table-column>
        <el-table-column align="center" label="角色信息">
          <template #default="{ row }">
            <el-tag v-for="item in row.roleList" :key="item.id">{{ item.description }} </el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" label="操作" width="300">
          <template #default="{ row }">
            <el-button type="primary" size="mini" @click="handleAllot(row)">分配角色</el-button>
            <el-button type="primary" size="mini" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" size="mini" @click="handleRestPassword(row)">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>
      <Pages :total="tableTotal" @search="searchData"></Pages>
    </el-card>
    <el-dialog v-model="dialogShow" title="分配权限" width="25%">
      <el-form>
        <el-form-item label="分配人员" prop="name">
          {{ selectRow.realName }}
        </el-form-item>
        <el-form-item label="权限分配" prop="name">
          <el-checkbox-group v-model="checkList">
            <el-checkbox label="103041">超级管理员</el-checkbox>
            <el-checkbox label="103043">管理员</el-checkbox>
            <el-checkbox label="103042">普通用户</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div class="flex-center">
        <el-button @click="dialogShow = false">取消</el-button>
        <el-button type="primary" @click="submitAllot">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="dialogVisible" @close="closeDialog" :title="dialogTitle" width="25%">
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
      </el-form>
      <div class="flex-center">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitDialog">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { getUserPage, restPassword, modifyUserInfo, addUser, setRoles } from '@/api/modules/user'
import Department from './components/department.vue'
import { filterParam } from '@/utils/index'
import { ElMessage, ElMessageBox } from 'element-plus'

onMounted(() => {
  pageInit()
})
let dialogShow = ref(false)
let checkList = ref([])
let selectRow = ref({})
const handleAllot = row => {
  selectRow.value = row
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

const queryForm = reactive({
  name: ''
})
let tableTotal = ref(0)
let tableData = ref([])
let tableLoading = ref(false)
const searchPerson = depIds => {
  queryForm.depIds = depIds
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
    isDeleted: false,
    sort: 'createdTime,DESC'
  }
  params = filterParam(params)
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
  ElMessageBox.confirm('该操作将重置该用户密码, 是否继续？', '提示', {
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
  realName: [{ required: true, message: '请选择真实姓名', trigger: 'change' }],
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      min: 1,
      max: 20,
      message: '长度在 1 到 20 个字符',
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: reg_tel_phone, message: '请输入正确的手机号或座机号', trigger: ['blur', 'change'] }
  ]
}
const handleAdd = () => {
  dialogVisible.value = true
  dialogTitle.value = '新增用户'
}
const handleEdit = row => {
  Object.assign(dialogForm, row)

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
    phone: null
  })
}
</script>
<style lang="scss" scoped>
@import './index.scss';
.form-line {
  display: flex;
  .el-form-item {
    margin: 0 10px 22px;
    width: 20%;
  }
}
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
