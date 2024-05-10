<template>
  <el-dialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :title="dialogTitle"
    width="30%"
    :before-close="handleClose"
  >
    <el-form :model="ruleForm" label-width="80px" label-position="left">
      <el-form-item label="有效期：">
        <el-radio-group v-model="ruleForm.status">
          <el-radio v-for="item in timeLimit" :key="item.value" :label="item.value"> {{ item.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="提取码：">
        <el-radio-group v-model="ruleForm.type" class="radioGroup">
          <el-radio label="系统随机生成提取码"></el-radio>
          <el-radio label="仅支持数字及英文字母">
            <div class="custom">
              <el-input
                class="w-100"
                oninput="value=value.replace(/[\W]/g,'')"
                :disabled="ruleForm.type !== '仅支持数字及英文字母'"
                maxlength="4"
                v-model="ruleForm.code"
                @blur="verifyCode"
              >
              </el-input>
              <span>仅支持数字及英文字母</span>
            </div>
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <el-button class="btn" type="primary" @click="handleShare">创建链接</el-button>
    <el-divider v-show="showLink"></el-divider>
    <div class="share-box" v-show="showLink">
      <el-alert title="文档分享已开启" type="success" show-icon :closable="false"> </el-alert>
      <div class="flex-center">
        <div class="label">链接：</div>
        <el-input v-model="link" readonly class="mt-10">
          <template #append>
            <el-button v-copy="link">复制</el-button>
          </template>
        </el-input>
      </div>
      <div class="flex-center">
        <div class="label">提取码：</div>
        <el-input v-model="code" readonly class="mt-10">
          <template #append>
            <el-button v-copy="code">复制</el-button>
          </template>
        </el-input>
      </div>
    </div>
  </el-dialog>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { shareFile } from '@/api/modules/share'
import { GlobalStore } from '@/stores'

const globalStore = GlobalStore()
const user_id = computed(() => globalStore.userInfo.user_id)
let dialogVisible = ref(false)
let dialogTitle = ref('直链分享')
let timeLimit = ref([
  {
    value: 'A_DAY',
    label: '一天'
  },
  {
    value: 'SEVEN_DAYS',
    label: '一周'
  },
  {
    value: 'ONE_MONTH',
    label: '一月'
  },
  {
    value: 'PERMANENT',
    label: '永久'
  }
])

const ruleForm = reactive({
  status: 'A_DAY',
  type: '系统随机生成提取码',
  code: null
})
let selectRows = ref<FileSpace.RowItf[]>([])
const initDialog = (row: FileSpace.RowItf[]) => {
  selectRows.value = row
  dialogVisible.value = true
}
let showLink = ref(false)

const verifyCode = () => {}
interface ShareItf {
  id: number
  verCode: string
}
const handleShare = () => {
  const folderList = selectRows.value.filter(item => item.type === 'FOLDER').map(item => item.id)
  const fileList = selectRows.value.filter(item => item.type !== 'FOLDER').map(item => item.id)
  let verCode
  if (ruleForm.type === '系统随机生成提取码') {
    verCode = randomStr()
  } else {
    if (ruleForm.code) verCode = ruleForm.code
    else {
      ElMessage.warning('请输入提取码')
      return
    }
  }

  shareFile<ShareItf>({
    deadTime: getDeadTime(ruleForm.status),
    fileCategoryIds: folderList,
    fileFolderIds: fileList,
    status: ruleForm.status,
    verCode: verCode,
    userId: user_id.value
  }).then(res => {
    setLink(res.id, res.verCode)
    showLink.value = true
    ElMessage.success('创建链接成功！')
  })
}
const handleClose = () => {
  ruleForm.status = 'A_DAY'
  ruleForm.type = '系统随机生成提取码'
  ruleForm.code = null
  showLink.value = false
  link.value = ''
  dialogVisible.value = false
}

let link = ref('')
let code = ref('')
const setLink = (id: number, verCode: string) => {
  link.value = `${window.location.href.split('#')[0]}#/share?id=${id}`
  code.value = verCode
}
//随机生成四位字母和数字组成的验证码
const randomStr = () => {
  //创建一个空字符，用于存放随机数/字母
  let strData = ''
  //生成随机字符库 (验证码四位，随机数三种，取公倍数12,所以循环4次。也可以是120次，1200次。)
  for (let i = 0; i < 4; i++) {
    let num = random(0, 9) //生成0-9的随机数
    let az = String.fromCharCode(random(97, 122)) //生成a-z
    let AZ = String.fromCharCode(random(65, 90)) //生成A-Z

    strData = strData + num + az + AZ //将生成的字符进行字符串拼接
  }
  // 开始真正的随机(从随机字符库中随机取出四个)
  let str = ''
  for (let i = 0; i < 4; i++) {
    str += strData[random(0, strData.length - 1)]
  }
  // console.log(str)
  return str
}
// 范围随机数
const random = (max: number, min: number) => {
  return Math.round(Math.random() * (max - min) + min)
}
//根据类型计算截止时间

const getDeadTime = (type: string) => {
  const noTime = new Date().getTime()
  let interval = 0
  let time
  switch (type) {
    case 'A_DAY':
      interval = 1000 * 60 * 60 * 24
      time = dayjs(noTime + interval).format('YYYY-MM-DD HH:mm:ss')
      break
    case 'SEVEN_DAYS':
      interval = 1000 * 60 * 60 * 24 * 7
      time = dayjs(noTime + interval).format('YYYY-MM-DD HH:mm:ss')
      break
    case 'ONE_MONTH':
      interval = 1000 * 60 * 60 * 24 * 31
      time = dayjs(noTime + interval).format('YYYY-MM-DD HH:mm:ss')

      break

    default:
      time = '9999-12-31 23:59:59'
      break
  }
  return time
}

defineExpose({ initDialog })
</script>
<style lang="scss" scoped>
.radioGroup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .custom {
    display: flex;
    align-items: center;

    span {
      margin-left: 5px;
      margin-top: 5px;
    }
  }
}
.label {
  width: 70px;
  height: 10px;
  text-align: right;
}
.w-100 {
  width: 100px;
}

.btn {
  margin-left: 80px !important;
  width: 120px;
}
.share-box {
  padding-bottom: 30px;
}
</style>
