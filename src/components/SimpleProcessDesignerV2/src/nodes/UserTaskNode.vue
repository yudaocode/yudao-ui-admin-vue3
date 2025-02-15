<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div
        class="node-box"
        :class="[
          { 'node-config-error': !currentNode.showText },
          `${useTaskStatusClass(currentNode?.activityStatus)}`
        ]"
      >
        <div class="node-title-container">
          <div
            :class="`node-title-icon ${currentNode.type === NodeType.TRANSACTOR_NODE ? 'transactor-task' : 'user-task'}`"
          >
            <span
              :class="`iconfont ${currentNode.type === NodeType.TRANSACTOR_NODE ? 'icon-transactor' : 'icon-approve'}`"
            >
            </span>
          </div>
          <input
            v-if="!readonly && showInput"
            type="text"
            class="editable-title-input"
            @blur="blurEvent()"
            v-mountedFocus
            v-model="currentNode.name"
            :placeholder="currentNode.name"
          />
          <div v-else class="node-title" @click="clickTitle">
            {{ currentNode.name }}
          </div>
        </div>
        <div class="node-content" @click="nodeClick">
          <div class="node-text" :title="currentNode.showText" v-if="currentNode.showText">
            {{ currentNode.showText }}
          </div>
          <div class="node-text" v-else>
            {{ NODE_DEFAULT_TEXT.get(currentNode.type) }}
          </div>
          <Icon icon="ep:arrow-right-bold" v-if="!readonly" />
        </div>
        <div v-if="!readonly" class="node-toolbar">
          <div class="toolbar-icon"
            ><Icon color="#0089ff" icon="ep:circle-close-filled" :size="18" @click="deleteNode"
          /></div>
        </div>
      </div>
      <!-- 传递子节点给添加节点组件。会在子节点前面添加节点 -->
      <NodeHandler
        v-if="currentNode"
        v-model:child-node="currentNode.childNode"
        :current-node="currentNode"
      />
    </div>
  </div>
  <UserTaskNodeConfig
    v-if="currentNode"
    ref="nodeSetting"
    :flow-node="currentNode"
    @find:return-task-nodes="findReturnTaskNodes"
  />
  <!-- 审批记录 -->
  <el-dialog
    :title="dialogTitle || '审批记录'"
    v-model="dialogVisible"
    width="1000px"
    append-to-body
  >
    <el-row>
      <el-table :data="selectTasks" size="small" border header-cell-class-name="table-header-gray">
        <el-table-column
          label="序号"
          header-align="center"
          align="center"
          type="index"
          width="50"
        />
        <el-table-column label="审批人" min-width="100" align="center">
          <template #default="scope">
            {{ scope.row.assigneeUser?.nickname || scope.row.ownerUser?.nickname }}
          </template>
        </el-table-column>

        <el-table-column label="部门" min-width="100" align="center">
          <template #default="scope">
            {{ scope.row.assigneeUser?.deptName || scope.row.ownerUser?.deptName }}
          </template>
        </el-table-column>
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="开始时间"
          prop="createTime"
          min-width="140"
        />
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="结束时间"
          prop="endTime"
          min-width="140"
        />
        <el-table-column align="center" label="审批状态" prop="status" min-width="90">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.BPM_TASK_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="审批建议" prop="reason" min-width="120" />
        <el-table-column align="center" label="耗时" prop="durationInMillis" width="100">
          <template #default="scope">
            {{ formatPast2(scope.row.durationInMillis) }}
          </template>
        </el-table-column>
      </el-table>
    </el-row>
  </el-dialog>
</template>
<script setup lang="ts">
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT } from '../consts'
import { useWatchNode, useNodeName2, useTaskStatusClass } from '../node'
import NodeHandler from '../NodeHandler.vue'
import UserTaskNodeConfig from '../nodes-config/UserTaskNodeConfig.vue'
import { dateFormatter, formatPast2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
defineOptions({
  name: 'UserTaskNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const emits = defineEmits<{
  'update:flowNode': [node: SimpleFlowNode | undefined]
  'find:parentNode': [nodeList: SimpleFlowNode[], nodeType: NodeType]
}>()

// 是否只读
const readonly = inject<Boolean>('readonly')
const tasks = inject<Ref<any[]>>('tasks', ref([]))
// 监控节点变化
const currentNode = useWatchNode(props)
// 节点名称编辑
const { showInput, blurEvent, clickTitle } = useNodeName2(currentNode, NodeType.START_USER_NODE)
const nodeSetting = ref()

const nodeClick = () => {
  if (readonly) {
    if (tasks && tasks.value) {
      dialogTitle.value = currentNode.value.name
      // 只读模式，弹窗显示任务信息
      selectTasks.value = tasks.value.filter(
        (item: any) => item?.taskDefinitionKey === currentNode.value.id
      )
      dialogVisible.value = true
    }
  } else {
    // 编辑模式，打开节点配置、把当前节点传递给配置组件
    nodeSetting.value.showUserTaskNodeConfig(currentNode.value)
    nodeSetting.value.openDrawer()
  }
}

const deleteNode = () => {
  emits('update:flowNode', currentNode.value.childNode)
}
// 查找可以驳回用户节点
const findReturnTaskNodes = (
  matchNodeList: SimpleFlowNode[] // 匹配的节点
) => {
  // 从父节点查找
  emits('find:parentNode', matchNodeList, NodeType.USER_TASK_NODE)
}

// 任务的弹窗显示，用于只读模式
const dialogVisible = ref(false) // 弹窗可见性
const dialogTitle = ref<string | undefined>(undefined) // 弹窗标题
const selectTasks = ref<any[] | undefined>([]) // 选中的任务数组
</script>
<style lang="scss" scoped></style>
