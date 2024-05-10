<template>
  <div class="card-contain">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>CPU</span>
        </div>
      </template>
      <el-table v-if="cpuTableData.length" v-loading="loading" :data="cpuTableData" style="width: 100%">
        <el-table-column prop="name" label="属性" />
        <el-table-column prop="value" label="值" />
      </el-table>
      <el-empty v-else description="暂无数据" :image-size="100" />
    </el-card>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>内存</span>
        </div>
      </template>
      <el-table v-if="emeTableData.length" :data="emeTableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="属性" />
        <el-table-column prop="value" label="值" />
        <el-table-column prop="JVM" label="JVM" />
      </el-table>
      <el-empty v-else description="暂无数据" :image-size="100" />
    </el-card>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>服务器信息</span>
        </div>
      </template>
      <el-table v-if="serviceTableData.length" :data="serviceTableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="computerName" label="服务器名称" />
        <el-table-column prop="computerIp" label="服务器IP" />
        <el-table-column prop="osName" label="操作系统" />
        <el-table-column prop="osArch" label="系统架构" />
      </el-table>
      <el-empty v-else description="暂无数据" :image-size="100" />
    </el-card>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>Java虚拟机信息</span>
        </div>
      </template>
      <el-table v-if="javaTableData.length" :data="javaTableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="startTime" label="启动时间" />
        <el-table-column prop="home" label="安装路径" />
        <el-table-column prop="userDir" label="项目路径" />
        <el-table-column label="运行参数">
          <template #default="scope">
            <div class="tabel-cell" :title="scope.row.inputArgs">{{ scope.row.inputArgs }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" />
        <el-table-column prop="runTime" label="运行时长" />
      </el-table>
      <el-empty v-else description="暂无数据" :image-size="100" />
    </el-card>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>磁盘状态</span>
        </div>
      </template>
      <el-table v-if="sysFilesTableData.length" :data="sysFilesTableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="dirName" label="盘符路径" />
        <el-table-column prop="sysTypeName" label="文件系统" />
        <el-table-column prop="typeName" label="盘符类型" />
        <el-table-column prop="total" label="总大小" />
        <el-table-column prop="free" label="可用大小" />
        <el-table-column prop="used" label="已用大小" />
        <el-table-column label="已用百分比">
          <template #default="scope"> {{ scope.row.usage }}% </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无数据" :image-size="100" />
    </el-card>
  </div>
</template>

<script setup>
import { vLoading } from 'element-plus'
import { getServeInfo } from '@/api/modules/server'
let loading = ref(true)
let cpuAttributeNames = {
  cpuNum: '核心数',
  used: '用户使用率',
  sys: '系统使用率',
  free: '当前空闲率'
}
let memoryAttributeNames = {
  total: '总内存',
  used: '已用内存',
  free: '剩余内存',
  usage: '使用率'
}
let computerAttributeNames = {
  computerName: '服务器名称',
  computerIp: '服务器IP',
  osName: '操作系统',
  osArch: '系统架构'
}
let jvmAttributeNames = {
  name: '名称',
  computerIp: '服务器IP',
  osName: '操作系统',
  osArch: '系统架构',
  name: '服务器名称',
  computerIp: '服务器IP',
  osName: '操作系统',
  osArch: '系统架构',
  name: '服务器名称',
  computerIp: '服务器IP',
  osName: '操作系统',
  osArch: '系统架构'
}
let sysFilesAttributeNames = {
  dirName: '盘符路径',
  sysTypeName: '文件系统',
  typeName: '盘符类型',
  total: '总大小',
  free: '可用大小',
  used: '已用大小',
  usage: '已用百分比'
}
// CPU信息
let cpuTableData = ref([])
const getCpuData = res => {
  let cpuObj = res['cpu'] || {}
  const keyList = Object.keys(cpuObj)
  const cpuData = keyList
    .map(key => {
      return {
        name: cpuAttributeNames[key],
        value: key !== 'cpuNum' ? cpuObj[key] + '%' : cpuObj[key]
      }
    })
    .filter(ele => ele.name)
  return cpuData
}
// 内存信息
let emeTableData = ref([])
const getMemData = res => {
  let memObj = res['mem'] || {}
  let jvmObj = res['jvm'] || {}
  const emeKeyList = Object.keys(memObj)
  const memeData = emeKeyList
    .map(key => {
      return {
        name: memoryAttributeNames[key],
        value: key === 'usage' ? memObj[key] + '%' : memObj[key] + 'G',
        JVM: key === 'usage' ? jvmObj[key] + '%' : jvmObj[key] + 'M'
      }
    })
    .filter(ele => ele.name)
  return memeData
}
// 服务器信息
let serviceTableData = ref([])
const getserviceData = res => {
  let sysObj = res['sys'] || {}
  const serviceData = [
    {
      computerIp: sysObj['computerIp'],
      computerName: sysObj['computerName'],
      osArch: sysObj['osArch'],
      osName: sysObj['osName']
    }
  ]
  return serviceData
}
// java虚拟机信息
let javaTableData = ref([])
const getjavaData = res => {
  let javaObj = res['jvm'] || {}
  let sysObj = res['sys'] || {}
  const javaData = [
    {
      name: javaObj['name'],
      startTime: javaObj['startTime'],
      home: javaObj['home'],
      userDir: sysObj['userDir'],
      inputArgs: javaObj['inputArgs'],
      version: javaObj['version'],
      runTime: javaObj['runTime']
    }
  ]
  return javaData
}
// 磁盘状态
let sysFilesTableData = ref([])
const getsysFilesData = res => {
  let sysFilesDataObj = res['sysFiles'] || []
  const sysFilesData = sysFilesDataObj || []
  return sysFilesData
}
onMounted(() => {
  getServeInfo().then(res => {
    if (res) {
      loading.value = false
      console.log('res', res)
      cpuTableData.value = getCpuData(res)
      emeTableData.value = getMemData(res)
      serviceTableData.value = getserviceData(res)
      javaTableData.value = getjavaData(res)
      sysFilesTableData.value = getsysFilesData(res)
    }
  })
})
</script>

<style lang="scss" scoped>
.card-contain {
  margin: 0;
  padding: 0;
}
.box-card:nth-child(1),
.box-card:nth-child(2) {
  box-sizing: border-box;
  display: inline-block;
  width: 50%;
}
.tabel-cell {
  max-height: 26px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
