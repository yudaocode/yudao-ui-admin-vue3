<template>
  <div v-loading="loading" class="overflow-auto">
    <SimpleProcessModel
      ref="simpleProcessModelRef"
      v-if="processNodeTree"
      :flow-node="processNodeTree"
      :readonly="false"
      @save="saveSimpleFlowModel"
    />
    <Dialog v-model="errorDialogVisible" title="保存失败" width="400" :fullscreen="false">
      <div class="mb-2">以下节点内容不完善，请修改后保存</div>
      <div
        class="mb-3 b-rounded-1 bg-gray-100 p-2 line-height-normal"
        v-for="(item, index) in errorNodes"
        :key="index"
      >
        {{ item.name }} : {{ NODE_DEFAULT_TEXT.get(item.type) }}
      </div>
      <template #footer>
        <el-button type="primary" @click="errorDialogVisible = false">知道了</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import SimpleProcessModel from './SimpleProcessModel.vue'
import { updateBpmSimpleModel, getBpmSimpleModel } from '@/api/bpm/simple'
import { SimpleFlowNode, NodeType, NodeId, NODE_DEFAULT_TEXT } from './consts'
import { getModel } from '@/api/bpm/model'
import { getForm, FormVO } from '@/api/bpm/form'
import { handleTree } from '@/utils/tree'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'

defineOptions({
  name: 'SimpleProcessDesigner'
})

const emits = defineEmits(['success']) // 保存成功事件

const props = defineProps({
  modelId: {
    type: String,
    required: false
  },
  modelKey: {
    type: String,
    required: false
  },
  modelName: {
    type: String,
    required: false
  },
  // 可发起流程的人员编号
  startUserIds : {
    type: Array,
    required: false
  }
})

const loading = ref(false)
const formFields = ref<string[]>([])
const formType = ref(20)
const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const deptOptions = ref<DeptApi.DeptVO[]>([]) // 部门列表
const deptTreeOptions = ref()
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表
provide('formFields', formFields)
provide('formType', formType)
provide('roleList', roleOptions)
provide('postList', postOptions)
provide('userList', userOptions)
provide('deptList', deptOptions)
provide('userGroupList', userGroupOptions)
provide('deptTree', deptTreeOptions)
provide('startUserIds', props.startUserIds)

const message = useMessage() // 国际化
const processNodeTree = ref<SimpleFlowNode | undefined>()
const errorDialogVisible = ref(false)
let errorNodes: SimpleFlowNode[] = []

// 添加更新模型的方法
const updateModel = (key?: string, name?: string) => {
  if (!processNodeTree.value) {
    processNodeTree.value = {
      name: name || '发起人',
      type: NodeType.START_USER_NODE,
      id: NodeId.START_USER_NODE_ID,
      childNode: {
        id: NodeId.END_EVENT_NODE_ID,
        name: '结束',
        type: NodeType.END_EVENT_NODE
      }
    }
  } else if (name) {
    // 更新现有模型的名称
    processNodeTree.value.name = name
  }
}

// 监听属性变化
watch([() => props.modelKey, () => props.modelName], ([newKey, newName]) => {
  if (!props.modelId && newKey && newName) {
    updateModel(newKey, newName)
  }
}, { immediate: true, deep: true })

const saveSimpleFlowModel = async (simpleModelNode: SimpleFlowNode) => {
  if (!simpleModelNode) {
    message.error('模型数据为空')
    return
  }
  try {
    loading.value = true
    if (props.modelId) {
      // 编辑模式
      const data = {
        id: props.modelId,
        simpleModel: simpleModelNode
      }
      const result = await updateBpmSimpleModel(data)
      if (result) {
        message.success('修改成功')
        emits('success')
      } else {
        message.alert('修改失败')
      }
    } else {
      // 新建模式，直接返回数据
      emits('success', simpleModelNode)
    }
  } finally {
    loading.value = false
  }
}

// 校验节点设置。 暂时以 showText 为空 未节点错误配置
const validateNode = (node: SimpleFlowNode | undefined, errorNodes: SimpleFlowNode[]) => {
  if (node) {
    const { type, showText, conditionNodes } = node
    if (type == NodeType.END_EVENT_NODE) {
      return
    }
    if (type == NodeType.START_USER_NODE) {
      // 发起人节点暂时不用校验，直接校验孩子节点
      validateNode(node.childNode, errorNodes)
    }

    if (
      type === NodeType.USER_TASK_NODE ||
      type === NodeType.COPY_TASK_NODE ||
      type === NodeType.CONDITION_NODE
    ) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }

    if (
      type == NodeType.CONDITION_BRANCH_NODE ||
      type == NodeType.PARALLEL_BRANCH_NODE ||
      type == NodeType.INCLUSIVE_BRANCH_NODE
    ) {
      // 分支节点
      // 1. 先校验各个分支
      conditionNodes?.forEach((item) => {
        validateNode(item, errorNodes)
      })
      // 2. 校验孩子节点
      validateNode(node.childNode, errorNodes)
    }
  }
}

onMounted(async () => {
  try {
    loading.value = true
    // 获取表单字段
    if (props.modelId) {
      const bpmnModel = await getModel(props.modelId)
      if (bpmnModel) {
        formType.value = bpmnModel.formType
        if (formType.value === 10) {
          const bpmnForm = (await getForm(bpmnModel.formId)) as unknown as FormVO
          formFields.value = bpmnForm?.fields
          console.log('formFields.value', formFields.value)
        }
      }
    }
    // 获得角色列表
    roleOptions.value = await RoleApi.getSimpleRoleList()
    // 获得岗位列表
    postOptions.value = await PostApi.getSimplePostList()
    // 获得用户列表
    userOptions.value = await UserApi.getSimpleUserList()
    // 获得部门列表
    deptOptions.value = await DeptApi.getSimpleDeptList()

    deptTreeOptions.value = handleTree(deptOptions.value as DeptApi.DeptVO[], 'id')
    // 获取用户组列表
    userGroupOptions.value = await UserGroupApi.getUserGroupSimpleList()

    if (props.modelId) {
      //获取 SIMPLE 设计器模型
      const result = await getBpmSimpleModel(props.modelId)
      if (result) {
        processNodeTree.value = result
      }
    }
    
    // 如果没有现有模型，创建初始模型
    if (!processNodeTree.value) {
      processNodeTree.value = {
        name: props.modelName || '发起人',
        type: NodeType.START_USER_NODE,
        id: NodeId.START_USER_NODE_ID,
        childNode: {
          id: NodeId.END_EVENT_NODE_ID,
          name: '结束',
          type: NodeType.END_EVENT_NODE
        }
      }
    }
  } finally {
    loading.value = false
  }
})

const simpleProcessModelRef = ref()

/** 获取当前流程数据 */
const getCurrentFlowData = async () => {
  if (simpleProcessModelRef.value) {
    return await simpleProcessModelRef.value.getCurrentFlowData()
  }
  return undefined
}

defineExpose({
  getCurrentFlowData,
  updateModel
})
</script>
