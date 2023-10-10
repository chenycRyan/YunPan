<template>
  <div class="tool-bar-ri">
    <div class="header-icon">
      <!-- <AssemblySize id="assemblySize" /> -->
      <!-- <SearchMenu id="searchMenu" /> -->
      <ThemeSetting id="themeSetting" />
      <!-- <Message id="message" /> -->
      <Fullscreen id="fullscreen" />
    </div>
    <el-dropdown trigger="click">
      <div class="username">{{ userInfo.real_name }}</div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="logout" divided>
            <el-icon><SwitchButton /></el-icon>登出
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <!-- <Avatar /> -->
    <div class="item cursor" @click="toFrontPage">
      <el-icon class="icon" size="18"> <Menu /></el-icon> <span>去往前台</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// import SearchMenu from './components/SearchMenu.vue'
import Fullscreen from './components/Fullscreen.vue'
// import Message from './components/Message.vue'
import ThemeSetting from './components/ThemeSetting.vue'
// import AssemblySize from './components/AssemblySize.vue'
import { resetRouter } from '@/routers/index'
import { LOGIN_URL } from '@/config/config'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
// import Avatar from './components/Avatar.vue'
import { GlobalStore } from '@/stores'
const globalStore = GlobalStore()
const route = useRoute()
const userInfo = computed(() => globalStore.userInfo)
const router = useRouter()
const toFrontPage = () => {
  router.push({
    name: 'dataScreen'
  })
}
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
.tool-bar-ri {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 15px;
  .header-icon {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 50px;
    margin-right: 15px;
  }
  .username {
    font-size: 15px;
    cursor: pointer;
  }
}
.item {
  display: flex;
  align-items: center;
  margin-left: 10px;
  .icon {
    margin-top: 3px;
    margin-right: 3px;
  }
}
.cursor {
  cursor: pointer;
  &:hover {
    color: #06a7ff;
  }
}
</style>
