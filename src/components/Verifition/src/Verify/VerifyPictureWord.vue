<template>
  <div style="position: relative">
    <div class="verify-img-out">
      <div
        :style="{
          width: setSize.imgWidth,
          height: setSize.imgHeight,
          'background-size': setSize.imgWidth + ' ' + setSize.imgHeight,
          'margin-bottom': vSpace + 'px'
        }"
        class="verify-img-panel"
      >
        <div v-show="showRefresh" class="verify-refresh" style="z-index: 3" @click="refresh">
          <i class="iconfont icon-refresh"></i>
        </div>
        <img
          @click="refresh"
          ref="canvas"
          :src="'data:image/png;base64,' + verificationCodeImg"
          alt=""
          style="display: block; width: 100%; height: 100%"
        />
      </div>
    </div>
    <div
      :style="{
        width: setSize.imgWidth,
        color: barAreaColor,
        'border-color': barAreaBorderColor
        // 'line-height': barSize.height
      }"
      class="verify-bar-area"
    >
      <div class="verify-msg">{{ text }}</div>
      <div
        :style="{
          'line-height': barSize.height
        }"
      >
        <input class="verify-input" type="text" v-model="userCode" />
      </div>
      <button type="button" class="verify-btn" @click="submit" :disabled="checking">{{
        t('captcha.verify')
      }}</button>
    </div>
  </div>
</template>
<script setup type="text/babel">
/**
 * VerifyPictureWord
 * @description 输入文字
 * */
import { resetSize } from '../utils/util'
import { aesEncrypt } from '../utils/ase'
import { getCode, reqCheck } from '@/api/login'
import { getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs } from 'vue'

const props = defineProps({
  // 弹出式 pop，固定 fixed
  mode: {
    type: String,
    default: 'fixed'
  },
  captchaType: {
    type: String
  },
  // 间隔
  vSpace: {
    type: Number,
    default: 5
  },
  imgSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '155px'
      }
    }
  },
  barSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '40px'
      }
    }
  }
})

const { t } = useI18n()
const { mode, captchaType } = toRefs(props)
const { proxy } = getCurrentInstance()
let secretKey = ref(''), // 后端返回的ase加密秘钥
  userCode = ref(''), // 用户输入的验证码 暂存至pointJson，无需加密
  verificationCodeImg = ref(''), // 后端获取到的背景图片
  backToken = ref(''), // 后端返回的token值
  setSize = reactive({
    imgHeight: 0,
    imgWidth: 0,
    barHeight: 0,
    barWidth: 0
  }),
  text = ref(''),
  barAreaColor = ref('#000'),
  barAreaBorderColor = ref('#ddd'),
  showRefresh = ref(true),
  // bindingClick = ref(true)
  checking = ref(false)

const init = () => {
  // 加载页面
  getPicture()
  nextTick(() => {
    let { imgHeight, imgWidth, barHeight, barWidth } = resetSize(proxy)
    setSize.imgHeight = imgHeight
    setSize.imgWidth = imgWidth
    setSize.barHeight = barHeight
    setSize.barWidth = barWidth
    proxy.$parent.$emit('ready', proxy)
  })
}
onMounted(() => {
  // 禁止拖拽
  init()
  proxy.$el.onselectstart = function () {
    return false
  }
})
const canvas = ref(null)

const submit = () => {
  checking.value = true
  // 发送后端请求
  const captchaVerification = secretKey.value
    ? aesEncrypt(backToken.value + '---' + userCode.value, secretKey.value)
    : backToken.value + '---' + userCode.value
  let data = {
    captchaType: captchaType.value,
    pointJson: userCode.value,
    token: backToken.value
  }
  reqCheck(data).then((res) => {
    if (res.repCode === '0000') {
      barAreaColor.value = '#4cae4c'
      barAreaBorderColor.value = '#5cb85c'
      text.value = t('captcha.success')
      // bindingClick.value = false
      if (mode.value === 'pop') {
        setTimeout(() => {
          proxy.$parent.clickShow = false
          refresh()
        }, 1500)
      }
      proxy.$parent.$emit('success', { captchaVerification })
    } else {
      proxy.$parent.$emit('error', proxy)
      barAreaColor.value = '#d9534f'
      barAreaBorderColor.value = '#d9534f'
      text.value = t('captcha.fail')
      setTimeout(() => {
        refresh()
      }, 700)
    }
    checking.value = false
  })
}

const refresh = async function () {
  barAreaColor.value = '#000'
  barAreaBorderColor.value = '#ddd'
  checking.value = false

  userCode.value = ''

  await getPicture()
  showRefresh.value = true
}

// 请求背景图片和验证图片
const getPicture = async () => {
  let data = {
    captchaType: captchaType.value
  }
  const res = await getCode(data)
  if (res.repCode === '0000') {
    verificationCodeImg.value = res.repData.originalImageBase64
    backToken.value = res.repData.token
    secretKey.value = res.repData.secretKey
    text.value = t('captcha.code')
  } else {
    text.value = res.repMsg
  }
}
</script>
