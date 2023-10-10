<template>
  <div class="page-container">
    <el-header>
      <div class="header-box">
        <div class="item"><img src="@/assets/images/header/logo.png" alt="" /> 汇博机器人云盘管理</div>
        <div style="display: flex; align-items: center">
          <el-dropdown trigger="click" style="cursor: pointer">
            <div class="username">{{ userInfo.real_name }}</div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout" divided>
                  <el-icon><SwitchButton /></el-icon>登出
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div class="item cursor ml-10" @click="toAdminPage" v-if="isAdmin || isManage">
            <el-icon class="icon" size="18"><HomeFilled /></el-icon> <span>返回后台</span>
          </div>
        </div>
      </div>
    </el-header>

    <el-container>
      <el-container>
        <LeftAside
          @filter-file="handleFilterFile"
          @home-page="homePage"
          @back-home="backHome"
          @recycle="getRecycleList"
          @share="getShareList"
          @browser="getBrowserList"
          @star="getStarList"
          ref="leftSide"
        ></LeftAside>
        <el-main>
          <!-- 按钮组 -->
          <div class="btn-group" style="width: 100%" v-if="showbtn">
            <div>
              <!-- 回收站 -->
              <template v-if="isRecycleStation">
                <el-button v-if="selectRows.length" type="primary" plain @click="batchRecycle">
                  <el-icon><RefreshLeft /></el-icon>
                  全部还原
                </el-button>
                <el-button v-if="selectRows.length" type="primary" plain @click="batchDeleteTrue">
                  <el-icon><Delete /></el-icon>
                  全部删除
                </el-button>
              </template>
              <template v-else>
                <template v-if="selectRows.length === 0">
                  <el-button type="primary" plain v-show="permission.upload" @click="handleUpload">
                    <el-icon><UploadFilled /></el-icon>上传</el-button
                  >
                  <el-divider direction="vertical" v-show="permission.newFolder" />
                  <el-button type="primary" plain @click="handleNewFolder" v-show="permission.newFolder">
                    <el-icon><FolderAdd /></el-icon>
                    新建文件夹
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    type="primary"
                    plain
                    @click="batchDownloadFile"
                    v-show="permission.download && selectFolders.length === 0"
                  >
                    <el-icon><Download /></el-icon>下载
                  </el-button>
                  <el-divider direction="vertical" v-show="permission.download && selectFolders.length === 0" />

                  <el-button type="primary" plain v-show="permission.rename && selectRows.length === 1" @click="handleRename">
                    <el-icon>
                      <Edit />
                    </el-icon>
                    重命名
                  </el-button>
                  <el-divider direction="vertical" v-show="permission.rename && selectRows.length === 1" />
                  <el-button type="primary" plain @click="batchCopy" v-show="permission.copy">
                    <el-icon><DocumentCopy /></el-icon>
                    复制
                  </el-button>
                  <el-divider direction="vertical" v-show="permission.copy" />
                  <el-button type="primary" plain @click="batchMove" v-show="permission.move">
                    <el-icon><SetUp /></el-icon>
                    移动
                  </el-button>
                  <el-divider direction="vertical" v-show="permission.move" />
                  <el-button type="primary" plain v-show="permission.delete" @click="batchDelete">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                  <el-divider direction="vertical" v-show="permission.delete" @click="batchDelete" />
                  <el-button type="primary" plain @click="batchAllot" v-show="permission.allot && selectRows.length === 1">
                    <el-icon><Guide /></el-icon>
                    分配权限
                  </el-button>
                  <el-divider direction="vertical" v-show="permission.allot && selectRows.length === 1" />
                  <el-button type="primary" plain @click="batchShare" v-show="permission.link">
                    <el-icon><Link /></el-icon>
                    分享文件
                  </el-button>
                </template>
                <el-divider direction="vertical" v-show="permission.allot" />
                <el-button type="primary" plain @click="dialogDownloadRef.initDialog()">
                  <el-icon><Sort /></el-icon>
                  下载列表
                </el-button>
              </template>
            </div>
            <div v-if="currentRow.name === '全部文件'">
              <el-input
                v-model="queryFileName"
                placeholder="请输入文件名"
                clearable
                :suffix-icon="Search"
                @change="getFileListByName"
              />
            </div>
          </div>

          <!-- 面包屑导航 -->
          <BreadCrumb v-show="navShow" @get-data="tableDbClickRow" @back-last="backLast" :data="breadcrumbData" />
          <!-- 首页 -->
          <HomePage
            v-if="isHomePage"
            @my_file="leftSide.handleBackHome"
            @my_share="leftSide.handleShare"
            @my_browser="leftSide.handleBrowser"
            @my_star="leftSide.handleStar"
            @my_trashed="leftSide.handleRecycle"
          ></HomePage>
          <!-- 文件区 -->
          <ShareList v-else-if="isShare"></ShareList>
          <!-- 浏览记录列表 -->
          <BrowserList v-else-if="isBrowser"></BrowserList>
          <el-table
            v-else
            ref="fileTableRef"
            :data="tableData"
            style="width: 100%"
            :row-class-name="tableRowClassName"
            @row-dblclick="tableDbClickRow"
            @row-contextmenu="showFileMenu"
            @cell-mouse-enter="tableHoverRow"
            @cell-mouse-leave="tableLeaveRow"
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
                  <svg-icon name="PICTURE" v-if="scope.row.type === 'PICTURE'" class="svg-icon"></svg-icon>
                  <!-- <img :src="scope.row.fileUrl" class="svg-icon" v-if="scope.row.type === 'PICTURE'" alt="" /> -->
                  <svg-icon name="MP4" v-else-if="scope.row.type === 'VIDEO'" class="svg-icon"></svg-icon>
                  <svg-icon name="Folder" v-else-if="scope.row.type === 'FOLDER'" class="svg-icon"></svg-icon>
                  <svg-icon :name="displayFileType(scope.row.name)" v-else class="svg-icon"></svg-icon>
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="time" align="center" sortable width="220px">
              <template #header>
                <el-icon>
                  <Calendar />
                </el-icon>
                <span>修改时间</span>
              </template>
              <template #default="scope">
                <div v-show="!scope.row.showDelBtn">
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
                </div>
                <el-button link class="delText" v-show="scope.row.showDelBtn" @click="batchRecycle">
                  <el-icon><RefreshLeft /></el-icon>
                  <span class="ml-3">还原</span>
                </el-button>
                <el-button link class="delText" v-show="scope.row.showDelBtn" @click="batchDeleteTrue">
                  <el-icon><Delete /></el-icon>
                  <span class="ml-3">删除</span>
                </el-button>
              </template>
            </el-table-column>

            <el-table-column prop="size" sortable width="140px">
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
                  {{ scope.row.size ? sizeTostr(scope.row.size) : '' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" align="center" width="160px">
              <!-- 表头 -->
              <template #header>
                <el-icon>
                  <Star />
                </el-icon>
                <span>收藏</span>
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
                <div v-show="!skeletonLoading && scope.row.type !== 'FOLDER'" @click="ifStar(scope.row)" style="height: 24px">
                  <el-icon v-if="!scope.row.star" size="20"><Star /></el-icon>
                  <el-icon v-if="scope.row.star" size="24"><StarFilled /></el-icon>
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
          </el-table>
        </el-main>
      </el-container>
      <el-footer>Copyright ©2023 江苏汇博机器人技术股份有限公司</el-footer>
    </el-container>
    <!-- 右键菜单 -->
    <Contextmenu ref="contextmenu" auto-ajust-placement>
      <ContextmenuItem v-if="permission.download && selectFolders.length === 0" @click="batchDownloadFile">
        <el-icon><Download /></el-icon>
        <label>
          {{ selectRows.length > 1 ? '批量下载' : '下载' }}
        </label>
      </ContextmenuItem>
      <ContextmenuDivider v-show="permission.download && selectFolders.length === 0"></ContextmenuDivider>
      <ContextmenuItem v-show="permission.rename && selectRows.length === 1" @click="handleRename">
        <el-icon>
          <Edit />
        </el-icon>
        <label>重命名</label>
      </ContextmenuItem>
      <ContextmenuItem v-show="permission.copy" @click="batchCopy">
        <el-icon><DocumentCopy /></el-icon>
        <label>复制</label>
      </ContextmenuItem>
      <ContextmenuItem v-show="permission.move" @click="batchMove">
        <el-icon><SetUp /></el-icon>
        <label>移动</label>
      </ContextmenuItem>

      <ContextmenuItem v-if="permission.delete" @click="batchDelete">
        <el-icon>
          <Delete />
        </el-icon>
        <label>删除 {{ selectRows.length > 0 ? '(' + selectRows.length + ')' : '' }}</label>
      </ContextmenuItem>

      <ContextmenuDivider v-show="permission.rename || permission.delete"></ContextmenuDivider>
      <ContextmenuItem v-show="permission.allot && selectRows.length === 1" @click="batchAllot">
        <el-icon><Guide /></el-icon>
        <label>分配权限</label>
      </ContextmenuItem>
      <ContextmenuItem v-show="permission.link && selectRows.length === 1" @click="batchShare">
        <el-icon><Link /></el-icon>
        <label> 分享文件</label>
      </ContextmenuItem>
    </Contextmenu>
    <!-- 文件下载 -->
    <DialogDownload ref="dialogDownloadRef" @search="searchFile"></DialogDownload>

    <!-- 文件上传 -->
    <DialogUpload ref="dialogUploadRef" @search="searchFile" :uploadAcceptType="uploadAcceptType"></DialogUpload>
    <!-- 文件、文件夹操作 -->
    <DialogHandler ref="dialogHandlerRef" @search="searchFile"></DialogHandler>
    <!-- 权限分配 -->
    <DialogAllot ref="dialogAllotRef" @search="searchFile"></DialogAllot>
    <!-- 分享链接 -->
    <DialogShare ref="dialogShareRef" @search="searchFile"></DialogShare>

    <el-dialog
      v-model="dialogTextVisible"
      draggable
      class="dialog-preview"
      :close-on-click-modal="false"
      :title="dialogTextTitle"
      top="4vh"
      width="50vw"
    >
      <!-- 视频在线预览 -->
      <VideoPlayer
        v-if="preview.type === 'video'"
        :file-id="preview.videoId"
        :file-name="preview.videoName"
        :sharding-list="preview.shardingList"
        :file-type="preview.fileType"
      ></VideoPlayer>
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
    <!-- <screen-short></screen-short> -->
  </div>
</template>
<script setup>
// import screenShort from 'vue-web-screen-shot'
import { resetRouter } from '@/routers/index'
import Fullscreen from '@/layouts/components/Header/components/Fullscreen.vue'
import { downloadFromStream, sizeTostr } from '@/utils'
import { displayFileType, filterFileType, filterFileClassify } from '@/utils/file'
// 右键菜单
import { Contextmenu, ContextmenuDivider, ContextmenuItem } from 'v-contextmenu'
import 'v-contextmenu/dist/themes/default.css'
import {
  getFileList,
  downloadFile,
  batchDeleteFile,
  renameFile,
  downloadFileToZip,
  addBrowserHistory,
  getBrowserHistoryList,
  starFile,
  cancelStarFile,
  getFilesList
} from '@/api/modules/file'
import { LOGIN_URL } from '@/config/config'
import { getFolderList, addFolder, renameFolder, batchDeleteFolder, batchDeleteFolderTrue } from '@/api/modules/folder'
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import useFileSelect from './hooks/useFileSelect.js'
import DialogHandler from './components/DialogHandler.vue'
import DialogAllot from './components/DialogAllot.vue'
import DialogShare from './components/DialogShare.vue'
import DialogUpload from './components/DialogUpload.vue'
import DialogDownload from './components/DialogDownload.vue'
import ShareList from './components/ShareList.vue'
import BrowserList from './components/BrowserList.vue'
import HomePage from '@/views/home/index.vue'
import LeftAside from '@/components/File/LeftAside.vue'
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
import { Search } from '@element-plus/icons-vue'
const route = useRoute()
const router = useRouter()
const globalStore = GlobalStore()
let leftSide = ref(null)
let queryFileName = ref('')

function getFileListByName() {
  if (queryFileName.value) {
    skeletonLoading.value = true
    getFileList({ originName: queryFileName.value, deleted: isRecycleStation.value, type: curtType.value }).then(res => {
      console.log(res)
      skeletonLoading.value = false
      if (res?.length) {
        tableData.value = res.map(item => {
          return {
            id: item.id,
            fileId: item.fileVo.id,
            name: item.originName || item.fileVo.originName,
            time: item.fileVo.lastUpdatedTime,
            md5: item.fileVo.md5,
            parentId: item.categoryVo.parentId,
            type: item.fileVo.type,
            size: item.fileVo.size,
            auth: item.userFileAuthVo?.type,
            fileUrl: null,
            star: item.star,
            shardingList: item.fileVo.shardingList,
            watermark: item.watermark
          }
        })
      } else {
        tableData.value = []
      }
    })
  }
}
const userInfo = computed(() => globalStore.userInfo)
const searchFile = () => {
  curtType.value ? handleFilterFile(curtType.value, false) : getCurtFile({ deleted: false })
}
const ifStar = async item => {
  // 回收站文件不执行收藏操作
  if (isRecycleStation.value) {
    return false
  }
  if (item.star) {
    await cancelStarFile(item.id)
    getStarList()
    ElMessage.success('取消收藏成功！')
  } else {
    await starFile(item.id)
    ElMessage.success('收藏成功！')
  }
  item.star = !item.star
}
//是否是回收站模式
const isRecycleStation = ref(false)
//查询回收站列表
const getRecycleList = () => {
  isRecycleStation.value = true
  navShow.value = true
  showbtn.value = true
  currentRow.name = '全部文件'
  getCurtFile({ deleted: true })
  isShare.value = false
  isBrowser.value = false
  isHomePage.value = false
  isShare.value = false
}
let isShare = ref(false)
let isBrowser = ref(false)
let isHomePage = ref(false)
// 查询收藏列表
const getStarList = () => {
  currentRow.name = ''
  isBrowser.value = false
  showbtn.value = false
  navShow.value = true
  isShare.value = false
  isHomePage.value = false
  isRecycleStation.value = false
  const foldId = currentRow.id || 0
  skeletonLoading.value = true
  getFileList({ fileCategoryId: foldId, deleted: false, star: true }).then(res => {
    skeletonLoading.value = false
    if (res?.length) {
      tableData.value = res.map(item => {
        return {
          id: item.id,
          fileId: item.fileVo.id,
          name: item.originName || item.fileVo.originName,
          time: item.fileVo.lastUpdatedTime,
          md5: item.fileVo.md5,
          parentId: item.categoryVo.parentId,
          type: item.fileVo.type,
          size: item.fileVo.size,
          auth: item.userFileAuthVo?.type,
          fileUrl: null,
          star: item.star,
          shardingList: item.fileVo.shardingList,
          watermark: item.watermark
        }
      })
    } else {
      tableData.value = []
    }
  })
}
// 查询浏览记录列表
const getBrowserList = () => {
  currentRow.name = ''
  navShow.value = false
  isBrowser.value = true
  showbtn.value = false
  isShare.value = false
  isHomePage.value = false
}
//查询分享列表
const getShareList = () => {
  currentRow.name = ''
  isShare.value = true
  showbtn.value = false
  isBrowser.value = false
  isHomePage.value = false
  navShow.value = true
}
const currentInstance = getCurrentInstance()
let {
  checkSelectable,
  selectRowsChange,
  selectRow,
  selectRows,
  selectFolders,
  selectFiles,
  tableRowClassName,
  toggleRowSelection
} = useFileSelect(currentInstance)

let permission = reactive({
  upload: true,
  newFolder: true,
  preview: true,
  open: true,
  download: true,
  rename: true,
  delete: true,
  allot: true,
  link: true,
  move: false,
  copy: false
})
const { isAdmin, isManage } = storeToRefs(globalStore)
watchEffect(() => {
  console.log(selectRows.value, 'selectRows')

  if (selectRows.value.some(item => item.auth === 'ONE')) {
    permission.upload = false
    permission.newFolder = false
    permission.download = false
    permission.rename = false
    permission.delete = false
    permission.copy = false
    permission.move = false
    permission.allot = false
    permission.link = false
    return
  }
  if (selectRows.value.some(item => item.auth === 'TWO')) {
    permission.upload = false
    permission.newFolder = false
    permission.download = true
    permission.rename = false
    permission.delete = false
    permission.copy = false
    permission.move = false
    permission.allot = false
    permission.link = false
    return
  }
  if (selectRows.value.some(item => item.auth === 'THREE')) {
    permission.upload = true
    permission.newFolder = true
    permission.download = true
    permission.rename = true
    permission.delete = false
    permission.copy = false
    permission.move = false
    permission.allot = false
    permission.link = false
    return
  }
  if (selectRows.value.some(item => item.auth === 'FOUR')) {
    permission.upload = true
    permission.newFolder = true
    permission.download = true
    permission.rename = true
    permission.delete = false
    permission.copy = true
    permission.move = true
    permission.allot = false
    permission.link = false
    return
  }
  //超管或者对文件有五级权限的人可以对文件任意操作
  if (isAdmin.value || selectRows.value.every(item => item.auth === 'FIVE' || item.auth === '' || item.auth === null)) {
    permission.upload = true
    permission.newFolder = true
    permission.download = true
    permission.rename = true
    permission.delete = true
    permission.copy = true
    permission.move = true
    permission.allot = true
    permission.link = true
  }
})
const currentRow = reactive({
  name: '全部文件',
  id: 0,
  auth: null
})
let curtType = ref(null)
let uploadAcceptType = ref('')
watch(
  () => curtType.value,
  type => {
    if (type === 'PICTURE') {
      uploadAcceptType.value = 'image/*'
    } else if (type === 'DOCUMENT') {
      uploadAcceptType.value =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (type === 'VIDEO') {
      uploadAcceptType.value = 'video/*'
    } else {
      uploadAcceptType.value = undefined
    }
  }
)
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
watch(
  () => currentRow.auth,
  val => {
    switch (val) {
      case 'ONE':
        permission.upload = false
        permission.newFolder = false
        permission.download = false
        permission.rename = false
        permission.delete = false

        break
      case 'TWO':
        permission.upload = false
        permission.newFolder = false
        permission.download = true
        permission.rename = false
        permission.delete = false
        break
      case 'THREE':
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = true
        permission.delete = false
        break
      case 'FOUR':
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = true
        permission.delete = false
        break

      default:
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = true
        permission.delete = true
        break
    }
  }
)
const fileTableRef = ref()
let tableData = ref([])
let navShow = ref(false)
let breadcrumbData = ref([])
let skeletonLoading = ref(false)

//获取文件和文件夹
const getCurtFile = params => {
  const foldId = currentRow.id || 0
  skeletonLoading.value = true
  let p1 = getFolderList({ parentId: foldId, ...params })
  let p2 = getFileList({ fileCategoryId: foldId, ...params })
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
          md5: item.fileVo.md5,
          parentId: item.categoryVo.parentId,
          type: item.fileVo.type,
          size: item.fileVo.size,
          auth: item.userFileAuthVo?.type,
          fileUrl: null,
          star: item.star,
          shardingList: item.fileVo.shardingList,
          watermark: item.watermark
        }
      })
      // arr2.forEach(item => {
      //   if (item.type === 'PICTURE') {
      //     handleFileUrl(item)
      //   }
      // })

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
    getCurtFile({ deleted: isRecycleStation.value })
  }
}

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
  textName: null,
  shardingList: null
})

