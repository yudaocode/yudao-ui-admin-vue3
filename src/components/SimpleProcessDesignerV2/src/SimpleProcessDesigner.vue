<template>
  <div class="simple-flow-canvas" v-loading="loading">
    <div class="simple-flow-container">
      <div class="top-area-container">
        <div class="top-actions">
          <div class="canvas-control">
            <span class="control-scale-group">
              <span class="control-scale-button"> <Icon icon="ep:plus" @click="zoomOut()" /></span>
              <span class="control-scale-label">{{ scaleValue }}%</span>
              <span class="control-scale-button"><Icon icon="ep:minus" @click="zoomIn()" /></span>
            </span>
          </div>
          <el-button type="primary" @click="saveSimpleFlowModel">保存</el-button>
          <!-- <el-button type="primary">全局设置</el-button> -->
        </div>
      </div>
      <div class="scale-container" :style="`transform: scale(${scaleValue / 100});`">
        <ProcessNodeTree v-if="processNodeTree" v-model:flow-node="processNodeTree" />
      </div>
    </div>
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
import ProcessNodeTree from './ProcessNodeTree.vue'
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
const router = useRouter() // 路由
const props = defineProps({
  modelId: {
    type: String,
    required: true
  }
})
const loading = ref(true)
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

const message = useMessage() // 国际化
const processNodeTree = ref<SimpleFlowNode | undefined>()
const errorDialogVisible = ref(false)
let errorNodes: SimpleFlowNode[] = []
const saveSimpleFlowModel = async () => {
  if (!props.modelId) {
    message.error('缺少模型 modelId 编号')
    return
  }
  errorNodes = []
  validateNode(processNodeTree.value, errorNodes)
  if (errorNodes.length > 0) {
    errorDialogVisible.value = true
    return
  }
  const data = {
    id: props.modelId,
    simpleModel: processNodeTree.value
  }

  const result = await updateBpmSimpleModel(data)
  if (result) {
    message.success('修改成功')
    close()
  } else {
    message.alert('修改失败')
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
      validateNode(node.childNode, errorNodes)
    }

    if (type === NodeType.USER_TASK_NODE) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }
    if (type === NodeType.COPY_TASK_NODE) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }
    if (type === NodeType.CONDITION_NODE) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }

    if (type == NodeType.CONDITION_BRANCH_NODE) {
      conditionNodes?.forEach((item) => {
        validateNode(item, errorNodes)
      })
      validateNode(node.childNode, errorNodes)
    }
  }
}

const close = () => {
  router.push({ path: '/bpm/manager/model' })
}
let scaleValue = ref(100)
const MAX_SCALE_VALUE = 200
const MIN_SCALE_VALUE = 50
// 放大
const zoomOut = () => {
  if (scaleValue.value == MAX_SCALE_VALUE) {
    return
  }
  scaleValue.value += 10
}
// 缩小
const zoomIn = () => {
  if (scaleValue.value == MIN_SCALE_VALUE) {
    return
  }
  scaleValue.value -= 10
}

onMounted(async () => {
  try {
    loading.value = true
    // 获取表单字段
    const bpmnModel = await getModel(props.modelId)
    if (bpmnModel) {
      formType.value = bpmnModel.formType
      if (formType.value === 10) {
        const bpmnForm = (await getForm(bpmnModel.formId)) as unknown as FormVO
        formFields.value = bpmnForm?.fields
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

    // 获取 SIMPLE 设计器模型
    const result = await getBpmSimpleModel(props.modelId)
    if (result) {
      processNodeTree.value = result
    } else {
      // 初始值
      processNodeTree.value = {
        name: '发起人',
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
</script>
