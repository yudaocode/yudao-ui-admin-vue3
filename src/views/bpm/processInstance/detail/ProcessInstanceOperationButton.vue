<template>
  <div
    class="h-50px bottom-10 text-14px flex items-center color-#32373c dark:color-#fff font-bold btn-container"
    v-if="runningTask.id"
  >
    <!-- 【通过】按钮 -->
    <el-popover
      :visible="passVisible"
      placement="top-end"
      :width="500"
      trigger="click"
      v-if="isShowButton(OperationButtonType.APPROVE)"
    >
      <template #reference>
        <el-button plain type="success" @click="openPopover('1')">
          <Icon icon="ep:select" />&nbsp; {{ getButtonDisplayName(OperationButtonType.APPROVE) }}
        </el-button>
      </template>
      <!-- 审批表单 -->
      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="auditForm"
          :rules="auditRule"
          label-width="100px"
        >
          <el-form-item v-if="processInstance && processInstance.startUser" label="流程发起人">
            {{ processInstance?.startUser.nickname }}
            <el-tag size="small" type="info" class="ml-8px">
              {{ processInstance?.startUser.deptName }}
            </el-tag>
          </el-form-item>
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
          <el-form-item label="审批建议" prop="reason">
            <el-input v-model="auditForm.reason" placeholder="请输入审批建议" type="textarea" />
          </el-form-item>
          <el-form-item label="抄送人" prop="copyUserIds">
            <el-select v-model="auditForm.copyUserIds" multiple placeholder="请选择抄送人">
              <el-option
                v-for="itemx in userOptions"
                :key="itemx.id"
                :label="itemx.nickname"
                :value="itemx.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button :disabled="formLoading" type="success" @click="handleAudit(true)">
              {{ getButtonDisplayName(OperationButtonType.APPROVE) }}
            </el-button>
            <el-button @click="passVisible = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【拒绝】按钮 -->
    <el-popover
      :visible="rejectVisible"
      placement="top-end"
      :width="500"
      trigger="click"
      v-if="isShowButton(OperationButtonType.REJECT)"
    >
      <template #reference>
        <el-button class="mr-20px" plain type="danger" @click="openPopover('2')">
          <Icon icon="ep:close" />&nbsp; {{ getButtonDisplayName(OperationButtonType.REJECT) }}
        </el-button>
      </template>
      <!-- 审批表单 -->
      <div class="flex flex-col flex-1 pt-20px px-20px" v-loading="formLoading">
        <el-form
          label-position="top"
          class="mb-auto"
          ref="formRef"
          :model="auditForm"
          :rules="auditRule"
          label-width="100px"
        >
          <el-form-item v-if="processInstance && processInstance.startUser" label="流程发起人">
            {{ processInstance?.startUser.nickname }}
            <el-tag size="small" type="info" class="ml-8px">
              {{ processInstance?.startUser.deptName }}
            </el-tag>
          </el-form-item>
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
          <el-form-item label="审批建议" prop="reason">
            <el-input v-model="auditForm.reason" placeholder="请输入审批建议" type="textarea" />
          </el-form-item>
          <el-form-item label="抄送人" prop="copyUserIds">
            <el-select v-model="auditForm.copyUserIds" multiple placeholder="请选择抄送人">
              <el-option
                v-for="itemx in userOptions"
                :key="itemx.id"
                :label="itemx.nickname"
                :value="itemx.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button :disabled="formLoading" type="danger" @click="handleAudit(false)">
              {{ getButtonDisplayName(OperationButtonType.REJECT) }}
            </el-button>
            <el-button @click="rejectVisible = false"> 取消 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-popover>

    <!-- 【抄送】按钮 -->
    <div @click="handleSend"> <Icon :size="14" icon="svg-icon:send" />&nbsp;抄送 </div>

    <!-- 【转交】按钮 -->
    <div @click="openTaskUpdateAssigneeForm" v-if="isShowButton(OperationButtonType.TRANSFER)">
      <Icon :size="14" icon="fa:share-square-o" />&nbsp;
      {{ getButtonDisplayName(OperationButtonType.TRANSFER) }}
    </div>

    <!-- 【委托】按钮 -->
    <div @click="handleDelegate" v-if="isShowButton(OperationButtonType.DELEGATE)">
      <Icon :size="14" icon="ep:position" />&nbsp;
      {{ getButtonDisplayName(OperationButtonType.DELEGATE) }}
    </div>

    <!-- 【加签】 -->
    <div @click="handleSign" v-if="isShowButton(OperationButtonType.ADD_SIGN)">
      <Icon :size="14" icon="ep:plus" />&nbsp;
      {{ getButtonDisplayName(OperationButtonType.ADD_SIGN) }}
    </div>
    <!-- TODO @jason：减签 -->

    <!-- 【退回】按钮 -->
    <div @click="handleBack" v-if="isShowButton(OperationButtonType.RETURN)">
      <Icon :size="14" icon="fa:mail-reply" />&nbsp;
      {{ getButtonDisplayName(OperationButtonType.RETURN) }}
    </div>

    <!--TODO @jason：撤回 -->
    <!--TODO @jason：再次发起 -->
  </div>

  <!-- 弹窗：转派审批人 -->
  <TaskTransferForm ref="taskTransferFormRef" @success="getDetail" />
  <!-- 弹窗：回退节点 -->
  <TaskReturnForm ref="taskReturnFormRef" @success="getDetail" />
  <!-- 弹窗：委派，将任务委派给别人处理，处理完成后，会重新回到原审批人手中-->
  <TaskDelegateForm ref="taskDelegateForm" @success="getDetail" />
  <!-- 弹窗：加签，当前任务审批人为A，向前加签选了一个C，则需要C先审批，然后再是A审批，向后加签B，A审批完，需要B再审批完，才算完成这个任务节点 -->
  <TaskSignCreateForm ref="taskSignCreateFormRef" @success="getDetail" />
