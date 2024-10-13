<template>
  <ContentWrap>
    <!-- 审批信息 -->
    <el-card
      v-for="(item, index) in runningTasks"
      :key="index"
      v-loading="processInstanceLoading"
      class="box-card"
    >
      <template #header>
        <span class="el-icon-picture-outline">审批任务【{{ item.name }}】</span>
      </template>
      <el-col :offset="6" :span="16">
        <el-form
          :ref="'form' + index"
          :model="auditForms[index]"
          :rules="auditRule"
          label-width="100px"
        >
          <el-form-item v-if="processInstance && processInstance.name" label="流程名">
            {{ processInstance.name }}
          </el-form-item>
          <el-form-item v-if="processInstance && processInstance.startUser" label="流程发起人">
            {{ processInstance?.startUser.nickname }}
            <el-tag size="small" type="info">{{ processInstance?.startUser.deptName }}</el-tag>
          </el-form-item>
          <el-card v-if="runningTasks[index].formId > 0" class="mb-15px !-mt-10px">
            <template #header>
              <span class="el-icon-picture-outline">
                填写表单【{{ runningTasks[index]?.formName }}】
              </span>
            </template>
            <form-create
              v-model="approveForms[index].value"
              v-model:api="approveFormFApis[index]"
              :option="approveForms[index].option"
              :rule="approveForms[index].rule"
            />
          </el-card>
          <el-form-item label="审批建议" prop="reason">
            <el-input
              v-model="auditForms[index].reason"
              placeholder="请输入审批建议"
              type="textarea"
            />
          </el-form-item>
          <el-form-item label="抄送人" prop="copyUserIds">
            <el-select v-model="auditForms[index].copyUserIds" multiple placeholder="请选择抄送人">
              <el-option
                v-for="itemx in userOptions"
                :key="itemx.id"
                :label="itemx.nickname"
                :value="itemx.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <div style="margin-bottom: 20px; margin-left: 10%; font-size: 14px">
          <!-- TODO @jason：建议搞个 if 来判断，替代现有的 !item.buttonsSetting || item.buttonsSetting[OpsButtonType.APPROVE]?.enable -->
          <el-button
            type="success"
            v-if="!item.buttonsSetting || item.buttonsSetting[OperationButtonType.APPROVE]?.enable"
            @click="handleAudit(item, true)"
          >
            <Icon icon="ep:select" />
            <!-- TODO @jason：这个也是类似哈，搞个方法来生成名字 -->
            {{
              item.buttonsSetting?.[OperationButtonType.APPROVE]?.displayName ||
              OPERATION_BUTTON_NAME.get(OperationButtonType.APPROVE)
            }}
          </el-button>
          <el-button
            v-if="!item.buttonsSetting || item.buttonsSetting[OperationButtonType.REJECT]?.enable"
            type="danger"
            @click="handleAudit(item, false)"
          >
            <Icon icon="ep:close" />
            {{
              item.buttonsSetting?.[OperationButtonType.REJECT].displayName ||
              OPERATION_BUTTON_NAME.get(OperationButtonType.REJECT)
            }}
          </el-button>
          <el-button
            v-if="!item.buttonsSetting || item.buttonsSetting[OperationButtonType.TRANSFER]?.enable"
            type="primary"
            @click="openTaskUpdateAssigneeForm(item.id)"
          >
            <Icon icon="ep:edit" />
            {{
              item.buttonsSetting?.[OperationButtonType.TRANSFER]?.displayName ||
              OPERATION_BUTTON_NAME.get(OperationButtonType.TRANSFER)
            }}
          </el-button>
          <el-button
            v-if="!item.buttonsSetting || item.buttonsSetting[OperationButtonType.DELEGATE]?.enable"
            type="primary"
            @click="handleDelegate(item)"
          >
            <Icon icon="ep:position" />
            {{
              item.buttonsSetting?.[OperationButtonType.DELEGATE]?.displayName ||
              OPERATION_BUTTON_NAME.get(OperationButtonType.DELEGATE)
            }}
          </el-button>
          <el-button
            v-if="!item.buttonsSetting || item.buttonsSetting[OperationButtonType.ADD_SIGN]?.enable"
            type="primary"
            @click="handleSign(item)"
          >
            <Icon icon="ep:plus" />
            {{
              item.buttonsSetting?.[OperationButtonType.ADD_SIGN]?.displayName ||
              OPERATION_BUTTON_NAME.get(OperationButtonType.ADD_SIGN)
            }}
          </el-button>
          <el-button
            v-if="!item.buttonsSetting || item.buttonsSetting[OperationButtonType.RETURN]?.enable"
            type="warning"
            @click="handleBack(item)"
          >
            <Icon icon="ep:back" />
            {{
              item.buttonsSetting?.[OperationButtonType.RETURN]?.displayName ||
              OPERATION_BUTTON_NAME.get(OperationButtonType.RETURN)
            }}
          </el-button>
        </div>
      </el-col>
    </el-card>

    <!-- 申请信息 -->
    <el-card v-loading="processInstanceLoading" class="box-card">
      <template #header>
        <span class="el-icon-document">申请信息【{{ processInstance.name }}】</span>
      </template>
      <!-- 情况一：流程表单 -->
      <el-col v-if="processInstance?.processDefinition?.formType === 10" :offset="6" :span="16">
        <form-create
          v-model="detailForm.value"
          v-model:api="fApi"
          :option="detailForm.option"
          :rule="detailForm.rule"
        />
      </el-col>
      <!-- 情况二：业务表单 -->
      <div v-if="processInstance?.processDefinition?.formType === 20">
        <BusinessFormComponent :id="processInstance.businessKey" />
      </div>
    </el-card>

    <!-- 审批记录 -->
    <ProcessInstanceTaskList
      :loading="tasksLoad"
      :process-instance="processInstance"
      :tasks="tasks"
      @refresh="getTaskList"
    />

    <!-- 高亮流程图 -->
    <ProcessInstanceBpmnViewer
      :id="`${id}`"
      :bpmn-xml="bpmnXml"
      :loading="processInstanceLoading"
      :process-instance="processInstance"
      :tasks="tasks"
    />

    <!-- 弹窗：转派审批人 -->
    <TaskTransferForm ref="taskTransferFormRef" @success="getDetail" />
    <!-- 弹窗：回退节点 -->
    <TaskReturnForm ref="taskReturnFormRef" @success="getDetail" />
    <!-- 弹窗：委派，将任务委派给别人处理，处理完成后，会重新回到原审批人手中-->
    <TaskDelegateForm ref="taskDelegateForm" @success="getDetail" />
    <!-- 弹窗：加签，当前任务审批人为A，向前加签选了一个C，则需要C先审批，然后再是A审批，向后加签B，A审批完，需要B再审批完，才算完成这个任务节点 -->
    <TaskSignCreateForm ref="taskSignCreateFormRef" @success="getDetail" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import { useUserStore } from '@/store/modules/user'
