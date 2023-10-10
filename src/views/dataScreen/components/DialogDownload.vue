<template>
  <el-dialog v-model="dialogVisible" :close-on-click-modal="false" :title="dialogTitle" width="600px" :before-close="handleClose">
    <div v-if="downloadingFileList.length === 0">
      <el-empty :image-size="200" />
    </div>
    <el-divider content-position="left" v-if="downloadingFileList.length > 1">下载列表</el-divider>
    <div v-for="fileItem in downloadingFileList" :key="fileItem.id">
      <div class="downloading">
        <div class="file-desc">
          <div class="fileName">{{ fileItem.name }}</div>
          <div>{{ formatSize(fileItem) }}</div>
        </div>
        <div class="file-desc">
          <div class="speed">
            <span>下载速度：</span>
            {{ fileItem.downloadSpeed }}
          </div>
          <el-button size="mini" @click="cancelDownload">取消下载 </el-button>
        </div>
        <div class="progress">
          <span>下载进度：</span>
          <el-progress :text-inside="true" :stroke-width="16" :percentage="fileItem.downloadPersentage"> </el-progress>
          <el-button circle class="ml-10" link @click="changeDownloadStop(fileItem)">
            <el-icon size="20" v-if="fileItem.downloadingStop == false"><VideoPause /></el-icon>
            <el-icon size="20" v-else><VideoPlay /></el-icon>
            {{ fileItem.loadingTips }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<script setup>
import { downloadBigFile, downLoadSmallFile } from '@/api/modules/file'
// import { fetchFile } from '@ffmpeg/ffmpeg'
import { ElMessage } from 'element-plus'
import { GlobalStore } from '@/stores'
import axios from 'axios'
const globalStore = GlobalStore()
const ffmpeg = globalStore.ffmpeg

let isDowning = ref(false)
let dialogVisible = ref(false)
const dialogTitle = ref('文件下载')
let downloadingFileList = ref([])
const handleClose = () => {
  // downloadingFileList.value = []
  dialogVisible.value = false
}
const cancelDownload = () => {
  window.location.reload()
}
watch(
  () => downloadingFileList.value.length,
  length => {
    console.log('downloadingFileList的' + length)
    let file = downloadingFileList.value[0]
    if (!isDowning.value && file) {
      if (file.shardingList && file.shardingList?.length > 0) {
        getTotalVideo(file)
      } else {
        file.blobList = []
        file.chunkList = []
        downloadChunk(1, file)
      }
    }
  }
)
//换算文件的大小单位
function formatSize(file) {
  //console.log("size",file.size);
  let size = file.size
  let unit
  let units = [' B', ' K', ' M', ' G']
  let pointLength = 2
  while ((unit = units.shift()) && size > 1024) {
    size = size / 1024
  }
  return (unit === 'B' ? size : size.toFixed(pointLength === undefined ? 2 : pointLength)) + unit
}
//点击暂停下载
function changeDownloadStop(file) {
  file.downloadingStop = !file.downloadingStop
  if (!file.downloadingStop) {
    console.log('开始。。')

    downloadChunk(1, file)
  }
}
//点击下载文件
function downloadFile(file) {
  console.log('下载', file)
  file.downloadingStop = false
  file.downloadSpeed = '0 M/s'
  file.downloadPersentage = 0
  file.loadingTips = '下载中...'
  const flag = downloadingFileList.value.findIndex(ele => ele.id === file.id)
  if (flag > -1) {
    ElMessage.warning('当前文件已在下载列表中')
    return
  }
  downloadingFileList.value.push(file)
  // if(file.shardingList && file.shardingList?.length > 0 ) {
  //   getTotalVideo(file.shardingList, file)
  // } else {
  //   // file.downloadingStop = false
  //   // file.downloadSpeed = '0 M/s'
  //   // file.downloadPersentage = 0
  //   file.blobList = []
  //   file.chunkList = []
  //   // downloadingFileList.value.push(file)
  //   downloadChunk(1, file)
  // }
}
//两个数之间的随机整数
function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //不含最大值，含最小值
}
/**
 * 下载大视频文件
 * @params arr: url数组
 */
