<template>
  <div class="page-container">
    <el-header>
      <div class="header-box">
        <div class="item"><img src="@/assets/images/header/logo.png" alt="" /> 汇博机器人云盘管理</div>
        <!-- <div class="item cursor" @click="toAdminPage">
          <el-icon class="icon" size="18"><HomeFilled /></el-icon> <span>返回后台</span>
        </div> -->
      </div>
    </el-header>

    <el-container>
      <el-container>
        <el-main>
          <!-- 按钮组 -->
          <div class="btn-group">
            <el-button type="primary" plain @click="batchDownloadFile" v-show="selectFolders.length === 0">
              <el-icon><Download /></el-icon>下载
            </el-button>
            <el-divider direction="vertical" />
            <el-button type="primary" plain @click="dialogDownloadRef.initDialog()">
              <el-icon><Sort /></el-icon>
              下载列表
            </el-button>
          </div>
          <!-- 面包屑导航 -->
          <BreadCrumb @get-data="tableDbClickRow" @back-last="backLast" :data="breadcrumbData" />
          <!-- 文件区 -->
          <el-table
            ref="fileTableRef"
            :data="tableData"
            style="width: 100%"
            :row-class-name="tableRowClassName"
            @row-dblclick="tableDbClickRow"
            @selection-change="selectRowsChange"
            height="75vh"
          >
            <template #empty>
              <div>
                <svg-icon class="empty-icon" name="empty" />
                <div class="font-bold text-base">数据为空，请先上传或添加文件</div>
              </div>
            </template>

            <el-table-column width="30px" type="selection" :selectable="checkSelectable"> </el-table-column>
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
                  <img :src="scope.row.fileUrl" class="svg-icon" v-if="scope.row.type === 'PICTURE'" alt="" />
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

            <el-table-column prop="size" sortable width="160px">
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
                  {{ scope.row.fileSize }}
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-main>
      </el-container>
      <el-footer>Copyright ©2023 江苏汇博机器人技术股份有限公司</el-footer>
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
    <!-- 文件下载 -->
    <DialogDownload ref="dialogDownloadRef" @search="searchFile"></DialogDownload>
  </div>
</template>
<script setup>
import { downloadFromStream, sizeTostr } from '@/utils'
import { displayFileType, filterFileType } from '@/utils/file'
import { getFileList, downloadFile, downloadFileToZip } from '@/api/modules/file'
import { getFolderList } from '@/api/modules/folder'
import { checkFileValid, getShareList, shareDownloadFile } from '@/api/modules/share'
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import DialogDownload from '../dataScreen/components/DialogDownload.vue'
import useFileSelect from '../dataScreen/hooks/useFileSelect.js'
import BreadCrumb from '@/components/File/BreadCrumb.vue'
import PdfViewer from '@/components/File/FileView/PdfViewer.vue'
import VideoPlayer from '@/components/File/FileView/VideoPlayer.vue'
import MarkdownViewer from '@/components/File/FileView/MarkdownViewer.vue'
import TextViewer from '@/components/File/FileView/TextViewer.vue'
import DocxViewer from '@/components/File/FileView/DocxViewer.vue'
import XlsxViewer from '@/components/File/FileView/XlsxViewer.vue'
import { v3ImgPreviewFn } from 'v3-img-preview-enhance'
let verCode = ref('')
const dialogDownloadRef = ref()
const route = useRoute()
const getShareKey = () => {
  const share = sessionStorage.getItem('SHARE_KEY')
  return share ? JSON.parse(share) : []
}

//校验权限
const checkShare = () => {
  //加延迟，不然ID切换不弹出，暂未找到解决方法
  setTimeout(() => {
    ElMessageBox.prompt(`请输入提取码：`, '提示', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator(val) {
        return !!val
      },
      inputErrorMessage: '提取码不能为空.'
    }).then(({ value }) => {
      checkFileValid(route.query.id, { verCode: value })
        .then(() => {
          verCode.value = value
          const shareInfo = {
            id: route.query.id,
            code: value
          }
          const share_key = getShareKey()
          if (share_key.every(item => item.id !== shareInfo.id)) share_key.push(shareInfo)
          sessionStorage.setItem('SHARE_KEY', JSON.stringify(share_key))
          getShareFile()
        })
        .catch(() => {
          MessageBox.close()
        })
    })
  }, 500)
}
watch(
  () => route.query,
  () => {
    if (!route.query.id) {
      ElMessage.error('分享链接不正确！')
    } else {
      const share_key = getShareKey()
      const list = share_key.filter(item => item.id === route.query.id)
      if (list.length > 0) {
        verCode.value = list[0].code
        //尝试直接打开
        checkFileValid(route.query.id, { verCode: verCode.value })
          .then(() => {
            getShareFile()
          })
          .catch(() => {
            checkShare()
          })
      } else {
        checkShare()
      }
    }
  },
  {
    immediate: true
  }
)
const getShareFile = () => {
  getShareList(route.query.id, { verCode: verCode.value }).then(res => {
    //文件夹
    const arr1 = res.fileCategoryVos.map(item => {
      const { id, name, parentId, parent } = item
      return {
        id,
        name,
        parentId,
        parent,
        time: item.lastUpdatedTime,
        type: 'FOLDER'
      }
    })
    //文件
    console.log('res.fileFolderVo', res.fileFolderVo)
    const arr2 = res.fileFolderVo.map(item => {
      return {
        id: item.id,
        fileId: item.fileVo.id,
        name: item.originName || item.fileVo.originName,
        time: item.fileVo.lastUpdatedTime,
        parentId: item.categoryVo.parentId,
        type: item.fileVo.type,
        fileSize: sizeTostr(item.fileVo.size),
        size: item.fileVo.size,
        shardingList: item.fileVo.shardingList,
        watermark: item.watermark,
        fileUrl: null
      }
    })
    arr2.forEach(item => {
      if (item.type === 'PICTURE') {
        handleFileUrl(item)
      }
    })
    breadcrumbData.value = [
      {
        name: '全部文件',
        id: 0
      }
    ]

    tableData.value = arr1.concat(arr2)
  })
}