import { setConfAndFields2 } from '@/utils/formCreate'
import type { ApiAttrs } from '@form-create/element-ui/types/config'
import * as DefinitionApi from '@/api/bpm/definition'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import * as TaskApi from '@/api/bpm/task'
import ProcessInstanceBpmnViewer from './ProcessInstanceBpmnViewer.vue'
import ProcessInstanceTaskList from './ProcessInstanceTaskList.vue'
import TaskReturnForm from './dialog/TaskReturnForm.vue'
import TaskDelegateForm from './dialog/TaskDelegateForm.vue'
import TaskTransferForm from './dialog/TaskTransferForm.vue'
import TaskSignCreateForm from './dialog/TaskSignCreateForm.vue'
import { registerComponent } from '@/utils/routerHelper'
import { isEmpty } from '@/utils/is'
import * as UserApi from '@/api/system/user'
import {
  OperationButtonType,
  OPERATION_BUTTON_NAME
} from '@/components/SimpleProcessDesignerV2/src/consts'

defineOptions({ name: 'BpmProcessInstanceDetail' })

const { query } = useRoute() // 查询参数
const message = useMessage() // 消息弹窗
const { proxy } = getCurrentInstance() as any

const userId = useUserStore().getUser.id // 当前登录的编号
const id = query.id as unknown as string // 流程实例的编号
const processInstanceLoading = ref(false) // 流程实例的加载中
const processInstance = ref<any>({}) // 流程实例
const bpmnXml = ref('') // BPMN XML
const tasksLoad = ref(true) // 任务的加载中
const tasks = ref<any[]>([]) // 任务列表
// ========== 审批信息 ==========
const runningTasks = ref<any[]>([]) // 运行中的任务
const auditForms = ref<any[]>([]) // 审批任务的表单
const auditRule = reactive({
  reason: [{ required: true, message: '审批建议不能为空', trigger: 'blur' }]
})
const approveForms = ref<any[]>([]) // 审批通过时，额外的补充信息
const approveFormFApis = ref<ApiAttrs[]>([]) // approveForms 的 fAPi

