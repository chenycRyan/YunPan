<template>
  <el-card>
    <el-upload
      v-loading="loading"
      element-loading-text="文件溯源中..."
      class="upload-demo"
      drag
      accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4"
      :action="fileTraceUrl"
      :headers="headers"
      :before-upload="addLoading"
      :on-success="getTraceFileId"
      :on-error="getTraceFailed"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">拖拽或者<em>点击查询文件</em></div>
      <template #tip>
        <div class="el-upload__tip">仅支持 docx/xlsx/ppt/pdf/mp4 格式文件的查询</div>
      </template>
    </el-upload>
    <div style="display: flex; align-items: center; justify-content: space-between">
      <div style="display: flex; align-items: center">
        <div class="title-start"></div>
        <div style="font-size: 16px">文件下载者</div>
      </div>
    </div>
    <el-table stripe :data="fileDownAuthor" style="width: 100%">
      <el-table-column prop="name" label="姓名"> </el-table-column>
      <el-table-column prop="phoneNumber" label="手机号"> </el-table-column>
    </el-table>
    <div style="display: flex; align-items: center; justify-content: space-between">
      <div style="display: flex; align-items: center">
        <div class="title-start"></div>
        <div style="font-size: 16px">文件操作记录</div>
      </div>
      <!-- <el-button type="primary" @click='logList = []'>重置</el-button> -->
    </div>
    <el-table stripe :data="logList" style="width: 100%">
      <el-table-column width="180" align="center" prop="createdTime" sortable>
        <template #header>
          <el-icon>
            <Calendar />
          </el-icon>
          <span>操作时间</span>
        </template>
        <template #default="scope">
          <div>
            {{ scope.row.createdTime }}
          </div>
        </template>
      </el-table-column>
      <el-table-column width="220" align="center">
        <template #header>
          <el-icon><Operation /></el-icon>
          <span>操作类型</span>
        </template>
        <template #default="scope">
          <div>
            {{ scope.row.type }}
          </div>
        </template>
      </el-table-column>
      <el-table-column>
        <template #header>
          <el-icon>
            <Document />
          </el-icon>
          <span>操作内容</span>
        </template>
        <template #default="scope">
          <div>
            {{ scope.row.message }}
          </div>
        </template>
      </el-table-column>
      <!-- <el-table-column label="操作" width="160">
        <template #default="scope">
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column> -->
    </el-table>
  </el-card>
</template>

