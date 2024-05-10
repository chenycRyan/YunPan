<template>
  <div>
    <el-dialog
      title="修改密码"
      v-model="dialogVisible"
      class="user-profile-pwd-dialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="closeDialog"
    >
      <div class="pwd-wrap">
        <div class="pwd-bg">
          <div>CHANGE PASSWORD</div>
        </div>
        <p class="comment">注：密码长度必须大于等于6位！</p>
        <el-form ref="passwordFormRef" :model="formData" label-width="80px" :rules="formRules" class="user-pwd-form">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input show-password v-model="formData.oldPassword"></el-input>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input show-password v-model="formData.newPassword"></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="retypePassword">
            <el-input show-password v-model="formData.retypePassword"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button class="submit-btn" type="primary" @click.prevent="submitUpdatePassword">提交</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { ElMessage } from 'element-plus'
import { GlobalStore } from '@/stores'
import { updateUserPassword } from '@/api/modules/user'
import { resetRouter } from '@/routers/index'
import { LOGIN_URL } from '@/config/config'
const globalStore = GlobalStore()
const user_id = computed(() => globalStore.userInfo.user_id)
const router = useRouter()
const route = useRoute()
let dialogVisible = ref(false)

let validateRetypePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== formData.newPassword) {
    callback(new Error('两次输入的密码不一致!'))
  } else {
    callback()
  }
}
let formData = reactive({
  newPassword: '',
  oldPassword: '',
  retypePassword: ''
})
let formRules = reactive({
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '长度不低于6位', trigger: 'blur' }
  ],
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  retypePassword: [
    {
      required: true,
      validator: validateRetypePassword,
      trigger: 'blur'
    }
  ]
})
const passwordFormRef = ref()
const submitUpdatePassword = () => {
  passwordFormRef.value.validate(valid => {
    if (valid) {
      const data = {
        newPassword: formData.newPassword,
        oldPassword: formData.oldPassword,
        userId: user_id.value
      }

      // 修改密码
      updateUserPassword(user_id.value, data).then(() => {
        passwordFormRef.value.resetFields()
        // 2.清除 Token
        globalStore.setToken('')
        // 3.重置路由
        resetRouter()
        // 4.重定向到登陆页，并携带当前退出页地址和参数
        const path = `${LOGIN_URL}?redirect=${route.path}&params=${JSON.stringify(route.query ? route.query : route.params)}`
        router.replace(path)
        ElMessage.success('密码修改成功，请重新登陆！')
      })
    } else {
      ElMessage.warning('请按照提示完成内容填写')
    }
  })
}
const closeDialog = () => {
  passwordFormRef.value.resetFields()
  dialogVisible.value = false
}
defineExpose({ dialogVisible })
</script>
<style lang="scss" scoped>
.pwd-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pwd-bg {
  width: 95%;
  height: 66px;
  font-size: 18px;
  margin: 0 auto;
  background-image: url('@/assets/images/header/passwdBg.jpg');
  background-size: cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  p {
    text-align: center;
    &:first-child {
      font-size: 22px;
    }
    &:last-child {
      font-size: 12px;
      color: #bbb9b9;
    }
  }
  margin-bottom: 20px;
}
.submit-btn {
  width: 100%;
  text-align: center;
}
.comment {
  text-align: center;
  margin-bottom: 20px;
  color: #bbb9b9;
}
.user-pwd-form {
  width: 80%;
}
</style>
<style>
.user-profile-pwd-dialog {
  min-width: 350px;
  max-width: 500px;
}
</style>
