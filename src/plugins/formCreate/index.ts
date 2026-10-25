import type { App } from 'vue'
import { getCurrentInstance } from 'vue'
// 👇使用 form-create 需额外全局引入 element plus 组件
import {
  // ElAutocomplete,
  // ElButton,
  // ElCascader,
  // ElCheckbox,
  // ElCheckboxButton,
  // ElCheckboxGroup,
  // ElCol,
  // ElColorPicker,
  // ElDatePicker,
  // ElDialog,
  // ElForm,
  // ElInput,
  // ElInputNumber,
  // ElPopover,
  // ElRadio,
  // ElRadioButton,
  // ElRadioGroup,
  // ElRate,
  // ElRow,
  // ElSelect,
  // ElSlider,
  // ElSwitch,
  // ElTimePicker,
  // ElTooltip,
  // ElTree,
  // ElUpload,
  // ElIcon,
  // ElProgress,
  // 以上会由 @form-create/element-ui/auto-import 自动引入
  ElAlert,
  ElTransfer,
  ElAside,
  ElContainer,
  ElDivider,
  ElHeader,
  ElMain,
  ElPopconfirm,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElBadge,
  ElTag,
  ElText,
  ElMenu,
  ElMenuItem,
  ElFooter,
  ElMessage,
  ElCollapse,
  ElCollapseItem,
  ElCard,
  ElTreeSelect
  // ElFormItem,
  // ElOption
} from 'element-plus'
import formCreate from '@form-create/element-ui'
import install from '@form-create/element-ui/auto-import'
// 设计器提供的签名、表格表单等组件（FcEditor、FcTitle、SignaturePad、TableForm、FcTable），渲染设计器生成的表单需要，无需加载整个设计器
import '@form-create/designer/dist/components.es.js'

//======================= 自定义组件 =======================
import { UploadFile, UploadImg, UploadImgs } from '@/components/UploadFile'
import { useApiSelect } from '@/components/FormCreate'
import { Editor } from '@/components/Editor'
import DictSelect from '@/components/FormCreate/src/components/DictSelect.vue'
import DeptSelect from '@/components/FormCreate/src/components/DeptSelect.vue'
import IframeComponent from '@/components/FormCreate/src/components/IframeComponent.vue'
import AreaSelect from '@/components/FormCreate/src/components/AreaSelect.vue'

const UserSelect = useApiSelect({
  name: 'UserSelect',
  labelField: 'nickname',
  valueField: 'id',
  url: '/system/user/simple-list'
})
const ApiSelect = useApiSelect({
  name: 'ApiSelect'
})

const components = [
  ElAlert,
  ElTransfer,
  ElAside,
  ElContainer,
  ElDivider,
  ElHeader,
  ElMain,
  ElPopconfirm,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTreeSelect,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElBadge,
  ElTag,
  ElText,
  ElMenu,
  ElMenuItem,
  ElFooter,
  ElMessage,
  // ElFormItem,
  // ElOption,
  UploadImg,
  UploadImgs,
  UploadFile,
  DictSelect,
  UserSelect,
  DeptSelect,
  ApiSelect,
  Editor,
  IframeComponent,
  AreaSelect,
  ElCollapse,
  ElCollapseItem,
  ElCard
]

formCreate.use(install)

const installedApps = new WeakSet<App>() // 已安装 form-create 的应用

// 参考 http://www.form-create.com/v3/element-ui/auto-import.html 文档
export const setupFormCreate = (app: App) => {
  if (installedApps.has(app)) {
    return
  }
  installedApps.add(app)
  components.forEach((component) => {
    app.component(component.name!, component)
  })
  app.use(formCreate)
}

/**
 * 按需安装 form-create：在使用 <form-create /> 的组件 setup 中同步调用，保证渲染表单前已注册
 *
 * 注意：不在 main.ts 启动时安装，避免 form-create 进入登录、普通列表等首屏
 */
export const useFormCreate = () => {
  const instance = getCurrentInstance()
  if (instance) {
    setupFormCreate(instance.appContext.app)
  }
}
