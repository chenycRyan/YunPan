<template>
  <div class="page-container">
    <CommonHeader></CommonHeader>

    <el-container>
      <el-container>
        <LeftAside
          @filter-file="handleFilterFile"
          @home-page="homePage"
          @back-home="backHome"
          @public-file="asidePublic"
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
                <el-button v-if="selectRows.length" type="primary" plain @click="batchRecycle()">
                  <el-icon><RefreshLeft /></el-icon>
                  全部还原
                </el-button>
                <el-button v-if="selectRows.length" type="primary" plain @click="batchDeleteTrue()">
                  <el-icon><Delete /></el-icon>
                  全部删除
                </el-button>
              </template>
              <template v-else>
                <template v-if="selectRows.length === 0">
                  <el-button type="primary" style="color: #5fd2c6" plain v-show="permission.upload" @click="handleUpload">
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

                  <el-button type="primary" plain @click="batchAllot" v-show="permission.allot">
                    <el-icon><Guide /></el-icon>
                    分配权限
                  </el-button>

                  <el-divider direction="vertical" v-show="permission.allot" />
                  <el-button type="primary" plain @click="batchShare" v-show="permission.link">
                    <el-icon><Link /></el-icon>
                    分享文件
                  </el-button>
                  <el-divider direction="vertical" v-show="permission.link" />
                  <el-button
                    type="primary"
                    plain
                    @click="batchSetOpen && selectRows.length === 1 && selectRow.type === 'FOLDER'"
                    v-show="permission.open"
                  >
                    <el-icon><FolderChecked /></el-icon>
                    {{ selectRow?.status === 'COMMON' ? '取消公开' : '公开文件' }}
                  </el-button>
                </template>
                <el-divider direction="vertical" v-show="permission.allot && permission.download" />
                <el-button type="primary" plain @click="dialogDownloadRef.initDialog()">
                  <el-icon><Sort /></el-icon>
                  下载列表
                </el-button>
              </template>
            </div>
            <div>
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
            :data="filterTableData"
            style="width: 100%"
            class="mt-10"
            :row-class-name="tableRowClassName"
            @row-dblclick="tableDbClickRow"
            @row-contextmenu="showFileMenu"
            @cell-mouse-enter="tableHoverRow"
            @cell-mouse-leave="tableLeaveRow"
            @selection-change="selectRowsChange"
            max-height="75vh"
          >
            <template #empty>
              <div>
                <svg-icon class="empty-icon" name="empty" />
                <div class="font-bold text-base">数据为空，请先上传或添加文件</div>
              </div>
            </template>

            <el-table-column width="40px" type="selection" :selectable="checkSelectable"> </el-table-column>
            <el-table-column prop="name" min-width="180px">
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
                  <div v-if="scope.row.type === 'PICTURE'">
                    <img :src="scope.row.fileUrl" v-if="scope.row.fileUrl" class="svg-icon" alt="" />
                    <svg-icon name="PICTURE" v-else class="svg-icon"></svg-icon>
                  </div>
                  <svg-icon name="MP4" v-else-if="scope.row.type === 'VIDEO'" class="svg-icon"></svg-icon>
                  <svg-icon name="FOLDER" v-else-if="scope.row.type === 'FOLDER'" class="svg-icon"></svg-icon>
                  <svg-icon :name="displayFileType(scope.row.name)" v-else class="svg-icon"></svg-icon>

                  <el-tooltip :content="scope.row.name" placement="bottom">
                    <div class="text_ellipsis">{{ scope.row.name }}</div>
                    {{ scope.row.name }}
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="time" align="center" sortable width="120px">
              <template #header>
                <el-icon><User /></el-icon>
                <span>创建人</span>
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
                  {{ scope.row.createdByName }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createdTime" align="center" sortable width="220px">
              <template #header>
                <el-icon>
                  <Calendar />
                </el-icon>
                <span>创建时间</span>
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
                  {{ scope.row.createdTime }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="time" align="center" sortable width="220px">
              <template #header>
                <el-icon>
                  <Calendar />
                </el-icon>
                <span>{{ isRecycleStation ? '删除时间' : '修改时间' }}</span>
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
                    {{ scope.row.lastUpdatedTime }}
                  </div>
                </div>
                <el-button link class="delText" v-show="scope.row.showDelBtn" @click="batchRecycle(scope.row)">
                  <el-icon><RefreshLeft /></el-icon>
                  <span class="ml-3">还原</span>
                </el-button>
                <el-button link class="delText" type="danger" v-show="scope.row.showDelBtn" @click="batchDeleteTrue(scope.row)">
                  <el-icon><Delete /></el-icon>
                  <span class="ml-3">删除</span>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="path" sortable width="140px" v-if="isPublicFolder">
              <!-- 表头 -->
              <template #header>
                <el-icon>
                  <Coin />
                </el-icon>
                <span>路径</span>
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
                  {{ scope.row.path }}
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="size" align="center" sortable width="100px" v-if="!isPublicFolder">
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
            <el-table-column prop="size" align="center" width="100px">
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
            <el-table-column align="center" sortable width="100px">
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
                <div v-show="!skeletonLoading" v-if="scope.row.type === 'FOLDER'">
                  <div v-if="isAdmin">
                    <el-tooltip
                      v-if="scope.row.status === 'COMMON'"
                      class="box-item"
                      effect="dark"
                      content="所有人均可操作文件"
                      placement="bottom"
                    >
                      <img :src="useImage(`images/level/OPEN.png`)" @click="openDetail(scope.row)" class="levelImg" alt="" />
                    </el-tooltip>
                    <el-tooltip class="box-item" effect="dark" v-else content="最高权限" placement="bottom">
                      <img :src="useImage(`images/level/FIVE.png`)" @click="openDetail(scope.row)" class="levelImg" alt="" />
                    </el-tooltip>
                  </div>
                  <div v-else>
                    <el-tooltip
                      class="box-item"
                      effect="dark"
                      v-if="scope.row.status === 'AUTH' && scope.row.auth"
                      :content="filterLevel(scope.row.auth)"
                      placement="bottom"
                    >
                      <img
                        :src="useImage(`images/level/${scope.row.auth}.png`)"
                        @click="openDetail(scope.row)"
                        class="levelImg"
                        alt=""
                      />
                    </el-tooltip>
                    <el-tooltip
                      v-if="scope.row.status === 'COMMON'"
                      class="box-item"
                      effect="dark"
                      content="所有人均可操作文件"
                      placement="bottom"
                    >
                      <img :src="useImage(`images/level/OPEN.png`)" @click="openDetail(scope.row)" class="levelImg" alt="" />
                    </el-tooltip>
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination_box">
            <el-pagination
              v-if="tableData.length"
              background
              layout="prev, pager, next ,total,sizes"
              :total="tableData.length"
              @current-change="handleCurrentChange"
              @size-change="handleSizeChange"
            />
            <div class="ml-10">文件夹：{{ folderCount }}</div>
            <div class="ml-10">文件：{{ fileCount }}</div>
          </div>
        </el-main>
      </el-container>
      <el-footer>Copyright ©2023 江苏汇博机器人技术股份有限公司</el-footer>
    </el-container>
    <!-- 右键菜单 -->
    <Contextmenu ref="contextmenuRef" auto-ajust-placement>
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

      <ContextmenuItem v-show="permission.allot" @click="batchAllot">
        <el-icon><Guide /></el-icon>
        <label>分配权限</label>
      </ContextmenuItem>
      <ContextmenuItem v-show="permission.link" @click="batchShare">
        <el-icon><Link /></el-icon>
        <label> 分享文件</label>
      </ContextmenuItem>
      <ContextmenuItem v-show="permission.open && selectRows.length === 1 && selectRow.type === 'FOLDER'" @click="batchSetOpen">
        <el-icon><FolderChecked /></el-icon>
        <label> {{ selectRow?.status === 'COMMON' ? '取消公开' : '公开文件' }} </label>
      </ContextmenuItem>
      <ContextmenuItem v-show="(isAdmin || isManage) && selectRows.length === 1" @click="openFileLog">
        <el-icon><Tickets /></el-icon>
        <label> 文件日志</label>
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
    <!-- 文件日志 -->
    <DialogFileLog ref="dialogFileLogRef"></DialogFileLog>
    <!-- 文件详情 -->
    <DialogDetail ref="dialogDetailRef"></DialogDetail>

    <el-dialog
      v-model="dialogTextVisible"
      draggable
      class="dialog-preview"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :title="dialogTextTitle"
      :fullscreen="fullDialog"
      top="4vh"
      width="50vw"
    >
      <template #header>
        <div class="dialog_header">
          <div>
            <h2>{{ dialogTextTitle }}</h2>
          </div>

          <el-button @click="fullDialog = !fullDialog" circle>
            <el-icon><FullScreen /></el-icon
          ></el-button>
        </div>
      </template>
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
      <DocxViewer v-if="preview.type === 'docx'" :full="fullDialog" :file-id="preview.docxId" />
      <!--Xlsx文件在线预览 -->
      <XlsxViewer v-if="preview.type === 'xlsx'" :full="fullDialog" :file-id="preview.xlsxId" />
    </el-dialog>
    <el-dialog
      title="创建文件夹"
      v-model="dialogVisible"
      :before-close="closeDialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="30vw"
    >
      <div class="tips">
        在 <b>{{ currentRow.name }}</b> 下创建
      </div>
      <el-form ref="newFolderRef" :model="newFolderForm" :rules="rules" label-width="120px">
        <el-form-item label="文件夹名称" prop="name">
          <el-input v-model="newFolderForm.name" placeholder="请输入文件夹名称"></el-input>
        </el-form-item>
        <el-form-item label="文件夹权限" prop="authType" v-if="currentRow.status !== 'COMMON'">
          <el-radio-group v-model="newFolderForm.authType">
            <el-radio label="DEFAULT">默认文件</el-radio>
            <el-radio label="PRIVATE">私人文件</el-radio>
            <el-radio label="DEP_PRIVATE">部门文件</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div class="flex-center just-end">
        <el-button type="" @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleCreateFolder">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import CommonHeader from './components/CommonHeader.vue'
import { downloadFromStream, sizeTostr } from '@/utils'
import { displayFileType, filterFileType } from '@/utils/file'
// 右键菜单
import { Contextmenu, ContextmenuDivider, ContextmenuItem } from 'v-contextmenu'
import 'v-contextmenu/dist/themes/default.css'
import {
  getFileList,
  downloadFile,
  batchDeleteFile,
  modifyFile,
  downloadFileToZip,
  addBrowserHistory,
  starFile,
  cancelStarFile
} from '@/api/modules/file'

import {
  getFolderList,
  addFolder,
  modifyFolder,
  batchDeleteFolder,
  batchDeleteFolderTrue,
  batchSetFolder,
  getSonFolder,
  getCommomFolder
} from '@/api/modules/folder'
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import useFileSelect from './hooks/useFileSelect.js'
import DialogHandler from './components/DialogHandler.vue'
import DialogAllot from './components/DialogAllot.vue'
import DialogShare from './components/DialogShare.vue'
import DialogUpload from './components/DialogUpload.vue'
import DialogDownload from './components/DialogDownload.vue'
import DialogDetail from './components/DialogDetail.vue'
import ShareList from './components/ShareList.vue'
import BrowserList from './components/BrowserList.vue'
import DialogFileLog from './components/DialogFileLog.vue'
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
const globalStore = GlobalStore()
let leftSide = ref(null)
let queryFileName = ref('')
const fullDialog = ref(false)

function getFileListByName() {
  if (queryFileName.value) {
    skeletonLoading.value = true
    // type: curtType.value
    getFileList({ originName: queryFileName.value, deleted: isRecycleStation.value }).then(res => {
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
        filterShowTable()
      } else {
        tableData.value = []
      }
    })
  }
}

const searchFile = () => {
  if (selectRow.value && selectRow.value.status === 'COMMON' && selectRow.value.type === 'FOLDER') {
    getPublicList()
  } else {
    curtType.value ? handleFilterFile(curtType.value, false) : getCurtFile({ deleted: false })
  }
}
const ifStar = async item => {
  // 回收站文件不执行收藏操作
  if (isRecycleStation.value) {
    return false
  }
  if (item.star) {
    await cancelStarFile(item.id)
    // getStarList()
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
  navShow.value = false
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
      filterShowTable()
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
  currentRow.id = 0
  isShare.value = true
  showbtn.value = false
  isBrowser.value = false
  isHomePage.value = false
  navShow.value = false
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
  upload: false,
  newFolder: false,
  preview: false,
  open: false,
  download: false,
  rename: false,
  delete: false,
  allot: false,
  link: false,
  move: false,
  copy: false
})

const { isAdmin, isManage } = storeToRefs(globalStore)
const handleBtnAuth = () => {
  nextTick(() => {
    let isTopRoot = false
    const folderList = tableData.value.filter(item => item.type === 'FOLDER')
    if (folderList.length > 0) {
      isTopRoot = folderList.every(item => item.parentId === 0)
    }

    //只有超管在顶级目录有编辑权限
    //顶级目录=>最高管理员=>所有权限；普通用户无权限
    // 其他目录=>普通用户=>默认权限=>选中行权限

    if (isTopRoot) {
      //超管有所有权限
      if (isAdmin.value) {
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

        //如果有选中行
        if (selectRows.value && selectRows.value.length) {
          handleCurrentRowAuth()
          handleSelectAuth()
        } else {
          //关闭右键菜单
          currentInstance.proxy.$refs.contextmenuRef.hide()
          handleCurrentRowAuth()
        }
      } else {
        //普通用户默认没有权限
        Object.assign(permission, {
          upload: false,
          newFolder: false,
          preview: false,
          open: false,
          download: false,
          rename: false,
          delete: false,
          allot: false,
          link: false,
          move: false,
          copy: false
        })
      }
    } else {
      //先重置权限
      Object.assign(permission, {
        upload: false,
        newFolder: false,
        preview: false,
        open: false,
        download: false,
        rename: false,
        delete: false,
        allot: false,
        link: false,
        move: false,
        copy: false
      })
      //如果有选中行
      if (selectRows.value && selectRows.value.length) {
        handleCurrentRowAuth()
        handleSelectAuth()
      } else {
        //关闭右键菜单
        currentInstance.proxy.$refs.contextmenuRef.hide()
        handleCurrentRowAuth()
      }
    }

    console.log(permission, 'watchEffect')
  })
}
const handleCurrentRowAuth = () => {
  if (currentRow.status === 'COMMON') {
    permission.upload = true
    permission.newFolder = true
    permission.download = true
    permission.rename = true
    permission.delete = true
  } else {
    switch (currentRow.auth) {
      case 'READ_ONLY':
        permission.upload = false
        permission.newFolder = false
        permission.download = false
        permission.rename = false
        permission.delete = false
        permission.copy = false
        permission.move = false
        permission.allot = false
        permission.link = false
        permission.open = false
        break
      case 'READ_ONLY_FOLDER':
        permission.upload = false
        permission.newFolder = false
        permission.download = false
        permission.rename = false
        permission.delete = false
        permission.copy = false
        permission.move = false
        permission.allot = false
        permission.link = false
        permission.open = false
        break
      case 'ONE':
        permission.upload = false
        permission.newFolder = false
        permission.download = false
        permission.rename = false
        permission.delete = false
        break
      case 'TWO':
        permission.upload = true
        permission.newFolder = true
        permission.download = false
        permission.rename = false
        permission.delete = false
        break
      case 'THREE':
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = false
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
}
const handleSelectAuth = () => {
  if (selectRows.value && selectRows.value.length) {
    const folder = selectRows.value.filter(item => item.type === 'FOLDER')
    const fileList = selectRows.value.filter(item => item.type !== 'FOLDER')
    if (folder.length > 0) {
      permission.allot = true
      permission.link = false
      //公开文件任何人可以对文件任意操作
      if (folder.every(item => item.status === 'COMMON')) {
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = true
        permission.delete = true
        permission.copy = true
        permission.move = true
        permission.allot = true
        permission.open = true
        return
      }
      //只读
      if (folder.some(item => item.auth === 'READ_ONLY' || item.auth === 'READ_ONLY_FOLDER')) {
        permission.upload = false
        permission.newFolder = false
        permission.download = false
        permission.rename = false
        permission.delete = false
        permission.copy = false
        permission.move = false
        permission.allot = false
        permission.open = false
        return
      }
      //不可见
      if (folder.some(item => item.auth === 'ONE')) {
        permission.upload = false
        permission.newFolder = false
        permission.download = false
        permission.rename = false
        permission.delete = false
        permission.copy = false
        permission.move = false
        permission.allot = false

        permission.open = false
        return
      }
      if (folder.some(item => item.auth === 'TWO')) {
        permission.upload = true
        permission.newFolder = true
        permission.download = false
        permission.rename = false
        permission.delete = false
        permission.copy = false
        permission.move = false
        permission.allot = false
        permission.open = false
        return
      }
      if (folder.some(item => item.auth === 'THREE')) {
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = false
        permission.delete = false
        permission.copy = false
        permission.move = false
        permission.allot = false
        permission.open = false
        return
      }
      if (folder.some(item => item.auth === 'FOUR')) {
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = true
        permission.delete = false
        permission.copy = true
        permission.move = true
        permission.allot = false
        permission.open = false
        return
      }

      //超管或者对文件有五级权限的人可以对文件任意操作
      if (isAdmin.value || folder.every(item => item.auth === 'FIVE' || !item.auth || item.status === 'COMMON')) {
        permission.upload = true
        permission.newFolder = true
        permission.download = true
        permission.rename = true
        permission.delete = true
        permission.copy = true
        permission.move = true
        permission.allot = true
        permission.open = true
      }
    } else if (fileList.length > 1) {
      permission.link = false
      permission.allot = false
    } else if (fileList.length === 1) {
      permission.link = true
      permission.allot = false
    }

    //只对文件分配权限
    if (selectRows.value.some(item => item.type !== 'FOLDER')) {
      permission.allot = false
    }
  }
}
watch(
  () => selectRows.value,
  () => {
    console.log(selectRows.value, 'selectRows')

    handleBtnAuth()
  },
  {
    deep: true
  }
)
let tableData = ref([])
watch(
  () => tableData.value,
  () => {
    console.log(tableData.value, 'tableData')
    handleBtnAuth()
  },
  {
    deep: true
  }
)
watch(
  () => isAdmin.value,
  () => {
    //只有超管在顶级目录有编辑权限
    nextTick(() => {
      if (isAdmin.value) {
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
      } else {
        Object.assign(permission, {
          upload: false,
          newFolder: false,
          preview: false,
          open: false,
          download: false,
          rename: false,
          delete: false,
          allot: false,
          link: false,
          move: false,
          copy: false
        })
      }
    })
  }
)
//最高管理员，可以修改根目录下的文件

const currentRow = reactive({
  name: '全部文件',
  id: 0,
  auth: null
})
watch(
  () => currentRow.auth,
  () => {
    handleBtnAuth()
  }
)

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
    ONE: '不可见',
    TWO: '查看、上传、创建',
    THREE: '查看、上传、创建、下载',
    FOUR: '查看、上传、创建、下载、复制、移动、重命名',
    FIVE: '最高权限',
    READ_ONLY: '查看',
    READ_ONLY_FOLDER: '查看'
  }
  return levelLabel[key]
}

const fileTableRef = ref()

let navShow = ref(false)
let breadcrumbData = ref([
  {
    id: 0,
    name: '全部文件'
  }
])
let skeletonLoading = ref(false)

//获取文件和文件夹
const getCurtFile = params => {
  let foldId = currentRow.id || 0
  if (params.deleted) {
    foldId = null
  }
  // 获取公共文件夹顶层文件
  if (isPublicFolder.value && !foldId) {
    showbtn.value = false
    getPublicList()
    return
  }
  skeletonLoading.value = true
  let p1 = getFolderList({ parentId: foldId, ...params })
  let p2 = getFileList({ fileCategoryId: foldId, ...params })
  Promise.all([p1, p2])
    .then(res => {
      console.log(res)
      skeletonLoading.value = false
      //文件夹
      const arr1 = res[0].map(item => {
        const { id, name, parentId, parent, status, createdByName, lastUpdatedTime, createdTime } = item
        return {
          id,
          name,
          parentId,
          status,
          parent,
          time: lastUpdatedTime,
          createdByName,
          lastUpdatedTime,
          createdTime,
          type: 'FOLDER',
          auth: item.userFileAuthVo?.type
        }
      })

      // 赋值导航面包屑

      if (currentRow.id !== 0) {
        const currentIndex = breadcrumbData.value.findIndex(item => item.id === currentRow.id)
        if (currentIndex > -1) {
          //删除当前点击之后的
          breadcrumbData.value.splice(currentIndex + 1)
        } else {
          breadcrumbData.value.push({
            id: currentRow.id,
            name: currentRow.name
          })
        }
      } else {
        //全部文件只保留一项
        breadcrumbData.value.splice(1)
      }
      //文件
      const arr2 = res[1].map(item => {
        return {
          id: item.id,
          fileId: item.fileVo.id,
          name: item.originName || item.fileVo.originName,
          time: item.fileVo.lastUpdatedTime,
          createdByName: item.createdByName,
          lastUpdatedTime: item.lastUpdatedTime,
          createdTime: item.createdTime,
          md5: item.fileVo.md5,
          parentId: item.categoryVo.parentId,
          type: item.fileVo.type,
          status: item.status,
          size: item.fileVo.size,
          auth: item.userFileAuthVo?.type,
          fileUrl: null,
          star: item.star,
          shardingList: item.fileVo.shardingList,
          watermark: item.watermark
        }
      })

      tableData.value = arr1.concat(arr2)

      filterShowTable()
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
  } else {
    ElMessage.success('当前已经是顶级目录！')
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
  // toggleRowSelection(row, true)
  console.log(row)
  if (row.type !== 'FOLDER') {
    addBrowserHistory(row.id)
    if (row.size > 1024 * 1024 * 10) {
      ElMessage.warning('文件大于10M，暂不支持在线预览！')
      return
    }
  }

  if (row.type === 'PICTURE') {
    const imgIoading = ElLoading.service({
      text: '图片加载中...',
      background: 'rgba(0, 0, 0, .3)'
    })
    try {
      const imgList = [await handleFileUrl(row)]
      const index = imgList.findIndex(item => item === row.fileUrl)
      v3ImgPreviewFn({
        images: imgList,
        index: index
      })
      imgIoading.close()
    } catch (error) {
      console.log(error)
      imgIoading.close()
    }
  } else if (row.type === 'VIDEO') {
    if (row.shardingList) {
      dialogTextTitle.value = row.name
      dialogTextVisible.value = true
      preview.type = 'video'
      preview.videoId = row.id
      preview.videoName = row.name
      preview.shardingList = row.shardingList
      console.log('preview', preview, row)
    } else ElMessage.warning('暂不支持在线预览！')
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
      // ElMessage.warning('回收站模式下，无法预览！')
      return
    }

    Object.assign(currentRow, row)

    //公开文件顶级目标隐藏按钮
    if (currentRow.id && isPublicFolder.value) showbtn.value = true
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

  if ((row.auth !== 'READ_ONLY' && row.auth !== 'ONE' && row.auth !== 'READ_ONLY_FOLDER') || row.status == 'COMMON') {
    toggleRowSelection(row, true)
    if (isRecycleStation.value) {
      return
    }
    let contextmenuRef = currentInstance.proxy.$refs.contextmenuRef
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
  } else {
    ElMessage.warning('您没有权限操作！')
  }
}
/**
 * -------文件/文件夹相关操作----------
 */
const dialogUploadRef = ref()
//文件上传
const handleUpload = () => {
  dialogUploadRef.value.initDialog(currentRow.id)
}

const newFolderForm = reactive({
  name: '',
  authType: 'DEFAULT'
})
const rules = reactive({
  name: [
    { required: true, message: '请输入文件夹名称', trigger: 'blur' },
    { min: 1, max: 20, message: '文件夹名称长度在 1 到20' }
  ],
  authType: [{ required: true, message: '请选择文件夹权限', trigger: 'change' }]
})
let dialogVisible = ref(false)
const newFolderRef = ref()
const closeDialog = () => {
  if (newFolderRef.value) newFolderRef.value.resetFields()
  newFolderForm.name = ''
  newFolderForm.authType = 'DEFAULT'

  dialogVisible.value = false
}
const handleCreateFolder = () => {
  newFolderRef.value.validate(async valid => {
    if (valid) {
      let param = {
        parentId: currentRow.id,
        name: newFolderForm.name,
        authType: newFolderForm.authType
      }
      const res = await addFolder(param)
      if (currentRow.status === 'COMMON') {
        //公开当前文件

        batchSetFolder(res.id, res.id)
      }

      ElMessage.success('创建成功')
      closeDialog()
      getCurtFile({ deleted: false })
    }
  })
}

//创建文件夹
const handleNewFolder = () => {
  dialogVisible.value = true
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
      reqMethod = modifyFolder
    } else {
      param = {
        id: row.id,
        originName: value
      }
      reqMethod = modifyFile
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
//文件详情
const dialogDetailRef = ref()
const openDetail = row => {
  dialogDetailRef.value.initDialog(row)
}

//批量修改权限
const batchSetOpen = () => {
  ElMessageBox.confirm(`确认${selectRow.value.status === 'COMMON' ? '取消公开' : '公开文件'}选中的文件吗？请谨慎操作！`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    if (selectRow.value.status === 'COMMON') {
      ElMessage.warning('请重新分配该文件的权限')
      batchAllot()
    } else {
      const folderIds = selectFolders.value.map(item => item.id)
      const res = await getSonFolder({ ids: folderIds.toString() })
      let fileCategoryIds = res.map(item => item.id)
      if (folderIds.length > 0) {
        batchSetFolder(fileCategoryIds.join(','), folderIds.join(',')).then(() => {
          ElMessage.success('公开选中文件夹成功！')
          searchFile()
        })
      }
    }
  })
}
// 真实删除文件
const batchDeleteTrue = row => {
  ElMessageBox.confirm('该操作将彻底删除, 是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    let folderIds = []
    let fileIds = []
    if (row) {
      if (row.type === 'FOLDER') {
        folderIds = [row.id]
      } else {
        fileIds = [row.id]
      }
    } else {
      folderIds = selectFolders.value.map(item => item.id)
      fileIds = selectFiles.value.map(item => item.id)
    }
    batchDeleteFolderTrue({ fileCategoryIds: folderIds, fileFolderIds: fileIds }).then(res => {
      console.log(res)
      ElMessage.success('删除文件成功！')
      getCurtFile({ deleted: true })
    })
  })
}
//批量还原
const batchRecycle = row => {
  ElMessageBox.confirm('确认要还原吗, 是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    let folderIds = []
    let fileIds = []
    if (row) {
      if (row.type === 'FOLDER') {
        folderIds = [row.id]
      } else {
        fileIds = [row.id]
      }
    } else {
      folderIds = selectFolders.value.map(item => item.id)
      fileIds = selectFiles.value.map(item => item.id)
    }

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
    if (!folderIds.length && !fileIds.length) {
      ElMessage.warning('请勾选文件！')
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
  isRecycleStation.value = false
  isShare.value = false
  isBrowser.value = false
  showbtn.value = false
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

    filterShowTable()
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
let isPublicFolder = ref(false)
const asidePublic = () => {
  currentRow.name = '全部文件'
  currentRow.id = 0
  //公开文件顶级目标隐藏按钮
  showbtn.value = false
  navShow.value = true
  isPublicFolder.value = true
  getPublicList()
}
const getPublicList = () => {
  skeletonLoading.value = true
  getCommomFolder()
    .then(res => {
      skeletonLoading.value = false
      //文件夹
      tableData.value = res.map(item => {
        const { id, name, parentId, parent, status, createdByName, lastUpdatedTime, createdTime, path } = item
        return {
          id,
          name,
          parentId,
          status,
          parent,
          time: lastUpdatedTime,
          createdByName,
          lastUpdatedTime,
          createdTime,
          type: 'FOLDER',
          path,
          auth: item.userFileAuthVo?.type
        }
      })
      filterShowTable()

      // 赋值导航面包屑

      if (currentRow.id !== 0) {
        const currentIndex = breadcrumbData.value.findIndex(item => item.id === currentRow.id)
        if (currentIndex > -1) {
          //删除当前点击之后的
          breadcrumbData.value.splice(currentIndex + 1)
        } else {
          breadcrumbData.value.push({
            id: currentRow.id,
            name: currentRow.name
          })
        }
      } else {
        //全部文件只保留一项
        breadcrumbData.value.splice(1)
      }
    })
    .catch(() => {
      skeletonLoading.value = false
    })
}

//查询主列表
const backHome = () => {
  currentRow.name = '全部文件'
  currentRow.id = 0
  isPublicFolder.value = false
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

const dialogFileLogRef = ref()
const openFileLog = () => {
  let row = selectRow.value
  dialogFileLogRef.value.openDialog(row)
}
/**
 * -------图片预览----------
 */
const handleFileUrl = async row => {
  const res = await downloadFile(row.id)
  row.fileUrl = window.URL.createObjectURL(new Blob([res]))

  return row.fileUrl
}

const handleBackspace = event => {
  if (event.key === 'Backspace') {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      backLast()
    }
  }
}

//表格用到的参数
const state = reactive({
  page: 1,
  limit: 10
})
let filterTableData = ref([])

//改变页码
const handleCurrentChange = e => {
  state.page = e
  filterShowTable()
}
//改变页数限制
const handleSizeChange = e => {
  state.limit = e

  filterShowTable()
}
const filterShowTable = () => {
  filterTableData.value = tableData.value.filter(
    (item, index) => index < state.page * state.limit && index >= state.limit * (state.page - 1)
  )

  filterTableData.value.forEach(item => {
    if (item.type === 'PICTURE' && !item.fileUrl) {
      handleFileUrl(item)
      filterTableData.value = [...filterTableData.value]
    }
  })
}
const folderCount = computed(() => {
  return tableData.value.filter(item => item.type === 'FOLDER').length
})
const fileCount = computed(() => {
  return tableData.value.filter(item => item.type !== 'FOLDER').length
})
onMounted(() => {
  document.addEventListener('keydown', handleBackspace)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleBackspace)
})
</script>
<style lang="scss" scoped>
@import './index.scss';
:deep(.el-breadcrumb__inner) {
  color: #409eff;
}
.dialog_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 30px;
  height: 32px;
}
.user_name {
  text-decoration: underline;
  color: #409eff;
}
.text_ellipsis {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.just-end {
  justify-content: flex-end;
}
.tips {
  margin-left: 20px;
  margin-bottom: 20px;
  font-size: 18px;
}
</style>