const currentInstance = getCurrentInstance()
let { checkSelectable, selectRowsChange, selectRows, selectFolders, selectFiles, tableRowClassName, toggleRowSelection } =
  useFileSelect(currentInstance)

const fileTableRef = ref()
let tableData = ref([])
const currentRow = reactive({
  name: '全部文件',
  id: 0
})

let breadcrumbData = ref([])
let skeletonLoading = ref(false)

//获取文件和文件夹
const getCurtFile = () => {
  const foldId = currentRow.id || 0
  skeletonLoading.value = true
  let p1 = getFolderList({ parentId: foldId })
  let p2 = getFileList({ fileCategoryId: foldId })
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
          name: item.originName || item.fileVo.originName,
          time: item.fileVo.lastUpdatedTime,
          parentId: item.categoryVo.parentId,
          type: item.fileVo.type,
          fileSize: sizeTostr(item.fileVo.size),
          size: item.fileVo.size,
          auth: item.userFileAuthVo?.type,
          shardingList: item.fileVo.shardingList,
          watermark: item.watermark,
          fileUrl: null
        }
      })
      arr2.forEach(item => {
        handleFileUrl(item)
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
    currentRow.id === 0 ? getShareFile() : getCurtFile()
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
const tableClickRow = row => {
  toggleRowSelection(row, true)
  if (row.type === 'PICTURE') {
    const imgList = selectRows.value.filter(item => item.type === 'PICTURE').map(item => item.fileUrl)
    const index = imgList.findIndex(item => item === row.fileUrl)
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
 * -------返回首页----------
 */
const router = useRouter()
const toAdminPage = () => {
  router.push({
    name: 'home'
  })
}
//批量下载
// const batchDownloadFile = () => {
//   let num = 0
//   selectFiles.value.forEach(item => {
//     let lastName = item.name.substr(item.name.lastIndexOf('.') + 1).toLowerCase()
//     if (lastName === 'mp4') {
//       num++
//     }
//   })
//   if (num > 0 && selectFiles.value.length > 1) {
//     ElMessage.warning('视频文件请单独下载')
//     return
//   }
//   selectFiles.value.forEach(async item => {
//     let lastName = item.name.substr(item.name.lastIndexOf('.') + 1).toLowerCase()
//     console.log(item)
//     //TODO: 分享的大视频文件下载
//     if (lastName === 'mp4' && item.fileSize > window.appsetings.bigFileSize) {
//       const res = await downloadFile(item.id)
//       downloadFromStream(res, item.name)
//     } else {
//       shareDownloadFile(route.query.id, { fileFolderId: item.id, verCode: verCode.value }).then(res => {
//         downloadFromStream(res, item.name)
//       })
//     }
//   })
// }
const batchDownloadFile = async () => {
  let flag = selectFiles.value.length > 1 && selectFiles.value.some(file => file.type === 'VIDEO')
  if (flag) {
    ElMessage.warning('多选下载不能选择视频文件！')
    return
  }
  const fileFolderIds = []
  const loadingInstance = ElLoading.service({
    text: '下载中...',
    background: 'rgba(0, 0, 0, .3)'
  })
  console.log(selectFiles.value)
  selectFiles.value.forEach(item => {
    if (item.size < window.appsetings.bigFileSize) {
      fileFolderIds.push(item.id)
    } else {
      dialogDownloadRef.value.initDialog()
      dialogDownloadRef.value.downloadFile(item)
    }
  })
  try {
    console.log(selectFiles.value)
    if (selectFiles.value.length === 1) {
      if (selectFiles.value[0].size < window.appsetings.bigFileSize) {
        const res = await downloadFile(selectFiles.value[0].id)
        downloadFromStream(res, selectFiles.value[0].name)
      }
      loadingInstance.close()
    } else {
      if (fileFolderIds.length) {
        const res = await downloadFileToZip({ fileFolderIds })
        downloadFromStream(res, `${getNowDate()}.zip`)
      }
      loadingInstance.close()
    }
  } catch (error) {
    loadingInstance.close()
  }
}
const getNowDate = () => {
  let date = new Date()
  let month = date.getMonth() + 1 // 月
  let day = date.getDate() // 日
  let hour = date.getHours() // 时
  let minutes = date.getMinutes() // 分
  let seconds = date.getSeconds() //秒
  // 给一位数的数据前面加 “0”
  if (month >= 1 && month <= 9) {
    month = '0' + month
  }
  if (day >= 0 && day <= 9) {
    day = '0' + day
  }
  if (hour >= 0 && hour <= 9) {
    hour = '0' + hour
  }
  if (minutes >= 0 && minutes <= 9) {
    minutes = '0' + minutes
  }
  if (seconds >= 0 && seconds <= 9) {
    seconds = '0' + seconds
  }
  return `${month}${day}${hour}${minutes}${seconds}`
}
/**
 * -------图片预览----------
 */
const handleFileUrl = async row => {
  const res = await shareDownloadFile(route.query.id, { fileFolderId: row.id, verCode: verCode.value })
  row.fileUrl = window.URL.createObjectURL(new Blob([res]))
  tableData.value = [...tableData.value]
}
</script>
<style lang="scss" scoped>
@import '../dataScreen/index.scss';
</style>
