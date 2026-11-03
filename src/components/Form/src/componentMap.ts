import type { Component } from 'vue'
import { defineAsyncComponent } from 'vue'
import {
  ElCascader,
  ElCheckboxGroup,
  ElColorPicker,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSelectV2,
  ElTreeSelect,
  ElSlider,
  ElSwitch,
  ElTimePicker,
  ElTimeSelect,
  ElAutocomplete,
  ElDivider,
  ElUpload
} from 'element-plus'
import { InputPassword } from '@/components/InputPassword'
import { UploadImg, UploadImgs, UploadFile } from '@/components/UploadFile'
import { IAgree } from '@/components/IAgree'
import { ComponentName } from '@/types/components'
import FormTransfer from './components/FormTransfer.vue'

// 富文本编辑器按需加载，避免使用 Form 的页面因此加载 wangEditor
const Editor = defineAsyncComponent(() => import('@/components/Editor/src/Editor.vue'))
// JSON 编辑器同样按需加载，避免使用 Form 的页面因此加载 jsoneditor
const JsonEditor = defineAsyncComponent(() => import('@/components/JsonEditor/src/JsonEditor.vue'))
// 图标选择（上游组件名 IconPicker，参考 99ffe6a86）复用芋道 IconSelect，按需加载图标数据
const IconPicker = defineAsyncComponent(() => import('@/components/Icon/src/IconSelect.vue'))

const componentMap: Recordable<Component, ComponentName> = {
  Radio: ElRadioGroup,
  // 兼容上游组件名：RadioGroup / CheckboxGroup 与 Radio / Checkbox 渲染一致
  RadioGroup: ElRadioGroup,
  Checkbox: ElCheckboxGroup,
  CheckboxGroup: ElCheckboxGroup,
  CheckboxButton: ElCheckboxGroup,
  Input: ElInput,
  Autocomplete: ElAutocomplete,
  InputNumber: ElInputNumber,
  Select: ElSelect,
  Cascader: ElCascader,
  Switch: ElSwitch,
  Slider: ElSlider,
  TimePicker: ElTimePicker,
  DatePicker: ElDatePicker,
  Rate: ElRate,
  ColorPicker: ElColorPicker,
  Transfer: FormTransfer,
  Divider: ElDivider,
  TimeSelect: ElTimeSelect,
  SelectV2: ElSelectV2,
  TreeSelect: ElTreeSelect,
  RadioButton: ElRadioGroup,
  InputPassword: InputPassword,
  Editor: Editor,
  UploadImg: UploadImg,
  UploadImgs: UploadImgs,
  UploadFile: UploadFile,
  // 兼容上游组件名 Upload（参考 c181887f7）：原生 ElUpload，绑定 file-list；业务上传仍使用上面三个芋道组件
  Upload: ElUpload,
  IAgree: IAgree,
  JsonEditor: JsonEditor,
  IconPicker: IconPicker
}

export { componentMap }
