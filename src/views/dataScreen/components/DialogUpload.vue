<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" :before-close="handleClose">
    <el-upload
      ref="uploadRef"
      class="upload-box"
      :before-upload="beforeUpload"
      @change="changeFile"
      action="#"
      :limit="1"
      drag
      :accept="props.uploadAcceptType"
      :http-request="xhrUpload"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">拖动文件至此或<em>点击上传</em></div>
    </el-upload>
    <!-- 正在上传的文件列表 -->
    <div class="uploading" v-for="(fileItem, index) in uploadFileList" :key="index">
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
          <el-button circle link @click="changeUploadingStop(fileItem)">
            <el-icon size="20" v-if="fileItem.uploadingStop == false"><VideoPause /></el-icon>
            <el-icon size="20" v-else><VideoPlay /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    <!-- <video
      src=""
      class="videos1"
      autoplay
      style="width: 300px; height: 240px"
      playsinline
      webkit-playsinline
      x5-playsinline
      x5-video-player-fullscreen
      x5-video-orientation="portraint"
      :controls="true"
      preload="auto"
    ></video> -->
    <!-- <video
      src=""
      class="videos2"
      autoplay
      style="width: 300px; height: 240px"
      playsinline
      webkit-playsinline
      x5-playsinline
      x5-video-player-fullscreen
      x5-video-orientation="portraint"
      :controls="true"
      preload="auto"
    ></video> -->
  </el-dialog>
</template>
<script setup>
// import { fetchFile } from '@ffmpeg/ffmpeg'
import { filterFileClassify } from '@/utils/file'
import {
  uploadFile,
  checkFileByMd5,
  uploadChunkFile,
  bindBigFile,
  uploadSmallFile,
  addSmallFile,
  checkFileType
} from '@/api/modules/file'
import { ElMessage, ElLoading } from 'element-plus'
import SparkMD5 from 'spark-md5'
import { VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { GlobalStore } from '@/stores'
const props = defineProps({
  uploadAcceptType: String
})
const globalStore = GlobalStore()
const ffmpeg = globalStore.ffmpeg
let mp4Duration = ref(0)
const emits = defineEmits(['search'])

let dialogVisible = ref(false)
let dialogTitle = ref('文件上传')
const handleClose = () => {
  dialogVisible.value = false
}
let currentId = ref()
const uploadRef = ref()
// 获取视频时长
const getMp4Time = file => {
  return new Promise(async (resolve, reject) => {
    let url = URL.createObjectURL(file)
    let audioElement = new Audio(url)
    let durtaion = 0
    // 下面需要注意的是在监听loadedmetadata绑定的事件中对duration直接进行赋值是无效的，需要在fun回调函数中进行赋值
    audioElement.addEventListener('loadedmetadata', function () {
      //音频/视频的元数据已加载时，会发生 loadedmetadata 事件
      durtaion = parseInt(audioElement.duration) //时长以秒作为单位
      fun(durtaion)
    })
    let fun = s => {
      durtaion = s
      resolve(durtaion)
    }
  })
}
const sliceVideoFile = async (file, uploadFile) => {
  console.log(file)
  let totalSize = file.size
  let expectStepSize = 10 * 1024 * 1024
  // 预设10M为1s
  // 按照10M分分成多少份
  let eachCopies = Math.round(totalSize / expectStepSize)
  // 按10M分每份的实际时长
  let eachRealTime = parseInt(mp4Duration.value / eachCopies)

  // let eachRealTime = Math.ceil(totalSize / expectStepSize)
  let startTime = 0
  let step = 1
  if (eachRealTime < 1) {
    step = 1
  } else {
    step = eachRealTime
  }
  // if (eachCopies <= eachRealTime) {
  //   // step = eachCopies
  //   console.log('计算步长', totalSize, mp4Duration.value, eachCopies, expectStepSize)
  //   // 如果真实每份的大小小于预计的每份的大小
  //   step = totalSize / eachRealTime <= expectStepSize ? eachRealTime : eachCopies
  // } else {
  //   step = eachRealTime < 1 ? 1 : eachRealTime
  // }
  let type = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase()
  let fileName = `file${Date.now()}.${type}`
  let index = 1
  let urlList = []
  let chunks = step / mp4Duration.value
  let stepSize = chunks * (totalSize / 1024 / 1024)
  try {
    uploadFile.uploadSpeed = '上传中...'
    uploadFile.uploadPercentage = 1
    console.log('ffmpeg-待写入')
    await ffmpeg.FS('writeFile', fileName, await globalStore.fetchFile(file))
    console.log('ffmpeg-write执行完毕')
    console.log('step', startTime, step, 'mp4Duration', mp4Duration.value)
    while (startTime + step <= mp4Duration.value) {
      const outName = Date.now() + '.mp4'
      console.log('name', fileName, outName, startTime, step)
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
      console.log('ffmpeg-readFile执行完毕')
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
      const videoPath = await uploadSmallFile(formData)
      urlList.push(videoPath)
      startTime += step
      let endTime = new Date().valueOf()
      let timeDif = (endTime - startSpeedTime) / 1000
      uploadFile.uploadSpeed = (stepSize / timeDif).toFixed(1) + ' M/s'
      uploadFile.uploadPercentage = parseInt(chunks * index * 90)
      index++
      if (startTime + step > mp4Duration.value && startTime < mp4Duration.value) {
        step = mp4Duration.value - startTime
        if (step <= 1) {
          break
        }
      }
      console.log(startTime, mp4Duration.value, step)
    }
    const params = {
      md5: uploadFile.md5,
      name: uploadFile.name,
      shardingList: urlList,
      size: uploadFile.size,
      type: uploadFile.fileType
    }
    console.log(params, uploadFile)
    addSmallFile(params)
      .then(videoId => {
        console.log(videoId)
        bindBigFile(currentId.value, videoId).then(() => {
          uploadFile.uploadPercentage = 100
          uploadFileList.value.splice(uploadFile.index, 1)
          ElMessage.success('文件上传成功！')
          uploadRef.value.clearFiles()
          emits('search')
          dialogVisible.value = false
        })
      })
      .catch(err => {
        ElMessage.error('文件上传失败！')
        uploadRef.value.clearFiles()
        console.log(err)
        uploadFileList.value.splice(uploadFile.index, 1)
        dialogVisible.value = false
      })
  } catch (err) {
    ElMessage.error('文件上传失败！')
    uploadFileList.value.splice(uploadFile.index, 1)
    uploadRef.value.clearFiles()
    dialogVisible.value = false
    throw err
  }
}
const initDialog = id => {
  currentId.value = id
  dialogVisible.value = true
}
function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('')
}

