import {
  useDictSelectRule,
  useEditorRule,
  useSelectRule,
  useUploadFileRule,
  useUploadImgRule,
  useUploadImgsRule
} from './config'
import { Ref } from 'vue'
import { Menu } from '@/components/FormCreate/src/type'
import { apiSelectRule } from '@/components/FormCreate/src/config/selectRule'
import { generateUUID } from '@/utils'

/**
 * 表单设计器增强 hook
 * 新增
 * - 文件上传
 * - 单图上传
 * - 多图上传
 * - 字典选择器
 * - 用户选择器
 * - 部门选择器
 * - 富文本
 */
export const useFormCreateDesigner = async (designer: Ref) => {
  const editorRule = useEditorRule()
  const uploadFileRule = useUploadFileRule()
  const uploadImgRule = useUploadImgRule()
  const uploadImgsRule = useUploadImgsRule()

  /**
   * 构建表单组件
   */
  const buildFormComponents = () => {
    // 移除自带的上传组件规则，使用 uploadFileRule、uploadImgRule、uploadImgsRule 替代
    designer.value?.removeMenuItem('upload')
    // 移除自带的富文本组件规则，使用 editorRule 替代
    designer.value?.removeMenuItem('fcEditor')
    const components = [editorRule, uploadFileRule, uploadImgRule, uploadImgsRule]
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
  }

  const userSelectRule = useSelectRule({
    name: 'UserSelect',
    label: '用户选择器',
    icon: 'icon-user-o'
  })
  const deptSelectRule = useSelectRule({
    name: 'DeptSelect',
    label: '部门选择器',
    icon: 'icon-address-card-o',
    props: [
      {
        type: 'select',
        field: 'returnType',
        title: '返回值类型',
        value: 'id',
        options: [
          { label: '部门编号', value: 'id' },
          { label: '部门名称', value: 'name' }
        ]
      }
    ]
  })
  const dictSelectRule = useDictSelectRule()
  const apiSelectRule0 = useSelectRule({
    name: 'ApiSelect',
    label: '接口选择器',
    icon: 'icon-server',
    props: [...apiSelectRule],
    event: ['click', 'change', 'visibleChange', 'clear', 'blur', 'focus']
  })

  /**
   * 构建系统字段菜单
   */
  const buildSystemMenu = () => {
    // 移除自带的下拉选择器组件，使用 currencySelectRule 替代
    // designer.value?.removeMenuItem('select')
    // designer.value?.removeMenuItem('radio')
    // designer.value?.removeMenuItem('checkbox')
    const components = [userSelectRule, deptSelectRule, dictSelectRule, apiSelectRule0]
    const menu: Menu = {
      name: 'system',
      title: '系统字段',
      list: components.map((component) => {
        // 插入组件规则
        designer.value?.addComponent(component)
        // 插入拖拽按钮到 `system` 分类下
        return {
          icon: component.icon,
          name: component.name,
          label: component.label
        }
      })
    }
    designer.value?.addMenu(menu)
  }

  /**
   * 修复重复的字段 ID 问题
   * 当复制组件时，自动为新组件生成新的字段 ID
   *
   * 对应 issue：https://gitee.com/yudaocode/yudao-ui-admin-vue3/issues/ICM22X
   */
  const fixDuplicateFields = () => {
    // 获取当前所有规则
    const rules = designer.value?.getRule() || []
    const fieldIds = new Set<string>()
    let hasChanges = false

    // 遍历所有规则，检测并修复重复的字段 ID
    rules.forEach((rule: any) => {
      if (rule.field) {
        if (fieldIds.has(rule.field)) {
          // 发现重复，生成新的ID
          const oldField = rule.field
          const newField = generateUUID()
          console.log(`[FormCreate] 检测到重复字段ID: ${oldField}, 已自动更新为: ${newField}`)
          rule.field = newField
          hasChanges = true
        } else {
          fieldIds.add(rule.field)
        }
      }
    })

    // 如果有重复字段被修复，更新设计器
    if (hasChanges) {
      designer.value?.setRule(rules)
    }

    return hasChanges
  }

  onMounted(async () => {
    await nextTick()
    buildFormComponents()
    buildSystemMenu()

    // 监听设计器内容变化，自动修复重复字段ID
    let isFixing = false // 防止无限循环
    watch(
      () => designer.value?.getRule(),
      async () => {
        if (!isFixing) {
          isFixing = true
          await nextTick()
          fixDuplicateFields()
          isFixing = false
        }
      },
      { deep: true }
    )
  })
}
