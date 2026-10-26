<template>
  <EmployeeDetailsHeader :employee="employee" :loading="detailLoading">
    <el-space wrap>
      <el-button
        v-hasPermi="['hrm:employee:update']"
        :disabled="!employee.id"
        type="primary"
        @click="openEmployeeForm"
      >
        <Icon icon="ep:edit" class="mr-5px" />编辑
      </el-button>
      <el-button
        v-if="employee.entryStatus === HrmEmployeeEntryStatus.PENDING_ENTRY"
        v-hasPermi="['hrm:employee:update']"
        type="success"
        plain
        @click="handleConfirmEntry"
      >
        <Icon icon="ep:circle-check" class="mr-5px" />确认入职
      </el-button>
      <el-button
        v-if="employee.entryStatus === HrmEmployeeEntryStatus.LEFT"
        v-hasPermi="['hrm:employee:update']"
        type="warning"
        plain
        @click="openRehire"
      >
        <Icon icon="ep:refresh" class="mr-5px" />办理再入职
      </el-button>
      <el-dropdown
        v-if="changeableEntryStatuses.includes(employee.entryStatus || 0)"
        v-hasPermi="['hrm:employee:update']"
        trigger="click"
        @command="openChangeAction"
      >
        <el-button type="primary" plain>
          <Icon icon="ep:sort" class="mr-5px" />办理异动
          <Icon icon="ep:arrow-down" class="ml-5px" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="action in changeActionOptions"
              :key="action.changeType"
              :command="action.changeType"
            >
              <Icon :icon="action.icon" class="mr-5px" />{{ action.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown v-if="moreActionOptions.length" trigger="click" @command="handleMoreCommand">
        <el-button plain> 更多<Icon icon="ep:arrow-down" class="ml-5px" /> </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="(action, index) in moreActionOptions"
              :key="action.command"
              :command="action.command"
              :divided="index > 0 && action.command === 'delete'"
            >
              <Icon :icon="action.icon" class="mr-5px" />{{ action.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-space>
  </EmployeeDetailsHeader>

  <el-col v-loading="detailLoading">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="岗位信息" name="post">
        <EmployeePostInfo
          ref="postInfoRef"
          :employee="employee"
          :employee-id="employeeId"
          @edit-quit="openQuit"
          @refresh="getEmployeeData"
        />
      </el-tab-pane>
      <el-tab-pane label="基本信息" name="basic" lazy>
        <EmployeeBasicInfo :employee="employee" :employee-id="employeeId" />
      </el-tab-pane>
      <el-tab-pane label="员工合同" name="contract" lazy>
        <ContentWrap title="合同信息">
          <EmployeeContractList :employee-id="employeeId" />
        </ContentWrap>
      </el-tab-pane>
      <el-tab-pane label="工资社保" name="salary" lazy>
        <EmployeeSalarySocialSecurity :employee-id="employeeId" />
      </el-tab-pane>
      <el-tab-pane label="材料附件" name="file" lazy>
        <EmployeeMaterialFiles :employee-id="employeeId" @success="getOperateLog" />
      </el-tab-pane>
      <el-tab-pane label="操作记录" name="operateLog">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <EmployeeForm ref="employeeFormRef" @success="getEmployeeData" />
  <!-- 表单弹窗：员工转正 -->
  <EmployeeRegularForm ref="regularFormRef" @success="handleEmployeeChangeSuccess" />
  <!-- 表单弹窗：员工调岗 -->
  <EmployeeTransferForm ref="transferFormRef" @success="handleEmployeeChangeSuccess" />
  <!-- 表单弹窗：员工晋升 -->
  <EmployeePromoteForm ref="promoteFormRef" @success="handleEmployeeChangeSuccess" />
  <!-- 表单弹窗：员工降级 -->
  <EmployeeDemoteForm ref="demoteFormRef" @success="handleEmployeeChangeSuccess" />
  <!-- 表单弹窗：员工转为全职 -->
  <EmployeeFullTimeForm ref="fullTimeFormRef" @success="handleEmployeeChangeSuccess" />
  <!-- 表单弹窗：员工离职 -->
  <EmployeeQuitForm ref="quitFormRef" @success="handleEmployeeQuitSuccess" />
</template>

<script lang="ts" setup>
import { parseId, isPositiveId } from '@/utils/id'

import { ElMessageBox } from 'element-plus'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { checkPermi } from '@/utils/permission'
import type { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/hrm/operate-log'
import * as EmployeeApi from '@/api/hrm/employee'
import EmployeeDemoteForm from '../EmployeeDemoteForm.vue'
import EmployeeForm from '../EmployeeForm.vue'
import EmployeeFullTimeForm from '../EmployeeFullTimeForm.vue'
import EmployeePromoteForm from '../EmployeePromoteForm.vue'
import EmployeeQuitForm from '../EmployeeQuitForm.vue'
import EmployeeRegularForm from '../EmployeeRegularForm.vue'
import EmployeeTransferForm from '../EmployeeTransferForm.vue'
import EmployeeBasicInfo from './EmployeeBasicInfo.vue'
import EmployeeContractList from './EmployeeContractList.vue'
import EmployeeDetailsHeader from './EmployeeDetailsHeader.vue'
import EmployeeMaterialFiles from './EmployeeMaterialFiles.vue'
import EmployeePostInfo from './EmployeePostInfo.vue'
import EmployeeSalarySocialSecurity from './EmployeeSalarySocialSecurity.vue'
import {
  HrmBizType,
  HrmEmployeeChangeType,
  HrmEmployeeEntryStatus,
  HrmEmployeeStatus
} from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmEmployeeDetail' })

const message = useMessage() // 消息弹窗
const route = useRoute() // 路由
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作

const employeeId = (parseId(route.params.id) as number) // 员工编号
const detailLoading = ref(true) // 详情的加载中
const employee = ref<EmployeeApi.HrmEmployeeVO>({} as EmployeeApi.HrmEmployeeVO) // 员工详情
const logList = ref<OperateLogVO[]>([]) // 操作日志列表
const activeTab = ref('post') // 当前选中的页签
const changeableEntryStatuses: number[] = [
  HrmEmployeeEntryStatus.ACTIVE,
  HrmEmployeeEntryStatus.PENDING_LEAVE
] // 允许办理异动的入职状态

/** 员工异动操作 */
const changeActionOptions = computed(() => {
  const actions: Array<{ label: string; changeType: number; icon: string }> = [
    { label: '调整部门/岗位', changeType: HrmEmployeeChangeType.TRANSFER, icon: 'ep:sort' },
    { label: '晋升', changeType: HrmEmployeeChangeType.PROMOTION, icon: 'ep:top' },
    { label: '降级', changeType: HrmEmployeeChangeType.DEMOTION, icon: 'ep:bottom' }
  ]
  if (employee.value.status === HrmEmployeeStatus.PROBATION) {
    actions.unshift({
      label: '办理转正',
      changeType: HrmEmployeeChangeType.REGULAR,
      icon: 'ep:circle-check'
    })
  }
  if (
    employee.value.status === HrmEmployeeStatus.INTERN ||
    employee.value.status === HrmEmployeeStatus.PART_TIME
  ) {
    actions.push({
      label: '转为全职',
      changeType: HrmEmployeeChangeType.FULL_TIME,
      icon: 'ep:user-filled'
    })
  }
  return actions
})

/** 更多操作选项 */
const moreActionOptions = computed(() => {
  const actions: Array<{ label: string; command: string; icon: string }> = []
  if (
    employee.value.entryStatus === HrmEmployeeEntryStatus.ACTIVE &&
    checkPermi(['hrm:employee:update'])
  ) {
    actions.push({ label: '设置离职', command: 'quit', icon: 'ep:remove' })
  }
  if (
    employee.value.entryStatus === HrmEmployeeEntryStatus.PENDING_LEAVE &&
    checkPermi(['hrm:employee:update'])
  ) {
    actions.push({ label: '取消离职', command: 'cancelQuit', icon: 'ep:refresh-left' })
  }
  if (
    employee.value.entryStatus === HrmEmployeeEntryStatus.LEFT &&
    checkPermi(['hrm:employee:update'])
  ) {
    actions.push({ label: '修改离职信息', command: 'quit', icon: 'ep:edit' })
  }
  if (checkPermi(['hrm:employee:delete'])) {
    actions.push({ label: '删除', command: 'delete', icon: 'ep:delete' })
  }
  return actions
})

/** 关闭窗口 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmEmployee' })
}

/** 获取详情 */
async function getEmployeeData() {
  detailLoading.value = true
  try {
    const data = await EmployeeApi.getEmployee(employeeId)
    if (!data) {
      message.warning('员工档案不存在')
      close()
      return
    }
    employee.value = data
    await getOperateLog()
  } finally {
    detailLoading.value = false
  }
}

/** 获取操作日志 */
async function getOperateLog() {
  const data = await getOperateLogPage({ bizType: HrmBizType.EMPLOYEE, bizId: employeeId })
  logList.value = data.list
}

const employeeFormRef = ref<InstanceType<typeof EmployeeForm>>() // 员工表单 Ref

/** 确认员工入职 */
function handleConfirmEntry() {
  employeeFormRef.value?.open('confirm', employeeId)
}

/** 编辑员工档案 */
function openEmployeeForm() {
  employeeFormRef.value?.open('update', employeeId)
}

/** 办理员工再入职 */
function openRehire() {
  employeeFormRef.value?.open('rehire', employeeId)
}

const regularFormRef = ref<InstanceType<typeof EmployeeRegularForm>>() // 转正表单 Ref
const transferFormRef = ref<InstanceType<typeof EmployeeTransferForm>>() // 调岗表单 Ref
const promoteFormRef = ref<InstanceType<typeof EmployeePromoteForm>>() // 晋升表单 Ref
const demoteFormRef = ref<InstanceType<typeof EmployeeDemoteForm>>() // 降级表单 Ref
const fullTimeFormRef = ref<InstanceType<typeof EmployeeFullTimeForm>>() // 转全职表单 Ref

/** 打开员工异动表单 */
function openChangeAction(command: string | number | object) {
  const changeType = Number(command)
  if (changeType === HrmEmployeeChangeType.REGULAR) {
    regularFormRef.value?.open(employee.value)
    return
  }
  if (changeType === HrmEmployeeChangeType.TRANSFER) {
    transferFormRef.value?.open(employee.value)
    return
  }
  if (changeType === HrmEmployeeChangeType.PROMOTION) {
    promoteFormRef.value?.open(employee.value)
    return
  }
  if (changeType === HrmEmployeeChangeType.DEMOTION) {
    demoteFormRef.value?.open(employee.value)
    return
  }
  if (changeType === HrmEmployeeChangeType.FULL_TIME) {
    fullTimeFormRef.value?.open(employee.value)
  }
}

const quitFormRef = ref<InstanceType<typeof EmployeeQuitForm>>() // 员工离职表单 Ref

/** 打开员工离职表单 */
function openQuit() {
  quitFormRef.value?.open(employee.value)
}

/** 取消离职 */
async function handleCancelQuit() {
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入取消员工“${employee.value.name}”离职安排的原因`,
      '取消离职',
      {
        inputValidator: (reason: string) => {
          if (!reason.trim()) {
            return '取消原因不能为空'
          }
          return reason.length <= 500 || '取消原因不能超过 500 个字符'
        }
      }
    )
    await EmployeeApi.cancelEmployeeQuit({ employeeId, reason: value })
    message.success('已取消离职')
    await handleEmployeeQuitSuccess()
  } catch {}
}

/** 删除员工档案 */
async function handleDelete() {
  // 删除的二次确认
  await message.delConfirm(`确认删除员工“${employee.value.name}”的档案吗？`)
  // 发起删除
  await EmployeeApi.deleteEmployee(employeeId)
  message.success('删除成功')
  close()
}

/** 处理更多操作 */
function handleMoreCommand(command: string) {
  if (command === 'quit') {
    openQuit()
  } else if (command === 'cancelQuit') {
    handleCancelQuit()
  } else if (command === 'delete') {
    handleDelete()
  }
}

const postInfoRef = ref<InstanceType<typeof EmployeePostInfo>>() // 岗位信息 Ref

/** 员工异动成功 */
async function handleEmployeeChangeSuccess() {
  await Promise.all([getEmployeeData(), postInfoRef.value?.refreshChangeRecordList()])
}

/** 员工离职信息变更成功 */
async function handleEmployeeQuitSuccess() {
  await Promise.all([getEmployeeData(), postInfoRef.value?.refreshQuitInfo()])
}

/** 初始化 */
onMounted(async () => {
  if (!isPositiveId(employeeId)) {
    message.warning('参数错误，员工编号不能为空！')
    close()
    return
  }
  await getEmployeeData()
})
</script>
