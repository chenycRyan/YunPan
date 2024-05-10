<template>
  <div class="not-container" v-loading="authLoading" element-loading-text="加载中...">
    <img v-show="!route.query?.expireDate" src="@/assets/images/error_images/autherror.png" class="not-img" />
    <div class="not-detail">
      <h4>{{ route.query?.expireDate ? '更新授权码!当前授权截止日期：' + route.query.expireDate : '请申请授权码!' }}</h4>
      <!-- <h4>请联系江苏汇博机器人技术股份有限公司</h4> -->
    </div>
    <div class="contact">
      <div class="title">申请授权码</div>
      <el-form
        ref="ruleFormRef"
        :rules="rules"
        label-position="right"
        label-width="140px"
        :model="licenseInfo"
        style="max-width: 560px"
      >
        <el-form-item label="申请用户类型" prop="licenseUserType">
          <el-select v-model="licenseInfo.licenseUserType" style="width: 100%" placeholder="请选择用户类型">
            <el-option v-for="type in userType" :key="type.value" :label="type.name" :value="type.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请用户名称" prop="licenseUser">
          <el-input v-model="licenseInfo.licenseUser" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="设备序号" prop="deviceNo">
          <el-input v-model="licenseInfo.deviceNo" placeholder="第几套设备就填相应数字" />
        </el-form-item>
        <el-form-item label="邮箱(接受授权码)" prop="email">
          <el-input v-model="licenseInfo.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="offline">线下申请</el-button>
          <el-button :disabled="!ifHasNet" type="primary" @click="online">线上申请 (常用)</el-button>
        </el-form-item>
        <div style="min-height: 16px; font-size: 14px">{{ tips }}</div>
      </el-form>
      <div class="auth-bottom">
        <div class="title">系统授权</div>
        <el-input
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 4 }"
          v-model="licenseCode"
          placeholder="请输入授权秘钥"
        ></el-input>
        <el-button class="btn" type="primary" @click="handleAuth">授权</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage, vLoading } from 'element-plus'
import { setLicense, getLicenseCode, getOffLineCode, getConnectFlag } from '@/api/modules/license'
import { useRouter, useRoute } from 'vue-router'
let tips = ref('')
let ifHasNet = ref(true)

let authLoading = ref(false)

// 导出授权码
const exportAuthCode = txt => {
  const filename = `教育资源管理-申请码(${licenseInfo.value.licenseUser}-${licenseInfo.value.deviceNo})`
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt))
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  documentbody.removeChild(element)
}

const router = useRouter()
const route = useRoute()
const licenseInfo = ref({
  licenseUserType: '',
  softwareId: 6,
  licenseUser: '',
  deviceNo: '',
  email: ''
})
let licenseCode = ref('')
const userType = [
  {
    name: '学校',
    value: 'SCHOOL'
  },
  {
    name: '企业',
    value: 'ENTERPRISE'
  },
  {
    name: '个人',
    value: 'PERSON'
  }
]
const rules = {
  licenseUserType: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
  licenseUser: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
  deviceNo: [{ required: true, message: '请输入设备别名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入正确邮箱地址',
      trigger: ['blur', 'change']
    }
  ]
}
let ruleFormRef = ref()
const offline = () => {
  tips.value = '将下载的申请码发送给管理员，等待管理员审核'
  if (!ruleFormRef.value) return false
  authLoading.value = true
  ruleFormRef.value.validate(valid => {
    if (valid) {
      getOffLineCode(licenseInfo.value)
        .then(res => {
          exportAuthCode(res)
          authLoading.value = false
        })
        .catch(() => {
          authLoading.value = false
        })
    } else {
      authLoading.value = false
      ElMessage.warning('请填写必要信息!')
      return false
    }
  })
}
const online = () => {
  tips.value = '等待管理员审核'
  if (!ruleFormRef.value) return false
  authLoading.value = true
  ruleFormRef.value.validate(valid => {
    if (valid) {
      getLicenseCode(licenseInfo.value)
        .then(res => {
          if (res?.code === 1) {
            ElMessage.success(res.msg)
          } else if (res?.code === 0) {
            ElMessage.warning(res.msg)
          }
          authLoading.value = false
        })
        .catch(() => {
          authLoading.value = false
        })
    } else {
      ElMessage.warning('请填写必要信息!')
      authLoading.value = false
      return false
    }
  })
}
const handleAuth = async () => {
  if (!licenseCode.value) return ElMessage.warning('请填先写授权码!!')
  authLoading.value = true
  setLicense({ licenseCode: licenseCode.value })
    .then(res => {
      authLoading.value = false
      if (res === 'EFFECTIVE') {
        ElMessage.success('授权成功')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        const status = {
          NONE: '授权码缺失',
          INVALID: '授权码无效',
          NOT_MATCH: '授权码与软件不匹配',
          EXPIRED: '授权码过期',
          SYSTEM_TIME_INVALID: '系统时间无效',
          DISABLE: '授权码被禁用',
          ONLINES_OVER_LIMIT: '在线人数超限',
          NO_NETWORK: '网络没有连接'
        }
        ElMessage.warning(res ? status[res] : '系统授权异常，请联系管理员！')
      }
    })
    .catch(() => {
      authLoading.value = false
    })
}
onMounted(() => {
  getConnectFlag().then(res => {
    ifHasNet.value = res
  })
})
</script>

<style lang="scss" scoped>
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.4);
}
:deep(.el-input__wrapper) {
  background-color: #f7f7f7 !important;
  box-shadow: none !important;
}
.not-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: url('@/assets/images/error_images/bg.jpg');
  background-size: 100% 100%;
  .auth-drawer {
    .auth-line {
      margin-top: 2vh;
      font-size: 16px;
      line-height: 1.6em;
      .auth-title {
        font-weight: bold;
      }
    }
  }
  .not-img {
    margin-right: 0;
    margin-bottom: 20px;
  }
  h4 {
    color: rgb(255, 123, 0) !important;
    text-align: center;
    font-weight: bold;
    font-size: 19px;
    margin-bottom: 20px;
  }
  .contact {
    min-width: 302px;
    border-top: 1px solid #f07b22;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding-top: 20px;
    .auth-bottom {
      border-top: 1px solid #f07b22;
      padding-top: 20px;
    }
    .concat-img {
      margin-right: 20px;
    }
    .btn {
      margin-top: 10px;
      width: 100%;
    }
    h6 {
      font-size: 18px;
    }
  }
}
:deep(.el-form-item__label) {
  color: #252525;
  font-weight: 600;
}
:deep(.el-form-item__content) {
  justify-content: flex-end;
}
.title {
  color: rgb(255, 123, 0) !important;
  font-size: 18px;
  padding-left: 8px;
  height: 20px;
  line-height: 20px;
  border-left: 6px solid #ff8935;
  margin: 6px 0;
  font-weight: 700;
}
</style>
