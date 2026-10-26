<template>
  <!-- 页面头部 -->
  <ContentWrap>
    <el-page-header content="薪资档案详情" @back="close" />
  </ContentWrap>

  <!-- 员工信息 -->
  <EmployeeDetailsHeader :employee="employee" :loading="loading">
    <el-button
      v-hasPermi="['hrm:salary:employee-info:update']"
      :disabled="!employee.id"
      type="primary"
      @click="openSetSalary()"
    >
      <Icon class="mr-5px" icon="ep:edit" />{{ salaryEmployee.id ? '调薪' : '定薪' }}
    </el-button>
  </EmployeeDetailsHeader>

  <!-- 薪资档案和调薪记录 -->
  <div v-loading="loading" class="mt-10px">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="薪资档案" name="salaryEmployee">
        <SalaryEmployeeInfoDetails :salary-employee="salaryEmployee" />
      </el-tab-pane>
      <el-tab-pane label="调薪记录" lazy name="records">
        <SalaryChangeRecordList
          ref="changeRecordListRef"
          :employee-id="id"
          @change="getData"
          @edit="openSetSalary"
        />
      </el-tab-pane>
    </el-tabs>
  </div>

  <!-- 定薪/调薪表单 -->
  <SalaryEmployeeInfoForm ref="employeeInfoFormRef" @success="handleSalaryUpdated" />
</template>

<script lang="ts" setup>
import { parseId, isPositiveId } from '@/utils/id'

import { useTagsViewStore } from '@/store/modules/tagsView'
import * as EmployeeApi from '@/api/hrm/employee'
import * as SalaryChangeRecordApi from '@/api/hrm/salary/change-record'
import * as SalaryEmployeeInfoApi from '@/api/hrm/salary/employee-info'
import EmployeeDetailsHeader from '@/views/hrm/employee/detail/EmployeeDetailsHeader.vue'
import SalaryEmployeeInfoForm from '../SalaryEmployeeInfoForm.vue'
import SalaryChangeRecordList from './SalaryChangeRecordList.vue'
import SalaryEmployeeInfoDetails from './SalaryEmployeeInfoDetails.vue'

defineOptions({ name: 'HrmSalaryEmployeeInfoDetail' })

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作
const id = (parseId(route.params.id) as number) // 员工编号
const loading = ref(false) // 详情加载中
const employee = ref<EmployeeApi.HrmEmployeeVO>({} as EmployeeApi.HrmEmployeeVO) // 员工档案
const salaryEmployee = ref<SalaryEmployeeInfoApi.SalaryEmployeeInfoVO>({}) // 薪资档案
const activeTab = ref('salaryEmployee') // 当前页签
const employeeInfoFormRef = ref<InstanceType<typeof SalaryEmployeeInfoForm>>() // 定薪/调薪表单
const changeRecordListRef = ref<InstanceType<typeof SalaryChangeRecordList>>() // 定薪/调薪记录

/** 关闭详情 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmSalaryEmployeeInfo' })
}

/** 查询详情 */
async function getData() {
  loading.value = true
  try {
    const [employeeData, salaryEmployeeData] = await Promise.all([
      EmployeeApi.getEmployee(id),
      SalaryEmployeeInfoApi.getSalaryEmployeeInfo(id)
    ])
    if (!employeeData) {
      message.warning('员工档案不存在')
      close()
      return
    }
    employee.value = employeeData
    salaryEmployee.value = salaryEmployeeData || {}
  } finally {
    loading.value = false
  }
}

/** 打开定薪/调薪表单 */
function openSetSalary(record?: SalaryChangeRecordApi.SalaryChangeRecordVO) {
  employeeInfoFormRef.value?.open(id, record?.id)
}

/** 刷新薪资档案和调薪记录 */
async function handleSalaryUpdated() {
  await getData()
  await changeRecordListRef.value?.getList()
}

/** 初始化 */
async function init() {
  if (!isPositiveId(id)) {
    message.warning('参数错误，员工不能为空！')
    close()
    return
  }
  await getData()
}

/** 初始化 */
onMounted(() => {
  init()
})
</script>