// ========== 申请信息 ==========
const fApi = ref<ApiAttrs>() //
const detailForm = ref({
  rule: [],
  option: {},
  value: {}
}) // 流程实例的表单详情

/** 监听 approveFormFApis，实现它对应的 form-create 初始化后，隐藏掉对应的表单提交按钮 */
watch(
  () => approveFormFApis.value,
  (value) => {
    value?.forEach((api) => {
      api.btn.show(false)
      api.resetBtn.show(false)
    })
  },
  {
    deep: true
  }
)

/** 处理审批通过和不通过的操作 */
const handleAudit = async (task, pass) => {
  // 1.1 获得对应表单
  const index = runningTasks.value.indexOf(task)
  const auditFormRef = proxy.$refs['form' + index][0]
  // 1.2 校验表单
  const elForm = unref(auditFormRef)
  if (!elForm) return
  let valid = await elForm.validate()
  if (!valid) return
  // 校验申请表单（可编辑字段）
  // TODO @jason：之前这里是 if (!fApi.value) return；针对业务表单的情况下，会导致没办法审核，可能要看下。我这里改了点，看看是不是还有别的地方兼容性
  if (fApi.value) {
    valid = await fApi.value.validate()
    if (!valid) return
  }

  // 2.1 提交审批
  const data = {
    id: task.id,
    reason: auditForms.value[index].reason,
    copyUserIds: auditForms.value[index].copyUserIds
  }
  if (pass) {
    // 审批通过，并且有额外的 approveForm 表单，需要校验 + 拼接到 data 表单里提交
    const formCreateApi = approveFormFApis.value[index]
    if (formCreateApi) {
      await formCreateApi.validate()
      data.variables = approveForms.value[index].value
    }
    // 获取表单可编辑字段的值
    if (fApi.value) {
      data.variables = getWritableValueOfForm(task.fieldsPermission)
    }

    await TaskApi.approveTask(data)
    message.success('审批通过成功')
  } else {
    await TaskApi.rejectTask(data)
    message.success('审批不通过成功')
  }
  // 2.2 加载最新数据
  getDetail()
}

/** 转派审批人 */
const taskTransferFormRef = ref()
const openTaskUpdateAssigneeForm = (id: string) => {
  taskTransferFormRef.value.open(id)
}

/** 处理审批退回的操作 */
const taskDelegateForm = ref()
const handleDelegate = async (task) => {
  taskDelegateForm.value.open(task.id)
}

/** 处理审批退回的操作 */
const taskReturnFormRef = ref()
const handleBack = async (task: any) => {
  taskReturnFormRef.value.open(task.id)
}

/** 处理审批加签的操作 */
const taskSignCreateFormRef = ref()
const handleSign = async (task: any) => {
  taskSignCreateFormRef.value.open(task.id)
}

/** 获得详情 */
const getDetail = async () => {
  // 1. 获得流程任务列表（审批记录）。 需要先获取任务，表单的权限设置需要根据任务来设置
  await getTaskList()
  // 2. 获得流程实例相关
  getProcessInstance()
}

