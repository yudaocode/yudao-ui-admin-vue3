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
        <el-card class="mb-15px" v-for="(item, index) in routerGroups" :key="index">
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
              <el-button class="mla" type="danger" link @click="deleteRouterGroup(index)">
                删除
              </el-button>
            </div>
          </template>
          <Condition
            :ref="($event) => (conditionRef[index] = $event)"
            v-model="routerGroups[index]"
          />
        </el-card>
      </el-form>

      <el-button class="w-1/1" type="primary" :icon="Plus" @click="addRouterGroup">
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
import { SimpleFlowNode, NodeType, ConditionType, RouterSetting } from '../consts'
import { useWatchNode, useDrawer, useNodeName } from '../node'
import Condition from './components/Condition.vue'

defineOptions({
  name: 'RouterNodeConfig'
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
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.ROUTER_BRANCH_NODE)
const routerGroups = ref<RouterSetting[]>([])
const nodeOptions = ref<any>([])
const conditionRef = ref([])

/** 保存配置 */
const saveConfig = async () => {
  // 校验表单
  let valid = true
  for (const item of conditionRef.value) {
    if (item && !(await item.validate())) {
      valid = false
    }
  }
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.name = nodeName.value!
  currentNode.value.showText = showText
  currentNode.value.routerGroups = routerGroups.value
  settingVisible.value = false
  return true
}
// 显示路由分支节点配置， 由父组件传过来
const showRouteNodeConfig = (node: SimpleFlowNode) => {
  getRouterNode(processNodeTree?.value)
  routerGroups.value = []
  nodeName.value = node.name
  if (node.routerGroups) {
    routerGroups.value = node.routerGroups
  }
}

const getShowText = () => {
  if (!routerGroups.value || !Array.isArray(routerGroups.value) || routerGroups.value.length <= 0) {
    message.warning('请配置路由！')
    return ''
  }
  for (const route of routerGroups.value) {
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
  return `${routerGroups.value.length}条路由分支`
}

const addRouterGroup = () => {
  routerGroups.value.push({
    nodeId: '',
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
  })
}

const deleteRouterGroup = (index: number) => {
  routerGroups.value.splice(index, 1)
}

// 递归获取所有节点
const getRouterNode = (node) => {
  // TODO 最好还需要满足以下要求
  // 并行分支、包容分支内部节点不能跳转到外部节点
  // 条件分支节点可以向上跳转到外部节点
  while (true) {
    if (!node) break
    if (node.type !== NodeType.ROUTER_BRANCH_NODE && node.type !== NodeType.CONDITION_NODE) {
      nodeOptions.value.push({
        label: node.name,
        value: node.id
      })
    }
    if (!node.childNode || node.type === NodeType.END_EVENT_NODE) {
      break
    }
    if (node.conditionNodes && node.conditionNodes.length) {
      node.conditionNodes.forEach((item) => {
        getRouterNode(item)
      })
    }
    node = node.childNode
  }
}

defineExpose({ openDrawer, showRouteNodeConfig }) // 暴露方法给父组件
</script>
