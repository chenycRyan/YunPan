<template>
  <div class="home">
    <!-- <img class="home-bg" src="@/assets/images/welcome.png" alt="welcome" /> -->
    <div class="user_info display_vertical_center pd_ri_lf24">
      <img src="@/assets/images/avatar.gif" alt="user" />
      <div class="info_text ml_24">
        <div class="text_top">{{ userInfo?.real_name }} 你好，欢迎使用汇博云盘</div>
        <div class="text_bottom">最新消息：新增访问记录，收藏记录，分享记录...</div>
      </div>
    </div>
    <div class="quick_navaigation">
      <div class="navaigation_item" @click="gotoMyShare('my_file')">
        <div class="center_box">
          <el-icon color="#007BD3" :size="52"><Files /></el-icon>
          <div>我的文件</div>
        </div>
      </div>
      <div class="navaigation_item" @click="gotoMyShare('my_share')">
        <div class="center_box">
          <el-icon color="#FFC069" :size="52"><Share /></el-icon>
          <div>我的分享</div>
        </div>
      </div>
      <div class="navaigation_item" @click="gotoMyShare('my_browser')">
        <div class="center_box">
          <el-icon color="#64D9D6" :size="52"><View /></el-icon>
          <div>我的浏览</div>
        </div>
      </div>
      <div class="navaigation_item" @click="gotoMyShare('my_star')">
        <div class="center_box">
          <el-icon color="#95E0FE" :size="52"><StarFilled /></el-icon>
          <div>我的收藏</div>
        </div>
      </div>
      <div class="navaigation_item" @click="gotoMyShare('my_trashed')">
        <div class="center_box">
          <el-icon color="#95DE64" :size="52"><Delete /></el-icon>
          <div>回收站</div>
        </div>
      </div>
    </div>
    <div class="data-display">
      <div class="dataDisplay_time">
        <div class="times-title pd_ri_lf24">
          <div>访问次数记录</div>
          <el-tag class="ml-2">周</el-tag>
        </div>
        <hr style="border-color: #ffffff" />
        <div id="browse_times"></div>
      </div>
      <div class="dataDisplay_time">
        <div class="times-title pd_ri_lf24">
          <div>收藏次数记录</div>
          <el-tag class="ml-2" type="warning">周</el-tag>
        </div>
        <hr style="border-color: #ffffff" />
        <div id="collect_times"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="home">
import * as echarts from 'echarts'
// import router from "@/routers"
import { useRouter } from 'vue-router'
import { GlobalStore } from '@/stores'
import { browserHistoryDate, starHistoryDate } from '@/api/modules/file'
const router = useRouter()
const globalStore = GlobalStore()
let browerCharts: echarts.ECharts
let collectCharts: echarts.ECharts
let userInfo = ref()
onMounted(async () => {
  console.log(globalStore.userInfo)
  userInfo.value = globalStore.userInfo
  userInfo.value.avatar = '@/assets/images/avatar.gif'
  let browserRes = await browserHistoryDate()
  let starRes = await starHistoryDate()
  console.log(browserRes, starRes)
  if (browserRes && browserRes.length) {
    browserOptions.series[0].data = browserRes.map((ele: { value: number; key: string }) => ele.value).reverse()
    browserOptions.xAxis[0].data = browserRes.map((ele: { value: number; key: string }) => ele.key).reverse()
  } else {
    browserOptions.series[0].data = []
    browserOptions.xAxis[0].data = []
  }
  if (starRes && starRes.length) {
    collectOptions.series[0].data = starRes.map((ele: { value: number; key: string }) => ele.value).reverse()
    collectOptions.xAxis[0].data = starRes.map((ele: { value: number; key: string }) => ele.key).reverse()
  } else {
    collectOptions.series[0].data = []
    collectOptions.xAxis[0].data = []
  }

  echartsForm()
})
let timesOption = {
  grid: {
    // 让图表占满容器
    top: '10px',
    left: '40px',
    right: '40px',
    bottom: '40px'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: [
    {
      type: 'category',
      data: ['00:00', '00:02', '00:04', '00:06', '00:08', '00:10', '00:12', '00:14'],
      splitLine: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        interval: 0,
        textStyle: {
          color: '#333'
        },
        margin: 15
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        textStyle: {
          color: '#333'
        }
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: '#dadada'
        }
      }
    }
  ],
  series: [
    {
      name: '浏览量统计',
      type: 'line',
      data: [13, 10, 8, 12, 15, 14, 10, 13],
      symbolSize: 6,
      symbol: 'circle',
      lineStyle: {
        color: '#049aeb'
      },
      itemStyle: {
        normal: {
          color: '#DCF2FF',
          borderColor: '#3CC69B'
        }
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: '#06A7FF'
          },
          {
            offset: 0.6,
            color: '#3ab7fb'
          },
          {
            offset: 1,
            color: '#ddece8ed'
          }
        ])
      }
    }
  ]
}
let browserOptions = JSON.parse(JSON.stringify(timesOption))
let collectOptions = JSON.parse(JSON.stringify(timesOption))
const removeEvent = () => {
  browerCharts.resize()
  collectCharts.resize()
}
const echartsForm = () => {
  // 访问次数折线图
  browerCharts = echarts.init(document.getElementById('browse_times'))
  browerCharts.setOption(browserOptions)
  // 收藏次数折线图
  collectCharts = echarts.init(document.getElementById('collect_times'))
  collectOptions.series[0].lineStyle.color = '#E6A23C'
  collectOptions.series[0].areaStyle.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: '#e3a74d'
    },
    {
      offset: 0.6,
      color: '#e1b065'
    },
    {
      offset: 1,
      color: '#e1b879'
    }
  ])
  collectCharts.setOption(collectOptions)
  window.addEventListener('resize', removeEvent)
}
const emits = defineEmits(['my_file', 'my_share', 'my_browser', 'my_star', 'my_trashed'])
async function gotoMyShare(params: string) {
  switch (params) {
    case 'my_file':
      emits('my_file')
      break
    case 'my_share':
      emits('my_share')
      break
    case 'my_browser':
      emits('my_browser')
      break
    case 'my_star':
      emits('my_star')
      break
    case 'my_trashed':
      emits('my_trashed')
      break
    default:
      break
  }
  await nextTick()
}
</script>

<style scoped lang="scss">
@import './index.scss';
</style>
