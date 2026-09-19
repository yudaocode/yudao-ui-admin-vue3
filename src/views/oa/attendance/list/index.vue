<template>
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="员工" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="考勤类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择考勤类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_ATTENDANCE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="考勤状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择考勤状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_ATTENDANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="考勤时间" prop="attendanceTime">
        <el-date-picker
          v-model="queryParams.attendanceTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="员工" prop="userName" align="center" min-width="120" />
      <el-table-column label="部门" prop="deptName" align="center" min-width="120" />
      <el-table-column label="考勤类型" align="center" width="110">
        <template #default="scope">
          <DictTag :type="DICT_TYPE.OA_ATTENDANCE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="考勤状态" align="center" width="100">
        <template #default="scope">
          <DictTag :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="考勤时间"
        prop="attendanceTime"
        :formatter="dateFormatter"
        align="center"
        width="180"
      />
      <el-table-column label="考勤 IP" prop="attendanceIp" align="center" min-width="130" />
      <el-table-column
        label="备注"
        prop="remark"
        align="center"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column label="操作" align="center" width="140">
        <template #default="scope">
          <el-button
            type="primary"
            link
            v-hasPermi="['oa:attendance:update']"
            @click="openForm(scope.row.id)"
          >
            修改
          </el-button>
          <el-button
            type="danger"
            link
            v-hasPermi="['oa:attendance:delete']"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 修改考勤记录弹窗 -->
  <OaAttendanceForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as AttendanceApi from '@/api/oa/attendance'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import OaAttendanceForm from './OaAttendanceForm.vue'

defineOptions({ name: 'OaAttendanceList' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<AttendanceApi.OaAttendanceVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  attendanceTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await AttendanceApi.getAttendancePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 修改操作 */
const formRef = ref()
const openForm = (id: number) => {
  formRef.value.open(id)
}

/** 删除操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await AttendanceApi.deleteAttendance(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
