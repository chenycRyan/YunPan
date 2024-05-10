<template>
  <div>
    <el-form ref="formRef" class="demo-ruleForm" :inline="true">
      <el-form-item>
        <el-input type="text" v-model.trim="queryForm.userName" placeholder="请输入用户名" clearable />
      </el-form-item>
      <el-form-item>
        <el-input type="text" v-model.trim="queryForm.ipaddr" placeholder="请输入IP" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="initData">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="true" :data="userData" border style="width: 100%" v-if="userData.length">
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="deptName" label="部门名称" />
      <el-table-column prop="ipaddr" label="IP" width="180" />
      <el-table-column prop="loginLocation" label="登录地址" width="100" />
      <el-table-column prop="browser" label="浏览器类型" width="100" />
      <el-table-column prop="os" label="操作系统" />
      <el-table-column prop="loginTime" label="登录时间" />
    </el-table>
    <el-empty v-else description="description" />
    <Pages :total="tableTotal" @search="searchData"></Pages>
  </div>
</template>

<script setup>
import { onlineUserPage } from '@/api/modules/user'
let queryForm = ref({
  userName: '',
  ipaddr: '',
  page: 0,
  size: 10,
  sort: 'createdTime,DESC'
})

const searchData = params => {
  queryForm.value.page = params.page
  queryForm.value.size = params.size
  initData()
}
let userData = ref([])
let tableTotal = ref(0)
const initData = () => {
  onlineUserPage(queryForm.value).then(res => {
    userData.value = res.content
    tableTotal.value = res.totalElements
  })
}
onMounted(() => {
  initData()
})
</script>

<style lang="scss" scoped></style>
