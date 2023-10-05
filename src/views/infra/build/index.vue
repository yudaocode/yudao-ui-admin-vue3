<template>
  <ContentWrap>
    <el-row>
      <el-col>
        <div class="float-right mb-2">
          <el-button size="small" type="primary" @click="showJson">生成 JSON</el-button>
          <el-button size="small" type="success" @click="showOption">生成 Options</el-button>
          <el-button size="small" type="danger" @click="showTemplate">生成组件</el-button>
        </div>
      </el-col>
      <!-- 表单设计器 -->
      <el-col>
        <FcDesigner ref="designer" height="780px" />
      </el-col>
    </el-row>
  </ContentWrap>

  <!-- 弹窗：表单预览 -->
  <Dialog v-model="dialogVisible" :title="dialogTitle" max-height="600">
    <div v-if="dialogVisible" ref="editor">
      <el-button style="float: right" @click="copy(formData)">
        {{ t('common.copy') }}
      </el-button>
      <el-scrollbar height="580">
        <div>
          <pre><code class="hljs" v-dompurify-html="highlightedCode(formData)"></code></pre>
        </div>
      </el-scrollbar>
    </div>
  </Dialog>
</template>
<script lang="ts" setup>
defineOptions({ name: 'InfraBuild' })
import FcDesigner from '@form-create/designer'
import { useClipboard } from '@vueuse/core'
import { isString } from '@/utils/is'

import hljs from 'highlight.js' // 导入代码高亮文件
import 'highlight.js/styles/github.css' // 导入代码高亮样式
import xml from 'highlight.js/lib/languages/java'
import json from 'highlight.js/lib/languages/json'
import formCreate from '@form-create/element-ui'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息

const designer = ref() // 表单设计器
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formType = ref(-1) // 表单的类型：0 - 生成 JSON；1 - 生成 Options；2 - 生成组件
const formData = ref('') // 表单数据

/** 打开弹窗 */
const openModel = (title: string) => {
  dialogVisible.value = true
  dialogTitle.value = title
}

/** 生成 JSON */
const showJson = () => {
  openModel('生成 JSON')
  formType.value = 0
  formData.value = designer.value.getRule()
}

/** 生成 Options */
const showOption = () => {
  openModel('生成 Options')
  formType.value = 1
  formData.value = designer.value.getOption()
}

/** 生成组件 */
const showTemplate = () => {
  openModel('生成组件')
  formType.value = 2
  formData.value = makeTemplate()
}

const makeTemplate = () => {
  const rule = designer.value.getRule()
  const opt = designer.value.getOption()
  return `<template>
    <form-create
      v-model="fapi"
      :rule="rule"
      :option="option"
      @submit="onSubmit"
    ></form-create>
  </template>
  <script setup lang=ts>
    import formCreate from "@form-create/element-ui";
    const faps = ref(null)
    const rule = ref('')
    const option = ref('')
    const init = () => {
      rule.value = formCreate.parseJson('${formCreate.toJson(rule).replaceAll('\\', '\\\\')}')
      option.value = formCreate.parseJson('${JSON.stringify(opt)}')
    }
    const onSubmit = (formData) => {
      //todo 提交表单
    }
    init()
  <\/script>`
}

/** 复制 **/
const copy = async (text: string) => {
  const { copy, copied, isSupported } = useClipboard({ source: text })
  if (!isSupported) {
    message.error(t('common.copyError'))
  } else {
    await copy()
    if (unref(copied)) {
      message.success(t('common.copySuccess'))
    }
  }
}

/**
 * 代码高亮
 */
const highlightedCode = (code) => {
  // 处理语言和代码
  let language = 'json'
  if (formType.value === 2) {
    language = 'xml'
  }
  if (!isString(code)) {
    code = JSON.stringify(code)
  }
  // 高亮
  const result = hljs.highlight(language, code, true)
  return result.value || '&nbsp;'
}

/** 初始化 **/
onMounted(async () => {
  // 注册代码高亮的各种语言
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('json', json)
})
</script>
