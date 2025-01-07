<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="630"
    :before-close="saveConfig"
  >
    <template #header>
      <div class="config-header">
        <input
          v-if="showInput"
          type="text"
          class="config-editable-input"
          @blur="blurEvent()"
          v-mountedFocus
          v-model="nodeName"
          :placeholder="nodeName"
        />
        <div v-else class="node-name">
          {{ nodeName }} <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()" />
        </div>
        <div class="divide-line"></div>
      </div>
    </template>
    <div>
      <el-form label-position="top">
        <el-card class="mb-15px" v-for="(item, index) in routeGroup" :key="index">
          <template #header>
            <div class="flex flex-items-center">
              <el-text size="large">路由{{ index + 1 }}</el-text>
              <el-select class="ml-15px" v-model="item.nodeId" style="width: 180px">
                <el-option
                  v-for="node in nodeOptions"
                  :key="node.value"
                  :label="node.label"
                  :value="node.value"
                />
              </el-select>
              <el-button class="mla" type="danger" link @click="deleteRouteGroup(index)"
                >删除</el-button
              >
            </div>
          </template>
          <el-form-item label="配置方式" prop="conditionType">
            <el-radio-group v-model="item.conditionType" @change="changeConditionType">
              <el-radio
                v-for="(dict, indexConditionType) in conditionConfigTypes"
                :key="indexConditionType"
                :value="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="item.conditionType === 1"
            label="条件表达式"
            prop="conditionExpression"
          >
            <el-input
              type="textarea"
              v-model="item.conditionExpression"
              clearable
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item v-if="item.conditionType === 2" label="条件规则">
            <div class="condition-group-tool">
              <div class="flex items-center">
                <div class="mr-4">条件组关系</div>
                <el-switch
                  v-model="item.conditionGroups.and"
                  inline-prompt
                  active-text="且"
                  inactive-text="或"
                />
              </div>
            </div>
            <el-space direction="vertical" :spacer="item.conditionGroups.and ? '且' : '或'">
              <el-card
                class="condition-group"
                style="width: 530px"
                v-for="(condition, cIdx) in item.conditionGroups.conditions"
                :key="cIdx"
              >
                <div
                  class="condition-group-delete"
                  v-if="item.conditionGroups.conditions.length > 1"
                >
                  <Icon
                    color="#0089ff"
                    icon="ep:circle-close-filled"
                    :size="18"
                    @click="deleteConditionGroup(item.conditionGroups.conditions, cIdx)"
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
                        v-for="(field, fIdx) in fieldOptions"
                        :key="fIdx"
                        :label="field.title"
                        :value="field.field"
                        :disabled="!field.required"
                      />
                    </el-select>
                  </div>
                  <div class="mr-2">
                    <el-select v-model="rule.opCode" style="width: 100px">
                      <el-option
                        v-for="operator in COMPARISON_OPERATORS"
                        :key="operator.value"
                        :label="operator.label"
                        :value="operator.value"
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
              <Icon
                color="#0089ff"
                icon="ep:plus"
                :size="24"
                @click="addConditionGroup(item.conditionGroups.conditions)"
              />
            </div>
          </el-form-item>
        </el-card>
      </el-form>

      <el-button class="w-1/1" type="primary" :icon="Plus" @click="addRouteGroup">
        新增路由分支
      </el-button>
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
import { Plus } from '@element-plus/icons-vue'
import {
  SimpleFlowNode,
  NodeType,
  CONDITION_CONFIG_TYPES,
  ConditionType,
  COMPARISON_OPERATORS,
  RouteCondition,
  ProcessVariableEnum
} from '../consts'
import { useWatchNode, useDrawer, useNodeName } from '../node'
import { BpmModelFormType } from '@/utils/constants'
import { useFormFields } from '../node'
defineOptions({
  name: 'RouteNodeConfig'
})
const message = useMessage() // 消息弹窗
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const processNodeTree = inject<Ref<SimpleFlowNode>>('processNodeTree')
// 抽屉配置
const { settingVisible, closeDrawer, openDrawer } = useDrawer()
// 当前节点
const currentNode = useWatchNode(props)
// 节点名称
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.ROUTE_BRANCH_NODE)
const formType = inject<Ref<number>>('formType') // 表单类型
const conditionConfigTypes = computed(() => {
  return CONDITION_CONFIG_TYPES.filter((item) => {
    // 业务表单暂时去掉条件规则选项
    if (formType?.value === BpmModelFormType.CUSTOM && item.value === ConditionType.RULE) {
      return false
    } else {
      return true
    }
  })
})
/** 条件规则可选择的表单字段 */
const fieldOptions = computed(() => {
  const fieldsCopy = useFormFields().slice()
  // 固定添加发起人 ID 字段
  fieldsCopy.unshift({
    field: ProcessVariableEnum.START_USER_ID,
    title: '发起人',
    required: true
  })
  return fieldsCopy
})
const routeGroup = ref<RouteCondition[]>([])
const nodeOptions = ref()