//表格单击-文件预览
const tableClickRow = async row => {
  toggleRowSelection(row, true)
  console.log(row)
  if (row.type !== 'FOLDER') {
    addBrowserHistory(row.id)
      .then(res => console.log(res))
      .catch(() => {})
  }
  if (row.type === 'PICTURE') {
    console.log(selectRows.value)
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
    // if (row.size >= window.appsetings.bigFileSize) {
    //   ElMessage.warning({
    //     title: '提示',
    //     message: '暂不支持大视频文件预览功能',
    //     duration: 5000,
    //     showClose: true,
    //     grouping: true
    //   })
    //   return
    // }
    dialogTextTitle.value = row.name
    dialogTextVisible.value = true
    preview.type = 'video'
    preview.videoId = row.id
    preview.videoName = row.name
    preview.shardingList = row.shardingList
    console.log('preview', preview, row)
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
    if (isRecycleStation.value) {
      ElMessage.warning('当前文件夹已删除')
      return
    }
    Object.assign(currentRow, row)
    getCurtFile({ deleted: isRecycleStation.value })
  }
}
const tableHoverRow = row => {
  if (isRecycleStation.value) row.showDelBtn = true
}
const tableLeaveRow = row => {
  if (isRecycleStation.value) row.showDelBtn = false
}

