<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="50%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="handleClose"
    top="4vh"
  >
    <div class="flex-center mt-10 upload_box">
      <el-upload
        multiple
        ref="uploadRef"
        class="upload-box"
        :auto-upload="false"
        :on-change="changeUpload"
        action="#"
        drag
        :accept="props.uploadAcceptType"
        :show-file-list="false"
      >
        <svg-icon name="upFiles"></svg-icon>

        <div class="el-upload__text">将<span class="text-red">文件</span> 拖到此处，或<em>点击上传</em></div>
      </el-upload>

      <div class="folder-input-wrapper el-upload-dragger">
        <svg-icon name="upFloder"></svg-icon>
        <div class="el-upload__text">将<span class="text-red">文件夹</span> 拖到此处，或<em>点击上传</em></div>
        <input
          ref="fileDirectoryRef"
          type="file"
          webkitdirectory
          directory
          id="directoryInput"
          multiple
          @change="handleFolderChange"
        />
      </div>
    </div>
    <el-divider></el-divider>
    <!-- <el-divider content-position="left">上传统计</el-divider> -->
    <div class="flex-center just-center">
      <div class="row-item">
        <span class="label">文件夹总数：</span>
        <span>{{ client.folderNum }}</span>
      </div>
      <el-divider direction="vertical"></el-divider>
      <div class="row-item">
        <span class="label"> 文件夹上传成功：</span>
        <span class="success_num"> {{ client.successFolderNum }}</span>
      </div>
      <el-divider direction="vertical"></el-divider>
      <div class="row-item">
        <span class="label"> 文件总数：</span>
        <span> {{ client.fileNum }}</span>
      </div>
      <el-divider direction="vertical"></el-divider>
      <div class="row-item">
        <span class="label"> 文件上传成功：</span>
        <span class="success_num"> {{ client.successFileNum }}</span>
      </div>
      <el-divider direction="vertical"></el-divider>
      <div class="row-item">
        <span class="label"> 文件上传失败：</span>
        <span class="error_num"> {{ client.errorFileNum }}</span>
      </div>
    </div>
    <div class="flex-center just-between">
      <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="上传成功" name="上传成功"></el-tab-pane>
        <el-tab-pane label="上传失败" name="上传失败"></el-tab-pane>
      </el-tabs>
      <div>
        <el-button type="primary" @click="batchRetry" :icon="Upload"> 一键重传</el-button>
        <el-button type="primary" @click="handleCancel" :icon="CircleClose"> 取消上传</el-button>
        <el-button class="ml-10" type="warning" @click="clearHistory" :icon="Delete">清空列表</el-button>
      </div>
    </div>

    <el-divider class="divider"></el-divider>
    <div class="file_content">
      <div v-if="bigFileList.length === 0 && samllFileList.length === 0">
        <el-empty></el-empty>
      </div>
      <div v-else>
        <el-table :data="tableList" style="width: 100%">
          <el-table-column prop="name" label="文件名称" />
          <el-table-column prop="webkitPath" label="文件目录" />
          <el-table-column label="上传状态">
            <template #default="{ row }">
              <el-tag :type="row.progress === '待上传' ? '' : row.progress === '上传成功' ? 'success' : 'danger'">
                {{ row.progress }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="失败重传" width="120px">
            <template #default="{ row }">
              <el-button type="primary" v-if="row.progress && row.progress.includes('接口异常')" @click="retryUpload(row)">
                重新上传
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pages :total="tableTotal" @search="searchData"></Pages>
      </div>
      <!-- 正在上传的文件列表 -->
      <div class="uploading" v-for="(fileItem, index) in bigFileTable" :key="index">
        <div class="progress">
          <div class="label">文件名称：</div>
          <div class="file_name">{{ fileItem.name }}</div>
        </div>
        <div class="progress">
          <div class="label">文件大小：</div>
          <div class="label">{{ formatSize(fileItem.size) }}</div>
        </div>

        <div class="progress">
          <div class="label">解析进度：</div>
          <el-progress :text-inside="true" :stroke-width="16" :percentage="fileItem.parsePercentage"> </el-progress>
        </div>
        <div class="progress">
          <div class="label">上传进度：</div>
          <el-progress :text-inside="true" :stroke-width="16" :percentage="fileItem.uploadPercentage"> </el-progress>
          <div class="uploadSpeed" v-if="(fileItem.uploadPercentage > 0) & (fileItem.uploadPercentage < 100)">
            <span>{{ fileItem.uploadSpeed }}</span>
            <!-- <el-button circle link @click="changeUploadingStop(fileItem)">
              <el-icon size="20" v-if="fileItem.uploadingStop == false"><VideoPause /></el-icon>
              <el-icon size="20" v-else><VideoPlay /></el-icon>
            </el-button> -->
          </div>
        </div>
        <div class="progress">
          <div class="label">上传状态:</div>
          <div class="fz-16">{{ fileItem.progress }}</div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<script setup>
import { Delete, Upload, CircleClose } from '@element-plus/icons-vue'
import { filterFileClassify } from '@/utils/file'
import { batchAddFolder } from '@/api/modules/folder'
import {
  uploadFile,
  checkFileByMd5,
  uploadChunkFile,
  bindBigFile,
  uploadFfmpegFile,
  addVideoChunks,
  addfileLog
} from '@/api/modules/file'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import SparkMD5 from 'spark-md5'
import { GlobalStore } from '@/stores'
const props = defineProps({
  uploadAcceptType: String
})
const globalStore = GlobalStore()
const real_name = computed(() => globalStore.userInfo.real_name)
const ffmpeg = globalStore.ffmpeg
const emits = defineEmits(['search'])
const authType = ref('PUBLIC')

let tableTotal = ref(0)
let tableList = ref([])
let queryForm = reactive({
  page: 0,
  size: 10
})
//分页功能
function searchData(params) {
  queryForm.page = params.page
  queryForm.size = params.size
  tableList.value = tableData.value.filter(
    (item, index) => index < (queryForm.page + 1) * queryForm.size && index >= queryForm.size * queryForm.page
  )
  tableTotal.value = tableData.value.length
}

/**
 * 文件夹上传
 * 文件信息统计
 * 文件上传进度，成功/失败列表
 * 失败重传，取消上传，清空上传列表
 */

//文件夹上传统计数据
let client = reactive({
  folderNum: 0,
  successFolderNum: 0,
  fileNum: 0,
  successFileNum: 0,
  errorFileNum: 0
})
const fileDirectoryRef = ref()

let cancelUpload = ref(false) //是否取消文件上传

//文件夹上传change
function handleFolderChange(event) {
  cancelUpload.value = false
  //文件夹里面所有文件
  let files = event.target.files

  //文件夹名称
  let relativePath = files[0].webkitRelativePath
  let folderName = relativePath.split('/')[0]
  //不上传WPS临时文件
  let fileArray = Array.from(files) //.filter(item => !item.name.startsWith('~$'))

  if (fileArray.length > 300) {
    ElMessage.error('单次上传文件数量不能超过300个，请重新选择！')
    return
  }
  console.log('文件夹上传列表', fileArray, folderName)
  //筛选文件目录
  let paths = fileArray.map(item => item.webkitRelativePath)

  //去重，截取文件目录
  const pathList = Array.from(
    new Set(
      paths.map(item => {
        return item.slice(0, item.lastIndexOf('/'))
      })
    )
  )
  client.folderNum = pathList.length
  client.fileNum = fileArray.length
  const loadingInstance = ElLoading.service({
    text: '创建文件夹中...',
    background: 'rgba(0, 0, 0, .3)'
  })
  batchAddFolder({ fileCategoryId: menuId.value, paths: pathList, authType: authType.value })
    .then(async res => {
      loadingInstance.close()
      client.successFolderNum = pathList.length
      const foldeIdsObj = res

      for (const item of fileArray) {
        console.log('file', item)

        const fileCategoryId = foldeIdsObj[item.webkitRelativePath.slice(0, item.webkitRelativePath.lastIndexOf('/'))]
        changeUpload({
          raw: item,
          fileCategoryId
        })
      }
    })
    .catch(() => {
      loadingInstance.close()
    })
}

//清空文件上传历史记录
function clearHistory() {
  samllFileList.value = []
  bigFileList.value = []
  Object.assign(client, {
    folderNum: 0,
    successFolderNum: 0,
    fileNum: 0,
    successFileNum: 0,
    errorFileNum: 0
  })
  console.log('清空上传组件')
  uploadRef.value.clearFiles()
  fileDirectoryRef.value = ''
}
//取消上传
function handleCancel() {
  ElMessageBox.confirm(`确认取消上传?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    bigQueList.value = []
    smallQueList.value = []
    cancelUpload.value = true
    ElMessage.success('取消上传成功！')
  })
}
let errSamllList = ref([])
let errBigList = ref([])
//单个重新上传
function retryUpload(row) {
  ElMessageBox.confirm(`确认重新上传${row.name}?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    errSamllList.value.push(row)
  })
}

