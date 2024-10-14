<template>
  <ContentWrap :body-style="{ padding: '0px' }" class="!mb-0">
    <!-- 表单设计器 -->
    <div
      class="h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding)-2px)]"
    >
      <fc-designer class="my-designer" ref="designer" :config="designerConfig">
        <template #handle>
          <el-button size="small" type="primary" plain @click="showJson">生成JSON</el-button>
          <el-button size="small" type="success" plain @click="showOption">生成Options</el-button>
          <el-button size="small" type="danger" plain @click="showTemplate">生成组件</el-button>
        </template>
      </fc-designer>
    </div>
  </ContentWrap>

  <!-- 弹窗：表单预览 -->
  <Dialog v-model="dialogVisible" :title="dialogTitle" max-height="600">
    <div v-if="dialogVisible" ref="editor">
      <el-button style="float: right" @click="copy(formData)">
        {{ t('common.copy') }}
      </el-button>
      <el-scrollbar height="580">
        <div>
          <pre><code v-dompurify-html="highlightedCode(formData)" class="hljs"></code></pre>
        </div>
      </el-scrollbar>
    </div>
  </Dialog>
</template>
<script lang="ts" setup>
import { useFormCreateDesigner } from '@/components/FormCreate'
import { useClipboard } from '@vueuse/core'
import { isString } from '@/utils/is'

import hljs from 'highlight.js' // 导入代码高亮文件
import 'highlight.js/styles/github.css' // 导入代码高亮样式
import xml from 'highlight.js/lib/languages/java'
import json from 'highlight.js/lib/languages/json'
import formCreate from '@form-create/element-ui'

defineOptions({ name: 'InfraBuild' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息

// 表单设计器配置
const designerConfig = ref({
  switchType: [], // 是否可以切换组件类型,或者可以相互切换的字段
  autoActive: true, // 是否自动选中拖入的组件
  useTemplate: false, // 是否生成vue2语法的模板组件
  formOptions: {}, // 定义表单配置默认值
  fieldReadonly: false, // 配置field是否可以编辑
  hiddenDragMenu: false, // 隐藏拖拽操作按钮
  hiddenDragBtn: false, // 隐藏拖拽按钮
  hiddenMenu: [], // 隐藏部分菜单
  hiddenItem: [], // 隐藏部分组件
  hiddenItemConfig: {}, // 隐藏组件的部分配置项
  disabledItemConfig: {}, // 禁用组件的部分配置项
  showSaveBtn: false, // 是否显示保存按钮
  showConfig: true, // 是否显示右侧的配置界面
  showBaseForm: true, // 是否显示组件的基础配置表单
  showControl: true, // 是否显示组件联动
  showPropsForm: true, // 是否显示组件的属性配置表单
  showEventForm: true, // 是否显示组件的事件配置表单
  showValidateForm: true, // 是否显示组件的验证配置表单
  showFormConfig: true, // 是否显示表单配置
  showInputData: true, // 是否显示录入按钮
  showDevice: true, // 是否显示多端适配选项
  appendConfigData: [] // 定义渲染规则所需的formData
})
const designer = ref() // 表单设计器
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formType = ref(-1) // 表单的类型：0 - 生成 JSON；1 - 生成 Options；2 - 生成组件
const formData = ref('') // 表单数据
useFormCreateDesigner(designer) // 表单设计器增强

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
      v-model:api="fApi"
      :rule="rule"
      :option="option"
      @submit="onSubmit"
    ></form-create>
  </template>
  <script setup lang=ts>
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

<style>
.my-designer {
  ._fc-l,
  ._fc-m,
  ._fc-r {
    border-top: none;
  }
}
</style>
