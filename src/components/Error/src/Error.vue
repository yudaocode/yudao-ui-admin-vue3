<script lang="ts" setup>
import pageError from '@/assets/svgs/404.svg'
import networkError from '@/assets/svgs/500.svg'
import noPermission from '@/assets/svgs/403.svg'

defineOptions({ name: 'Error' })

interface ErrorMap {
  url: string
  message: string
  buttonText: string
}

const { t } = useI18n()

// 文案随语言切换更新：不刷新页面切换语言后，错误页提示与按钮也使用新语言
const errorMap = computed<Record<string, ErrorMap>>(() => ({
  '404': {
    url: pageError,
    message: t('error.pageError'),
    buttonText: t('error.returnToHome')
  },
  '500': {
    url: networkError,
    message: t('error.networkError'),
    buttonText: t('error.returnToHome')
  },
  '403': {
    url: noPermission,
    message: t('error.noPermission'),
    buttonText: t('error.returnToHome')
  }
}))

// 原生运行时 props 声明，保留取值范围的运行时校验与默认 404
const props = defineProps({
  type: {
    type: String,
    default: '404',
    validator: (v: string) => ['404', '500', '403'].includes(v)
  }
})

const emit = defineEmits(['errorClick'])

const btnClick = () => {
  emit('errorClick', props.type)
}
</script>

<template>
  <div class="flex justify-center">
    <div class="text-center">
      <img :src="errorMap[type].url" alt="" width="350" />
      <div class="text-14px text-[var(--el-color-info)]">{{ errorMap[type].message }}</div>
      <div class="mt-20px">
        <el-button type="primary" @click="btnClick">{{ errorMap[type].buttonText }}</el-button>
      </div>
    </div>
  </div>
</template>
