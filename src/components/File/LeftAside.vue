<template>
  <el-aside class="aside">
    <div class="aside-line" :class="{ active: cIndex == 0 }" @click="handleHomePage">
      <el-icon><HomeFilled /></el-icon>
      <span>主页</span>
    </div>
    <div class="aside-line" :class="{ active: cIndex == 1 }" @click="handleBackHome">
      <el-icon v-show="isCollapse" @click="isCollapse = !isCollapse"><CaretRight /></el-icon>
      <el-icon v-show="!isCollapse" @click="isCollapse = !isCollapse"><CaretBottom /></el-icon>
      <span>我的文件</span>
    </div>

    <!-- <ul v-show="!isCollapse">
      <li @click="handleFilterFile('PICTURE')"><svg-icon name="PICTURE"></svg-icon> 图片</li>
      <li @click="handleFilterFile('DOCUMENT')"><svg-icon name="DOCUMENT"></svg-icon>文档</li>
      <li @click="handleFilterFile('VIDEO')"><svg-icon name="VIDEO"></svg-icon>视频</li>
      <li @click="handleFilterFile('OTHER')"><svg-icon name="OTHER"></svg-icon>其他</li>
    </ul> -->
    <div class="aside-line" :class="{ active: cIndex == 6 }" @click="handlePublicFile">
      <el-icon><FolderOpened /></el-icon>
      <span>公有文件</span>
    </div>
    <div class="aside-line" :class="{ active: cIndex == 2 }" @click="handleShare">
      <el-icon><Share /></el-icon>
      <span>我的分享</span>
    </div>
    <div class="aside-line" :class="{ active: cIndex == 3 }" @click="handleBrowser">
      <el-icon><View /></el-icon>
      <span>我的足迹</span>
    </div>
    <div class="aside-line" :class="{ active: cIndex == 4 }" @click="handleStar">
      <el-icon><StarFilled /></el-icon>
      <span>我的收藏</span>
    </div>
    <div class="aside-line" :class="{ active: cIndex == 5 }" @click="handleRecycle">
      <el-icon><Delete /></el-icon>
      <span>回收站</span>
    </div>
  </el-aside>
</template>
<script setup>
const emits = defineEmits(['homePage', 'filterFile', 'backHome', 'recycle', 'browser', 'Star', 'share', 'publicFile'])
const isCollapse = ref(false)
let cIndex = ref(0)
const handleFilterFile = type => {
  emits('filterFile', type)
}
onMounted(() => {
  cIndex.value = sessionStorage.getItem('cIndex') || 0

  switch (cIndex.value) {
    case '0':
      handleHomePage()

      break
    case '1':
      handleBackHome()

      break
    case '2':
      handleShare()

      break
    case '3':
      handleBrowser()

      break
    case '4':
      handleStar()

      break
    case '5':
      handleRecycle()

      break
    case '6':
      handlePublicFile()

      break
    default:
      handleHomePage()
      break
  }
})

const handleHomePage = () => {
  sessionStorage.setItem('cIndex', cIndex.value)
  cIndex.value = 0
  emits('homePage')
}
const handleBackHome = () => {
  cIndex.value = 1
  sessionStorage.setItem('cIndex', cIndex.value)
  emits('backHome')
}
const handleShare = () => {
  cIndex.value = 2
  sessionStorage.setItem('cIndex', cIndex.value)
  emits('share')
}
const handleBrowser = () => {
  cIndex.value = 3
  sessionStorage.setItem('cIndex', cIndex.value)
  emits('browser')
}
const handleStar = () => {
  cIndex.value = 4
  sessionStorage.setItem('cIndex', cIndex.value)
  emits('Star')
}
const handleRecycle = () => {
  cIndex.value = 5
  sessionStorage.setItem('cIndex', cIndex.value)
  emits('recycle')
}

const handlePublicFile = () => {
  cIndex.value = 6
  sessionStorage.setItem('cIndex', cIndex.value)
  emits('publicFile')
}

defineExpose({ handleShare, handleRecycle, handleBackHome, handleBrowser, handleStar, handlePublicFile })
</script>
<style lang="scss" scoped>
.aside {
  width: 200px;
  padding: 10px;
  ul {
    width: 100%;
    padding: 0;
    li {
      display: flex;
      align-items: center;
      justify-content: center;
      list-style-type: none;
      height: 40px;
      &:hover {
        background-color: #fafafc;
        border-radius: 12px;
        cursor: pointer;
      }
      svg {
        width: 18px !important;
        height: 18px !important;
        margin-right: 10px;
      }
    }
  }
  .aside-line {
    color: #06a7ff;
    background-color: #fff;
    border-radius: 10px;
    padding: 16px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding-left: 30px;
    span {
      margin-left: 10px;
    }
  }
  .active {
    background-color: #eef9fe;
  }
}
</style>
