<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="588"
    :before-close="handleClose"
  >
    <template #header>
      <div class="config-header">
        <input
          v-if="showInput"
          type="text"
          class="config-editable-input"
          @blur="blurEvent()"
          v-mountedFocus
          v-model="currentNode.name"
          :placeholder="currentNode.name"
        />
        <div v-else class="node-name"
          >{{ currentNode.name }}
          <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()"
        /></div>

        <div class="divide-line"></div>
      </div>
    </template>
    <div>
      <div class="mb-3 font-size-16px" v-if="currentNode.conditionSetting?.defaultFlow"
        >未满足其它条件时，将进入此分支（该分支不可编辑和删除）</div
      >
      <div v-else>
        <Condition ref="conditionRef" v-model="condition" />
      </div>
    </div>
    <template #footer>
      <el-divider />
      <div>
        <el-button type="primary" @click="saveConfig">确 定</el-button>
        <el-button @click="closeDrawer">取 消</el-button>
      </div>
    </template>
  </el-drawer>
</template>
<script setup lang="ts">
import {
  SimpleFlowNode,
  ConditionType,
  COMPARISON_OPERATORS,
} from '../consts'
import { getDefaultConditionNodeName } from '../utils'
import { useFormFieldsAndStartUser } from '../node'
import Condition from './components/Condition.vue'
const message = useMessage() // 消息弹窗
defineOptions({
  name: 'ConditionNodeConfig'
})
const props = defineProps({
  conditionNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  },
  nodeIndex: {
    type: Number,
    required: true
  }
})
const settingVisible = ref(false)
const currentNode = ref<SimpleFlowNode>(props.conditionNode)
const condition = ref<any>()
const open = () => {
  condition.value = currentNode.value.conditionSetting
  settingVisible.value = true
}

watch(
  () => props.conditionNode,
  (newValue) => {
    currentNode.value = newValue
  }
)
// 显示名称输入框
const showInput = ref(false)

const clickIcon = () => {
  showInput.value = true
}
// 输入框失去焦点
const blurEvent = () => {
  showInput.value = false
  currentNode.value.name =
    currentNode.value.name ||
    getDefaultConditionNodeName(props.nodeIndex, currentNode.value?.conditionSetting?.defaultFlow)
}



defineExpose({ open }) // 提供 open 方法，用于打开弹窗

// 关闭
const closeDrawer = () => {
  settingVisible.value = false
}

const handleClose = async (done: (cancel?: boolean) => void) => {
  const isSuccess = await saveConfig()
  if (!isSuccess) {
    done(true) // 传入 true 阻止关闭
  } else {
    done()
  }
}

const conditionRef = ref()
// 保存配置
const saveConfig = async () => {
  if (!currentNode.value.conditionSetting?.defaultFlow) {
    // 校验表单
    const valid = await conditionRef.value.validate()
    if (!valid) return false
    const showText = getShowText()
    if (!showText) {
      return false
    }
    currentNode.value.showText = showText
    currentNode.value.conditionSetting!.conditionType = condition.value?.conditionType
    if (currentNode.value.conditionSetting?.conditionType === ConditionType.EXPRESSION) {
      currentNode.value.conditionSetting.conditionGroups = undefined
      currentNode.value.conditionSetting.conditionExpression = condition.value?.conditionExpression
    }
    if (currentNode.value.conditionSetting!.conditionType === ConditionType.RULE) {
      currentNode.value.conditionSetting!.conditionExpression = undefined
      currentNode.value.conditionSetting!.conditionGroups = condition.value?.conditionGroups
    }
  }
  settingVisible.value = false
  return true
}
const getShowText = (): string => {
  let showText = ''
  if (condition.value?.conditionType === ConditionType.EXPRESSION) {
    if (condition.value.conditionExpression) {
      showText = `表达式：${condition.value.conditionExpression}`
    }
  }
  if (condition.value?.conditionType === ConditionType.RULE) {
    // 条件组是否为与关系
    const groupAnd = condition.value.conditionGroups?.and
    let warningMesg: undefined | string = undefined
    const conditionGroup = condition.value.conditionGroups?.conditions.map((item) => {
      return (
        '(' +
        item.rules
          .map((rule) => {
            if (rule.leftSide && rule.rightSide) {
              return (
                getFieldTitle(rule.leftSide) + ' ' + getOpName(rule.opCode) + ' ' + rule.rightSide
              )
            } else {
              // 有一条规则不完善。提示错误
              warningMesg = '请完善条件规则'
              return ''
            }
          })
          .join(item.and ? ' 且 ' : ' 或 ') +
        ' ) '
      )
    })
    if (warningMesg) {
      message.warning(warningMesg)
      showText = ''
    } else {
      showText = conditionGroup!.join(groupAnd ? ' 且 ' : ' 或 ')
    }
  }
  return showText
}
// 流程表单字段和发起人字段
const fieldOptions = useFormFieldsAndStartUser()

/** 获取字段名称 */
const getFieldTitle = (field: string) => {
  const item = fieldOptions.find((item) => item.field === field)
  return item?.title
}

/** 获取操作符名称 */
const getOpName = (opCode: string): string => {
  const opName = COMPARISON_OPERATORS.find((item: any) => item.value === opCode)
  return opName?.label
}
</script>

<style lang="scss" scoped>
.condition-group-tool {
  display: flex;
  justify-content: space-between;
  width: 500px;
  margin-bottom: 20px;
}

.condition-group {
  position: relative;

  &:hover {
    border-color: #0089ff;

    .condition-group-delete {
      opacity: 1;
    }
  }

  .condition-group-delete {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    cursor: pointer;
    opacity: 0;
  }
}

::v-deep(.el-card__header) {
  padding: 8px var(--el-card-padding);
  border-bottom: 1px solid var(--el-card-border-color);
  box-sizing: border-box;
}
</style>