const getTotalVideo = async file => {
  console.log(`comment=${globalStore.userInfo.user_id}_${globalStore.userInfo.user_phone}_${file.id}`)

  let arr = file.shardingList
  const source = axios.CancelToken.source()
  isDowning.value = true
  let arrLength = arr.length
  let chunkSize = file.size / 1024 / 1024 / arrLength
  console.log(file, chunkSize, arrLength)
  let str = 'concat:'
  console.log(arr)
  let blobs = []
  let startTime1 = new Date().valueOf()
  if (file.watermark) {
    let random = Math.floor(Math.random() * (arr.length - 1))
    random = random ? random : 1
    let random1 = random - 1 <= 0
    if (arr.length === 1) {
      arr.forEach(ele => {
        blobs.push(
          downLoadSmallFile({ path: ele, fileFolderId: file.id, waterMarkPath: `${arr[0]}` }, { cancelToken: source.token })
        )
      })
    } else {
      arr.forEach(ele => {
        blobs.push(
          downLoadSmallFile(
            { path: ele, fileFolderId: file.id, waterMarkPath: `${arr[0]},${arr[getRandomInt(1, arr.length - 1)]}` },
            { cancelToken: source.token }
          )
        )
      })
    }
  } else {
    arr.forEach(ele => {
      blobs.push(downLoadSmallFile({ path: ele, fileFolderId: file.id, waterMarkPath: `` }, { cancelToken: source.token }))
    })
  }
  arr = null
  file.loadingTips = '下载中...'
  let num = 0
  blobs.forEach(p => {
    p.then(() => {
      num++
      let endTime1 = new Date().valueOf()
      let timeDif1 = (endTime1 - startTime1) / 1000
      startTime1 = endTime1
      file.downloadSpeed = (chunkSize / timeDif1).toFixed(1) + ' M/s'
      file.downloadPersentage = parseInt((num * 80) / arrLength)
    })
  })
  Promise.all(blobs)
    .then(async res => {
      blobs = null
      console.log(res)
      for (let i = 0; i < res.length; i++) {
        file.loadingTips = '文件处理中...'
        let startTime = Date.now()
        let blob = new Blob([res[i]])
        let newName = `file${i}.mp4`
        let file11 = new File([blob], newName, { type: 'video/mp4' })
        let mp4Name = Date.now() + i + '.mp4'
        let newTdsName = Date.now() + i + '.ts'
        await ffmpeg.FS('writeFile', mp4Name, await globalStore.fetchFile(file11))
        await ffmpeg.run('-i', mp4Name, '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts', newTdsName)
        await ffmpeg.FS('unlink', mp4Name)
        let endTime = Date.now()
        let timeDif = (endTime - startTime) / 1000
        file.downloadSpeed = parseInt(chunkSize / timeDif) + ' M/s'
        console.log(timeDif, chunkSize, file.downloadSpeed)
        file.downloadPersentage = file.downloadPersentage < 99 ? Math.ceil(file.downloadPersentage + 20 / arrLength) : 99
        if (i === res.length - 1) {
          str = str + newTdsName
        } else {
          str = str + newTdsName + '|'
        }

        console.log(`循环${i}次`)
        res[i] = null
        blob = null
        file11 = null
        startTime = null
        endTime = null
        timeDif = null
      }
      res = null
      console.log('开始合并')
      const mergeName = 'merge' + Date.now() + '.mp4'
      await ffmpeg.run('-i', `${str}`, '-c', 'copy', '-bsf:a', 'aac_adtstoasc', '-movflags', '+faststart', mergeName)
      console.log('结束合并')

      const outName = Date.now() + '.mp4'

      // 写入文件属性
      await ffmpeg.run(
        '-y',
        '-i',
        `${mergeName}`,
        '-vcodec',
        'copy',
        '-acodec',
        'copy',
        '-metadata',
        `comment=${globalStore.userInfo.real_name}_${globalStore.userInfo.user_phone}_${file.id}`,
        outName
      )

      let arrayBuffer = ffmpeg.FS('readFile', outName).buffer
      await ffmpeg.FS('unlink', outName)
      let outputBlob = new Blob([arrayBuffer])
      console.log('outputBlob', outputBlob)
      let downLoadUrl = URL.createObjectURL(outputBlob, { type: 'video/mp4' })
      let a = document.createElement('a')
      a.style.display = 'none'
      document.body.appendChild(a)
      a.download = file.name
      a.href = downLoadUrl
      a.click()

      isDowning.value = false
      console.log('downLoadUrl', downLoadUrl)
      //预览1.5s 浏览器处理文件
      let timer = setTimeout(() => {
        file.downloadPersentage = 100
        //下载成功后，列表中清除当前的大文件
        downloadingFileList.value.splice(
          downloadingFileList.value.findIndex(ele => ele.id === file.id),
          1
        )
        if (downloadingFileList.value.length === 0) {
          handleClose()
        }
        clearTimeout(timer)
        timer = null
        file = null
      }, 1500)
    })
    .catch(err => {
      console.log(err)
      ElMessage.error({
        title: '提示',
        message: '文件下载失败',
        duration: 5000,
        showClose: true,
        grouping: true
      })
      downloadingFileList.value.splice(
        downloadingFileList.value.findIndex(ele => ele.id === file.id),
        1
      )
      if (downloadingFileList.value.length === 0) {
        handleClose()
      }
      file = null
      isDowning.value = false
      source.cancel('请求取消')
    })
}