/*********大文件 */

let uploadFileList = ref([])

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
//计算文件的md5值
function computeMd5(file, uploadFile) {
  return new Promise((resolve, reject) => {
    //分片读取并计算md5

    const chunkTotal = 100 //分片数
    const chunkSize = Math.ceil(file.size / chunkTotal)
    const fileReader = new FileReader()
    const md5 = new SparkMD5()
    let index = 0
    const loadFile = uploadFile => {
      uploadFile.parsePercentage.value = parseInt((index / file.size) * 100)
      const slice = file.slice(index, index + chunkSize)

      fileReader.readAsBinaryString(slice)
    }
    loadFile(uploadFile)
    fileReader.onload = e => {
      md5.appendBinary(e.target.result)
      if (index < file.size) {
        index += chunkSize
        loadFile(uploadFile)
      } else {
        // md5.end() 就是文件md5码
        resolve(md5.end())
      }
    }
  })
}

//文件上传之前,el-upload自动触发
async function beforeUpload(file) {
  if (file.type.split('/')[0] === 'video') {
    if (file.size >= window.appsetings.maxFileSize) {
      ElMessage.warning({
        title: '提示',
        message: `上传视频文件大小不能超过${window.appsetings.maxFileSize / 1024 / 1024}M`,
        duration: 3000,
        showClose: true,
        grouping: true
      })
      loadingInstance.close()
      return false
    } else {
      // let formData = new FormData()
      // //检查文件类型
      // formData.append('file', file)
      // const type = await checkFileType(formData)
      if (file.type.split('/')[1] !== 'mp4') {
        ElMessage.warning('只能上传mp4格式的视频!')
        loadingInstance.close()
        return false
      }
    }
  }
  if (file.type.split('/')[1] === 'vnd.ms-excel') {
    //xls
    ElMessage.warning('请上传xlsx格式的Excel文件')
    loadingInstance.close()
    return false
  }
  if (file.type.split('/')[1] === 'msword') {
    //doc
    ElMessage.warning('请上传docx格式的文档')
    loadingInstance.close()
    return false
  }

  //大文件上传前判断是否已经上传过
  if (file.size >= window.appsetings.bigFileSize) {
    console.log(file)
    let uploadFile = {}
    uploadFile.name = file.name
    uploadFile.size = file.size
    uploadFile.parsePercentage = ref(0)
    uploadFile.uploadPercentage = ref(0)
    uploadFile.uploadSpeed = '0 M/s'
    uploadFile.chunkList = null
    uploadFile.file = file
    uploadFile.uploadingStop = false
    uploadFile.index = uploadFileList.value.length
    uploadFileList.value.push(uploadFile)
    let md5 = await computeMd5(file, uploadFile) //async 和 await配可以实现等待异步函数计算完成
    uploadFile.md5 = md5
    let res = await checkFileByMd5({ md5 }) //上传服务器检查，以确认是否秒传
    console.log(res, uploadFile)

    //根据文件的md5信息判断是否在系统中上传过

    if (Array.isArray(res)) {
      uploadFile.chunkList = res
      uploadFile.needUpload = true
    } else {
      uploadFile.needUpload = false
      uploadFile.uploadPercentage.value = 100
      await bindBigFile(currentId.value, res)
      ElMessage.success('文件已秒传!')
      dialogVisible.value = false
      emits('search')
    }

    //如果是大文件

    for (let i = 0; i < uploadFileList.value.length; i++) {
      if ((file.name == uploadFileList.value[i].name) & (file.size == uploadFileList.value[i].size)) {
        uploadFile = uploadFileList.value[i]
        break
      }
    }
    if (uploadFile.needUpload) {
      // 赋值文件类型
      let type = filterFileClassify(file.name)
      uploadFile.fileType = type
      if (type === 'VIDEO') {
        //大文件视频--- 获取视频时长
        mp4Duration.value = await getMp4Time(file)
        sliceVideoFile(file, uploadFile)
      } else {
        // 非视频大文件分片上传文件
        uploadChunk(file, 1, uploadFile)
      }
    }
  } else {
    //小文件上传
    let formData = new FormData()
    formData.append('file', file)
    let type = filterFileClassify(file.name)
    const loadingInstance = ElLoading.service({
      text: '上传中...',
      background: 'rgba(0, 0, 0, .3)'
    })
    uploadFile(currentId.value, type, formData)
      .then(() => {
        ElMessage.success('上传成功！')
        uploadRef.value.clearFiles()
        emits('search')
        loadingInstance.close()
        dialogVisible.value = false
      })
      .catch(() => {
        loadingInstance.close()
        uploadRef.value.clearFiles()
        dialogVisible.value = false
      })
  }
  loadingInstance.close()
  dialogVisible.value = false
}

