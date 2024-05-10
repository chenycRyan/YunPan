<template>
  <el-tooltip effect="dark" content="系统授权信息" placement="bottom">
    <div class="action-item">
      <el-icon @click="license" class="key_icon"><Key /></el-icon>
    </div>
  </el-tooltip>
  <el-drawer v-model="authDrawer" title="授权信息" size="350px" modal-class="auth-drawer">
    <el-row class="auth-line">
      <el-col :span="24" class="auth-title">授权申请软件</el-col>
      <el-col :span="24">汇博云盘 </el-col>
    </el-row>
    <el-row class="auth-line">
      <el-col :span="24" class="auth-title">软件版本</el-col>
      <el-col :span="24">{{ licenseInfo.exeVersion }}</el-col>
    </el-row>
    <el-row class="auth-line">
      <el-col :span="24" class="auth-title">申请单位</el-col>
      <el-col :span="24">{{ licenseInfo.licenseUser }}</el-col>
    </el-row>
    <el-row class="auth-line">
      <el-col :span="24" class="auth-title">单位类型</el-col>
      <el-col :span="24">{{ licenseInfo.licenseUserType }}</el-col>
    </el-row>
    <el-row class="auth-line">
      <el-col :span="24" class="auth-title">邮箱地址</el-col>
      <el-col :span="24">{{ licenseInfo.email }}</el-col>
    </el-row>
    <el-row class="auth-line">
      <el-col :span="24" class="auth-title">授权有效期</el-col>
      <el-col :span="24">{{ licenseInfo.permanent ? '永久' : licenseInfo.expireDate }}</el-col>
    </el-row>
    <el-row class="flex-center">
      <el-button type="primary" @click="handleApply"> 申请禁用</el-button>
      <el-button type="danger" @click="handleDisable"> 立即失效</el-button>
    </el-row>
  </el-drawer>
</template>

<script setup>
import { getLicense, disableApply, changeEncryptData } from '@/api/modules/license'
import { ElMessage, ElMessageBox } from 'element-plus'
const authDrawer = ref(false)
const licenseInfo = ref({
  licenseUserType: '',
  software: '',
  licenseUser: '',
  permanent: false,
  expireDate: '',
  email: ''
})
function handleDisable() {
  ElMessageBox.confirm(`该操作将禁用该软件，请谨慎使用！`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    changeEncryptData().then(() => {
      window.location.reload()
    })
  })
}

function handleApply() {
  ElMessageBox.confirm(`该操作将申请禁用该软件，请谨慎使用！`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    disableApply().then(res => {
      if (res?.code === 1) {
        ElMessage.success(res.msg)
      } else if (res?.code === 0) {
        ElMessage.warning(res.msg)
      }
    })
  })
}

function license() {
  getLicense().then(res => {
    console.log('getLicense', res)
    authDrawer.value = true
    const typeObj = { SCHOOL: '学校', ENTERPRISE: '企业', PERSON: '个人' }
    licenseInfo.value = res
    licenseInfo.value.licenseUserType = typeObj[res.licenseUserType]
  })
}
</script>

<style lang="scss" scoped>
.action-item {
  cursor: pointer;
}

.key_icon {
  margin-right: 15px;
  margin-top: 2px;
  font-size: 18px;
  display: block;
}
.auth-drawer {
  .auth-line {
    margin-top: 2vh;
    font-size: 16px;
    line-height: 1.6em;
    .auth-title {
      font-weight: bold;
    }
  }
}
</style>
