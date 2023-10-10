<template>
  <el-dropdown trigger="click">
    <div class="avatar">
      <img src="@/assets/images/avatar.gif" alt="avatar" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="logout" divided>
          <el-icon><SwitchButton /></el-icon>登出
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { GlobalStore } from '@/stores'
import { LOGIN_URL } from '@/config/config'
import { resetRouter } from '@/routers/index'

import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
const route = useRoute()
const router = useRouter()
const globalStore = GlobalStore()

// 退出登录
const logout = () => {
  ElMessageBox.confirm('您是否确认退出登录?', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 2.清除 Token
    globalStore.setToken('')
    // 3.重置路由
    resetRouter()
    // 4.重定向到登陆页，并携带当前退出页地址和参数
    const path = `${LOGIN_URL}?redirect=${route.path}&params=${JSON.stringify(route.query ? route.query : route.params)}`
    router.replace(path)
    ElMessage.success('退出登录成功！')
  })
}
</script>

<style scoped lang="scss">
.avatar {
  width: 40px;
  height: 40px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 50%;
  img {
    width: 100%;
    height: 100%;
  }
}
</style>