//表格右键
const showFileMenu = (row, column, event) => {
  console.log(row, column, event)
  toggleRowSelection(row, true)
  if (isRecycleStation.value) {
    return
  }
  let contextmenuRef = currentInstance.proxy.$refs.contextmenu
  event.preventDefault()
  event.stopPropagation()
  contextmenuRef.show({
    top: event.clientY,
    left: event.clientX
  })
  window.onclick = () => {
    contextmenuRef.hide()
  }
  contextmenuRef.$el.hidden = false
}
/**
 * -------文件/文件夹相关操作----------
 */
const dialogUploadRef = ref()
//文件上传
const handleUpload = () => {
  dialogUploadRef.value.initDialog(currentRow.id)
}
//创建文件夹
const handleNewFolder = () => {
  ElMessageBox.prompt(`在 <b>${currentRow.name}</b> 下创建文件夹，请输入要创建的文件夹名称`, '新建文件夹', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    draggable: true,
    inputValidator(val) {
      if (!val) {
        return '文件夹名称不能为空'
      }

      if (val.includes('/')) {
        return '文件夹名称不能包含 /'
      }
      return true
    }
  }).then(({ value }) => {
    let param = {
      parentId: currentRow.id,
      name: value
    }
    addFolder(param)
      .then(() => {
        ElMessage.success('创建成功')
      })
      .finally(() => {
        getCurtFile({ deleted: false })
      })
  })
}
// 重命名文件/文件夹
const handleRename = () => {
  let row = selectRow.value
  if (row === null) {
    ElMessage.warning('请先选中一个文件或文件夹！')
    return
  }
  ElMessageBox.prompt(`将 <b>${row.name}</b> 修改为：`, '提示', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: row.name,
    inputValidator(val) {
      return !!val
    },
    inputErrorMessage: '模板名称不能为空.'
  }).then(({ value }) => {
    let param

    let reqMethod
    if (row.type === 'FOLDER') {
      param = {
        id: row.id,
        name: value
      }
      reqMethod = renameFolder
    } else {
      param = {
        id: row.id,
        originName: value
      }
      reqMethod = renameFile
    }

    const renameLoadingInstance = ElLoading.service({
      fullscreen: true,
      text: '重命名中...',
      background: 'rgba(255, 255, 255, 0.6)'
    })

    reqMethod(param)
      .then(() => {
        ElMessage.success('重命名成功')
      })
      .finally(() => {
        renameLoadingInstance.close()
        searchFile()
      })
  })
}