//点击暂停或开始上传
function changeUploadingStop(uploadFile) {
  uploadFile.uploadingStop = !uploadFile.uploadingStop
  if (!uploadFile.uploadingStop) {
    uploadChunk(uploadFile.file, 1, uploadFile)
  }
}
function changeFile() {}
//上传文件,替换el-upload的action
async function xhrUpload(xhrData) {
  let uploadFile = null
}
//上传文件分片
function uploadChunk(file, index, uploadFile) {
  let chunkSize = 1024 * 1024 * 24 //24mb
  let chunkTotal = Math.ceil(file.size / chunkSize)
  if (index <= chunkTotal) {
    // 根据是否暂停，确定是否继续上传
    let startTime = new Date().valueOf()

    let exit = uploadFile.chunkList.includes(index)
    // console.log("是否存在",exit);

    if (!exit) {
      //    console.log("3.3上传文件",uploadingStop);
      if (!uploadFile.uploadingStop) {
        // 分片上传，同时计算进度条和上传速度
        // 已经上传的不在上传、
        // 上传完成后提示，上传成功
        // console.log("上传分片1",index);
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
          md5: uploadFile.md5,
          type: type
        }
        uploadChunkFile(chunkForm, formdata).then(res => {
          let endTime = new Date().valueOf()
          let timeDif = (endTime - startTime) / 1000
          //上传速度
          uploadFile.uploadSpeed = (10 / timeDif).toFixed(1) + ' M/s'
          uploadFile.chunkList.push(index)
          //上传进度
          uploadFile.uploadPercentage = parseInt((uploadFile.chunkList.length / chunkTotal) * 100)
          if (index == chunkTotal) {
            bindBigFile(currentId.value, res).then(() => {
              ElMessage.success('文件上传成功！')
              uploadRef.value.clearFiles()
              emits('search')
            })
          }
          uploadChunk(file, index + 1, uploadFile)
        })
      }
    } else {
      uploadFile.uploadPercentage = parseInt((uploadFile.chunkList.length / chunkTotal) * 100)

      uploadChunk(file, index + 1, uploadFile)
    }
  }
}
defineExpose({ initDialog })
</script>
<style lang="scss" scoped>
.uploading {
  padding-top: 10px;
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
</style>
