import {
  useCurrencySelectRule,
  useDictSelectRule,
  useEditorRule,
  useUploadFileRule,
  useUploadImgRule,
  useUploadImgsRule
} from './config'
import { Ref } from 'vue'

/**
 * 表单设计器增强 hook
 * 新增
 * - 文件上传
 * - 单图上传
 * - 多图上传
 * - 字典选择器
 * - 系统用户选择器
 * - 富文本
 */
export const useFormCreateDesigner = (designer: Ref) => {
  const editorRule = useEditorRule()
  const uploadFileRule = useUploadFileRule()
  const uploadImgRule = useUploadImgRule()
  const uploadImgsRule = useUploadImgsRule()
  const dictSelectRule = useDictSelectRule()
  const currencySelectRule = useCurrencySelectRule()

  onMounted(() => {
    // 移除自带的上传组件规则，使用 uploadFileRule、uploadImgRule、uploadImgsRule 替代
    designer.value?.removeMenuItem('upload')
    // 移除自带的富文本组件规则，使用 editorRule 替代
    designer.value?.removeMenuItem('fc-editor')
    // 移除自带的下拉选择器组件，使用 currencySelectRule 替代
    designer.value?.removeMenuItem('select')
    const components = [
      editorRule,
      uploadFileRule,
      uploadImgRule,
      uploadImgsRule,
      dictSelectRule,
      currencySelectRule
    ]
    components.forEach((component) => {
      // 插入组件规则
      designer.value?.addComponent(component)
      // 插入拖拽按钮到 `main` 分类下
      designer.value?.appendMenuItem('main', {
        icon: component.icon,
        name: component.name,
        label: component.label
      })
    })
  })
}
