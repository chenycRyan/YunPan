<template>
  <el-card class="page-container">
    <el-container>
      <el-main>
        <!-- 面包屑导航 -->
        <BreadCrumb @get-data="tableDbClickRow" @back-last="backLast" :data="breadcrumbData" />
        <!-- 文件区 -->
        <el-table
          ref="fileTableRef"
          :data="tableData"
          style="width: 100%"
          :row-class-name="tableRowClassName"
          @row-dblclick="tableDbClickRow"
          height="80vh"
        >
          <template #empty>
            <div>
              <svg-icon class="empty-icon" name="empty" />
              <div class="font-bold text-base">数据为空，请先上传或添加文件</div>
            </div>
          </template>

          <el-table-column prop="name">
            <template #header>
              <el-icon>
                <Document />
              </el-icon>
              <span>文件名</span>
            </template>
            <template #default="scope">
              <div v-show="skeletonLoading" class="flex-align">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="circle" class="circle" />
                    <el-skeleton-item variant="text" class="file" />
                  </template>
                </el-skeleton>
              </div>
              <div v-show="!skeletonLoading" class="row-name flex-align" @click="tableClickRow(scope.row)">
                <svg-icon name="PICTURE" v-if="scope.row.type === 'PICTURE'" class="svg-icon"></svg-icon>
                <svg-icon name="MP4" v-else-if="scope.row.type === 'VIDEO'" class="svg-icon"></svg-icon>
                <svg-icon name="Folder" v-else-if="scope.row.type === 'FOLDER'" class="svg-icon"></svg-icon>
                <svg-icon :name="displayFileType(scope.row.name)" v-else class="svg-icon"></svg-icon>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="time" align="center" sortable width="180px">
            <template #header>
              <el-icon>
                <Calendar />
              </el-icon>
              <span>修改时间</span>
            </template>
            <template #default="scope">
              <div v-show="skeletonLoading">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="text" class="w-100" />
                  </template>
                </el-skeleton>
              </div>
              <div v-show="!skeletonLoading">
                {{ scope.row.time }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="size" align="center" sortable width="160px">
            <!-- 表头 -->
            <template #header>
              <el-icon>
                <Coin />
              </el-icon>
              <span>大小</span>
            </template>
            <template #default="scope">
              <!-- 骨架屏 -->
              <div v-show="skeletonLoading">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="text" class="w-80" />
                  </template>
                </el-skeleton>
              </div>
              <!-- 数据 -->
              <div v-show="!skeletonLoading">
                {{ scope.row.size }}
              </div>
            </template>
          </el-table-column>
          <el-table-column align="center" sortable width="160px">
            <!-- 表头 -->
            <template #header>
              <el-icon>
                <Setting />
              </el-icon>
              <span>权限</span>
            </template>
            <template #default="scope">
              <!-- 骨架屏 -->
              <div v-show="skeletonLoading">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="text" class="w-80" />
                  </template>
                </el-skeleton>
              </div>
              <!-- 数据 -->
              <div v-show="!skeletonLoading">
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  v-if="scope.row.auth"
                  :content="filterLevel(scope.row.auth)"
                  placement="bottom"
                >
                  <img :src="useImage(`images/level/${scope.row.auth}.png`)" class="levelImg" alt="" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="size" align="center" sortable width="160px">
            <!-- 表头 -->
            <template #header>
              <el-icon>
                <Coin />
              </el-icon>
              <span>水印</span>
            </template>
            <template #default="scope">
              <!-- 骨架屏 -->
              <div v-show="skeletonLoading">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="text" class="w-80" />
                  </template>
                </el-skeleton>
              </div>
              <!-- 数据 -->
              <div v-show="!skeletonLoading">
                <el-switch v-model="scope.row.watermark" v-if="authLevel(scope.row)" @change="changeFile(scope.row)" />
                <span v-else>无权限</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
    </el-container>

    <el-dialog
      v-model="dialogTextVisible"
      draggable
      class="dialog-preview"
      :title="dialogTextTitle"
      :destroy-on-close="true"
      top="4vh"
      width="50vw"
    >
      <!-- 视频在线预览 -->
      <VideoPlayer v-if="preview.type === 'video'" :file-id="preview.videoId" :file-name="preview.videoName"></VideoPlayer>
      <!-- PDF在线预览 -->
      <PdfViewer v-if="preview.type === 'pdf'" :file-id="preview.pdfId"></PdfViewer>
      <!-- 文本在线预览 -->
      <TextViewer v-if="preview.type === 'text'" :file-id="preview.textId" :file-name="preview.textName" />
      <!-- Markdown在线预览 -->
      <MarkdownViewer v-if="preview.type === 'md'" :file-id="preview.mdId" />
      <!-- Doc文件在线预览 -->
      <DocxViewer v-if="preview.type === 'docx'" :file-id="preview.docxId" />
      <!--Xlsx文件在线预览 -->
      <XlsxViewer v-if="preview.type === 'xlsx'" :file-id="preview.xlsxId" />
    </el-dialog>
  </el-card>
</template>
<script setup>
import { sizeTostr } from '@/utils'
import { displayFileType, filterFileType } from '@/utils/file'
import { getFileList, renameFile } from '@/api/modules/file'
import { getFolderList, renameFolder } from '@/api/modules/folder'
import { downloadFile } from '@/api/modules/file'
import { ElMessage } from 'element-plus'
import useFileSelect from '../dataScreen/hooks/useFileSelect.js'
import BreadCrumb from '@/components/File/BreadCrumb.vue'
import PdfViewer from '@/components/File/FileView/PdfViewer.vue'
import VideoPlayer from '@/components/File/FileView/VideoPlayer.vue'
import MarkdownViewer from '@/components/File/FileView/MarkdownViewer.vue'
import TextViewer from '@/components/File/FileView/TextViewer.vue'
import DocxViewer from '@/components/File/FileView/DocxViewer.vue'
import XlsxViewer from '@/components/File/FileView/XlsxViewer.vue'
import { v3ImgPreviewFn } from 'v3-img-preview-enhance'
import useImage from '@/hooks/useImage'
import { GlobalStore } from '@/stores'
onMounted(() => {
  getCurtFile()
})
const globalStore = GlobalStore()
const { isAdmin, isManage } = storeToRefs(globalStore)
const authLevel = row => {
  if (row.auth === 'FIVE' && isManage.value) {
    return true
  } else if (isAdmin.value) {
    return true
  } else {
    return false
  }
}

const currentInstance = getCurrentInstance()
let { tableRowClassName, toggleRowSelection } = useFileSelect(currentInstance)

const fileTableRef = ref()
let tableData = ref([])
const currentRow = reactive({
  name: '全部文件',
  id: 0
})
const filterLevel = key => {
  const levelLabel = {
    ONE: '无权限-不可见',
    TWO: '可查看、下载',
    THREE: '可查看、下载、上传、创建文件夹',
    FOUR: '可查看、下载、上传、创建、复制、移动、重命名文件夹/文件',
    FIVE: '最高权限-任意操作'
  }
  return levelLabel[key]
}
let breadcrumbData = ref([])
let skeletonLoading = ref(false)
const changeFile = row => {
  const API = row.type === 'FOLDER' ? renameFolder : renameFile

  API({
    id: row.id,
    watermark: row.watermark
  }).then(() => {
    ElMessage.success('设置成功！')
    getCurtFile()
  })
}

//获取文件和文件夹
const getCurtFile = () => {
  const foldId = currentRow.id || 0
  skeletonLoading.value = true
  let p1 = getFolderList({ parentId: foldId })
  let p2 = getFileList({ fileCategoryId: foldId, deleted: false })
  Promise.all([p1, p2])
    .then(res => {
      console.log(res)
      skeletonLoading.value = false
      //文件夹
      const arr1 = res[0].map(item => {
        const { id, name, parentId, parent } = item
        return {
          id,
          name,
          parentId,
          parent,
          watermark: item.watermark,
          time: item.lastUpdatedTime,
          type: 'FOLDER',
          auth: item.userFileAuthVo?.type
        }
      })

      // 赋值导航面包屑
      const foldArr = res[0]
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

      //文件
      const arr2 = res[1].map(item => {
        return {
          id: item.id,
          fileId: item.fileVo.id,
          watermark: item.watermark,
          name: item.originName || item.fileVo.originName,
          time: item.fileVo.lastUpdatedTime,
          parentId: item.categoryVo.parentId,
          type: item.fileVo.type,
          size: sizeTostr(item.fileVo.size),
          auth: item.userFileAuthVo?.type,
          fileUrl: null
        }
      })

      console.log(arr2, 'arr2')
      tableData.value = arr1.concat(arr2)
      console.log(tableData.value, 'tableData')
    })
    .catch(() => {
      skeletonLoading.value = false
    })
}
//递归处理面包屑
const getChildBread = obj => {
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
//返回上一级
const backLast = () => {
  if (breadcrumbData.value.length > 1) {
    Object.assign(currentRow, breadcrumbData.value[breadcrumbData.value.length - 2])
    getCurtFile()
  }
}
//表格单击-面包屑导航
let dialogTextVisible = ref(false)
let dialogTextTitle = ref()
const preview = reactive({
  type: null,
  videoId: null,
  videoName: null,
  pdfId: null,
  mdId: null,
  docxId: null,
  xlsxId: null,
  textId: null,
  textName: null
})

//表格单击-文件预览
const tableClickRow = async row => {
  toggleRowSelection(row, true)
  if (row.type === 'PICTURE') {
    const imgList = [await handleFileUrl(row)]
    // const imgList = selectRows.value.filter(item => item.type === 'PICTURE').map(item => item.fileUrl)
    const index = imgList.findIndex(item => item === row.fileUrl)
    console.log(imgList, index)
    console.log(index)
    v3ImgPreviewFn({
      images: imgList,
      index: index
    })
  } else if (row.type === 'VIDEO') {
    dialogTextTitle.value = row.name
    dialogTextVisible.value = true
    preview.type = 'video'
    preview.videoId = row.id
    preview.videoName = row.name
  } else if (row.type === 'DOCUMENT') {
    switch (filterFileType(row.name)) {
      case 'pdf':
        preview.type = 'pdf'
        preview.pdfId = row.id
        break
      case 'md':
        preview.type = 'md'
        preview.mdId = row.id
        break
      case 'docx':
        preview.type = 'docx'
        preview.docxId = row.id
        break
      case 'xlsx':
        preview.type = 'xlsx'
        preview.xlsxId = row.id
        break
      case 'text':
        preview.type = 'text'
        preview.textId = row.id
        preview.textName = row.name
        break

      default:
        preview.type = null
        ElMessage.warning('暂不支持在线预览！')
        break
    }
    if (preview.type) {
      dialogTextTitle.value = row.name
      dialogTextVisible.value = true
    }
  } else if (row.type === 'OTHER') {
    ElMessage.warning('暂不支持在线预览！')
  }
}
//表格双击-面包屑导航
const tableDbClickRow = row => {
  if (row.type === 'FOLDER' || !row.type) {
    Object.assign(currentRow, row)
    currentRow.id === 0 ? getShareFile() : getCurtFile()
  }
}

/**
 * -------图片预览----------
 */
const handleFileUrl = async row => {
  const res = await downloadFile(row.id)
  row.fileUrl = window.URL.createObjectURL(new Blob([res]))
  tableData.value = [...tableData.value]
  return row.fileUrl
}
</script>
<style lang="scss" scoped>
@import '../dataScreen/index.scss';
.el-container {
  height: 100%;
}
</style>
