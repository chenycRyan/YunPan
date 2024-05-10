<template>
  <div :class="showLoading && 'video_container'">
    <div class="artplayer-app"></div>

    <el-icon v-if="showLoading" class="is-loading">
      <Loading />
    </el-icon>

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
      @error="videoError"
    ></video> -->

    <!-- <a id="downid" href="" download="get.mp4">下载</a> -->
  </div>
</template>

<script setup>
// import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import Artplayer from 'artplayer'
import { ElLoading, ElMessage } from 'element-plus'
import flvjs from 'flv.js'
import Hls from 'hls.js'
import { downloadFile, downLoadFfmpegFile } from '@/api/modules/file'
import { GlobalStore } from '@/stores'
import axios from 'axios'
const globalStore = GlobalStore()
const props = defineProps({
  fileId: Number,
  fileName: String,
  shardingList: Array
})
// const ffmpeg = createFFmpeg()
// if (!ffmpeg.isLoaded()) {
//   ffmpeg.load().catch(err => {
//     console.log(err)
//   })
// }
let showLoading = ref(false)
let source = ref()
watch(
  () => props.fileId,
  async val => {
    let domElement = document.querySelector('.artplayer-app')
    domElement ? (domElement.innerHTML = '') : ''
    // 挂载时，加载文件内容，并初始化
    if (val) {
      console.log(val, props)
      if (props.shardingList) {
        console.log(props.shardingList)
        showLoading.value = true
        // const loadingInstance = ElLoading.service({
        //   text: '加载中...',
        //   background: 'rgba(0, 0, 0, .3)'
        // })
        await nextTick()
        source.value = axios.CancelToken.source()
        // waterMarkPath: `${props.shardingList[0]}`
        downLoadFfmpegFile(
          {
            path: props.shardingList[0],
            fileFolderId: val,
            waterMarkPath: ''
          },
          { cancelToken: source.token }
        ).then(async res => {
          let fileBlob = new Blob([res])
          let file = new File([fileBlob], 'out.mp4', { type: 'mp4' })
          let mp4Time = await getMp4Time(file)
          ElMessage.success('预览时长' + mp4Time)
          initArtPlayer(props.fileName, window.URL.createObjectURL(fileBlob))
          showLoading.value = false
        })
      } else {
        showLoading.value = true

        downloadFile(val)
          .then(res => {
            console.log(new Blob([res]))
            initArtPlayer(props.fileName, window.URL.createObjectURL(new Blob([res])))
            console.log('url', window.URL.createObjectURL(new Blob([res])))
            showLoading.value = false
          })
          .catch(() => {
            showLoading.value = false
          })
      }
    }
  },
  { immediate: true }
)
// 获取视频列表, 如果是当前视频, 则设置为默认勾选.
// onMounted(() => {
//   initArtPlayer(
// 		'mp4格式.mp4',
// 		' https://liwan-my.sharepoint.cn/personal/admin_liwan_partner_onmschina_cn/_layouts/15/download.aspx?UniqueId=95aea659-9a07-45e1-a372-464819de7750&Translate=false&tempauth=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAvbGl3YW4tbXkuc2hhcmVwb2ludC5jbkA1MzViNGQ3Ni0xZTE1LTQ5MmYtYThjYS1jMjcyNjU1OGRiNDMiLCJpc3MiOiIwMDAwMDAwMy0wMDAwLTBmZjEtY2UwMC0wMDAwMDAwMDAwMDAiLCJuYmYiOiIxNjc4MjYyODg5IiwiZXhwIjoiMTY3ODI2NjQ4OSIsImVuZHBvaW50dXJsIjoiZXBLQ0Ftb1dMWVdJaXBKbFJJZ2oyc3lOS1F0VUpPRS9qRHdvcEtrVDIxUT0iLCJlbmRwb2ludHVybExlbmd0aCI6IjE2MCIsImlzbG9vcGJhY2siOiJUcnVlIiwiY2lkIjoiWXpCall6UXlaVGd0WTJGa1l5MDBPVEJsTFRrek16UXRNRE5sWmpZek56WXpOVEppIiwidmVyIjoiaGFzaGVkcHJvb2Z0b2tlbiIsInNpdGVpZCI6IlpqTTNZMlkwTlRVdE5EZzVZaTAwTkdFeUxUaGlZVFF0WXpCaU1HUm1ZemcyWWprNCIsImFwcF9kaXNwbGF5bmFtZSI6InpmaWxlIiwiYXBwaWQiOiI0YTcyZDkyNy0xOTA3LTQ4OGQtOWViMi0xYjQ2NWM1M2MxYzUiLCJ0aWQiOiI1MzViNGQ3Ni0xZTE1LTQ5MmYtYThjYS1jMjcyNjU1OGRiNDMiLCJ1cG4iOiJhZG1pbkBsaXdhbi5wYXJ0bmVyLm9ubXNjaGluYS5jbiIsInB1aWQiOiIxMDAzMzIzMEM2NjA0MjE3IiwiY2FjaGVrZXkiOiIwaC5mfG1lbWJlcnNoaXB8MTAwMzMyMzBjNjYwNDIxN0BsaXZlLmNvbSIsInNjcCI6ImFsbGZpbGVzLndyaXRlIGFsbHNpdGVzLnJlYWQgYWxsc2l0ZXMud3JpdGUgYWxscHJvZmlsZXMucmVhZCIsInR0IjoiMiIsInVzZVBlcnNpc3RlbnRDb29raWUiOm51bGwsImlwYWRkciI6IjUyLjEzMC4xMC4xNjEifQ.UElQRDIyS1hMKys4Qm1mOTRMTkMwdHhHcm5OWWlwR3FKQ2YrTkFvMUpDMD0&ApiVersion=2.0'
// 	)
// })

