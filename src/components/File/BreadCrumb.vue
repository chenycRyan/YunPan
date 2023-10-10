<template>
  <div class="flex-center">
    <div class="back" @click="backLast" v-show="data.length > 1">返回上一级</div>
    <el-divider direction="vertical" v-show="data.length > 1" />
    <el-breadcrumb :separator-icon="ArrowRight">
      <el-breadcrumb-item v-for="item in data" @click="getData(item)" :key="item.id">{{ item.name }}</el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>
<script setup>
import { ArrowRight } from '@element-plus/icons-vue'
const emits = defineEmits(['getData', 'backLast'])
defineProps({
  data: Array
})
const getData = item => {
  emits('getData', item)
}
const backLast = () => {
  emits('backLast')
}
</script>
<style lang="scss" scoped>
.flex-center {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding-left: 5px;

  .back {
    font-size: 12px;
    cursor: pointer;
    color: #06a7ff;
  }
  :deep(.el-divider--vertical) {
    border-left: 1px solid #606266;
    margin: 0px 8px;
    height: 0.8em;
  }
  :deep(.el-breadcrumb) {
    font-size: 12px;
    cursor: pointer;
    .el-breadcrumb__inner {
      cursor: pointer;
      &:hover {
        text-decoration: underline;
        color: #06a7ff;
      }
    }
  }
}
</style>
