<template>
  <Dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :fullscreen="false"
    :default-fullscreen="true"
    :before-close="handleBeforeClose"
  >
    <iframe
      v-if="src"
      :src="src"
      class="block h-[calc(100vh-110px)] w-full border-none"
      allowfullscreen="true"
    ></iframe>
  </Dialog>
</template>
<script lang="ts" setup>
import { getRefreshToken, getTenantId } from '@/utils/auth'

/** UReport2 设计器、预览弹窗 */
defineOptions({ name: 'UReportFrame' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const frameType = ref<'design' | 'preview'>('design') // 弹窗的类型：design - 新建、设计；preview - 预览
const src = ref('') // iframe 地址

/** 数据库存储的模板名称前缀，与后端 UReport2DatabaseReportProvider.PREFIX 一致 */
const FILE_PREFIX = 'db:'

/**
 * 构建 UReport2 页面地址
 *
 * 1. token、tenantId：UReport2 会透传给页面内的后续请求。使用 getRefreshToken() 方法，而不使用 getAccessToken() 方法的原因：iframe 内无法方便的刷新访问令牌
 * 2. _u：模板文件。存储前缀不编码，模板名称按入口编码不同的次数；新建时不传递，打开空白模板
 *    - designer 设计器：编码两次。设计器页面读取地址栏中未解码的 _u，加载模板时再经表单提交编码一次，随后 Servlet 解码一次、ReportUtils 解码两次
 *    - preview 预览页：编码三次。Servlet 解码一次后，BaseServletAction.decode 再解码两次；预览页内的分页、打印、导出请求，直接复用地址栏中的 _u
 */
const buildSrc = (path: 'designer' | 'preview', name?: string) => {
  const params = new URLSearchParams({ token: getRefreshToken() || '' })
  const tenantId = getTenantId()
  if (tenantId) {
    params.set('tenantId', String(tenantId))
  }
  let url = import.meta.env.VITE_BASE_URL + '/ureport/' + path + '?' + params.toString()
  if (name) {
    let fileName = encodeURIComponent(encodeURIComponent(name))
    if (path === 'preview') {
      fileName = encodeURIComponent(fileName) // 预览页多编码一次，原因见上方说明
    }
    url += '&_u=' + FILE_PREFIX + fileName
  }
  return url
}

/** 打开弹窗 */
const open = (type: 'design' | 'preview', name?: string) => {
  frameType.value = type
  if (type === 'preview') {
    dialogTitle.value = '预览：' + name
    src.value = buildSrc('preview', name)
  } else {
    dialogTitle.value = name ? '设计：' + name : '新建报表'
    src.value = buildSrc('designer', name)
  }
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 关闭弹窗：设计器中未保存的内容会丢失，所以需要二次确认；关闭后刷新列表，展示设计器中保存的模板 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const handleBeforeClose = async (done: () => void) => {
  if (frameType.value === 'design') {
    try {
      await message.confirm('关闭后，设计器中未保存的内容将丢失，是否确认关闭？')
    } catch {
      return
    }
  }
  done()
  src.value = ''
  if (frameType.value === 'design') {
    emit('success')
  }
}
</script>
