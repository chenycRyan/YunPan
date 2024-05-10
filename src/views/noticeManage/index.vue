<template>
  <div>
    <el-form :model="queryForm" :inline="true">
      <el-form-item label="标题">
        <el-input v-model="queryForm.title" placeholder="请输入标题"></el-input>
      </el-form-item>
      <el-form-item label="">
        <el-button @click="pageInit">查询</el-button> <el-button type="primary" @click="handleAdd">新增</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="tableData" style="width: 100%">
      <el-table-column label="序号" width="80px" type="index"></el-table-column>
      <el-table-column label="标题" prop="title"></el-table-column>
      <el-table-column label="发布人" prop="publisher"></el-table-column>
      <el-table-column label="发布时间" prop="createdTime"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="warning" @click="resetPush(row)">重发</el-button>
          <el-button @click="showDetail(row)">查看</el-button>
          <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pages :total="tableTotal" @search="searchData"></Pages>
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleClose"
      top="4vh"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <Editor @update:description="changeDetail" :innerVisible="dialogVisible" :description="formData.content" />
        </el-form-item>
      </el-form>
      <div class="flex-center just-center">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { getMsgPage, publishMsg, modifyMsg, resetPublish, deleteMsg } from '@/api/modules/sysMsg.ts'
import Editor from '@/components/RichEditor/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
const formData = reactive({
  title: '',
  content: '',
  publishTime: '2024-01-08 15:55:52'
})
onMounted(() => {
  pageInit()
})
// 修改富文本信息
const changeDetail = val => {
  formData.content = val
}
let tableData = ref([])
let tableTotal = ref(0)
const queryForm = reactive({
  page: 0,
  size: 10
})
const searchData = params => {
  queryForm.page = params.page
  queryForm.size = params.size
  pageInit()
}
const pageInit = () => {
  let params = {
    ...queryForm,
    isDeleted: false,
    sort: 'createdTime,DESC'
  }
  getMsgPage(params).then(res => {
    tableData.value = res.content
    tableTotal.value = res.totalElements
  })
}
const rules = reactive({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
})
let dialogTitle = ref('添加')
let dialogVisible = ref(false)
const handleEdit = row => {
  dialogTitle.value = '编辑'
  Object.assign(formData, row)

  dialogVisible.value = true
}
const router = useRouter()
const route = useRoute()
const showDetail = row => {
  router.push('/notice?noticeId=' + row.id + '&origin=' + route.fullPath)
}
const handleAdd = () => {
  dialogTitle.value = '添加'
  dialogVisible.value = true
}
const handleClose = () => {
  formRef.value.resetFields()
  dialogVisible.value = false
}
const formRef = ref()
const handleSubmit = () => {
  formRef.value.validate(valid => {
    if (valid) {
      const { id, title, content } = formData
      const params = { id, title, content }
      params.publishTime = dayjs(formData.publishTime).format('YYYY-MM-DD HH:mm:ss')
      const api = dialogTitle.value === '添加' ? publishMsg(params) : modifyMsg(params)
      api.then(() => {
        ElMessage.success(dialogTitle.value + '成功')
        handleClose()
        pageInit()
      })
    }
  })
}
const resetPush = row => {
  ElMessageBox.confirm('该操作将重新发布该公告, 是否继续?', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    resetPublish(row.id).then(() => {
      ElMessage.success('重新发布成功！')
      pageInit()
    })
  })
}
const handleDelete = row => {
  ElMessageBox.confirm('该操作将删除该公告, 是否继续?', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteMsg(row.id).then(() => {
      ElMessage.success('删除成功')
      pageInit()
    })
  })
}
</script>
<style lang="scss"></style>
