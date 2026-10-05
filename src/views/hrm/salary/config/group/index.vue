<template>
  <doc-alert
    title="【薪资】计薪设置、薪资档案、月度工资、工资条"
    url="https://doc.iocoder.cn/hrm/salary/config/"
  />

  <!-- 操作栏 -->
  <ContentWrap>
    <el-button
      v-hasPermi="['hrm:salary:group:create']"
      plain
      type="primary"
      @click="openForm('create')"
    >
      <Icon class="mr-5px" icon="ep:plus" />新增
    </el-button>
  </ContentWrap>

  <!-- 薪资组列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column
        label="薪资组名称"
        align="center"
        prop="name"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column label="计薪标准" align="center" prop="salaryStandard" width="110">
        <template #default="scope">{{ scope.row.salaryStandard ?? 0 }} 天/月</template>
      </el-table-column>
      <el-table-column
        label="计税规则"
        align="center"
        prop="taxRuleName"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column
        label="调薪规则"
        align="center"
        prop="changeRule"
        min-width="220"
        show-overflow-tooltip
      />
      <el-table-column align="center" label="适用范围" min-width="180">
        <template #default="scope">
          {{ formatSalaryGroupScope(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button
            v-hasPermi="['hrm:salary:group:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id!)"
          >
            <Icon icon="ep:edit" />编辑
          </el-button>
          <el-button
            v-hasPermi="['hrm:salary:group:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id!)"
          >
            <Icon icon="ep:delete" />删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 薪资组表单 -->
  <SalaryGroupForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import * as SalaryGroupApi from '@/api/hrm/salary/config/group'
import { formatSalaryGroupScope } from '@/views/hrm/utils/format'
import SalaryGroupForm from './SalaryGroupForm.vue'

defineOptions({ name: 'HrmSalaryGroup' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表加载中
const total = ref(0) // 列表总数
const list = ref<SalaryGroupApi.SalaryGroupVO[]>([]) // 薪资组列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
}) // 查询参数
const formRef = ref<InstanceType<typeof SalaryGroupForm>>() // 薪资组表单

/** 查询薪资组列表 */
async function getList() {
  loading.value = true
  try {
    const data = await SalaryGroupApi.getSalaryGroupPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开新增/修改表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 删除薪资组 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SalaryGroupApi.deleteSalaryGroup(id)
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
