<template>
  <div
    class="h-50px bottom-10 text-14px flex items-center color-#32373c dark:color-#fff font-bold btn-container"
    v-if="runningTask && runningTask.id"
  >
    <!-- 【通过】按钮 -->
    <el-popover
      :visible="popOverVisible.approve"
      placement="top-end"
      :width="420"
      trigger="click"
      v-if=" isHandleTaskStatus() && isShowButton(OperationButtonType.APPROVE)"
    >
      <template #reference>
        <el-button plain type="success" @click="openPopover('approve')">
          <Icon icon="ep:select" />&nbsp; {{ getButtonDisplayName(OperationButtonType.APPROVE) }}
        </el-button>
      </template>
      <!-- 审批表单 -->
      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="genericForm"
          :rules="genericRule"
          label-width="100px"
        >
          <el-card v-if="runningTask.formId > 0" class="mb-15px !-mt-10px">
            <template #header>
              <span class="el-icon-picture-outline"> 填写表单【{{ runningTask?.formName }}】 </span>
            </template>
            <form-create
              v-model="approveForm.value"
              v-model:api="approveFormFApi"
              :option="approveForm.option"
              :rule="approveForm.rule"
            />
          </el-card>
          <el-form-item label="审批意见" prop="reason">
            <el-input
              v-model="genericForm.reason"
              placeholder="请输入审批意见"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
          <el-form-item>
            <el-button :disabled="formLoading" type="success" @click="handleAudit(true)">
              {{ getButtonDisplayName(OperationButtonType.APPROVE) }}
            </el-button>
            <el-button @click="popOverVisible.approve = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【拒绝】按钮 -->
    <el-popover
      :visible="popOverVisible.reject"
      placement="top-end"
      :width="420"
      trigger="click"
      v-if=" isHandleTaskStatus() && isShowButton(OperationButtonType.REJECT)"
    >
      <template #reference>
        <el-button class="mr-20px" plain type="danger" @click="openPopover('reject')">
          <Icon icon="ep:close" />&nbsp; {{ getButtonDisplayName(OperationButtonType.REJECT) }}
        </el-button>
      </template>
      <!-- 审批表单 -->
      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="genericForm"
          :rules="genericRule"
          label-width="100px"
        >
          <el-card v-if="runningTask.formId > 0" class="mb-15px !-mt-10px">
            <template #header>
              <span class="el-icon-picture-outline"> 填写表单【{{ runningTask?.formName }}】 </span>
            </template>
            <form-create
              v-model="approveForm.value"
              v-model:api="approveFormFApi"
              :option="approveForm.option"
              :rule="approveForm.rule"
            />
          </el-card>
          <el-form-item label="审批意见" prop="reason">
            <el-input
              v-model="genericForm.reason"
              placeholder="请输入审批意见"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
          <el-form-item>
            <el-button :disabled="formLoading" type="danger" @click="handleAudit(false)">
              {{ getButtonDisplayName(OperationButtonType.REJECT) }}
            </el-button>
            <el-button @click="popOverVisible.reject = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【抄送】按钮 -->
    <el-popover
      :visible="popOverVisible.copy"
      placement="top-start"
      :width="420"
      trigger="click"
      v-if="isHandleTaskStatus() && isShowButton(OperationButtonType.COPY)"
    >
      <template #reference>
        <div @click="openPopover('copy')" class="hover-bg-gray-100 rounded-xl p-6px">
          <Icon :size="14" icon="svg-icon:send" />&nbsp;
          {{ getButtonDisplayName(OperationButtonType.COPY) }}
        </div>
      </template>
      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="genericForm"
          :rules="genericRule"
          label-width="100px"
        >
          <el-form-item label="抄送人" prop="copyUserIds">
            <el-select
              v-model="genericForm.copyUserIds"
              clearable
              style="width: 100%"
              multiple
              placeholder="请选择抄送人"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="抄送意见" prop="copyReason">
            <el-input
              v-model="genericForm.copyReason"
              clearable
              placeholder="请输入抄送意见"
              type="textarea"
              :rows="3"
            />
          </el-form-item>

          <el-form-item>
            <el-button :disabled="formLoading" type="primary" @click="handleCopy">
              {{ getButtonDisplayName(OperationButtonType.COPY) }}
            </el-button>
            <el-button @click="popOverVisible.copy = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【转交】按钮 -->
    <el-popover
      :visible="popOverVisible.transfer"
      placement="top-start"
      :width="420"
      trigger="click"
      v-if=" isHandleTaskStatus() && isShowButton(OperationButtonType.TRANSFER)"
    >
      <template #reference>
        <div @click="openPopover('transfer')" class="hover-bg-gray-100 rounded-xl p-6px">
          <Icon :size="14" icon="fa:share-square-o" />&nbsp;
          {{ getButtonDisplayName(OperationButtonType.TRANSFER) }}
        </div>
      </template>
      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="genericForm"
          :rules="genericRule"
          label-width="100px"
        >
          <el-form-item label="新审批人" prop="assigneeUserId">
            <el-select v-model="genericForm.assigneeUserId" clearable style="width: 100%">
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="审批意见" prop="reason">
            <el-input
              v-model="genericForm.reason"
              clearable
              placeholder="请输入审批意见"
              type="textarea"
              :rows="3"
            />
          </el-form-item>

          <el-form-item>
            <el-button :disabled="formLoading" type="primary" @click="handleTransfer()">
              {{ getButtonDisplayName(OperationButtonType.TRANSFER) }}
            </el-button>
            <el-button @click="popOverVisible.transfer = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【委派】按钮 -->
    <el-popover
      :visible="popOverVisible.delegate"
      placement="top-start"
      :width="420"
      trigger="click"
      v-if="isHandleTaskStatus() && isShowButton(OperationButtonType.DELEGATE)"
    >
      <template #reference>
        <div @click="openPopover('delegate')" class="hover-bg-gray-100 rounded-xl p-6px">
          <Icon :size="14" icon="ep:position" />&nbsp;
          {{ getButtonDisplayName(OperationButtonType.DELEGATE) }}
        </div>
      </template>

      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="genericForm"
          :rules="genericRule"
          label-width="100px"
        >
          <el-form-item label="接收人" prop="delegateUserId">
            <el-select v-model="genericForm.delegateUserId" clearable style="width: 100%">
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="审批意见" prop="reason">
            <el-input
              v-model="genericForm.reason"
              clearable
              placeholder="请输入审批意见"
              type="textarea"
              :rows="3"
            />
          </el-form-item>

          <el-form-item>
            <el-button :disabled="formLoading" type="primary" @click="handleDelegate()">
              {{ getButtonDisplayName(OperationButtonType.DELEGATE) }}
            </el-button>
            <el-button @click="popOverVisible.delegate = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【加签】按钮 当前任务审批人为A，向前加签选了一个C，则需要C先审批，然后再是A审批，向后加签B，A审批完，需要B再审批完，才算完成这个任务节点 -->
    <el-popover
      :visible="popOverVisible.addSign"
      placement="top-start"
      :width="420"
      trigger="click"
      v-if="isHandleTaskStatus() && isShowButton(OperationButtonType.ADD_SIGN)"
    >
      <template #reference>
        <div @click="openPopover('addSign')" class="hover-bg-gray-100 rounded-xl p-6px">
          <Icon :size="14" icon="ep:plus" />&nbsp;
          {{ getButtonDisplayName(OperationButtonType.ADD_SIGN) }}
        </div>
      </template>

      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="genericForm"
          :rules="genericRule"
          label-width="100px"
        >
          <el-form-item label="加签处理人" prop="addSignUserIds">
            <el-select v-model="genericForm.addSignUserIds" multiple clearable style="width: 100%">
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="审批意见" prop="reason">
            <el-input
              v-model="genericForm.reason"
              clearable
              placeholder="请输入审批意见"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item>
            <el-button :disabled="formLoading" type="primary" @click="handlerAddSign('before')">
              向前{{ getButtonDisplayName(OperationButtonType.ADD_SIGN) }}
            </el-button>
            <el-button :disabled="formLoading" type="primary" @click="handlerAddSign('after')">
              向后{{ getButtonDisplayName(OperationButtonType.ADD_SIGN) }}
            </el-button>
            <el-button @click="popOverVisible.addSign = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【减签】按钮 -->
    <div
      @click="openChildrenTask()"
      class="hover-bg-gray-100 rounded-xl p-6px"
      v-if="runningTask.children"
    >
      <Icon :size="14" icon="ep:semi-select" />&nbsp; 减签
    </div>

    <!-- 【退回】按钮 -->
    <el-popover
      :visible="popOverVisible.return"
      placement="top-start"
      :width="420"
      trigger="click"
      v-if="isHandleTaskStatus() && isShowButton(OperationButtonType.RETURN)"
    >
      <template #reference>
        <div @click="openReturnPopover" class="hover-bg-gray-100 rounded-xl p-6px">
          <Icon :size="14" icon="fa:mail-reply" />&nbsp;
          {{ getButtonDisplayName(OperationButtonType.RETURN) }}
        </div>
      </template>
      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="genericForm"
          :rules="genericRule"
          label-width="100px"
        >
          <el-form-item label="退回节点" prop="targetTaskDefinitionKey">
            <el-select v-model="genericForm.targetTaskDefinitionKey" clearable style="width: 100%">
              <el-option
                v-for="item in returnList"
                :key="item.taskDefinitionKey"
                :label="item.name"
                :value="item.taskDefinitionKey"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="退回理由" prop="returnReason">
            <el-input
              v-model="genericForm.returnReason"
              clearable
              placeholder="请输入退回理由"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item>
            <el-button :disabled="formLoading" type="primary" @click="handleReturn()">
              {{ getButtonDisplayName(OperationButtonType.RETURN) }}
            </el-button>
            <el-button @click="popOverVisible.return = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 弹窗：子任务  -->
    <TaskSignList ref="taskSignListRef" @success="reload" />
    <!--TODO @jason：撤回 -->
    <!--TODO @jason：再次发起 -->
  </div>
