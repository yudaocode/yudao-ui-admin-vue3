import type { App } from 'vue'
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
import FcDesigner from '@form-create/designer'
import formCreate from '@form-create/element-ui'
import install from '@form-create/element-ui/auto-import'

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

// 参考 http://www.form-create.com/v3/element-ui/auto-import.html 文档
export const setupFormCreate = (app: App<Element>) => {
  components.forEach((component) => {
    app.component(component.name!, component)
  })
  formCreate.use(install)
  app.use(formCreate)
  app.use(FcDesigner)
}