<script setup>
import { ElMessage, ElMessageBox, vLoading } from 'element-plus'
import { dateToString } from '@/utils/dateTool'
import { getfileLogPage, getfileLogList } from '@/api/modules/file'
import { getUserList } from '@/api/modules/user'
import { GlobalStore } from '@/stores'
import qs from 'qs'
import axios from 'axios'
const globalStore = GlobalStore()
const ffmpeg = globalStore.ffmpeg
let opreationType = ref({
  CREATE_FILE: '上传文件',
  DOWN_LOAD_FILE: '下载文件',
  DELETE_FILE: '删除文件',
  RESTORE_FILE: '恢复文件',
  COPY_FILE: '复制文件',
  MOVE_FILE: '移动文件',
  AUTH_FILE: '赋予权限',
  CREATE_CATEGORY: '上传文件夹',
  DELETE_CATEGORY: '删除文件夹',
  RESTORE_CATEGORY: '恢复文件夹',
  COPY_CATEGORY: '复制文件夹',
  MOVE_CATEGORY: '移动文件夹',
  AUTH_CATEGORY: '赋予权限'
})
let loading = ref(false)
let queryParams = ref({
  endTime: '',
  fileFolderId: '',
  level: '',
  message: '',
  page: '',
  size: '',
  sort: '',
  startTime: '',
  type: ''
})
let fileTraceUrl = ref('')
let headers = ref({
  Authorization: ''
})
let fileDownAuthor = ref([])
onMounted(() => {
  // getTraceFileId()
  fileTraceUrl.value = window.appsetings.base_URL + '/file/get/file-type'
  headers.value.Authorization = 'Bearer ' + globalStore.token
})
let logList = ref([])
async function addLoading(rawFile) {
  loading.value = true
  // console.log(rawFile)
  console.log('rawFile', rawFile)
  if (rawFile.type === 'video/mp4') {
    let formData = new FormData()
    let fileBlob
    if (rawFile.size > 10 * 1024 * 1024) {
      let fileName = 'input.mp4'
      let outName = 'output.mp4'
      await ffmpeg.FS('writeFile', fileName, await globalStore.fetchFile(rawFile))
      await ffmpeg.run(
        '-ss',
        `${0}`,
        '-to',
        `${2}`,
        '-y',
        '-i',
        `${fileName}`,
        '-vcodec',
        'copy',
        '-acodec',
        'copy',
        '-an',
        outName
      )
      let arrayBuffer = ffmpeg.FS('readFile', outName)
      fileBlob = new File([new Blob([arrayBuffer])], outName, { type: rawFile.type })
      console.log('fileBlob', fileBlob)
    } else {
      fileBlob = rawFile
    }
    formData.append('file', fileBlob)
    let res = await axios.post(fileTraceUrl.value, formData, { headers: headers.value }).catch(err => {
      ElMessage.warning(err.data || err.message || err)
    })
    if (res && res.data) {
      let resArray = res.data.split('huibo')
      console.log('resArray', resArray)
      let userInfo = await getUserList({ phone: resArray[0] })
      let userRealName = userInfo && userInfo.length ? userInfo[0].realName : 'unknown'
      resArray[1] = resArray[1].split('/')[0]
      let newResStr = userRealName + '_' + resArray[0] + '_' + resArray[1]
      getTraceFileId(newResStr)
      console.log(newResStr)
    } else {
      getTraceFailed()
    }
    // getTraceFileId(res)
    // 测试视频能否正常播放
    // const outputBlob = new Blob([arrayBuffer])
    // let downLoadUrl = URL.createObjectURL(outputBlob, { type: 'video/mp4' })
    // console.log('downLoadUrl', downLoadUrl)
    // let a = document.createElement('a')
    // a.style.display = 'none'
    // document.body.appendChild(a)
    // a.download = 'output.mp4'
    // a.href = downLoadUrl
    // a.click()
    return false
  }
}
function getTraceFileId(response, uploadFile) {
  loading.value = true
  let query = {
    fileFolderId: ''
  }
  console.log(response)
  console.log(uploadFile)
  let resultArr = []
  if (response) {
    resultArr = response.split('_')
    // resultArr[0]:真实姓名，resultArr[1]:手机号码，resultArr[2]:文件id
    if (!resultArr[2]) {
      getTraceFailed()
      return
    }
    fileDownAuthor.value = [
      {
        name: resultArr[0],
        phoneNumber: resultArr[1]
      }
    ]
    query.fileFolderId = resultArr[2]
    getfileLogList({ ...query, isDeleted: false, sort: 'createdTime,DESC' })
      .then(res => {
        console.log(res)
        if (!res || res?.length === 0) {
          ElMessage({
            message: '未查询到相关操作记录',
            type: 'warning'
          })
          logList.value = []
          // fileDownAuthor.value = []
          loading.value = false
          return
        }
        res.forEach(ele => {
          ele.createdTime = dateToString(ele.createdTime)
          ele.lastUpdatedTime = dateToString(ele.lastUpdatedTime)
          ele.type = opreationType.value[ele.type]
          console.log(ele.type)
        })
        // logList.value = res.content.filter(ele => ele.message.includes(resultArr[0])).concat(logList.value)
        logList.value = res
        loading.value = false
      })
      .catch(() => {
        ElMessage({
          message: '未查询到相关操作记录',
          type: 'warning'
        })
        logList.value = []
        loading.value = false
        // fileDownAuthor.value = []
        return
      })
  } else {
    getTraceFailed()
  }
  // Object.keys(queryParams.value).forEach(key=>{
  //   if(queryParams.value[key] !== '' && queryParams.value[key] !== undefined){
  //     query[key] = queryParams.value[key]
  //   }
  // })
}
function getTraceFailed(error) {
  console.log(error)
  ElMessage({
    message: '未查询到相关操作记录',
    type: 'warning'
  })
  logList.value = []
  fileDownAuthor.value = []
  loading.value = false
}
</script>

<style scoped lang="scss">
.main {
  margin-top: 40px;
  margin-bottom: 40px;
}
.page-container {
  width: fit-content;
  margin: 0 auto;
  margin-top: 24px;
}
.title-start {
  width: 6px;
  height: 22px;
  background-color: #06a7ff;
  margin: 12px 12px 12px 0;
}
:deep() {
  .el-table__header-wrapper .el-icon {
    font-size: 1rem;
    line-height: 1.5rem;
    top: 0.125rem;
    margin-right: 0.5rem;
  }
  .el-table .warning-row {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
  }
  .el-table .success-row {
    --el-table-tr-bg-color: var(--el-color-success-light-9);
  }
}
</style>
