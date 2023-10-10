<template>
  <el-card class="group">
    <template #header>
      <div class="card-header" v-show="depName">当前群组 ：{{ depName }}</div>
      <el-divider border-style="dashed" v-show="depName" />
      <div class="card-header">
        <el-button type="primary" @click="handleAddGroup">创建群组</el-button>
        <el-button @click="handleAddPerson">创建用户</el-button>
      </div>
    </template>

    <ul>
      <li v-for="item in tableData" :key="item.id" :class="{ active: depId == item.id }" @click="handleNodeClick(item)">
        <span>{{ item.name }}</span>

        <el-dropdown class="more" trigger="click" @command="handleCommand">
          <el-icon><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="{ type: 'edit', command: item }">
                <el-icon><Edit /></el-icon>
                <span>修改群组</span>
              </el-dropdown-item>
              <el-dropdown-item :command="{ type: 'add', command: item }">
                <el-icon><Plus /></el-icon>
                <span>添加成员</span>
              </el-dropdown-item>
              <el-dropdown-item :command="{ type: 'delete', command: item }">
                <el-icon><Delete /></el-icon>
                <span>删除群组</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </li>
    </ul>
    <Pages :total="tableTotal" layout="prev, pager, next" @search="searchData"></Pages>
    <Member ref="memberRef" @search-person="handleNodeClick"></Member>
  </el-card>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiFun } from '@/api/apiFun'
import { updateDepartment } from '@/api/modules/department'
import Member from './member.vue'
const departmentApi = apiFun('/departments')
const emits = defineEmits(['searchPerson', 'addPerson'])
onMounted(() => {
  getDepartment()
})
const queryForm = reactive({
  page: '',
  size: ''
})
let tableTotal = ref(0)
let tableData = ref([])
//分页查询
const searchData = params => {
  queryForm.page = params.page
  queryForm.size = params.size
  getDepartment()
}
let depId = ref()
let depName = ref()
const handleNodeClick = row => {
  depId.value = row.id
  depName.value = row.name
  emits('searchPerson', row.id)
}
const handleAddPerson = () => {
  emits('addPerson')
}
const getDepartment = () => {
  let params = {
    ...queryForm,
    sort: 'createdTime,DESC'
  }
  departmentApi.findPage(params).then(res => {
    tableData.value = res.content
    tableTotal.value = res.totalElements
  })
}
const handleAddGroup = () => {
  ElMessageBox.prompt(`将添加群组，请输入群组名称：`, '提示', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: '',
    inputValidator(val) {
      return !!val
    },
    inputErrorMessage: '群组名称不能为空.'
  }).then(({ value }) => {
    departmentApi
      .addItem({
        name: value,
        tenantId: 1
      })
      .then(() => {
        ElMessage.success('添加成功！')
        getDepartment()
      })
  })
}

const handleEditGroup = row => {
  ElMessageBox.prompt(`将 <b>${row.name}</b> 修改为：`, '提示', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: row.name,
    inputValidator(val) {
      return !!val
    },
    inputErrorMessage: '群组名称不能为空.'
  }).then(({ value }) => {
    console.log(value)
    updateDepartment(row.id, {
      id: row.id,
      name: value,
      tenantId: row.tenantId
    }).then(() => {
      ElMessage.success('修改成功')
      getDepartment()
    })
  })
}
const handleDeleteGroup = row => {
  ElMessageBox.confirm('该操作将删除该条数据, 是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    departmentApi.deleteItem(row.id).then(() => {
      ElMessage.success('删除成功')
      getDepartment()
    })
  })
}
const memberRef = ref()
const handleCommand = ({ type, command }) => {
  if (type === 'edit') {
    handleEditGroup(command)
  } else if (type === 'delete') {
    handleDeleteGroup(command)
  } else {
    memberRef.value.initDialog(command)
  }
}
</script>
<style lang="scss" scoped>
@import '../index.scss';
</style>