/** 加载流程实例 */
const BusinessFormComponent = ref(null) // 异步组件
const getProcessInstance = async () => {
  try {
    processInstanceLoading.value = true
    const data = await ProcessInstanceApi.getProcessInstance(id)
    if (!data) {
      message.error('查询不到流程信息！')
      return
    }
    processInstance.value = data

    // 设置表单信息
    const processDefinition = data.processDefinition
    if (processDefinition.formType === 10) {
      if (detailForm.value.rule.length > 0) {
        detailForm.value.value = data.formVariables
      } else {
        setConfAndFields2(
          detailForm,
          processDefinition.formConf,
          processDefinition.formFields,
          data.formVariables
        )
      }
      nextTick().then(() => {
        fApi.value?.btn.show(false)
        fApi.value?.resetBtn.show(false)
        fApi.value?.disabled(true)
        // 设置表单权限。后续需要改造成。只处理一个运行中的任务
        if (runningTasks.value.length > 0) {
          const task = runningTasks.value.at(0)
          if (task.fieldsPermission) {
            Object.keys(task.fieldsPermission).forEach((item) => {
              setFieldPermission(item, task.fieldsPermission[item])
            })
          }
        }
      })
    } else {
      // 注意：data.processDefinition.formCustomViewPath 是组件的全路径，例如说：/crm/contract/detail/index.vue
      BusinessFormComponent.value = registerComponent(data.processDefinition.formCustomViewPath)
    }

    // 加载流程图
    bpmnXml.value = (
      await DefinitionApi.getProcessDefinition(processDefinition.id as number)
    )?.bpmnXml
  } finally {
    processInstanceLoading.value = false
  }
}

/** 加载任务列表 */
const getTaskList = async () => {
  runningTasks.value = []
  auditForms.value = []
  approveForms.value = []
  approveFormFApis.value = []
  try {
    // 获得未取消的任务
    tasksLoad.value = true
    const data = await TaskApi.getTaskListByProcessInstanceId(id)
    tasks.value = []
    // 1.1 移除已取消的审批
    data.forEach((task) => {
      if (task.status !== 4) {
        tasks.value.push(task)
      }
    })
    // 1.2 排序，将未完成的排在前面，已完成的排在后面；
    tasks.value.sort((a, b) => {
      // 有已完成的情况，按照完成时间倒序
      if (a.endTime && b.endTime) {
        return b.endTime - a.endTime
      } else if (a.endTime) {
        return 1
      } else if (b.endTime) {
        return -1
        // 都是未完成，按照创建时间倒序
      } else {
        return b.createTime - a.createTime
      }
    })

    // 获得需要自己审批的任务
    loadRunningTask(tasks.value)
  } finally {
    tasksLoad.value = false
  }
}

/**
 * 设置 runningTasks 中的任务
 */
const loadRunningTask = (tasks) => {
  tasks.forEach((task) => {
    if (!isEmpty(task.children)) {
      loadRunningTask(task.children)
    }
    // 2.1 只有待处理才需要
    if (task.status !== 1 && task.status !== 6) {
      return
    }
    // 2.2 自己不是处理人
    if (!task.assigneeUser || task.assigneeUser.id !== userId) {
      return
    }

    // 2.3 添加到处理任务
    runningTasks.value.push({ ...task })
    auditForms.value.push({
      reason: '',
      copyUserIds: []
    })

    // 2.4 处理 approve 表单
    if (task.formId && task.formConf) {
      const approveForm = {}
      setConfAndFields2(approveForm, task.formConf, task.formFields, task.formVariables)
      approveForms.value.push(approveForm)
    } else {
      approveForms.value.push({}) // 占位，避免为空
    }
  })
}

/**
 * 设置表单权限
 */
const setFieldPermission = (field: string, permission: string) => {
  if (permission === '1') {
    fApi.value?.disabled(true, field)
  }
  if (permission === '2') {
    fApi.value?.disabled(false, field)
  }
  if (permission === '3') {
    fApi.value?.hidden(true, field)
  }
}
/**
 * 获取可以编辑字段的值
 */
const getWritableValueOfForm = (fieldsPermission: Object) => {
  const fieldsValue = {}
  if (fieldsPermission && fApi.value) {
    Object.keys(fieldsPermission).forEach((item) => {
      if (fieldsPermission[item] === '2') {
        fieldsValue[item] = fApi.value.getValue(item)
      }
    })
  }
  return fieldsValue
}

/** 初始化 */
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
onMounted(async () => {
  getDetail()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
})
</script>
