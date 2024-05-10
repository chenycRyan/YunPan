<template>
  <div class="news-container">
    <div class="top-main">
      <div class="header-close" @click="goBack">
        <el-icon><Back /></el-icon>
        <span class="header-close-text">返回</span><span class="header-line"></span>
      </div>
      <div class="header-wrapper"><div data-v-1a88ca70="">公告</div></div>
    </div>
    <div class="main-content">
      <div class="notice-content">
        <div class="title">
          <h1>{{ title }}</h1>
          <p>创建时间 {{ createdTime }}</p>
        </div>
        <div class="divider"></div>
        <div class="editor-content editor-content-view" v-html="noticeContent"></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { getDetail, readMsg } from '@/api/modules/sysMsg.ts'

const route = useRoute()
const router = useRouter()
let title = ref('')
let noticeContent = ref('')
let createdTime = ref('')
let origin = ref('')
onMounted(() => {
  let noticeId = route.query.noticeId
  origin.value = route.query.origin
  getPage(noticeId)
})
const goBack = () => {
  origin.value ? router.push(origin.value) : router.back()
}
const getPage = noticeId => {
  getDetail(noticeId).then(res => {
    title.value = res.title
    noticeContent.value = res.content
    createdTime.value = res.createdTime
    readMsg(noticeId)
  })
}
</script>

<style src="./editor.scss"></style>
<style lang="scss" scoped>
.news-container {
  color: #666;
  font-size: 14px;
  background: #f9f9f9;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
.top-main {
  // background: #1b1b1b;
  background: #fff;
  box-shadow: 0 1px 5px 0 rgb(51 51 51 / 14%);
  display: flex;
  height: 44px;
  justify-content: flex-start;
  line-height: 44px;
  padding-left: 16px;
  padding-right: 16px;
  position: relative;
  z-index: 500;
  .icon-font {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
  }
  .header-close {
    align-items: center;
    cursor: pointer;
    display: flex;
    margin-right: 16px;
    .header-close-text {
      font-size: 14px;
      padding: 0 16px 0 8px;
      color: #2fd3a1;
    }
    .header-line {
      background-color: #f2f2f2;
      height: 16px;
      width: 1px;
    }
  }
  .header-wrapper {
    color: #333;
    flex: 1;
    font-size: 16px;
    font-weight: 500;
  }
  .item {
    padding: 20px 5px;
    text-align: center;
    display: inline-block;
    width: 120px;
    color: white;
    cursor: default;
    &:first-child {
      &:after {
        content: '|';
        margin-left: 25px;
        color: rgb(163, 163, 163);
      }
    }
    &:hover {
      color: #eee;
    }
  }
}
.main-content {
  height: calc(100vh - 44px);
  background: #f8f8f8;
  box-sizing: border-box;
  margin: 0 auto;
  overflow: auto;
  padding-top: 8px;
  width: 100%;

  .title {
    text-align: center;
    h1 {
      padding-bottom: 10px;
    }
    p {
      color: #999;
    }
  }
  .divider {
    display: block;
    height: 1px;
    width: 100%;
    margin: 24px 0;
    background-color: #dcdfe6;
    position: relative;
    box-sizing: border-box;
  }
  .notice-content {
    background: #fff;
    min-height: 100%;
    margin: 0 auto;
    width: 1041px;
    padding: 32px;
    .editor-content {
      width: 100% !important;
      padding: 0 !important;
      border: none !important;
      height: auto !important;
      overflow: auto;
    }
  }
}
</style>
