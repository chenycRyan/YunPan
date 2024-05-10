<template>
  <el-header>
    <div class="header-box">
      <div class="item"><img src="@/assets/images/header/logo.png" alt="" /> 汇博机器人云盘管理</div>
      <div class="flex-center">
        <HBNotice></HBNotice>
        <LicenseShow></LicenseShow>

        <el-dropdown trigger="click" class="fz-16">
          <span class="user_name">{{ userInfo.real_name }}</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="changePassword" divided>
                <el-icon><EditPen /></el-icon>修改密码
              </el-dropdown-item>
              <el-dropdown-item @click="logout" divided>
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div class="item cursor ml-10" @click="toAdminPage" v-if="isAdmin || isManage">
          <el-icon class="icon" size="18"><HomeFilled /></el-icon>
          <span class="fz-16">返回后台</span>
        </div>
      </div>
    </div>
  </el-header>
  <ChangePwd ref="changPwdRef"></ChangePwd>
</template>
<script setup>
import ChangePwd from '@/layouts/components/Header/components/ChangePwd.vue'
import LicenseShow from '@/views/license/components/LicenseShow.vue'
import { GlobalStore } from '@/stores'
import { LOGIN_URL } from '@/config/config'
import { ElMessageBox, ElMessage } from 'element-plus'
import { resetRouter } from '@/routers/index'
const globalStore = GlobalStore()
const route = useRoute()
const router = useRouter()
const { isAdmin, isManage, userInfo } = storeToRefs(globalStore)
//修改密码
const changPwdRef = ref()
const changePassword = () => {
  changPwdRef.value.dialogVisible = true
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

/**
 * -------返回首页----------
 */

const toAdminPage = () => {
  // ElMessageBox.confirm('当前正在下载文件，是否退出当前页面?', '警告', {
  //   confirmButtonText: '确认',
  //   cancelButtonText: '取消',
  //   type: 'warning'
  // }).then(() => {

  // })
  router.push({
    name: 'personalManage'
  })
}
</script>
<style lang="scss" scoped>
.header-box {
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
  background: url(@/assets/images/header/header_bg.png);
  .item {
    display: flex;
    align-items: center;
    img {
      width: 28px;
      margin-right: 10px;
    }
    .icon {
      margin-right: 3px;
    }
  }
  .cursor {
    cursor: pointer;
    &:hover {
      color: #06a7ff;
    }
  }
  .fz-16 {
    font-size: 18px;
    cursor: pointer;
  }
}
</style>