</template>
<script lang="ts" setup>
import { setConfAndFields2 } from '@/utils/formCreate'
import { useUserStore } from '@/store/modules/user'
import * as TaskApi from '@/api/bpm/task'
import { propTypes } from '@/utils/propTypes'
import TaskReturnForm from './dialog/TaskReturnForm.vue'
import TaskDelegateForm from './dialog/TaskDelegateForm.vue'
import TaskTransferForm from './dialog/TaskTransferForm.vue'
import TaskSignCreateForm from './dialog/TaskSignCreateForm.vue'
import { isEmpty } from '@/utils/is'
import {
  OperationButtonType,
  OPERATION_BUTTON_NAME
} from '@/components/SimpleProcessDesignerV2/src/consts'
defineOptions({ name: 'ProcessInstanceBtnConatiner' })

const userId = useUserStore().getUser.id // 当前登录的编号
const message = useMessage() // 消息弹窗
const { proxy } = getCurrentInstance() as any
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
defineProps({
  processInstance: propTypes.any, // 流程实例信息
  userOptions: propTypes.any
})
const formLoading = ref(false) // 表单加载中
const passVisible = ref(false) // 是否显示
const rejectVisible = ref(false) // 是否显示
// ========== 审批信息 ==========
const runningTask = ref<any>({}) // 运行中的任务
const auditForm = ref<any>({}) // 审批任务的表单
const approveForm = ref<any>({}) // 审批通过时，额外的补充信息
const approveFormFApi = ref<any>({}) // approveForms 的 fAPi
const formRef = ref()
const auditRule = reactive({
  reason: [{ required: true, message: '审批建议不能为空', trigger: 'blur' }]
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

// TODO @jaosn：具体的审批任务，要不改成后端返回。让前端弱化下
/**
 * 设置 runningTasks 中的任务
 */
const loadRunningTask = (tasks: any[]) => {
  runningTask.value = {}
  auditForm.value = {}
  approveForm.value = {}
  approveFormFApi.value = {}
  tasks.forEach((task: any) => {
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
    runningTask.value = { ...task }
    auditForm.value = {
      reason: '',
      copyUserIds: []
    }

    // 2.4 处理 approve 表单
    if (task.formId && task.formConf) {
      const tempApproveForm = {}
      setConfAndFields2(tempApproveForm, task.formConf, task.formFields, task.formVariables)
      approveForm.value = tempApproveForm
    } else {
      approveForm.value = {} // 占位，避免为空
    }
  })
}

/** 处理审批通过和不通过的操作 */
const handleAudit = async (pass: any) => {
  formLoading.value = true
  try {
    const auditFormRef = proxy.$refs['formRef']
    // 1.2 校验表单
    const elForm = unref(auditFormRef)
    if (!elForm) return
    const valid = await elForm.validate()
    if (!valid) return

    // 2.1 提交审批
    const data = {
      id: runningTask.value.id,
      reason: auditForm.value.reason,
      copyUserIds: auditForm.value.copyUserIds
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
      message.success('审批通过成功')
    } else {
      await TaskApi.rejectTask(data)
      message.success('审批不通过成功')
    }
    // 2.2 加载最新数据
    getDetail()
  } finally {
    formLoading.value = false
  }
}

/* 抄送 TODO */
const handleSend = () => {}

// TODO 代码优化：这里 flag 改成 approve: boolean 。因为 flag 目前就只有 1 和 2
const openPopover = (flag) => {
  passVisible.value = false
  rejectVisible.value = false
  formRef.value.resetFields()
  flag === '1' ? (passVisible.value = true) : (rejectVisible.value = true)
}

/** 转派审批人 */
const taskTransferFormRef = ref()
const openTaskUpdateAssigneeForm = () => {
  taskTransferFormRef.value.open(runningTask.value.id)
}

/** 处理审批退回的操作 */
const taskDelegateForm = ref()
const handleDelegate = async () => {
  taskDelegateForm.value.open(runningTask.value.id)
}

/** 处理审批退回的操作 */
const taskReturnFormRef = ref()
const handleBack = async () => {
  taskReturnFormRef.value.open(runningTask.value.id)
}

/** 处理审批加签的操作 */
const taskSignCreateFormRef = ref()
const handleSign = async () => {
  taskSignCreateFormRef.value.open(runningTask.value.id)
}
/** 获得详情 */
const getDetail = () => {
  emit('success')
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

defineExpose({ loadRunningTask })
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