</template>
<script lang="ts" setup>
import TaskSignList from './dialog/TaskSignList.vue'
import { setConfAndFields2 } from '@/utils/formCreate'
import * as TaskApi from '@/api/bpm/task'
import { propTypes } from '@/utils/propTypes'
import {
  OperationButtonType,
  OPERATION_BUTTON_NAME
} from '@/components/SimpleProcessDesignerV2/src/consts'
defineOptions({ name: 'ProcessInstanceBtnConatiner' })

const message = useMessage() // 消息弹窗
const { proxy } = getCurrentInstance() as any
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const props = defineProps({
  processInstanceId: propTypes.string, // 流程实例信息
  userOptions: propTypes.any
})
const formLoading = ref(false) // 表单加载中
/** 气泡卡是否展示 */
const popOverVisible = ref({
  approve: false,
  reject: false,
  transfer: false,
  delegate: false,
  addSign: false,
  return: false,
  copy: false
})
/** 退回节点 */
const returnList = ref([] as any)
// ========== 审批信息 ==========
const runningTask = ref<any>({}) // 运行中的任务
const genericForm = ref<any>({}) // 通用表单
const approveForm = ref<any>({}) // 审批通过时，额外的补充信息
const approveFormFApi = ref<any>({}) // approveForms 的 fAPi
const formRef = ref()
/** 表单校验规则 */
const genericRule = reactive({
  reason: [{ required: true, message: '审批意见不能为空', trigger: 'blur' }],
  returnReason: [{ required: true, message: '退回理由不能为空', trigger: 'blur' }],
  copyUserIds: [{ required: true, message: '抄送人不能为空', trigger: 'change' }],
  assigneeUserId: [{ required: true, message: '新审批人不能为空', trigger: 'change' }],
  delegateUserId: [{ required: true, message: '接收人不能为空', trigger: 'change' }],
  addSignUserIds: [{ required: true, message: '加签处理人不能为空', trigger: 'change' }]
})

