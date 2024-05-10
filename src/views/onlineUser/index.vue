<template>
  <div>
    <el-form :model="forms" :inline="true" ref="loginForm">
      <el-row>
        <el-form-item label="登录地址：" prop="ip">
          <el-input v-model.trim="queryParamas.ip" placeholder="请输入登录地址" clearable></el-input>
        </el-form-item>
        <el-form-item label="账号名称：" prop="loginName">
          <el-input v-model.trim="queryParamas.loginName" placeholder="请输入账号名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="登录地点：" prop="ipType">
          <el-select clearable v-model="queryParamas.ipType" placeholder="请选择">
            <el-option :value="true" label="内网登录"></el-option>
            <el-option :value="false" label="外网登录"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="登录方式：" prop="type">
          <el-select clearable v-model="queryParamas.type" placeholder="请选择">
            <el-option value="USER_NAME" label="账户登录"></el-option>
            <el-option value="PHONE" label="手机号登录"></el-option>
            <el-option value="ID_CARD_NO" label="身份证号登录"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="initData" type="primary">查询</el-button>
        </el-form-item>
      </el-row>
    </el-form>
    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column label="访问编号" width="100" type="index" align="center"></el-table-column>
      <el-table-column label="账号名称" align="center" width="200" prop="loginName"></el-table-column>
      <el-table-column label="登录地址" align="center" width="220" prop="ip"></el-table-column>
      <el-table-column label="登录地点" align="center" width="130">
        <template #default="scope">
          <el-tag v-if="scope.row.ipType" effect="plain" type="primary">{{ ipTypeFilter(scope.row.ipType) }}</el-tag>
          <el-tag v-else effect="plain" type="success">{{ ipTypeFilter(scope.row.ipType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="登录方式" align="center" width="130">
        <template #default="scope">
          <el-tag v-if="scope.row.type" effect="plain" type="primary">{{ typeFilter(scope.row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="浏览器" align="center" width="220" prop="browser"></el-table-column>
      <el-table-column label="操作系统" align="center" width="150" prop="os"></el-table-column>
      <el-table-column label="登录状态" align="center" width="130" prop="status">
        <template #default="scope">
          <el-tag v-if="scope.row.status" effect="plain" type="success">登录成功</el-tag>
          <el-tag v-else effect="plain" type="danger">登录失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="登录时间" align="center">
        <!-- | dateNoSec -->
        <template #default="scope">{{ formatTime(scope.row.createdTime) }}</template>
      </el-table-column>
    </el-table>
    <Pages :total="tableTotal" @search="searchData"></Pages>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { getLoginLogPageList } from '@/api/modules/log'
let loading = ref(true)
let tableData = ref([])
let tableTotal = ref(0)
let queryParamas = ref({
  ipType: '',
  ip: '',
  type: '',
  loginName: '',
  page: 0,
  size: 10,
  sort: 'createdTime,DESC'
})
const searchData = params => {
  queryParamas.value.page = params.page
  queryParamas.value.size = params.size
  initData()
}
const initData = () => {
  getLoginLogPageList(queryParamas.value).then(res => {
    console.log('log', res)
    tableData.value = res.content
    tableTotal.value = res.totalElements
  })
}
const formatTime = v => {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : ''
}
const ipTypeFilter = ipType => {
  if (ipType) {
    return '内网登录'
  } else {
    return '外网登录'
  }
}
const typeFilter = type => {
  if (type == '' || type == null) {
    return ''
  }
  const typeMap = {
    USER_NAME: '账户登录',
    PHONE: '手机号登录',
    ID_CARD_NO: '身份证号登录'
  }
  return typeMap[type]
}
onMounted(() => {
  initData()
})
</script>

<style lang="scss" scoped></style>
