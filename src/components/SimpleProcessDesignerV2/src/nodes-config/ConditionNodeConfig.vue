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
import { SimpleFlowNode, ConditionType } from '../consts'
import { getDefaultConditionNodeName } from '../utils'
import { useFormFieldsAndStartUser, getConditionShowText } from '../node'
import Condition from './components/Condition.vue'
import { cloneDeep } from 'lodash-es'

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
const condition = ref<any>({
  conditionType: ConditionType.RULE, // 设置默认值
  conditionExpression: '',
  conditionGroups: {
    and: true,
    conditions: [
      {
        and: true,
        rules: [
          {
            opCode: '==',
            leftSide: '',
            rightSide: ''
          }
        ]
      }
    ]
  }
})
const open = () => {
  // 如果有已存在的配置则使用，否则使用默认值
  if (currentNode.value.conditionSetting) {
    condition.value = cloneDeep(currentNode.value.conditionSetting)
  } else {
    // 重置为默认值
    condition.value = {
      conditionType: ConditionType.RULE,
      conditionExpression: '',
      conditionGroups: {
        and: true,
        conditions: [
          {
            and: true,
            rules: [
              {
                opCode: '==',
                leftSide: '',
                rightSide: ''
              }
            ]
          }
        ]
      }
    }
  }
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

/** 保存配置 */
const fieldOptions = useFormFieldsAndStartUser() // 流程表单字段和发起人字段
const conditionRef = ref()
const saveConfig = async () => {
  if (!currentNode.value.conditionSetting?.defaultFlow) {
    // 校验表单
    const valid = await conditionRef.value.validate()
    if (!valid) return false
    const showText = getConditionShowText(
      condition.value?.conditionType,
      condition.value?.conditionExpression,
      condition.value.conditionGroups,
      fieldOptions
    )
    if (!showText) {
      return false
    }
    currentNode.value.showText = showText
    // 使用 cloneDeep 进行深拷贝
    currentNode.value.conditionSetting = cloneDeep({
      ...currentNode.value.conditionSetting,
      conditionType: condition.value?.conditionType,
      conditionExpression:
        condition.value?.conditionType === ConditionType.EXPRESSION
          ? condition.value?.conditionExpression
          : undefined,
      conditionGroups:
        condition.value?.conditionType === ConditionType.RULE
          ? condition.value?.conditionGroups
          : undefined
    })
  }
  settingVisible.value = false
  return true
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