//批量删除
const batchDelete = () => {
  ElMessageBox.confirm('确认要删除吗, 是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const folderIds = selectFolders.value.map(item => item.id)
    const fileIds = selectFiles.value.map(item => item.id)

    if (folderIds.length) {
      batchDeleteFolder(folderIds).then(() => {
        searchFile()
        ElMessage.success('删除文件夹成功！')
      })
    }
    if (fileIds.length) {
      batchDeleteFile(fileIds).then(() => {
        searchFile()
        ElMessage.success('删除文件成功！')
      })
    }
  })
}
const dialogDownloadRef = ref()
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

//批量下载
const batchDownloadFile = async () => {
  let flag = selectFiles.value.length > 1 && selectFiles.value.some(file => file.type === 'VIDEO')
  if (flag) {
    ElMessage.warning('多选下载不能选择视频文件！')
    return
  }
  // selectFiles.value.forEach(item => {
  //   if (item.size < window.appsetings.bigFileSize) {
  //     downloadFile(item.id).then(res => {
  //       downloadFromStream(res, item.name)
  //     })
  //   } else {
  //     dialogDownloadRef.value.initDialog()
  //     dialogDownloadRef.value.downloadFile(item)
  //   }
  // })
  const fileFolderIds = []
  const bigFileList = []
  const loadingInstance = ElLoading.service({
    text: '下载中...',
    background: 'rgba(0, 0, 0, .3)'
  })
  console.log(selectFiles.value)
  selectFiles.value.forEach(item => {
    if (item.size < window.appsetings.bigFileSize) {
      fileFolderIds.push(item.id)
    } else {
      bigFileList.push(item.fileId)
      dialogDownloadRef.value.initDialog()
      dialogDownloadRef.value.downloadFile(item)
    }
  })
  // if (bigFileList.length) {
  //   ElMessage.warning('下载中包含大文件，请耐心等待下载完成！')
  // }
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
const dialogHandlerRef = ref()
const dialogShareRef = ref()
//批量拷贝
const batchCopy = () => {
  dialogHandlerRef.value.initDialog(selectRows.value, 'copy')
}
//批量移动
const batchMove = () => {
  dialogHandlerRef.value.initDialog(selectRows.value, 'move')
}
//批量移动
const batchShare = () => {
  dialogShareRef.value.initDialog(selectRows.value)
}
// 真实删除文件
const batchDeleteTrue = () => {
  ElMessageBox.confirm('确认要删除吗, 是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const folderIds = selectFolders.value.map(item => item.id)
    const fileIds = selectFiles.value.map(item => item.id)
    batchDeleteFolderTrue({ fileCategoryIds: folderIds, fileFolderIds: fileIds }).then(res => {
      console.log(res)
      ElMessage.success('删除文件成功！')
      getCurtFile({ deleted: true })
    })
  })
}
//批量还原
const batchRecycle = () => {
  ElMessageBox.confirm('确认要还原吗, 是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const folderIds = selectFolders.value.map(item => item.id)
    const fileIds = selectFiles.value.map(item => item.id)

    if (folderIds.length) {
      batchDeleteFolder(folderIds, false).then(() => {
        ElMessage.success('还原文件夹成功！')
        getCurtFile({ deleted: true })
      })
    }
    if (fileIds.length) {
      batchDeleteFile(fileIds, false).then(() => {
        ElMessage.success('还原文件成功！')
        getCurtFile({ deleted: true })
      })
    }
  })
}
//权限分配
const dialogAllotRef = ref()
const batchAllot = () => {
  dialogAllotRef.value.initDialog(selectRows.value)
}

