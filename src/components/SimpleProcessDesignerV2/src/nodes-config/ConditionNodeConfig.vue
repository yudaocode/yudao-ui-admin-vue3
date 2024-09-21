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
      <div class="mb-3 font-size-16px" v-if="currentNode.defaultFlow">其它条件不满足进入此分支（该分支不可编辑和删除）</div>
      <div v-else>
        <el-form
          ref="formRef"
          :model="currentNode"
          :rules="formRules"
          label-position="top"
        >
          <el-form-item label="配置方式" prop="conditionType">
            <el-radio-group
              v-model="currentNode.conditionType"
              @change="changeConditionType"
            >
              <el-radio
                v-for="(dict, index) in conditionConfigTypes"
                :key="index"
                :value="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item
            v-if="currentNode.conditionType === 1"
            label="条件表达式"
            prop="conditionExpression"
          >
            <el-input
              type="textarea"
              v-model="currentNode.conditionExpression"
              clearable
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item v-if="currentNode.conditionType === 2" label="条件规则">
            <div class="condition-group-tool">
              <div class="flex items-center">
                <div class="mr-4">条件组关系</div>
                <el-switch
                  v-model="conditionGroups.and"
                  inline-prompt
                  active-text="且"
                  inactive-text="或"
                />
              </div>
            </div>
            <el-space direction="vertical" :spacer="conditionGroups.and ? '且' : '或'">
              <el-card
                class="condition-group"
                style="width: 530px"
                v-for="(condition, cIdx) in conditionGroups.conditions"
                :key="cIdx"
              >
                <div class="condition-group-delete" v-if="conditionGroups.conditions.length > 1">
                  <Icon
                    color="#0089ff"
                    icon="ep:circle-close-filled"
                    :size="18"
                    @click="deleteConditionGroup(cIdx)"
                  />
                </div>
                <template #header>
                  <div class="flex items-center justify-between">
                    <div>条件组</div>
                    <div class="flex">
                      <div class="mr-4">规则关系</div>
                      <el-switch
                        v-model="condition.and"
                        inline-prompt
                        active-text="且"
                        inactive-text="或"
                      />
                    </div>
                  </div>
                </template>

                <div class="flex pt-2" v-for="(rule, rIdx) in condition.rules" :key="rIdx">
                  <div class="mr-2">
                    <el-select style="width: 160px" v-model="rule.leftSide">
                      <el-option
                        v-for="(item, index) in fieldsInfo"
                        :key="index"
                        :label="item.title"
                        :value="item.field"
                      />
                    </el-select>
                  </div>
                  <div class="mr-2">
                    <el-select v-model="rule.opCode" style="width: 100px">
                      <el-option
                        v-for="item in COMPARISON_OPERATORS"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                  <div class="mr-2">
                    <el-input v-model="rule.rightSide" style="width: 160px" />
                  </div>
                  <div class="mr-1 flex items-center" v-if="condition.rules.length > 1">
                    <Icon
                      icon="ep:delete"
                      :size="18"
                      @click="deleteConditionRule(condition, rIdx)"
                    />
                  </div>
                  <div class="flex items-center">
                    <Icon icon="ep:plus" :size="18" @click="addConditionRule(condition, rIdx)" />
                  </div>
                </div>
              </el-card>
            </el-space>
            <div title="添加条件组" class="mt-4 cursor-pointer">
              <Icon color="#0089ff" icon="ep:plus" :size="24" @click="addConditionGroup" />
            </div>
          </el-form-item>
        </el-form>
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
  CONDITION_CONFIG_TYPES,
  ConditionType,
  COMPARISON_OPERATORS,
  ConditionGroup,
  Condition,
  ConditionRule
} from '../consts'
import { getDefaultConditionNodeName } from '../utils'
import { useFormFields } from '../node'
const message = useMessage() // 消息弹窗
defineOptions({
  name: 'ConditionNodeConfig'
})
const formType = inject<Ref<number>>('formType') // 表单类型
const conditionConfigTypes = computed(() => {
  return CONDITION_CONFIG_TYPES.filter((item) => {
    // 业务表单暂时去掉条件规则选项
    if (formType?.value !== 10) {
      return item.value === ConditionType.RULE
    } else {
      return true
    }
  })
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
const open = () => {
  if (currentNode.value.conditionType === ConditionType.RULE) {
    if (currentNode.value.conditionGroups) {
      conditionGroups.value = currentNode.value.conditionGroups
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
    getDefaultConditionNodeName(props.nodeIndex, currentNode.value?.defaultFlow)
}

const currentNode = ref<SimpleFlowNode>(props.conditionNode)

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
// 表单校验规则
const formRules = reactive({
  conditionType: [{ required: true, message: '配置方式不能为空', trigger: 'blur' }],
  conditionExpression: [{ required: true, message: '条件表达式不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

// 保存配置
const saveConfig = async () => {
  if (!currentNode.value.defaultFlow) {
    // 校验表单
    if (!formRef) return false
    const valid = await formRef.value.validate()
    if (!valid) return false
    const showText = getShowText()
    if (!showText) {
      return false
    }
    currentNode.value.showText = showText
    if (currentNode.value.conditionType === ConditionType.EXPRESSION) {
      currentNode.value.conditionGroups = undefined
    }
    if (currentNode.value.conditionType === ConditionType.RULE) {
      currentNode.value.conditionExpression = undefined
      currentNode.value.conditionGroups = conditionGroups.value
    }
  }
  settingVisible.value = false
  return true
}
const getShowText = (): string => {
  let showText = ''
  if (currentNode.value.conditionType === ConditionType.EXPRESSION) {
    if (currentNode.value.conditionExpression) {
      showText = `表达式：${currentNode.value.conditionExpression}`
    }
  }
  if (currentNode.value.conditionType === ConditionType.RULE) {
    // 条件组是否为与关系
    const groupAnd = conditionGroups.value.and
    let warningMesg: undefined | string = undefined
    const conditionGroup = conditionGroups.value.conditions.map((item) => {
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
      showText = conditionGroup.join(groupAnd ? ' 且 ' : ' 或 ')
    }
  }
  return showText
}

// 改变条件配置方式
const changeConditionType = () => {}

const conditionGroups = ref<ConditionGroup>({
  and: true,
  conditions: [
    {
      and: true,
      rules: [
        {
          type: 1,
          opName: '等于',
          opCode: '==',
          leftSide: '',
          rightSide: ''
        }
      ]
    }
  ]
})
// 添加条件组
const addConditionGroup = () => {
  const condition = {
    and: true,
    rules: [
      {
        type: 1,
        opName: '等于',
        opCode: '==',
        leftSide: '',
        rightSide: ''
      }
    ]
  }
  conditionGroups.value.conditions.push(condition)
}
// 删除条件组
const deleteConditionGroup = (idx: number) => {
  conditionGroups.value.conditions.splice(idx, 1)
}

// 添加条件规则
const addConditionRule = (condition: Condition, idx: number) => {
  const rule: ConditionRule = {
    type: 1,
    opName: '等于',
    opCode: '==',
    leftSide: '',
    rightSide: ''
  }
  condition.rules.splice(idx + 1, 0, rule)
}

const deleteConditionRule = (condition: Condition, idx: number) => {
  condition.rules.splice(idx, 1)
}

const fieldsInfo = useFormFields()

const getFieldTitle = (field: string) => {
  const item = fieldsInfo.find((item) => item.field === field)
  return item?.title
}

const getOpName = (opCode: string): string => {
  const opName = COMPARISON_OPERATORS.find((item) => item.value === opCode)
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
