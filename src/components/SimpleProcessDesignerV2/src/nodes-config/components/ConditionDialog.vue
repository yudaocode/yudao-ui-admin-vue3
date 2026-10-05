<template>
  <Dialog v-model="dialogVisible" title="条件配置" width="600px" :fullscreen="false">
    <div class="h-410px">
      <el-scrollbar wrap-class="h-full">
        <Condition ref="conditionRef" v-model="condition" />
      </el-scrollbar>
    </div>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ConditionType, ConditionGroup, DEFAULT_CONDITION_GROUP_VALUE } from '../../consts'
import Condition from './Condition.vue'
import { cloneDeep } from 'lodash-es'
defineOptions({
  name: 'ConditionDialog'
})

const condition = ref<{
  conditionType: ConditionType
  conditionExpression?: string
  conditionGroups?: ConditionGroup
}>({
  conditionType: ConditionType.RULE,
  conditionGroups: cloneDeep(DEFAULT_CONDITION_GROUP_VALUE)
}) // 编辑中的条件数据

const emit = defineEmits<{
  updateCondition: [condition: object]
}>()
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const conditionRef = ref() // 条件表单 Ref

/** 打开弹窗，conditionObj 非空时回显已有的条件配置 */
const open = (conditionObj: any | undefined) => {
  condition.value = {
    conditionType: conditionObj?.conditionType ?? ConditionType.RULE,
    conditionExpression: conditionObj?.conditionExpression,
    conditionGroups: cloneDeep(conditionObj?.conditionGroups ?? DEFAULT_CONDITION_GROUP_VALUE)
  }
  dialogVisible.value = true
}

/** 保存条件设置 */
const submitForm = async () => {
  // 校验表单
  if (!conditionRef.value) return
  let valid = false // 表单校验结果
  try {
    valid = await conditionRef.value.validate()
  } catch {
    valid = false
  }
  if (!valid) {
    message.warning('请完善条件规则')
    return
  }
  dialogVisible.value = false
  // 设置完的条件传递给父组件
  emit('updateCondition', condition.value)
}

defineExpose({ open })
</script>