/** 监听 approveFormFApis，实现它对应的 form-create 初始化后，隐藏掉对应的表单提交按钮 */
watch(
  () => approveFormFApi.value,
  (val) => {
    val?.btn?.show(false)
    val?.resetBtn?.show(false)
  },
  {
    deep: true
  }
)

/** 弹出退回气泡卡 */
const openReturnPopover = async () => {
  returnList.value = await TaskApi.getTaskListByReturn(runningTask.value.id)
  if (returnList.value.length === 0) {
    message.warning('当前没有可退回的节点')
    return
  }
  openPopover('return')
}
/** 弹出气泡卡 */
const openPopover = (type: string) => {
  Object.keys(popOverVisible.value).forEach((item) => {
    if (item === type) {
      popOverVisible.value[item] = true
    } else {
      popOverVisible.value[item] = false
    }
  })
  formRef.value.resetFields()
}

/** 处理审批通过和不通过的操作 */
const handleAudit = async (pass: boolean) => {
  formLoading.value = true
  try {
    const genericFormRef = proxy.$refs['formRef']
    // 1.2 校验表单
    const elForm = unref(genericFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return

    // 2.1 提交审批
    const data = {
      id: runningTask.value.id,
      reason: genericForm.value.reason
    }
    if (pass) {
      // 审批通过，并且有额外的 approveForm 表单，需要校验 + 拼接到 data 表单里提交
      const formCreateApi = approveFormFApi.value
      if (Object.keys(formCreateApi)?.length > 0) {
        await formCreateApi.validate()
        // @ts-ignore
        data.variables = approveForm.value.value
      }
      await TaskApi.approveTask(data)
      popOverVisible.value.approve = false
      message.success('审批通过成功')
    } else {
      await TaskApi.rejectTask(data)
      popOverVisible.value.reject = false
      message.success('审批不通过成功')
    }
    // 2.2 加载最新数据
    reload()
  } finally {
    formLoading.value = false
  }
}

/* 处理抄送 */
const handleCopy = async () => {
  formLoading.value = true
  try {
    const copyFormRef = proxy.$refs['formRef']
    // 1. 校验表单
    const elForm = unref(copyFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return
    // 2. 提交抄送
    const data = {
      id: runningTask.value.id,
      reason: genericForm.value.copyReason,
      copyUserIds: genericForm.value.copyUserIds
    }
    await TaskApi.copyTask(data)
    popOverVisible.value.copy = false
    message.success('操作成功')
  } finally {
    formLoading.value = false
  }
}

/** 处理转交 */
const handleTransfer = async () => {
  formLoading.value = true
  try {
    const transferFormRef = proxy.$refs['formRef']
    // 1.1 校验表单
    const elForm = unref(transferFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return
    // 1.2 提交转交
    const data = {
      id: runningTask.value.id,
      reason: genericForm.value.reason,
      assigneeUserId: genericForm.value.assigneeUserId
    }

    await TaskApi.transferTask(data)
    popOverVisible.value.transfer = false
    message.success('操作成功')
    // 2. 加载最新数据
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 处理委派 */
const handleDelegate = async () => {
  formLoading.value = true
  try {
    const deletegateFormRef = proxy.$refs['formRef']
    // 1.1 校验表单
    const elForm = unref(deletegateFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return
    // 1.2 处理委派
    const data = {
      id: runningTask.value.id,
      reason: genericForm.value.reason,
      delegateUserId: genericForm.value.delegateUserId
    }

    await TaskApi.delegateTask(data)
    popOverVisible.value.delegate = false
    message.success('操作成功')
    // 2. 加载最新数据
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 处理加签 */
const handlerAddSign = async (type: string) => {
  formLoading.value = true
  try {
    const transferFormRef = proxy.$refs['formRef']
    // 1.1 校验表单
    const elForm = unref(transferFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return
    // 1.2 提交加签
    const data = {
      id: runningTask.value.id,
      type,
      reason: genericForm.value.reason,
      userIds: genericForm.value.addSignUserIds
    }
    await TaskApi.signCreateTask(data)
    message.success('操作成功')
    popOverVisible.value.addSign = false
    // 2 加载最新数据
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 处理退回 */
const handleReturn = async () => {
  formLoading.value = true
  try {
    const returnFormRef = proxy.$refs['formRef']
    // 1.1 校验表单
    const elForm = unref(returnFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return
    // 1.2 提交退回
    const data = {
      id: runningTask.value.id,
      reason: genericForm.value.returnReason,
      targetTaskDefinitionKey: genericForm.value.targetTaskDefinitionKey
    }

    await TaskApi.returnTask(data)
    popOverVisible.value.return = false
    message.success('操作成功')
    // 2 重新加载数据
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 子任务 */
const taskSignListRef = ref()
const openChildrenTask = () => {
  taskSignListRef.value.open(runningTask.value)
}

/** 重新加载数据 */
const reload = () => {
  emit('success')
}

/** 任务是否为处理中状态 */
const isHandleTaskStatus = () => {
  let canHandle = false
  if (
    TaskApi.TaskStatusEnum.RUNNING === runningTask.value.status ||
    TaskApi.TaskStatusEnum.DELEGATE === runningTask.value.status
  ) {
    canHandle = true
  }
  return canHandle
}

/** 是否显示按钮 */
const isShowButton = (btnType: OperationButtonType): boolean => {
  let isShow = true
  if (runningTask.value.buttonsSetting && runningTask.value.buttonsSetting[btnType]) {
    isShow = runningTask.value.buttonsSetting[btnType].enable
  }
  return isShow
}

/** 获取按钮的显示名称 */
const getButtonDisplayName = (btnType: OperationButtonType) => {
  let displayName = OPERATION_BUTTON_NAME.get(btnType)
  if (runningTask.value.buttonsSetting && runningTask.value.buttonsSetting[btnType]) {
    displayName = runningTask.value.buttonsSetting[btnType].displayName
  }
  return displayName
}

const loadTodoTask = (task: any) => {
  genericForm.value = {}
  approveForm.value = {}
  approveFormFApi.value = {}
  runningTask.value = task
  // 处理 approve 表单.
  if (task && task.formId && task.formConf) {
    const tempApproveForm = {}
    setConfAndFields2(tempApproveForm, task.formConf, task.formFields, task.formVariables)
    approveForm.value = tempApproveForm
  } else {
    approveForm.value = {} // 占位，避免为空
  }
}

defineExpose({ loadTodoTask })

</script>

<style lang="scss" scoped>
:deep(.el-affix--fixed) {
  background-color: var(--el-bg-color);
}

.btn-container {
  > div {
    display: flex;
    margin: 0 15px;
    cursor: pointer;
    align-items: center;

    &:hover {
      color: #6db5ff;
    }
  }
}
</style>
