<template>
  <Dialog v-model="dialogVisible" title="从后台用户批量建档" width="96%" top="4vh">
    <div class="mb-16px flex items-center gap-12px">
      <span class="whitespace-nowrap">选择未建档用户</span>
      <UserSelectV2
        v-model="selectedUserIds"
        multiple
        :disabled-ids="boundUserIds"
        placeholder="请选择后台用户"
        class="!w-520px"
        @change="handleUserChange"
      />
      <span class="text-12px text-[var(--el-text-color-secondary)]">
        已选择 {{ formData.employees.length }} 人，已绑定员工档案的用户不可选
      </span>
    </div>

    <el-form ref="formRef" :model="formData" label-position="top">
      <el-table
        v-loading="loading"
        :data="formData.employees"
        border
        stripe
        max-height="calc(100vh - 300px)"
        row-key="userId"
      >
        <el-table-column label="后台用户" min-width="170" fixed>
          <template #default="{ row }">
            <div>{{ row.nickname || '-' }}</div>
            <div class="text-12px text-[var(--el-text-color-secondary)]">{{ row.username }}</div>
          </template>
        </el-table-column>
        <el-table-column label="手机号" min-width="170">
          <template #default="{ row }">
            <el-form-item
              :prop="`employees.${row.index}.mobile`"
              :rules="[{ required: true, message: '请输入手机号', trigger: 'blur' }]"
              class="!mb-0"
            >
              <el-input v-model="row.mobile" placeholder="请输入手机号" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="部门" min-width="180">
          <template #default="{ row }">
            <DeptSelect v-model="row.deptId" class="!w-1/1" />
          </template>
        </el-table-column>
        <el-table-column label="工号" min-width="150">
          <template #default="{ row }">
            <el-form-item
              :prop="`employees.${row.index}.jobNumber`"
              :rules="[{ required: true, message: '请输入工号', trigger: 'blur' }]"
              class="!mb-0"
            >
              <el-input v-model="row.jobNumber" maxlength="64" placeholder="请输入工号" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="直属上级" min-width="190">
          <template #default="{ row }">
            <HrmEmployeeSelect v-model="row.leaderEmployeeId" placeholder="请选择直属上级" />
          </template>
        </el-table-column>
        <el-table-column label="岗位" min-width="170">
          <template #default="{ row }">
            <el-input v-model="row.postName" maxlength="255" placeholder="请输入岗位" />
          </template>
        </el-table-column>
        <el-table-column label="入职时间" min-width="190">
          <template #default="{ row }">
            <el-form-item
              :prop="`employees.${row.index}.entryTime`"
              :rules="[{ required: true, message: '请选择入职时间', trigger: 'change' }]"
              class="!mb-0"
            >
              <el-date-picker
                v-model="row.entryTime"
                type="datetime"
                value-format="x"
                class="!w-1/1"
                placeholder="请选择入职时间"
              />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="聘用形式" min-width="130">
          <template #default="{ row }">
            <el-select v-model="row.type" class="!w-1/1" @change="handleTypeChange(row)">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="试用期/状态" min-width="150">
          <template #default="{ row }">
            <el-input-number
              v-if="row.type === HrmEmployeeType.FORMAL"
              v-model="row.probation"
              :min="0"
              :max="6"
              controls-position="right"
              class="!w-1/1"
            />
            <el-select v-else v-model="row.status" class="!w-1/1" placeholder="请选择状态">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_STATUS).filter((item) =>
                  (HRM_EMPLOYEE_NON_FORMAL_STATUSES as readonly number[]).includes(
                    Number(item.value)
                  )
                )"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" @click="removeRow($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>

    <template #footer>
      <el-button type="primary" :loading="loading" @click="submitForm">确认建档</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type * as UserApi from '@/api/system/user'
import * as EmployeeApi from '@/api/hrm/employee'
import type { HrmEmployeeCreateFromUserReqVO } from '@/api/hrm/employee'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import HrmEmployeeSelect from './components/HrmEmployeeSelect.vue'
import {
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HrmEmployeeStatus,
  HrmEmployeeType
} from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmEmployeeCreateFromUserForm' })

type EmployeeRow = HrmEmployeeCreateFromUserReqVO & {
  index: number
  username: string
  nickname: string
}

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 加载中
const formData = reactive<{
  employees: EmployeeRow[]
}>({
  employees: []
}) // 表单数据
const selectedUserIds = ref<number[]>([]) // 选中的用户编号
const boundUserIds = ref<number[]>([]) // 已绑定员工档案的用户编号
const formRef = ref<FormInstance>() // 表单 Ref

/** 打开批量建档弹窗 */
async function open() {
  dialogVisible.value = true
  selectedUserIds.value = []
  formData.employees = []
  loading.value = true
  try {
    // 获取已绑定用户编号
    boundUserIds.value = await EmployeeApi.getBoundUserIdList()
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开组件

const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调

/** 根据系统用户选择结果生成可编辑的员工行 */
function handleUserChange(value: UserApi.UserVO | UserApi.UserVO[] | undefined) {
  const users = Array.isArray(value) ? value : value ? [value] : []
  const oldRows = new Map(formData.employees.map((row) => [row.userId, row]))
  formData.employees = users.map((user, index) => {
    const oldRow = oldRows.get(user.id)
    if (oldRow) {
      oldRow.index = index
      return oldRow
    }
    return {
      index,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      mobile: user.mobile || '',
      jobNumber: '',
      deptId: user.deptId,
      type: HrmEmployeeType.FORMAL,
      probation: 0,
      entryTime: Date.now(),
      postName: '',
      postLevel: '',
      workCity: '',
      workAddress: '',
      remark: ''
    }
  })
}

/** 切换聘用形式时清理互斥字段 */
function handleTypeChange(row: EmployeeRow) {
  if (row.type === HrmEmployeeType.FORMAL) {
    row.status = undefined
    row.probation = row.probation ?? 0
  } else {
    row.probation = undefined
    row.status = row.status ?? HrmEmployeeStatus.INTERN
  }
}

/** 移除待建档用户 */
function removeRow(index: number) {
  const removedUserId = formData.employees[index]?.userId
  selectedUserIds.value = selectedUserIds.value.filter((userId) => userId !== removedUserId)
  formData.employees.splice(index, 1)
  formData.employees.forEach((row, itemIndex) => (row.index = itemIndex))
}

/** 提交批量建档 */
async function submitForm() {
  if (formData.employees.length === 0) {
    message.warning('请先选择未建档的后台用户')
    return
  }
  // 校验表单
  if (!formRef.value || !(await formRef.value.validate())) {
    return
  }
  // 提交请求
  loading.value = true
  try {
    const result = await EmployeeApi.createEmployeeList(formData.employees)
    message.success(`已创建 ${result.length} 份员工档案，开通通知将在事务提交后发送`)
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
