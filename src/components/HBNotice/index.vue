<template>
  <el-badge :value="badge">
    <el-popover placement="bottom" trigger="hover" width="300px">
      <template #reference>
        <el-icon class="bell_icon"> <Bell /></el-icon>
      </template>
      <el-tabs v-model="activeName">
        <el-tab-pane label="通知" name="notice">
          <div class="notice-list">
            <el-scrollbar height="300px">
              <ul v-if="list.length > 0">
                <li
                  v-for="(item, index) in list"
                  :key="index"
                  @click="showDetail(item.id)"
                  :class="{ tip: item.alreadyReadFlag === false, notip: item.alreadyReadFlag }"
                >
                  <div class="notice-text" v-html="item.title" />
                </li>
              </ul>
              <span v-else>暂无通知</span>
            </el-scrollbar>
          </div>
        </el-tab-pane>
      </el-tabs>
      <div class="notice-clear" @click="handleReadNotice">
        <el-button link> 全部已读 </el-button>
      </div>
    </el-popover>
  </el-badge>
</template>
<script setup>
import { getMsgPage, readAll } from '@/api/modules/sysMsg.ts'
import { ElMessage } from 'element-plus'
let list = ref([])
let badge = ref(0)
let activeName = ref('notice')
const router = useRouter()
const route = useRoute()
const handleReadNotice = () => {
  readAll().then(() => {
    ElMessage.success('已将消息全部设置为已读状态')
    fetchData()
  })
}
onMounted(() => {
  fetchData()
})
const fetchData = async () => {
  getMsgPage({ size: 1000, sort: 'createdTime,DESC' }).then(res => {
    list.value = res.content.map(item => {
      return Object.assign({}, item, {
        email: '@email',
        image: 'https://i.gtimg.cn/club/item/face/img/8/15918_100.gif'
      })
    })
    const unreadList = list.value.filter(item => item.alreadyReadFlag === false)
    badge.value = unreadList.length === 0 ? '' : unreadList.length
  })
}

const showDetail = id => {
  router.push({
    path: '/notice',
    query: {
      noticeId: id,
      origin: route.fullPath
    }
  })
}
</script>
<style lang="scss" scoped>
.bell_icon {
  margin-right: 15px;
  margin-top: 2px;
  font-size: 18px;
  display: block;
}
:deep() {
  .el-badge__content.is-fixed {
    right: calc(14px + var(--el-badge-size) / 2);
  }
  .el-badge__content--primary {
    background-color: var(--el-badge-background-color) !important;
  }
  .el-tabs__active-bar {
    min-width: 28px;
  }
}
.notice-list {
  height: auto;
  min-height: 100px;
  ul {
    padding: 0 15px 0 0;
    margin: 0;
    li {
      display: flex;
      align-items: center;
      padding: 10px 0 10px 0;
      border-bottom: 1px solid #ebebeb;

      cursor: pointer;
      &:last-child {
        border: none;
        margin-bottom: 10px;
      }
      .notice-text {
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      ::deep() {
        .el-avatar {
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }
      }
      &.tip:before {
        content: '';
        width: 5px;
        height: 5px;
        background: #f73838;
        border-radius: 50%;
        display: inline-block;
        margin: 0 10px 0 10px;
        position: relative;
        top: -2px;
      }
      &.notip {
        padding-left: 24px;
      }
    }
  }
}

.notice-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0 0 0;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  border-top: 1px solid #e8eaec;

  i {
    margin-right: 3px;
  }
}
</style>
