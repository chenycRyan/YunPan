<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%" :before-close="handleClose">
    <!-- <div class="flex-center">
      <div class="back" @click="backLast" v-show="breadcrumbData.length > 1">返回上一级</div>
      <el-divider direction="vertical" v-show="breadcrumbData.length > 1" />
      <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item v-for="item in breadcrumbData" @click="tableClickRow(item)" :key="item.id">{{
          item.name
        }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div> -->
    <!-- 面包屑导航 -->
    <BreadCrumb @get-data="tableClickRow" @back-last="backLast" :data="breadcrumbData" />
    <!-- 文件区 -->
    <el-table ref="fileTableRef" :data="tableData" style="width: 100%" @row-click="tableClickRow">
      <template #empty>
        <div>
          <svg-icon class="empty-icon" name="empty" />
          <div class="font-bold text-base">数据为空，请先上传或添加文件</div>
        </div>
      </template>

      <el-table-column prop="name">
        <template #header> </template>
        <template #default="scope">
          <div class="row-name flex-align">
            <svg-icon :name="scope.row.type" class="svg-icon"></svg-icon>
            {{ scope.row.name }}
          </div>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDialong"> {{ dialogTitle }}到此 </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { batchCopyFile, batchMoveFile } from '@/api/modules/file'
import { getFolderList, batchMoveFolder, batchCopyFolder } from '@/api/modules/folder'
const emits = defineEmits(['search'])

let dialogVisible = ref(false)
let dialogTitle = ref('移动')
let tableData = ref<FileSpace.FoldItf[]>([])
let breadcrumbData = ref<FileSpace.IdNameItf[]>([])
let selectRows = ref<FileSpace.RowItf[]>([])

const currentRow = reactive<FileSpace.IdNameItf>({
  name: '全部文件',
  id: 0
})

const initDialog = (row: any, type: string) => {
  getFolder()
  selectRows.value = row
  dialogVisible.value = true
  dialogTitle.value = type === 'move' ? '移动' : '复制'
}
const handleClose = () => {
  currentRow.name = '全部文件'
  currentRow.id = 0
  dialogTitle.value = '移动'
  breadcrumbData.value = []
  selectRows.value = []
  tableData.value = []
  dialogVisible.value = false
}
//返回上一级
const backLast = () => {
  if (breadcrumbData.value.length > 1) {
    Object.assign(currentRow, breadcrumbData.value[breadcrumbData.value.length - 2])
    getFolder()
  }
}
//表格点击
const tableClickRow = (row: FileSpace.IdNameItf) => {
  Object.assign(currentRow, row)
  getFolder()
}

//获取文件夹
const getFolder = () => {
  const foldId = currentRow.id || 0
  getFolderList<any, FileSpace.FoldItf[]>({ parentId: foldId, deleted: false }).then(res => {
    console.log(res)
    //文件夹
    tableData.value = res.map(item => {
      return {
        id: item.id,
        name: item.name,
        time: item.lastUpdatedTime,
        parentId: item.parentId,
        type: 'FOLDER'
      }
    })
    // 赋值导航面包屑
    const foldArr = res
    if (foldArr.length) {
      breadcrumbData.value = []
      getChildBread(foldArr[0].parent)
      breadcrumbData.value.unshift({
        id: 0,
        name: '全部文件'
      })
    } else {
      const hasCurrent = breadcrumbData.value.some(item => item.id === currentRow.id)
      if (!hasCurrent) {
        breadcrumbData.value.push({
          id: currentRow.id,
          name: currentRow.name
        })
      }
    }

    console.log(tableData.value, 'tableData')
  })
}

//递归处理面包屑
const getChildBread = (obj: FileSpace.IdNameItf) => {
  if (obj) {
    if (obj.parent) {
      getChildBread(obj.parent)
    }
    breadcrumbData.value.push({
      id: obj.id,
      name: obj.name
    })
  }
}
const submitDialong = () => {
  const folderList = selectRows.value.filter(item => item.type === 'FOLDER')
  const fileList = selectRows.value.filter(item => item.type !== 'FOLDER')
  console.log(folderList, fileList)
  const folderParm = folderList.length
    ? folderList.map(item => {
        return {
          id: item.id,
          newParentId: currentRow.id
        }
      })
    : []
  const fileParm = fileList.length
    ? fileList.map(item => {
        return {
          id: item.id,
          fileCategoryId: currentRow.id
        }
      })
    : []
  console.log(folderParm, fileParm, '请求参数')
  let p1, p2
  if (dialogTitle.value === '复制') {
    p1 = new Promise<void>(resolve => {
      if (folderParm.length)
        batchCopyFolder({ fileCategoryCopyDtos: folderParm }).then(() => {
          resolve()
        })
      else resolve()
    })
    p2 = new Promise<void>(resolve => {
      if (fileParm.length)
        batchCopyFile({ fileCopyDtos: fileParm }).then(() => {
          resolve()
        })
      else resolve()
    })
  } else {
    p1 = new Promise<void>(resolve => {
      if (folderParm.length) {
        const params = {
          ids: folderList.map(item => item.id),
          newParentId: currentRow.id
        }
        batchMoveFolder(params).then(() => {
          resolve()
        })
      } else resolve()
    })
    p2 = new Promise<void>(resolve => {
      if (fileParm.length)
        batchMoveFile({ fileMoveDtos: fileParm }).then(() => {
          resolve()
        })
      else resolve()
    })
  }
  Promise.all([p1, p2]).then(() => {
    dialogVisible.value = false
    ElMessage.success(dialogTitle.value + '成功！')
    handleClose()
    emits('search')
  })
}

defineExpose({ initDialog })
</script>
<style lang="scss" scoped>
@import '../index.scss';
</style>
