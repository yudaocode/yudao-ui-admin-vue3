import {
  useDictSelectRule,
  useUploadFileRule,
  useUploadImgRule,
  useUploadImgsRule,
  useUserSelectRule
} from './config'
import { Ref } from 'vue'

/**
 * 表单设计器增强 hook
 * 新增
 * - 文件上传
 * - 单图上传
 * - 多图上传
 */
export const useFormCreateDesigner = (designer: Ref) => {
  const uploadFileRule = useUploadFileRule()
  const uploadImgRule = useUploadImgRule()
  const uploadImgsRule = useUploadImgsRule()
  const dictSelectRule = useDictSelectRule()
  const userSelectRule = useUserSelectRule()

  onMounted(() => {
    // 移除自带的上传组件规则，使用 uploadFileRule、uploadImgRule、uploadImgsRule 替代
    designer.value?.removeMenuItem('upload')
    const components = [
      uploadFileRule,
      uploadImgRule,
      uploadImgsRule,
      dictSelectRule,
      userSelectRule
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
