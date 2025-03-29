<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :appendToBody="true" v-loading="loading">
    <div class="flex h-600px">
      <!-- 左侧物模型属性（view模式） -->
      <div class="w-1/2 border-r border-gray-200 pr-2 overflow-auto">
        <JsonEditor :model-value="thingModel" mode="view" height="600px" />
      </div>

      <!-- 右侧JSON编辑器（code模式） -->
      <div class="w-1/2 pl-2 overflow-auto">
        <JsonEditor v-model="editableModelTSL" mode="code" height="600px" @error="handleError" />
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave" :disabled="hasJsonError">保存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'ThingModelDualView' })

const props = defineProps<{
  modelValue: any // 物模型的值
  thingModel: any[] // 物模型
}>()
const emits = defineEmits(['update:modelValue', 'change'])

const message = useMessage()
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('物模型编辑器') // 弹窗的标题
const editableModelTSL = ref([
  {
    identifier: '对应左侧 identifier 属性值',
    value: '如果 identifier 是 int 类型则输入数字，具体查看产品物模型定义'
  }
]) // 物模型数据
const hasJsonError = ref(false) // 是否有 JSON 格式错误
const loading = ref(false) // 加载状态

/** 打开弹窗 */
const open = () => {
  try {
    // 数据回显
    if (props.modelValue) {
      editableModelTSL.value = JSON.parse(props.modelValue)
    }
  } catch (e) {
    message.error('物模型编辑器参数')
    console.error(e)
  } finally {
    dialogVisible.value = true
    // 重置状态
    hasJsonError.value = false
  }
}
defineExpose({ open }) // 暴露方法供父组件调用

/** 保存修改 */
const handleSave = async () => {
  try {
    await message.confirm('确定要保存物模型参数吗？')
    emits('update:modelValue', JSON.stringify(editableModelTSL.value))
    message.success('保存成功')
    dialogVisible.value = false
  } catch {}
}

/** 处理 JSON 编辑器错误的函数 */
const handleError = (errors: any) => {
  if (isEmpty(errors)) {
    hasJsonError.value = false
    return
  }
  hasJsonError.value = true
}
</script>