//点击下载文件分片
function downloadChunk(index, file) {
  isDowning.value = true
  let chunkSize = 1024 * 1024 * 5
  let chunkTotal = Math.ceil(file.size / chunkSize)

  if (index <= chunkTotal) {
    // console.log("下载进度",index);
    let exit = file.chunkList.includes(index)
    console.log('存在', exit)

    if (!exit) {
      if (!file.downloadingStop) {
        let startTime = new Date().valueOf()

        downloadBigFile({
          chunkSize: index * chunkSize >= file.size ? file.size - (index - 1) * chunkSize : chunkSize,
          chunkTotal: chunkTotal,
          fileName: file.name,
          index: index,
          md5: file.md5
        }).then(res => {
          file.chunkList.push(index)
          let endTime = new Date().valueOf()
          let timeDif = (endTime - startTime) / 1000
          file.downloadSpeed = (5 / timeDif).toFixed(1) + ' M/s'

          file.downloadPersentage = parseInt((index / chunkTotal) * 100)

          const blob = res

          file.blobList.push(blob)
          //切片下载完成
          if (index == chunkTotal) {
            let resBlob = new Blob(file.blobList, {
              type: 'application/octet-stream'
            })

            let url = window.URL.createObjectURL(resBlob) // 将获取的文件转化为blob格式
            let a = document.createElement('a') // 此处向下是打开一个储存位置
            a.style.display = 'none'
            a.href = url
            // 下面两行是自己项目需要的处理，总之就是得到下载的文件名（加后缀）即可

            let fileName = file.name

            a.setAttribute('download', fileName)
            document.body.appendChild(a)
            a.click() //点击下载
            isDowning.value = false
            document.body.removeChild(a) // 下载完成移除元素
            window.URL.revokeObjectURL(url) // 释放掉blob对象
            //调用关闭弹框
            handleClose()
          }

          downloadChunk(index + 1, file)
        })
      }
    } else {
      file.downloadPersentage = parseInt((index / chunkTotal) * 100)
      downloadChunk(index + 1, file)
    }
  }
}
const initDialog = () => {
  dialogVisible.value = true
}
defineExpose({ initDialog, downloadFile, downloadingFileList })
</script>
<style lang="scss" scoped>
:deep(.el-divider--horizontal) {
  margin: 12px 0 !important;
}
.title {
  margin-top: 5px;
  margin-bottom: 5px;
}
.downloading {
  margin-top: 10px;

  .file-desc {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .speed {
    margin-bottom: 16px;
  }
}
.progress {
  display: flex;
}
.progress .el-progress {
  width: 310px;
}
</style>
