<template>
  <el-dialog v-model="dialogVisible" @close="closeDialog" :title="dialogTitle" width="40%">
    <div class="row-line">
      <div class="row-left">
        <div class="search">
          <span> 用户名称: </span>
          <el-input v-model="queryForm.realName" @input="getPerson" placeholder="请输入"></el-input>
        </div>
        <el-checkbox-group v-model="checkList" class="check_box">
          <el-checkbox v-for="item in tableData" :key="item.id" :label="{ id: item.id, label: item.label }">{{
            item.label
          }}</el-checkbox>
        </el-checkbox-group>
        <Pages :total="tableTotal" @search="searchData"></Pages>
      </div>

      <div class="row-right">
        <el-tag v-for="tag in checkList" @close="closeTag(tag)" :key="tag.id" class="tag-item" closable>
          {{ tag.label }}
        </el-tag>
      </div>
    </div>
    <div class="flx-end">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="submitDialog">确定</el-button>
    </div>
  </el-dialog>
</template>
<script setup>
import { getUserPage } from '@/api/modules/user'
import { filterParam } from '@/utils/index'
import { ElMessage } from 'element-plus'
import { batchUpdateMember } from '@/api/modules/department'
const emits = defineEmits(['searchPerson'])
onMounted(() => {})

let dialogVisible = ref(false)
let dialogTitle = ref('维护成员')
let depId = ref()
let depName = ref()
const initDialog = row => {
  dialogVisible.value = true
  depId.value = row.id
  depName.value = row.name

  getPerson()
  getDepList()
}

let tableTotal = ref(0)
let tableData = ref([])
const queryForm = reactive({
  realName: '',
  page: 0,
  size: 10
})
//分页查询
const searchData = params => {
  queryForm.page = params.page
  queryForm.size = params.size
  getPerson()
}
//获取左侧人员列表
const getPerson = () => {
  let params = {
    ...queryForm,
    isDeleted: false,
    sort: 'createdTime,DESC'
  }

  params = filterParam(params)
  getUserPage(params).then(res => {
    tableData.value = res.content
    tableData.value.forEach(item => {
      item.label = `${item.realName} ${item.phone}`
    })
    tableTotal.value = res.totalElements
  })
}
let checkList = ref([])
//获取右侧群组所属人员列表
const getDepList = () => {
  getUserPage({ depIds: depId.value, page: 0, size: 1000 }).then(res => {
    checkList.value = res.content.map(item => {
      return {
        id: item.id,
        label: `${item.realName} ${item.phone}`
      }
    })
  })
}
const closeTag = row => {
  checkList.value = checkList.value.filter(item => item.id !== row.id)
}

const submitDialog = () => {
  const userIds = checkList.value.map(item => item.id)

  batchUpdateMember({
    depId: depId.value,
    userIds: userIds
  }).then(() => {
    ElMessage.success('维护成功！')
    emits('searchPerson', { id: depId.value, name: depName.value })
    closeDialog()
  })
}
const closeDialog = () => {
  tableData.value = []
  checkList.value = []
  depId.value = null
  depName.value = null
  dialogVisible.value = false
}
defineExpose({ initDialog })
</script>
<style lang="scss" scoped>
.check_box {
  display: flex;
  flex-direction: column;
  padding: 10px;
}
.row-line {
  display: flex;
  flex-wrap: nowrap;
  :deep(.el-divider--vertical) {
    height: 31em;
  }
  .search {
    display: flex;
    align-items: center;
    span {
      width: 100px;
    }
  }
  .row-right {
    border-left: 1px solid #eeeeee;
    padding-left: 10px;
    margin-left: 10px;
    .tag-item {
      margin: 5px;
    }
  }
}
</style>
