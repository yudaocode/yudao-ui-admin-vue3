<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-scrollbar height="600px">
      <pre><code v-dompurify-html="highlightedCode()" class="hljs"></code></pre>
    </el-scrollbar>
  </Dialog>
</template>

<script setup lang="ts">
import hljs from 'highlight.js' // 导入代码高亮文件
import 'highlight.js/styles/github.css' // 导入代码高亮样式
import json from 'highlight.js/lib/languages/json'
import { ThingModelApi } from '@/api/iot/thingmodel'
import { ProductVO } from '@/api/iot/product/product'
import { IOT_PROVIDE_KEY } from '@/views/iot/utils/constants'

defineOptions({ name: 'ThingModelTSL' })

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('物模型 TSL') // 弹窗的标题
const product = inject<Ref<ProductVO>>(IOT_PROVIDE_KEY.PRODUCT) // 注入产品信息

/** 打开弹窗 */
const open = () => {
  dialogVisible.value = true
}
defineExpose({ open })

/** 获取 TSL */
const thingModelTSL = ref('')
const getTsl = async () => {
  const res = await ThingModelApi.getThingModelTSLByProductId(product?.value?.id || 0)
  thingModelTSL.value = JSON.stringify(res, null, 2)
}

/** 代码高亮 */
const highlightedCode = () => {
  // TODO @puhui999：可以考虑 highlight 的告警解决下；另外，可以考虑配置设置里面，有个 json editor 预览
  const result = hljs.highlight('json', thingModelTSL.value, true)
  return result.value || '&nbsp;'
}

/** 初始化 **/
onMounted(async () => {
  // 注册代码高亮的各种语言
  hljs.registerLanguage('json', json)
  await getTsl()
})
</script>