//批量重新上传
function batchRetry() {
  ElMessageBox.confirm(`请确认是否重新上传?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    //先暂停上传
    bigQueList.value = []
    smallQueList.value = []
    cancelUpload.value = true
    //2s后重新上传
    setTimeout(() => {
      cancelUpload.value = false

      errSamllList.value = samllFileList.value.filter(item => !item.progress.includes('上传成功'))

      errBigList.value = bigFileList.value.filter(item => !item.progress.includes('上传成功'))
    }, 2000)
  })
}
watch(
  () => errSamllList.value,
  () => {
    if (errSamllList.value.length) {
      const firstOne = { ...errSamllList.value[0] }
      smallQueList.value.push({ method: uploadSmallFile(firstOne), prop: firstOne })
    }
  },
  {
    deep: true
  }
)
watch(
  () => errBigList.value,
  () => {
    if (errBigList.value.length) {
      const firstOne = { ...errBigList.value[0] }
      //赋值引用地址，更新页面的进度
      const i = bigFileList.value.findIndex(
        item => item.file.webkitRelativePath === firstOne.file.webkitRelativePath && item.file.name === firstOne.file.name
      )
      bigFileList.value[i] = firstOne
      let bool = bigQueList.value.some(
        item =>
          item.prop.file.webkitRelativePath === firstOne.file.webkitRelativePath && item.prop.file.name === firstOne.file.name
      )
      console.log(bool, i, bigFileList.value)
      //判断队列中是否存在,如果已经存在则不添加
      if (!bool) {
        bigQueList.value.push({ method: uploadBigFile(firstOne), prop: firstOne })
      }
    }
  },
  {
    deep: true
  }
)

//待上传的文件列表-做原始数据记录
let bigFileList = ref([])
let samllFileList = ref([])
//文件表格-做展示数据
let tableData = ref([])
let bigFileTable = ref([])
let activeName = ref('')
//切换进度列表
const handleTabClick = () => {
  nextTick(() => {
    tableData.value = samllFileList.value.filter(item => item.progress.includes(activeName.value))
    bigFileTable.value = bigFileList.value.filter(item => item.progress.includes(activeName.value))
    tableList.value = tableData.value.filter(
      (item, index) => index < (queryForm.page + 1) * queryForm.size && index >= queryForm.size * queryForm.page
    )
    tableTotal.value = tableData.value.length
  })
}

//监听小文件进度列表
watch(
  () => samllFileList.value,
  () => {
    client.successFileNum =
      samllFileList.value.filter(item => item.progress === '上传成功').length +
      bigFileList.value.filter(item => item.progress === '上传成功').length
    client.errorFileNum =
      samllFileList.value.filter(item => item.progress.includes('上传失败')).length +
      bigFileList.value.filter(item => item.progress.includes('上传失败')).length

    tableData.value = activeName.value
      ? samllFileList.value.filter(item => item.progress.includes(activeName.value))
      : samllFileList.value

    searchData({ page: queryForm.page, size: queryForm.size })
  },
  {
    deep: true
  }
)
//监听大文件进度列表
watch(
  () => bigFileList.value,
  () => {
    client.successFileNum =
      bigFileList.value.filter(item => item.progress === '上传成功').length +
      samllFileList.value.filter(item => item.progress === '上传成功').length

    client.errorFileNum =
      bigFileList.value.filter(item => item.progress.includes('上传失败')).length +
      samllFileList.value.filter(item => item.progress.includes('上传失败')).length
    bigFileTable.value = activeName.value
      ? bigFileList.value.filter(item => item.progress.includes(activeName.value))
      : [...bigFileList.value]
  },
  {
    deep: true
  }
)

const uploadRef = ref()
let mp4Duration = ref(0) //MP4视频时长
let smallQueList = ref([]) //队列
let smallQueIndex = ref(0) //队列最新索引
let interval = ref(1) //小文件同时上传数量
let bigQueList = ref([]) //大文件队列
let bigQueIndex = ref(0)

/***
 * 单个文件上传change事件
 */
async function changeUpload(file) {
  cancelUpload.value = false
  //单个文件属性
  let fileProps = {
    isMp4: false,
    progress: '待上传',
    name: file.raw.name,
    size: file.raw.size,
    fparsePercentage: 0,
    uploadPercentage: 0,
    uploadSpeed: '等待中...',
    chunkList: null,
    file: file.raw,
    uploadingStop: false,
    fileCategoryId: file.fileCategoryId || menuId.value || 0, //文件夹ID
    webkitPath: file.raw.webkitRelativePath.slice(0, file.raw.webkitRelativePath.lastIndexOf('/'))
  }

  //如果是mp4格式的视频文件
  if (file.raw.type === 'video/mp4') {
    //当MP4文件size小于maxFileSize配置时，做视频切片上传，否则做文件切片上传
    fileProps.isMp4 = file.raw.size < window.appsetings.maxFileSize
  }

  if (fileProps.progress !== '待上传') {
    ElMessage.warning(fileProps.progress)
    //错误列表中没有，则添加
    const boolErrFile = samllFileList.value.some(
      item => item.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.file.name === fileProps.file.name
    )
    if (!boolErrFile) {
      samllFileList.value.push(fileProps)
    }
    setProgressMsg(samllFileList.value, fileProps, fileProps.progress)

    return false
  }
  //大文件上传
  if (fileProps.file.size >= window.appsetings.bigFileSize) {
    let bIndex = bigFileList.value.findIndex(
      item => item.file.name === fileProps.file.name && item.file.webkitRelativePath === fileProps.file.webkitRelativePath
    )

    if (bIndex < 0) {
      bigFileList.value.push(fileProps)
    } else {
      bigFileList.value[bIndex] = fileProps
    }
    if (bigQueList.value.length === 0) {
      bigQueList.value.push({ prop: fileProps, method: uploadBigFile(fileProps) })
      bigQueIndex.value = bigFileList.value.findIndex(
        item => item.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.file.name === fileProps.file.name
      )
    }
  } else {
    //判断小文件列表是否有，没有则添加
    const boolSmallFile = samllFileList.value.some(
      item => item.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.file.name === fileProps.file.name
    )
    if (!boolSmallFile) {
      samllFileList.value.push(fileProps)
    }

    //判断队列长度，如果小于3则继续添加

    if (smallQueList.value.length < interval.value) {
      smallQueList.value.push({ prop: fileProps, method: uploadSmallFile(fileProps) })
      smallQueIndex.value = samllFileList.value.findIndex(
        item => item.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.file.name === fileProps.file.name
      )
    }
  }
}
async function uploadBigFile(fileProps) {
  try {
    let md5 = await computeMd5(fileProps.file, fileProps)
    fileProps.md5 = md5

    let res = await checkFileByMd5({ md5 }) //上传服务器检查，以确认是否秒传
    //根据文件的md5信息判断是否在系统中上传过,返回数组则调用切片，返回ID则调用关联绑定
    if (Array.isArray(res)) {
      fileProps.chunkList = res
      // 赋值文件类型

      let type = filterFileClassify(fileProps.file.name)

      fileProps.fileType = type
      if (fileProps.isMp4) {
        mp4Duration.value = await getMp4Time(fileProps)
        console.log('--------开始大视频切片-----------', mp4Duration.value)
        //大视频文件切片
        await sliceVideoFile(fileProps.file, fileProps)
      } else {
        console.log('--------开始大文件切片-----------')
        // 大文件分片上传文件
        sliceChunkFile(fileProps.file, 1, fileProps)
      }
    } else {
      fileProps.uploadPercentage = 33
      await bindBigFile(fileProps.fileCategoryId, res, fileProps.file.name, authType.value)
      fileProps.uploadPercentage = 100
      setProgressMsg(bigFileList.value, fileProps, '上传成功')
      ElMessage.success('文件已秒传!')

      emits('search')
      delAndPushBig(fileProps)
    }
  } catch (error) {
    delAndPushBig(fileProps)
    setProgressMsg(bigFileList.value, fileProps, '上传失败，接口异常！')
  }
}
function delAndPushBig(fileProps) {
  //取消上传
  if (cancelUpload.value) {
    bigFileList.value.forEach((item, index) => {
      if (index > bigQueIndex.value - 1) {
        item.progress = '暂停上传'
      }
    })

    return
  }
  //如果错误列表中有
  if (errBigList.value.length > 0) {
    //删除队列已上传项
    const errIndex = errBigList.value.findIndex(
      item => item.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.file.name === fileProps.file.name
    )

    errBigList.value.splice(errIndex, 1)
    console.log(errBigList.value)
  }
  //删除队列已上传项
  const index = bigQueList.value.findIndex(
    item => item.prop.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.prop.file.name === fileProps.file.name
  )
  bigQueList.value.splice(index, 1)
  //如果不是最后一项，向队列中添加最新项
  console.log('delAndPushBig', bigQueIndex.value, bigFileList.value.length)
  if (bigQueIndex.value < bigFileList.value.length - 1) {
    const newest = bigFileList.value[bigQueIndex.value + 1]
    bigQueIndex.value++

    bigQueList.value.push({ method: uploadBigFile(newest), prop: newest })
  }
}

async function uploadSmallFile(fileProps) {
  fileProps.progress = '待上传'
  //小文件上传
  let formData = new FormData()
  formData.append('file', fileProps.file)
  let type = filterFileClassify(fileProps.name)

  try {
    await uploadFile(fileProps.fileCategoryId, type, authType.value, formData)
    let uIndex = samllFileList.value.findIndex(
      item => item.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.file.name === fileProps.file.name
    )

    setProgressMsg(samllFileList.value, fileProps, '上传成功')

    //当前轮小文件上传结束
    if (uIndex === samllFileList.value.length - 1) {
      ElMessage.success('上传成功！')

      fileDirectoryRef.value = ''
      emits('search')
    }
    uploadRef.value.clearFiles()

    //补充小文件上传队列
    delAndPushSmall(fileProps)
  } catch (error) {
    setProgressMsg(samllFileList.value, fileProps, '上传失败，接口异常！')
    uploadRef.value.clearFiles()
    //补充小文件上传队列
    delAndPushSmall(fileProps)
  }
}
//补充小文件上传队列
function delAndPushSmall(fileProps) {
  //取消上传
  if (cancelUpload.value) {
    samllFileList.value.forEach((item, index) => {
      if (index > smallQueIndex.value - 1) {
        item.progress = '暂停上传'
      }
    })

    return
  }
  //移出上传完的错误文件
  if (errSamllList.value.length) {
    errSamllList.value = errSamllList.value.filter(
      item => item.file.webkitRelativePath !== fileProps.file.webkitRelativePath && item.file.name !== fileProps.file.name
    )
    console.log(errSamllList.value)
  }

  //删除队列当前上传项
  if (smallQueIndex.value >= interval.value - 1) {
    const index = smallQueList.value.findIndex(
      item =>
        item.prop.file.webkitRelativePath === fileProps.file.webkitRelativePath && item.prop.file.name === fileProps.file.name
    )
    smallQueList.value.splice(index, 1)

    //如果不是最后一项，向队列中添加最新项
    if (smallQueIndex.value < samllFileList.value.length - 1) {
      const newest = samllFileList.value[smallQueIndex.value + 1]

      smallQueList.value.push({ method: uploadSmallFile(newest), prop: newest })

      smallQueIndex.value++
    }
  }
}

//设置文件上传进度，上传失败记录文件
function setProgressMsg(list, prop, msg) {
  //取消上传--则不改变当前文件上传进度
  if (cancelUpload.value) {
    return
  }
  list.forEach(item => {
    if (item.file.webkitRelativePath === prop.file.webkitRelativePath && item.file.name === prop.file.name) {
      item.progress = msg
      if (msg.includes('上传失败')) {
        addfileLog({
          fileCategoryId: prop.fileCategoryId,
          level: 'ERROR',
          message: `${real_name.value}上传${prop.name}至目录${prop.webkitPath}，${prop.progress}`,
          type: 'CREATE_FILE'
        })
      }
    }
  })
}

//点击暂停或开始上传
function changeUploadingStop(fileProps) {
  fileProps.uploadingStop = !fileProps.uploadingStop
  if (!fileProps.uploadingStop) {
    sliceChunkFile(fileProps.file, 1, fileProps)
  }
}

//上传文件分片-非视频大文件切片
function sliceChunkFile(file, index, fileProps) {
  let chunkSize = 1024 * 1024 * 24 //24mb
  let chunkTotal = Math.ceil(file.size / chunkSize)
  if (index <= chunkTotal) {
    // 根据是否暂停，确定是否继续上传
    let startTime = new Date().valueOf()

    let exit = fileProps.chunkList.includes(index)
    // console.log("是否存在",exit);

    if (!exit) {
      if (!fileProps.uploadingStop) {
        // 分片上传，同时计算进度条和上传速度
        // 已经上传的不在上传、
        // 上传完成后提示，上传成功

        let formdata = new FormData()
        let start = (index - 1) * chunkSize
        let end = index * chunkSize >= file.size ? file.size : index * chunkSize
        let chunk = file.slice(start, end)

        formdata.append('chunk', chunk)

        let type = filterFileClassify(file.name)

        let chunkForm = {
          chunkSize: chunkSize,
          chunkTotal: chunkTotal,
          fileName: file.name,
          fileSize: file.size,
          index: index,
          md5: fileProps.md5,
          type: type
        }
        uploadChunkFile(chunkForm, formdata).then(res => {
          let endTime = new Date().valueOf()
          let timeDif = (endTime - startTime) / 1000
          //上传速度
          fileProps.uploadSpeed = (10 / timeDif).toFixed(1) + ' M/s'
          fileProps.chunkList.push(index)
          //上传进度
          fileProps.uploadPercentage = parseInt((fileProps.chunkList.length / chunkTotal) * 100)

          //补丁！为了修复第一个大文件不触发watch事件
          bigFileList.value = [...bigFileList.value]
          if (index == chunkTotal) {
            bindBigFile(fileProps.fileCategoryId, res, file.name, authType.value)
              .then(() => {
                ElMessage.success('文件上传成功！')
                uploadRef.value.clearFiles()

                delAndPushBig(fileProps)
                emits('search')
                setProgressMsg(bigFileList.value, fileProps, '上传成功')
              })
              .catch(() => {
                delAndPushBig(fileProps)
                setProgressMsg(bigFileList.value, fileProps, '上传失败，接口异常！')
              })
          }
          //取消上传跳出循环
          if (!cancelUpload.value) {
            sliceChunkFile(file, index + 1, fileProps)
          } else {
            bigFileList.value.forEach((item, index) => {
              if (index > bigQueIndex.value - 1) {
                item.progress = '暂停上传'
              }
            })
          }
        })
      }
    } else {
      fileProps.uploadPercentage = parseInt((fileProps.chunkList.length / chunkTotal) * 100)

      sliceChunkFile(file, index + 1, fileProps)
    }
  }
}

// 获取视频总时长
const getMp4Time = fileProps => {
  return new Promise(async (resolve, reject) => {
    try {
      let url = URL.createObjectURL(fileProps.file)
      let audioElement = new Audio(url)
      // 在 canplay 事件中获取总时长
      console.log(`------在 canplay 事件中获取视频总时长-----------`)
      audioElement.addEventListener('canplay', function () {
        console.log(`------视频总时长${audioElement.duration}-----------`)
        resolve(parseInt(audioElement.duration))
      })

      // 5秒后如果还没有触发 canplay 事件，则直接采用 audioElement.duration 获取总时长
      setTimeout(() => {
        if (!audioElement.paused) {
          console.log(`------保底获取视频总时长${audioElement.duration}-----------`)
          resolve(parseInt(audioElement.duration))
        }
        if (!audioElement.duration) {
          console.log(`------获取失败视频总时长，尝试重新获取-----------`)
          //清空大文件队列尝试重新上传
          bigQueList.value = []
          changeUpload({
            raw: fileProps.file,
            fileCategoryId: fileProps.fileCategoryId
          })
        }
      }, 5000)
    } catch (error) {
      reject(error)
    }
  })
}
//大视频ffmpeg切片上传,按文件大小来切片
//ffmpeg只能按时间来切片，所以要将切片大小转成时间 ，分片不足3秒的按3秒来切片
const sliceVideoFile = (file, fileProps) => {
  return new Promise(async (resolve, reject) => {
    let totalSize = file.size
    let expectStepSize = 10 * 1024 * 1024
    // 预设10M为1s
    // 按照10M分分成多少份
    let eachCopies = Math.round(totalSize / expectStepSize)
    // 按10M分每份的实际时长
    let eachRealTime = parseInt(mp4Duration.value / eachCopies)

    let startTime = 0
    let step = 3
    if (eachRealTime < 3) {
      step = 3
    } else {
      step = eachRealTime
    }

    let type = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase()
    let fileName = `file${Date.now()}.${type}`
    let index = 1
    let urlList = []
    let chunks = step / mp4Duration.value
    let stepSize = chunks * (totalSize / 1024 / 1024)
    try {
      fileProps.uploadSpeed = '上传中...'
      fileProps.uploadPercentage = 1
      // console.log('ffmpeg-待写入')
      await ffmpeg.FS('writeFile', fileName, await globalStore.fetchFile(file))
      // console.log('ffmpeg-write执行完毕')
      // console.log('step', startTime, step, 'mp4Duration', mp4Duration.value)
      while (startTime + step <= mp4Duration.value) {
        //取消上传跳出循环
        if (cancelUpload.value) {
          bigFileList.value.forEach((item, index) => {
            if (index > bigQueIndex.value - 1) {
              item.progress = '暂停上传'
            }
          })
          break
        }
        const outName = Date.now() + '.mp4'
        // console.log('name', fileName, outName, startTime, step)
        // -y 覆盖已有文件  -i 输入文件 -vcodec 强制使用codec编解码方式 -an取消音频
        await ffmpeg.run(
          '-ss',
          `${startTime}`,
          '-to',
          `${startTime + step}`,
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
        // console.log('ffmpeg-readFile执行完毕')
        let fileBlob = new File([new Blob([arrayBuffer])], outName, { type: file.type })

        //  测试预览文件流
        // console.log('开始')
        // const outputBlob = new Blob([arrayBuffer])
        // let downLoadUrl = URL.createObjectURL(outputBlob, { type: 'video/mp4' })
        // console.log('downLoadUrl', downLoadUrl)
        // let a = document.createElement('a')
        // a.style.display = 'none'
        // document.body.appendChild(a)
        // a.download = 'output.mp4'
        // a.href = downLoadUrl
        // a.click()
        // 测试预览文件流
        let formData = new FormData()
        formData.append('file', fileBlob)
        let startSpeedTime = new Date().valueOf()
        //上传切片视频
        const videoPath = await uploadFfmpegFile(formData)
        urlList.push(videoPath)
        startTime += step
        let endTime = new Date().valueOf()
        let timeDif = (endTime - startSpeedTime) / 1000
        fileProps.uploadSpeed = (stepSize / timeDif).toFixed(1) + ' M/s'
        fileProps.uploadPercentage = parseInt(chunks * index * 90)

        //补丁！为了修复第一个大文件不触发watch事件
        bigFileList.value = [...bigFileList.value]
        index++
        //判断最后一个片段上传完成，跳出循环
        if (startTime + step > mp4Duration.value && startTime < mp4Duration.value) {
          step = mp4Duration.value - startTime
          if (step <= 1) {
            break
          }
        }
        // console.log(startTime, mp4Duration.value, step)
      }
      //取消上传则不调用
      if (!cancelUpload.value) {
        const params = {
          md5: fileProps.md5,
          name: fileProps.name,
          shardingList: urlList,
          size: fileProps.size,
          type: fileProps.fileType
        }
        //上传分片集合
        const videoId = await addVideoChunks(params)

        bindBigFile(fileProps.fileCategoryId, videoId, fileProps.name, authType.value)
          .then(() => {
            fileProps.uploadPercentage = 100

            ElMessage.success('文件上传成功！')
            uploadRef.value.clearFiles()
            emits('search')

            delAndPushBig(fileProps)
            resolve('文件上传成功！')
            setProgressMsg(bigFileList.value, fileProps, '上传成功')
          })
          .catch(err => {
            setProgressMsg(bigFileList.value, fileProps, '上传失败，接口异常！')
            delAndPushBig(fileProps)
            reject(err)
          })
      }
    } catch (err) {
      ElMessage.error('文件上传失败！')

      uploadRef.value.clearFiles()
      delAndPushBig(fileProps)

      reject(err)
      throw err
    }
  })
}

//计算文件的md5值
function computeMd5(file, fileProps) {
  return new Promise((resolve, reject) => {
    try {
      //分片读取并计算md5
      const chunkTotal = 100 //分片数
      const chunkSize = Math.ceil(file.size / chunkTotal)
      const fileReader = new FileReader()
      const md5 = new SparkMD5()
      let index = 0
      const loadFile = () => {
        fileProps.parsePercentage = parseInt((index / file.size) * 100)
        fileProps.progress = '待上传'

        //补丁！为了修复第一个大文件不触发watch事件
        bigFileList.value = [...bigFileList.value]
        const slice = file.slice(index, index + chunkSize)
        fileReader.readAsBinaryString(slice)
      }
      loadFile()
      fileReader.onload = e => {
        md5.appendBinary(e.target.result)
        if (index < file.size) {
          index += chunkSize
          //取消上传停止切片
          if (!cancelUpload.value) {
            loadFile()
          } else {
            bigFileList.value.forEach((item, index) => {
              if (index > bigQueIndex.value - 1) {
                item.progress = '暂停上传'
              }
            })
            console.log(bigFileList.value)
          }
        } else {
          resolve(md5.end()) // md5.end() 就是文件md5码
        }
      }
    } catch (error) {
      reject(error)
    }
  })
}

//换算文件的大小单位
function formatSize(size) {
  //size的单位大小k
  let unit
  let units = [' B', ' K', ' M', ' G']
  let pointLength = 2
  while ((unit = units.shift()) && size > 1024) {
    size = size / 1024
  }
  return (unit === 'B' ? size : size.toFixed(pointLength === undefined ? 2 : pointLength)) + unit
}
//赋值当前目录ID
let menuId = ref()
let dialogVisible = ref(false)
let dialogTitle = ref('文件上传')
function handleClose() {
  dialogVisible.value = false
}
function initDialog(id) {
  menuId.value = id
  dialogVisible.value = true
}
defineExpose({ initDialog })
</script>
<style>
.divider.el-divider--horizontal {
  margin: 10px 0 20px !important;
}
</style>
<style lang="scss" scoped>
:deep(.el-divider--vertical) {
  border-left: 1px solid #9b9da0 !important;
  margin: 0px 10px !important;
}
:deep(.el-tabs__item.is-active) {
  color: #fff !important;
  background-color: #79bbff;
}
:deep(.el-upload-dragger) {
  padding: 30px 40px;
  border: 1px dashed #ccc;
  svg {
    height: 36px !important;
  }
}
.upload_box {
  justify-content: space-evenly;
  width: 80%;
}
.text-red {
  color: #f56c6c;
}

.file_content {
  max-height: 500px;
  overflow: auto;
}
.small_box {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eeeeee;
  .item {
    display: flex;
    align-items: center;
    .label {
      width: 100px;
      font-size: 16px;
    }
    .file_name {
      width: 240px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 16px;
    }
  }
}
.uploading {
  padding-top: 10px;
  border-bottom: 1px solid #eeeeee;
  .label {
    width: 100px;
    font-size: 16px;
  }
  .file_name {
    width: 240px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
  }
  .progress {
    display: flex;
    align-items: center;
    margin: 10px 0;
    .el-progress {
      width: 300px;
      padding-top: 5px;
    }
  }
  .uploadSpeed {
    width: 100px;
  }
}

.progress .uploadSpeed {
  font-size: 16px;
  margin-left: 5px;
  padding-left: 5px;
  padding-right: 10px;
}

.just-between {
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 10px;
  :deep(.el-tabs__header) {
    margin-bottom: 0 !important;
  }
}

.folder-input-wrapper {
  position: relative;
  margin-left: 10px;
  input[type='file'] {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    height: 100%;
  }
}
.just-center {
  justify-content: space-between;
  margin-top: 10px;
  padding-left: 5px;
}
.row-item {
  display: flex;
  align-items: center;
  // justify-content: center;
  width: 130px;
  line-height: 36px;

  .label {
    font-weight: bold;
    color: #909399;
  }
  .success_num {
    color: #67c23a;
  }
  .error_num {
    color: #f56c6c;
  }
}
.fz-16 {
  font-size: 16px;
}
</style>