// 保存配置
const saveConfig = async () => {
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.name = nodeName.value!
  currentNode.value.showText = showText
  currentNode.value.routeGroup = routeGroup.value
  settingVisible.value = false
  return true
}
// 显示路由分支节点配置， 由父组件传过来
const showRouteNodeConfig = (node: SimpleFlowNode) => {
  getRoutableNode()
  routeGroup.value = []
  nodeName.value = node.name
  if (node.routeGroup) {
    routeGroup.value = node.routeGroup
  }
}

const getShowText = () => {
  if (!routeGroup.value || !Array.isArray(routeGroup.value) || routeGroup.value.length <= 0) {
    message.warning('请配置路由！')
    return ''
  }
  for (const route of routeGroup.value) {
    if (!route.nodeId || !route.conditionType) {
      message.warning('请完善路由配置项！')
      return ''
    }
    if (route.conditionType === ConditionType.EXPRESSION && !route.conditionExpression) {
      message.warning('请完善路由配置项！')
      return ''
    }
    if (route.conditionType === ConditionType.RULE) {
      for (const condition of route.conditionGroups.conditions) {
        for (const rule of condition.rules) {
          if (!rule.leftSide || !rule.rightSide) {
            message.warning('请完善路由配置项！')
            return ''
          }
        }
      }
    }
  }
  return `${routeGroup.value.length}条路由分支`
}

const changeConditionType = () => {}

const deleteConditionGroup = (conditions, index) => {
  conditions.splice(index, 1)
}

const deleteConditionRule = (condition, index) => {
  condition.rules.splice(index, 1)
}

const addConditionRule = (condition, index) => {
  const rule = {
    type: 1,
    opName: '等于',
    opCode: '==',
    leftSide: '',
    rightSide: ''
  }
  condition.rules.splice(index + 1, 0, rule)
}

const addConditionGroup = (conditions) => {
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
  conditions.push(condition)
}

const addRouteGroup = () => {
  routeGroup.value.push({
    nodeId: '',
    conditionType: ConditionType.EXPRESSION,
    conditionExpression: '',
    conditionGroups: {
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
    }
  })
}

const deleteRouteGroup = (index) => {
  routeGroup.value.splice(index, 1)
}

const getRoutableNode = () => {
  // TODO 还需要满足以下要求
  // 并行分支、包容分支内部节点不能跳转到外部节点
  // 条件分支节点可以向上跳转到外部节点
  let node = processNodeTree?.value
  nodeOptions.value = []
  while (true) {
    if (!node) break
    if (node.type !== NodeType.ROUTE_BRANCH_NODE) {
      nodeOptions.value.push({
        label: node.name,
        value: node.id
      })
    }
    if (!node.childNode || node.type === NodeType.END_EVENT_NODE) {
      break
    }
    node = node.childNode
  }
}

defineExpose({ openDrawer, showRouteNodeConfig }) // 暴露方法给父组件
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