/**
 * -------侧边栏相关----------
 */
let showbtn = ref(false)

//筛选文件类型
const handleFilterFile = (type, deleted = false) => {
  currentRow.name = ''
  isShare.value = false
  isBrowser.value = false
  showbtn.value = true
  isHomePage.value = false
  currentRow.id = 0
  permission.upload = true
  permission.newFolder = false
  curtType.value = type
  getFileList({ type: curtType.value, deleted: deleted }).then(res => {
    tableData.value = res.map(item => {
      return {
        id: item.id,
        fileId: item.fileVo.id,
        name: item.originName || item.fileVo.originName,
        time: item.fileVo.lastUpdatedTime,
        parentId: item.categoryVo.parentId,
        type: item.fileVo.type,
        size: item.fileVo.size,
        auth: item.userFileAuthVo?.type,
        shardingList: item.fileVo.shardingList,
        watermark: item.watermark
      }
    })
    // tableData.value.forEach(item => {
    //   if (item.type === 'PICTURE') {
    //     handleFileUrl(item)
    //   }
    // })
  })
}
// 返回首页
const homePage = () => {
  currentRow.name = ''
  navShow.value = false
  isShare.value = false
  isBrowser.value = false
  isHomePage.value = true
  showbtn.value = false
}
//查询主列表
const backHome = () => {
  currentRow.name = '全部文件'
  currentRow.id = 0
  showbtn.value = true
  navShow.value = true
  curtType.value = null
  isRecycleStation.value = false
  isShare.value = false
  isBrowser.value = false
  isHomePage.value = false

  Object.assign(permission, {
    upload: true,
    newFolder: true,
    preview: true,
    open: true,
    download: true,
    rename: true,
    delete: true,
    allot: true,
    link: true,
    move: false,
    copy: false
  })

  getCurtFile({ deleted: false })
}

/**
 * -------返回首页----------
 */

const toAdminPage = () => {
  console.log(dialogDownloadRef.value.downloadingFileList.length)
  if (dialogDownloadRef.value.downloadingFileList.length) {
    ElMessageBox.confirm('当前正在下载文件，是否退出当前页面?', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push({
        name: 'personalManage'
      })
    })
  } else {
    router.push({
      name: 'personalManage'
    })
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
// 退出登录
const logout = () => {
  ElMessageBox.confirm('您是否确认退出登录?', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 2.清除 Token
    globalStore.setToken('')
    // 3.重置路由
    resetRouter()
    // 4.重定向到登陆页，并携带当前退出页地址和参数
    const path = `${LOGIN_URL}?redirect=${route.path}&params=${JSON.stringify(route.query ? route.query : route.params)}`
    router.replace(path)
    ElMessage.success('退出登录成功！')
  })
}
</script>
<style lang="scss" scoped>
@import './index.scss';
.userName {
  margin-right: 12px;
}
</style>