let hiddenIcon =
  '<i class="art-icon art-icon-not-hidden"><svg t="1662978336444" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="968" width="128" height="128"><path d="M711.456 377.184c32.736 31.52 60.928 72.256 84.64 122.208a40.64 40.64 0 0 1 0 34.72c-63.776 135.04-160.48 202.528-290.112 202.528-46.752 0-89.248-8.832-127.456-26.464l37.184-37.184c27.52 10.048 57.6 15.104 90.272 15.104 108.864 0 188.48-55.168 244.608-171.296-21.088-43.584-45.44-78.56-73.44-105.28l34.304-34.336z m13.024-122.816l28.768 28.8a5.376 5.376 0 0 1 0 7.616L272.96 771.04a5.408 5.408 0 0 1-7.648 0l-28.8-28.8a5.376 5.376 0 0 1 0-7.616l71.36-71.36c-35.84-32.384-66.56-75.392-92.032-129.088a40.64 40.64 0 0 1 0-34.72C279.68 364.48 376.384 296.96 505.984 296.96c50.752 0 96.448 10.4 137.12 31.168l73.76-73.728a5.376 5.376 0 0 1 7.616 0z m-218.496 91.136c-108.8 0-188.416 55.168-244.608 171.296 22.944 47.36 49.792 84.608 80.928 112.096l56.256-56.256a118.688 118.688 0 0 1 160.576-160.576l47.424-47.424c-30.336-12.832-63.776-19.136-100.576-19.136z m-70.016 137.088a75.616 75.616 0 0 0-4.64 57.28l95.04-95.04a75.616 75.616 0 0 0-90.4 37.76z m60.416 109.504a75.456 75.456 0 0 0 82.144-82.112l35.616-35.616a118.72 118.72 0 0 1-153.376 153.344l35.616-35.616z" p-id="969"></path></svg></i>'
let notHiddenIcon =
  '<i class="art-icon art-icon-hidden"><svg t="1662978261880" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4451" width="128" height="128"><path d="M512.032 648a136.128 136.128 0 0 1-136-136c0-74.976 60.992-136 136-136s136 61.024 136 136a136.128 136.128 0 0 1-136 136z m0-224c-48.544 0-88 39.456-88 88s39.456 88 88 88 88-39.456 88-88-39.456-88-88-88z" p-id="4452"></path><path d="M512.032 743.616a327.68 327.68 0 0 1-231.872-95.616L142.88 512l137.28-136a327.68 327.68 0 0 1 231.872-95.584c87.328 0 169.664 33.952 231.872 95.584l137.28 136-137.28 136a327.52 327.52 0 0 1-231.872 95.616zM206.528 512l107.424 101.952c53.152 52.672 123.488 81.696 198.048 81.696s144.896-29.024 198.08-81.696L817.536 512l-107.424-101.952c-53.152-52.672-123.488-81.696-198.048-81.696s-144.896 29.024-198.08 81.696L206.528 512z" p-id="4453"></path></svg></i>'
