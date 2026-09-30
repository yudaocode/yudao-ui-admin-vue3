<template>
  <doc-alert title="【员工】员工管理" url="https://doc.iocoder.cn/hrm/employee/" />

  <template v-if="accessible">
    <ContentWrap>
      <div class="flex items-center justify-between">
        <span class="text-18px font-600">我的档案</span>
        <el-button @click="refreshEmployee">
          <Icon icon="ep:refresh" class="mr-5px" />刷新
        </el-button>
      </div>
    </ContentWrap>

    <el-col v-loading="loading">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="base">
          <EmployeeBaseInfo
            ref="baseInfoRef"
            :employee="employee"
            :field-config-list="fieldConfigList"
            @edit="openEmployeeForm"
          />
        </el-tab-pane>
        <el-tab-pane label="岗位信息" name="post" lazy>
          <EmployeePostInfo ref="postInfoRef" :employee="employee" />
        </el-tab-pane>
      </el-tabs>
    </el-col>

    <EmployeeForm ref="employeeFormRef" @success="getEmployee" />
  </template>
</template>

<script lang="ts" setup>
import type { HrmEmployeeFieldConfigVO } from '@/api/hrm/employee/config'
import * as EmployeeApi from '@/api/hrm/portal/employee'
import * as EmployeeFieldConfigApi from '@/api/hrm/portal/employee/field-config'
import { checkHrmPortalAccess } from '@/views/hrm/utils/employee'
import EmployeeBaseInfo from './EmployeeBaseInfo.vue'
import EmployeeForm from './EmployeeForm.vue'
import EmployeePostInfo from './EmployeePostInfo.vue'

defineOptions({ name: 'HrmPortalEmployee' })

const router = useRouter() // 路由
const accessible = ref(false) // 是否允许访问员工端
const loading = ref(false) // 页面加载中
const activeTab = ref('base') // 当前页签
const employee = ref<EmployeeApi.HrmPortalEmployeeVO>({} as EmployeeApi.HrmPortalEmployeeVO) // 当前员工档案
const fieldConfigList = ref<HrmEmployeeFieldConfigVO[]>([]) // 员工档案字段配置
const baseInfoRef = ref<InstanceType<typeof EmployeeBaseInfo>>() // 基本信息 Ref
const postInfoRef = ref<InstanceType<typeof EmployeePostInfo>>() // 岗位信息 Ref
const employeeFormRef = ref<InstanceType<typeof EmployeeForm>>() // 员工档案表单 Ref

/** 获得当前员工档案和字段配置 */
async function getEmployee() {
  loading.value = true
  try {
    const [employeeData, fields] = await Promise.all([
      EmployeeApi.getEmployee(),
      EmployeeFieldConfigApi.getEmployeeFieldConfigList()
    ])
    employee.value = employeeData
    fieldConfigList.value = fields
  } finally {
    loading.value = false
  }
}

/** 刷新当前员工档案页面 */
async function refreshEmployee() {
  await getEmployee()
  if (activeTab.value === 'base') {
    await baseInfoRef.value?.getList()
  } else {
    await postInfoRef.value?.getQuitInfo()
  }
}

/** 打开员工档案编辑表单 */
function openEmployeeForm() {
  employeeFormRef.value?.open(employee.value, fieldConfigList.value)
}

/** 页面激活时刷新员工档案 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router)
  if (!accessible.value) {
    return
  }
  await getEmployee()
})
</script>
