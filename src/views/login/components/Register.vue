<template>
  <el-dialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    title="用户注册"
    width="500px"
    @close="closeDialog"
  >
    <el-form ref="registerFormRef" :model="registerForm" :rules="rules" label-width="100px">
      <el-form-item label="登录名：" prop="name">
        <el-input v-model.trim="registerForm.name" placeholder="请输入"></el-input>
      </el-form-item>
      <el-form-item label="密码：" prop="password">
        <el-input v-model.trim="registerForm.password" placeholder="请输入"></el-input>
      </el-form-item>
      <el-form-item label="真实姓名：" prop="realName">
        <el-input v-model="registerForm.realName" placeholder="请输入"></el-input>
      </el-form-item>
      <el-form-item label="联系方式：" prop="phone">
        <el-input v-model="registerForm.phone" placeholder="请输入"></el-input>
      </el-form-item>

      <el-form-item label="所属部门：" prop="depIds">
        <el-select v-model="registerForm.depIds" multiple placeholder="请选择" style="width: 100%">
          <el-option v-for="item in departmentList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitDialog">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup>
import { apiFun } from '@/api/apiFun'
const departmentApi = apiFun('/departments')
import { registerUser } from '@/api/modules/user'
import { ElMessage } from 'element-plus'
let dialogVisible = ref(false)
const rules = reactive({
  name: [
    { required: true, message: '请输入登录名必填', trigger: 'blur' },
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
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '长度不低于6位', trigger: 'blur' }
  ],
  depIds: [{ required: true, message: '请选择所属部门', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3456789]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
})
const closeDialog = () => {
  Object.assign(registerForm, {
    name: '',
    phone: '',
    realName: '',
    password: '',
    depIds: []
  })
  registerFormRef.value.resetFields()
  dialogVisible.value = false
}
const registerFormRef = ref()

let registerForm = reactive({
  name: '',
  phone: '',
  realName: '',
  password: '',
  depIds: []
})

onMounted(() => {
  getDepartment()
})
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
const submitDialog = () => {
  registerFormRef.value.validate(valid => {
    if (valid) {
      const params = {
        email: `${new Date().getTime()}qq.com`,
        employerIds: [1],
        idCardNo: new Date().getTime(),
        name: registerForm.name,
        password: registerForm.password || 'a123456',
        phone: registerForm.phone,
        depIds: registerForm.depIds,
        realName: registerForm.realName,
        sex: 'MALE',
        userTenantDtos: [
          {
            profession: 'TEACHER',
            tenantId: 1,
            type: 'COMMON'
          }
        ]
      }

      registerUser({ user: params }).then(() => {
        ElMessage.success('注册成功！')
        closeDialog()
      })
    }
  })
}
defineExpose({ dialogVisible })
</script>
<style lang="scss" scoped></style>