let videoListIcon =
  '<i class="art-icon art-icon-video-list"><svg t="1650551038453" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12028" width="20" height="20"><path d="M111.395066 179.64038l801.208844 0 0 87.866187-801.208844 0 0-87.866187Z" p-id="12029"></path><path d="M111.395066 468.067418l801.208844 0 0 87.866187-801.208844 0 0-87.866187Z" p-id="12030"></path><path d="M111.395066 756.493433l801.208844 0 0 87.866187-801.208844 0 0-87.866187Z" p-id="12031"></path></svg></i>'

const autoPlayNextVideo = ref(true)
const autoPlayVideo = ref(true)
const hiddenTools = ref(true)

let art = null
function getTimes(t) {
  let h = parseInt((t / 60 / 60) % 24)
  let m = parseInt((t / 60) % 60)
  let s = parseInt(t % 60)
  //三元表达式 补零 如果小于10 则在前边进行补零 如果大于10 则不需要补零
  h = h < 10 ? '0' + h : h
  m = m < 10 ? '0' + m : m
  s = s < 10 ? '0' + s : s
  return `${h}小时${m}分钟${s}秒`
}
// 获取视频时长
const getMp4Time = file => {
  return new Promise(async (resolve, reject) => {
    let url = URL.createObjectURL(file)
    let audioElement = new Audio(url)
    let durtaion = 0
    // 下面需要注意的是在监听loadedmetadata绑定的事件中对duration直接进行赋值是无效的，需要在fun回调函数中进行赋值
    audioElement.addEventListener('loadedmetadata', function () {
      //音频/视频的元数据已加载时，会发生 loadedmetadata 事件
      durtaion = getTimes(parseInt(audioElement.duration)) //时长以秒作为单位
      fun(durtaion)
    })
    let fun = s => {
      durtaion = s
      resolve(durtaion)
    }
  })
}
const videoError = e => {
  console.log('videoError', e)
}
const initArtPlayer = async (name, url) => {
  if (art) {
    art.destroy()
  }

  let videoType = 'mp4'

  if (name.toLowerCase().endsWith('flv')) {
    videoType = 'flv'
  } else if (name.toLowerCase().endsWith('m3u8')) {
    videoType = 'm3u8'
  }

  let options = {
    container: '.artplayer-app',
    title: name,
    url: url,
    type: videoType,
    setting: true,
    playbackRate: true,
    flip: true,
    fullscreen: true,
    fastForward: true,
    autoOrientation: true,
    aspectRatio: true,
    fullscreenWeb: true,
    theme: '#23ade5',
    lock: true,
    subtitleOffset: true,
    miniProgressBar: true,
    autoplay: autoPlayVideo.value,
    whitelist: ['*'],
    moreVideoAttr: {
      'x5-video-player-type': 'h5',
      'x5-video-player-fullscreen': false,
      'x5-video-orientation': 'portraint',
      preload: 'metadata',
      crossOrigin: 'anonymous'
    },
    customType: {
      flv: function (video, url) {
        if (flvjs.isSupported()) {
          const flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: url
          })
          flvPlayer.attachMediaElement(video)
          flvPlayer.load()
        } else {
          art.notice.show = '不支持播放格式：flv'
        }
      },
      m3u8: function (video, url) {
        if (Hls.isSupported()) {
          const hls = new Hls()
          hls.loadSource(url)
          hls.attachMedia(video)
        } else {
          const canPlay = video.canPlayType('application/vnd.apple.mpegurl')
          if (canPlay === 'probably' || canPlay == 'maybe') {
            video.src = url
          } else {
            art.notice.show = '不支持播放格式：m3u8'
          }
        }
      }
    },
    contextmenu: [
      {
        html: '下载',
        click: function () {
          window.open(url)
        }
      }
    ],
    settings: [
      {
        html: '自动播放',
        tooltip: autoPlayVideo.value ? '开启' : '关闭',
        icon: '<img width="22" heigth="22" src="data:image/svg+xml;base64,Cjxzdmcgdmlld0JveD0iMCAwIDgwIDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48cGF0aCBpZD0icGlkLTY0LXN2Z28tYSIgZD0iTTAgMGg4MHY4MEgweiI+PC9wYXRoPjxwYXRoIGQ9Ik01Mi41NDYgOC4wMTRhMy45OTggMy45OTggMCAwMTQuMjIyIDMuMDc3Yy4xMDQuNDQ2LjA5My44MDguMDM5IDEuMTM4YTIuNzQgMi43NCAwIDAxLS4zMTIuODgxYy0uMDczLjEzMi0uMTYuMjU0LS4yNDYuMzc2bC0uMjU3LjM2Ni0uNTIxLjczYy0uNy45NjktMS40MTUgMS45MjYtMi4xNTQgMi44NjZsLS4wMTUuMDJhMjQwLjk0NSAyNDAuOTQ1IDAgMDE1Ljk4Ni4zNDFsMS42NDMuMTIzLjgyMi4wNjYuNDEuMDM0LjIwNi4wMTguMTAzLjAwOC4xMTUuMDEyYzEuMjY2LjExNiAyLjUxNi40NSAzLjY3Ny45NzVhMTEuNjYzIDExLjY2MyAwIDAxMy4xNjYgMi4xMTRjLjkzMS44NyAxLjcxOSAxLjg5NSAyLjMyMSAzLjAyMmExMS41OTUgMTEuNTk1IDAgMDExLjIyNCAzLjYxM2MuMDMuMTU3LjA0Ni4zMTYuMDY4LjQ3NGwuMDE1LjExOS4wMTMuMTEyLjAyMi4yMDYuMDg1LjgyMi4xNTkgMS42NDZjLjEgMS4wOTguMTkgMi4xOTguMjcgMy4yOTguMzE1IDQuNC40NjMgOC44MjkuMzYgMTMuMjU1YTE2Ni40ODkgMTY2LjQ4OSAwIDAxLS44NDMgMTMuMjEzYy0uMDEyLjEyNy0uMDM0LjI5Ny0uMDUzLjQ1NGE3LjU4OSA3LjU4OSAwIDAxLS4wNzIuNDc1bC0uMDQuMjM3LS4wNS4yMzZhMTEuNzYyIDExLjc2MiAwIDAxLS43NCAyLjI4NyAxMS43NTUgMTEuNzU1IDAgMDEtNS4xMTggNS41NyAxMS43MDUgMTEuNzA1IDAgMDEtMy42MjMgMS4yNjNjLS4xNTguMDI0LS4zMTYuMDUyLS40NzUuMDcybC0uNDc3LjA1My0uODIxLjA3MS0xLjY0NC4xMzRjLTEuMDk2LjA4Ni0yLjE5Mi4xNi0zLjI4OC4yM2EyNjAuMDggMjYwLjA4IDAgMDEtNi41NzguMzI1Yy04Ljc3Mi4zMjQtMTcuNTQ2LjIyLTI2LjMxMy0uMzAyYTI0Mi40NTggMjQyLjQ1OCAwIDAxLTMuMjg3LS4yMmwtMS42NDMtLjEyOS0uODIyLS4wNjktLjQxLS4wMzUtLjIwNi0uMDE4Yy0uMDY4LS4wMDYtLjEzMy0uMDEtLjIxOC0uMDJhMTEuNTY2IDExLjU2NiAwIDAxLTMuNy0uOTkyIDExLjczMiAxMS43MzIgMCAwMS01LjQ5Ny01LjE3OCAxMS43MyAxMS43MyAwIDAxLTEuMjE1LTMuNjI3Yy0uMDI0LS4xNTgtLjA1MS0uMzE2LS4wNjctLjQ3NWwtLjAyNi0uMjM4LS4wMTMtLjExOS0uMDEtLjEwMy0uMDctLjgyMy0uMTMyLTEuNjQ4YTE5MC42MzcgMTkwLjYzNyAwIDAxLS4yMi0zLjI5OGMtLjI1Ni00LjM5OS0uMzU4LTguODE3LS4yNTgtMTMuMjMzLjA5OS00LjQxMi4zNzItOC44MTEuNzg4LTEzLjE5N2ExMS42NSAxMS42NSAwIDAxMy4wMzktNi44MzUgMTEuNTg1IDExLjU4NSAwIDAxNi41NzItMy41NjNjLjE1Ny0uMDIzLjMxMi0uMDUxLjQ3LS4wN2wuNDctLjA1LjgyLS4wNyAxLjY0My0uMTNhMjI4LjQ5MyAyMjguNDkzIDAgMDE2LjY0Ny0uNDA1bC0uMDQxLS4wNWE4OC4xNDUgODguMTQ1IDAgMDEtMi4xNTQtMi44NjdsLS41Mi0uNzMtLjI1OC0uMzY2Yy0uMDg2LS4xMjItLjE3My0uMjQ0LS4yNDYtLjM3NmEyLjc0IDIuNzQgMCAwMS0uMzEyLS44ODEgMi44MDggMi44MDggMCAwMS4wNC0xLjEzOCAzLjk5OCAzLjk5OCAwIDAxNC4yMi0zLjA3NyAyLjggMi44IDAgMDExLjA5My4zMTNjLjI5NC4xNTUuNTM4LjM0Ny43NDIuNTY4LjEwMi4xMS4xOS4yMy4yOC4zNWwuMjcuMzU5LjUzMi43MmE4OC4wNTkgODguMDU5IDAgMDEyLjA2IDIuOTM2IDczLjAzNiA3My4wMzYgMCAwMTEuOTI5IDMuMDNjLjE4Ny4zMTMuMzczLjYyOC41NTYuOTQ1IDIuNzI0LS4wNDcgNS40NDctLjA1NiA4LjE3LS4wMzguNzQ4LjAwNiAxLjQ5Ni4wMTUgMi4yNDQuMDI2LjE4LS4zMTMuMzY0LS42MjQuNTQ5LS45MzRhNzMuMjgxIDczLjI4MSAwIDAxMS45My0zLjAzIDg4LjczNyA4OC43MzcgMCAwMTIuMDU5LTIuOTM1bC41MzMtLjcyLjI2OC0uMzU5Yy4wOS0uMTIuMTc5LS4yNC4yODEtLjM1YTIuOCAyLjggMCAwMTEuODM0LS44ODF6TTMwLjEzIDM0LjYzMWE0IDQgMCAwMC0uNDE4IDEuNDIgOTEuMTU3IDkxLjE1NyAwIDAwLS40NDYgOS4xMjhjMCAyLjgyOC4xMjEgNS42NTYuMzY0IDguNDgzbC4xMSAxLjIxMmE0IDQgMCAwMDUuODU4IDMuMTQzYzIuODItMS40OTggNS41NS0zLjAzMyA4LjE5My00LjYwNmExNzcuNDEgMTc3LjQxIDAgMDA1Ljg5Ni0zLjY2NmwxLjQzNC0uOTQyYTQgNCAwIDAwLjA0Ny02LjYzMiAxMzcuNzAzIDEzNy43MDMgMCAwMC03LjM3Ny00LjcwOCAxNDYuODggMTQ2Ljg4IDAgMDAtNi44NzktMy44NDlsLTEuNC0uNzI1YTQgNCAwIDAwLTUuMzgyIDEuNzQyeiIgaWQ9InBpZC02NC1zdmdvLWQiPjwvcGF0aD48ZmlsdGVyIHg9Ii0xNS40JSIgeT0iLTE2LjMlIiB3aWR0aD0iMTMwLjklIiBoZWlnaHQ9IjEzMi41JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0icGlkLTY0LXN2Z28tYyI+PGZlT2Zmc2V0IGR5PSIyIiBpbj0iU291cmNlQWxwaGEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjEiIGluPSJzaGFkb3dPZmZzZXRPdXRlcjEiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUdhdXNzaWFuQmx1cj48ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMyAwIiBpbj0ic2hhZG93Qmx1ck91dGVyMSIgcmVzdWx0PSJzaGFkb3dNYXRyaXhPdXRlcjEiPjwvZmVDb2xvck1hdHJpeD48ZmVPZmZzZXQgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMiI+PC9mZU9mZnNldD48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzLjUiIGluPSJzaGFkb3dPZmZzZXRPdXRlcjIiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMiI+PC9mZUdhdXNzaWFuQmx1cj48ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMiAwIiBpbj0ic2hhZG93Qmx1ck91dGVyMiIgcmVzdWx0PSJzaGFkb3dNYXRyaXhPdXRlcjIiPjwvZmVDb2xvck1hdHJpeD48ZmVNZXJnZT48ZmVNZXJnZU5vZGUgaW49InNoYWRvd01hdHJpeE91dGVyMSI+PC9mZU1lcmdlTm9kZT48ZmVNZXJnZU5vZGUgaW49InNoYWRvd01hdHJpeE91dGVyMiI+PC9mZU1lcmdlTm9kZT48L2ZlTWVyZ2U+PC9maWx0ZXI+PC9kZWZzPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgb3BhY2l0eT0iLjgiPjxtYXNrIGlkPSJwaWQtNjQtc3Znby1iIiBmaWxsPSIjZmZmIj48dXNlIHhsaW5rOmhyZWY9IiNwaWQtNjQtc3Znby1hIj48L3VzZT48L21hc2s+PGcgbWFzaz0idXJsKCNwaWQtNjQtc3Znby1iKSI+PHVzZSBmaWxsPSIjMDAwIiBmaWx0ZXI9InVybCgjcGlkLTY0LXN2Z28tYykiIHhsaW5rOmhyZWY9IiNwaWQtNjQtc3Znby1kIj48L3VzZT48dXNlIGZpbGw9IiNGRkYiIHhsaW5rOmhyZWY9IiNwaWQtNjQtc3Znby1kIj48L3VzZT48L2c+PC9nPjwvc3ZnPg==">',
        switch: autoPlayVideo.value,
        onSwitch: function (item, $dom, event) {
          const nextState = !item.switch

          autoPlayVideo.value = nextState
          art.autoplay = nextState
          // 改变提示文本
          item.tooltip = nextState ? '开启' : '关闭'

          // 改变按钮状态
          return nextState
        }
      },
      {
        html: '自动播放下一个视频',
        tooltip: autoPlayNextVideo.value ? '开启' : '关闭',
        icon: '<img width="22" heigth="22" src="data:image/svg+xml;base64,Cjxzdmcgdmlld0JveD0iMCAwIDgwIDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48cGF0aCBpZD0icGlkLTY0LXN2Z28tYSIgZD0iTTAgMGg4MHY4MEgweiI+PC9wYXRoPjxwYXRoIGQ9Ik01Mi41NDYgOC4wMTRhMy45OTggMy45OTggMCAwMTQuMjIyIDMuMDc3Yy4xMDQuNDQ2LjA5My44MDguMDM5IDEuMTM4YTIuNzQgMi43NCAwIDAxLS4zMTIuODgxYy0uMDczLjEzMi0uMTYuMjU0LS4yNDYuMzc2bC0uMjU3LjM2Ni0uNTIxLjczYy0uNy45NjktMS40MTUgMS45MjYtMi4xNTQgMi44NjZsLS4wMTUuMDJhMjQwLjk0NSAyNDAuOTQ1IDAgMDE1Ljk4Ni4zNDFsMS42NDMuMTIzLjgyMi4wNjYuNDEuMDM0LjIwNi4wMTguMTAzLjAwOC4xMTUuMDEyYzEuMjY2LjExNiAyLjUxNi40NSAzLjY3Ny45NzVhMTEuNjYzIDExLjY2MyAwIDAxMy4xNjYgMi4xMTRjLjkzMS44NyAxLjcxOSAxLjg5NSAyLjMyMSAzLjAyMmExMS41OTUgMTEuNTk1IDAgMDExLjIyNCAzLjYxM2MuMDMuMTU3LjA0Ni4zMTYuMDY4LjQ3NGwuMDE1LjExOS4wMTMuMTEyLjAyMi4yMDYuMDg1LjgyMi4xNTkgMS42NDZjLjEgMS4wOTguMTkgMi4xOTguMjcgMy4yOTguMzE1IDQuNC40NjMgOC44MjkuMzYgMTMuMjU1YTE2Ni40ODkgMTY2LjQ4OSAwIDAxLS44NDMgMTMuMjEzYy0uMDEyLjEyNy0uMDM0LjI5Ny0uMDUzLjQ1NGE3LjU4OSA3LjU4OSAwIDAxLS4wNzIuNDc1bC0uMDQuMjM3LS4wNS4yMzZhMTEuNzYyIDExLjc2MiAwIDAxLS43NCAyLjI4NyAxMS43NTUgMTEuNzU1IDAgMDEtNS4xMTggNS41NyAxMS43MDUgMTEuNzA1IDAgMDEtMy42MjMgMS4yNjNjLS4xNTguMDI0LS4zMTYuMDUyLS40NzUuMDcybC0uNDc3LjA1My0uODIxLjA3MS0xLjY0NC4xMzRjLTEuMDk2LjA4Ni0yLjE5Mi4xNi0zLjI4OC4yM2EyNjAuMDggMjYwLjA4IDAgMDEtNi41NzguMzI1Yy04Ljc3Mi4zMjQtMTcuNTQ2LjIyLTI2LjMxMy0uMzAyYTI0Mi40NTggMjQyLjQ1OCAwIDAxLTMuMjg3LS4yMmwtMS42NDMtLjEyOS0uODIyLS4wNjktLjQxLS4wMzUtLjIwNi0uMDE4Yy0uMDY4LS4wMDYtLjEzMy0uMDEtLjIxOC0uMDJhMTEuNTY2IDExLjU2NiAwIDAxLTMuNy0uOTkyIDExLjczMiAxMS43MzIgMCAwMS01LjQ5Ny01LjE3OCAxMS43MyAxMS43MyAwIDAxLTEuMjE1LTMuNjI3Yy0uMDI0LS4xNTgtLjA1MS0uMzE2LS4wNjctLjQ3NWwtLjAyNi0uMjM4LS4wMTMtLjExOS0uMDEtLjEwMy0uMDctLjgyMy0uMTMyLTEuNjQ4YTE5MC42MzcgMTkwLjYzNyAwIDAxLS4yMi0zLjI5OGMtLjI1Ni00LjM5OS0uMzU4LTguODE3LS4yNTgtMTMuMjMzLjA5OS00LjQxMi4zNzItOC44MTEuNzg4LTEzLjE5N2ExMS42NSAxMS42NSAwIDAxMy4wMzktNi44MzUgMTEuNTg1IDExLjU4NSAwIDAxNi41NzItMy41NjNjLjE1Ny0uMDIzLjMxMi0uMDUxLjQ3LS4wN2wuNDctLjA1LjgyLS4wNyAxLjY0My0uMTNhMjI4LjQ5MyAyMjguNDkzIDAgMDE2LjY0Ny0uNDA1bC0uMDQxLS4wNWE4OC4xNDUgODguMTQ1IDAgMDEtMi4xNTQtMi44NjdsLS41Mi0uNzMtLjI1OC0uMzY2Yy0uMDg2LS4xMjItLjE3My0uMjQ0LS4yNDYtLjM3NmEyLjc0IDIuNzQgMCAwMS0uMzEyLS44ODEgMi44MDggMi44MDggMCAwMS4wNC0xLjEzOCAzLjk5OCAzLjk5OCAwIDAxNC4yMi0zLjA3NyAyLjggMi44IDAgMDExLjA5My4zMTNjLjI5NC4xNTUuNTM4LjM0Ny43NDIuNTY4LjEwMi4xMS4xOS4yMy4yOC4zNWwuMjcuMzU5LjUzMi43MmE4OC4wNTkgODguMDU5IDAgMDEyLjA2IDIuOTM2IDczLjAzNiA3My4wMzYgMCAwMTEuOTI5IDMuMDNjLjE4Ny4zMTMuMzczLjYyOC41NTYuOTQ1IDIuNzI0LS4wNDcgNS40NDctLjA1NiA4LjE3LS4wMzguNzQ4LjAwNiAxLjQ5Ni4wMTUgMi4yNDQuMDI2LjE4LS4zMTMuMzY0LS42MjQuNTQ5LS45MzRhNzMuMjgxIDczLjI4MSAwIDAxMS45My0zLjAzIDg4LjczNyA4OC43MzcgMCAwMTIuMDU5LTIuOTM1bC41MzMtLjcyLjI2OC0uMzU5Yy4wOS0uMTIuMTc5LS4yNC4yODEtLjM1YTIuOCAyLjggMCAwMTEuODM0LS44ODF6TTMwLjEzIDM0LjYzMWE0IDQgMCAwMC0uNDE4IDEuNDIgOTEuMTU3IDkxLjE1NyAwIDAwLS40NDYgOS4xMjhjMCAyLjgyOC4xMjEgNS42NTYuMzY0IDguNDgzbC4xMSAxLjIxMmE0IDQgMCAwMDUuODU4IDMuMTQzYzIuODItMS40OTggNS41NS0zLjAzMyA4LjE5My00LjYwNmExNzcuNDEgMTc3LjQxIDAgMDA1Ljg5Ni0zLjY2NmwxLjQzNC0uOTQyYTQgNCAwIDAwLjA0Ny02LjYzMiAxMzcuNzAzIDEzNy43MDMgMCAwMC03LjM3Ny00LjcwOCAxNDYuODggMTQ2Ljg4IDAgMDAtNi44NzktMy44NDlsLTEuNC0uNzI1YTQgNCAwIDAwLTUuMzgyIDEuNzQyeiIgaWQ9InBpZC02NC1zdmdvLWQiPjwvcGF0aD48ZmlsdGVyIHg9Ii0xNS40JSIgeT0iLTE2LjMlIiB3aWR0aD0iMTMwLjklIiBoZWlnaHQ9IjEzMi41JSIgZmlsdGVyVW5pdHM9Im9iamVjdEJvdW5kaW5nQm94IiBpZD0icGlkLTY0LXN2Z28tYyI+PGZlT2Zmc2V0IGR5PSIyIiBpbj0iU291cmNlQWxwaGEiIHJlc3VsdD0ic2hhZG93T2Zmc2V0T3V0ZXIxIj48L2ZlT2Zmc2V0PjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjEiIGluPSJzaGFkb3dPZmZzZXRPdXRlcjEiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMSI+PC9mZUdhdXNzaWFuQmx1cj48ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMyAwIiBpbj0ic2hhZG93Qmx1ck91dGVyMSIgcmVzdWx0PSJzaGFkb3dNYXRyaXhPdXRlcjEiPjwvZmVDb2xvck1hdHJpeD48ZmVPZmZzZXQgaW49IlNvdXJjZUFscGhhIiByZXN1bHQ9InNoYWRvd09mZnNldE91dGVyMiI+PC9mZU9mZnNldD48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIzLjUiIGluPSJzaGFkb3dPZmZzZXRPdXRlcjIiIHJlc3VsdD0ic2hhZG93Qmx1ck91dGVyMiI+PC9mZUdhdXNzaWFuQmx1cj48ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMiAwIiBpbj0ic2hhZG93Qmx1ck91dGVyMiIgcmVzdWx0PSJzaGFkb3dNYXRyaXhPdXRlcjIiPjwvZmVDb2xvck1hdHJpeD48ZmVNZXJnZT48ZmVNZXJnZU5vZGUgaW49InNoYWRvd01hdHJpeE91dGVyMSI+PC9mZU1lcmdlTm9kZT48ZmVNZXJnZU5vZGUgaW49InNoYWRvd01hdHJpeE91dGVyMiI+PC9mZU1lcmdlTm9kZT48L2ZlTWVyZ2U+PC9maWx0ZXI+PC9kZWZzPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgb3BhY2l0eT0iLjgiPjxtYXNrIGlkPSJwaWQtNjQtc3Znby1iIiBmaWxsPSIjZmZmIj48dXNlIHhsaW5rOmhyZWY9IiNwaWQtNjQtc3Znby1hIj48L3VzZT48L21hc2s+PGcgbWFzaz0idXJsKCNwaWQtNjQtc3Znby1iKSI+PHVzZSBmaWxsPSIjMDAwIiBmaWx0ZXI9InVybCgjcGlkLTY0LXN2Z28tYykiIHhsaW5rOmhyZWY9IiNwaWQtNjQtc3Znby1kIj48L3VzZT48dXNlIGZpbGw9IiNGRkYiIHhsaW5rOmhyZWY9IiNwaWQtNjQtc3Znby1kIj48L3VzZT48L2c+PC9nPjwvc3ZnPg==">',
        switch: autoPlayNextVideo.value,
        onSwitch: function (item, $dom, event) {
          const nextState = !item.switch

          autoPlayNextVideo.value = nextState

          // 改变提示文本
          item.tooltip = nextState ? '开启' : '关闭'

          // 改变按钮状态
          return nextState
        }
      }
    ],
    controls: [
      {
        position: 'right',
        html: hiddenTools.value ? hiddenIcon : notHiddenIcon,
        click: function (_, event) {
          hiddenTools.value = !hiddenTools.value
          event.target.parentNode.parentNode.innerHTML = hiddenTools.value ? hiddenIcon : notHiddenIcon
        }
      }
      //   {
      //     name: 'video-list',
      //     position: 'right',
      //     html: videoListIcon,
      //     selector: fileList.value,
      //     onSelect: function (item, $dom) {
      //       initArtPlayer(item.html, item.url)
      //       return videoListIcon
      //     }
      //   }
    ]
  }

  art = new Artplayer(options)
  let domElement = document.querySelector('.artplayer-app')
  let domCreate = domElement.firstChild
  let domItem = document.createElement('div')
  domItem.id = 'userName'
  domItem.setAttribute('class', 'resize-drag')
  // 从父组件传过来的水印内容
  domItem.innerText = globalStore.userInfo.real_name
  domItem.style.cssText =
    'position:absolute;top:100px;right:150px; color:#e6984d;font-size:40px;opacity:0.5;padding-top:10px;z-index:999;font-style:italic'
  domCreate.appendChild(domItem)
  art.on('error', count => {
    if (count === 5) {
      ElMessage.warning({
        title: '提示',
        message: '加载视频失败, 可能浏览器不支持此视频格式的解码，可尝试使用本地播放器打开',
        duration: 5000,
        showClose: true,
        grouping: true
      })
    }
  })

  art.on('destory', () => {})
}
</script>

<style scoped lang="scss">
.artplayer-app {
  height: 70vh;
}
.video_container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
