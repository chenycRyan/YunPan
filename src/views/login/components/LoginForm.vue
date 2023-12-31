<template>
  <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large">
    <el-form-item prop="username">
      <el-input v-model="loginForm.username" placeholder="用户名：admin / user">
        <template #prefix>
          <el-icon class="el-input__icon"><user /></el-icon>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item prop="password">
      <el-input type="password" v-model="loginForm.password" placeholder="密码：123456" show-password autocomplete="new-password">
        <template #prefix>
          <el-icon class="el-input__icon"><lock /></el-icon>
        </template>
      </el-input>
    </el-form-item>
  </el-form>
  <div class="login-btn">
    <el-button :icon="CircleClose" round @click="resetForm(loginFormRef)" size="large">重置</el-button>
    <el-button :icon="UserFilled" round @click="login(loginFormRef)" size="large" type="primary" :loading="loading">
      登录
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Login } from '@/api/interface'
import { ElNotification } from 'element-plus'
import { GlobalStore } from '@/stores'
import { TabsStore } from '@/stores/modules/tabs'
import { getTimeState } from '@/utils'
import { HOME_URL } from '@/config/config'
import { initDynamicRouter } from '@/routers/modules/dynamicRouter'
import { CircleClose, UserFilled } from '@element-plus/icons-vue'
import type { ElForm } from 'element-plus'

const route = useRoute()
const router = useRouter()
const tabsStore = TabsStore()
const globalStore = GlobalStore()

// 定义 formRef（校验规则）
type FormInstance = InstanceType<typeof ElForm>
const loginFormRef = ref<FormInstance>()
const loginRules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const loading = ref(false)
const loginForm = reactive<Login.ReqLoginForm>({ username: 'admin', password: 'a123456' })
const login = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      // 1.执行登录接口
      await globalStore.userLogin(loginForm.username, window.btoa(loginForm.password))

      // 2.添加动态路由
      await initDynamicRouter()

      // 3.清除上个账号的 tab 信息
      tabsStore.closeMultipleTab()
      // 4.跳转至前台页面
      router.push(HOME_URL)
      // 4.跳转页面，如果没有 redirect 跳转到首页，有就携带参数跳转到 redirect
      // if (!route.query?.redirect) router.push(HOME_URL)
      // else router.push({ path: route.query?.redirect as string, query: JSON.parse(route.query?.params as string) })

      ElNotification({
        title: getTimeState(),
        message: '欢迎登录  汇博云盘',
        type: 'success',
        duration: 3000
      })
    } finally {
      loading.value = false
    }
  })
}

// resetForm
const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

onMounted(() => {
  // 监听enter事件（调用登录）
  document.onkeydown = (e: any) => {
    e = window.event || e
    if (e.code === 'Enter' || e.code === 'enter' || e.code === 'NumpadEnter') {
      if (loading.value) return
      login(loginFormRef.value)
    }
  }
})
</script>

<style scoped lang="scss">
@import '../index.scss';
</style>
