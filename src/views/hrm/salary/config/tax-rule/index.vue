<template>
  <doc-alert
    title="【薪资】计薪设置、薪资档案、月度工资、工资条"
    url="https://doc.iocoder.cn/hrm/salary/config/"
  />

  <!-- 操作栏 -->
  <ContentWrap>
    <el-button
      v-hasPermi="['hrm:salary:tax-rule:create']"
      plain
      type="primary"
      @click="openForm('create')"
    >
      <Icon class="mr-5px" icon="ep:plus" />新增计税规则
    </el-button>
  </ContentWrap>

  <!-- 计税规则列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column
        label="方案名称"
        align="center"
        prop="name"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column label="个税类型" align="center" prop="type" width="140">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.HRM_SALARY_TAX_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="计税周期" align="center" prop="cycleType" min-width="360">
        <template #default="scope">
          {{
            HrmSalaryTaxCycleTypeOptions.find((item) => item.value === scope.row.cycleType)
              ?.label || '-'
          }}
        </template>
      </el-table-column>
      <el-table-column label="是否计税" align="center" prop="taxEnabled" width="100">
        <template #default="scope">
          <template v-if="scope.row.taxEnabled == null">-</template>
          <el-tag v-else :type="scope.row.taxEnabled ? 'success' : 'info'">
            {{ scope.row.taxEnabled ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="起征点" align="center" prop="threshold" width="120">
        <template #default="scope">
          {{ scope.row.threshold == null ? '-' : `${scope.row.threshold}元/月` }}
        </template>
      </el-table-column>
      <el-table-column label="个税结果保留小数位" align="center" prop="decimalScale" width="170">
        <template #default="scope">
          {{ scope.row.decimalScale == null ? '-' : `保留${scope.row.decimalScale}位小数` }}
        </template>
      </el-table-column>
      <el-table-column label="适用薪资组" align="center" min-width="170">
        <template #default="scope"> {{ scope.row.usedGroupCount ?? 0 }}个薪资组正在使用 </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="140" fixed="right">
        <template #default="scope">
          <el-button
            v-hasPermi="['hrm:salary:tax-rule:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['hrm:salary:tax-rule:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 计税规则表单 -->
  <SalaryTaxRuleForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as SalaryTaxRuleApi from '@/api/hrm/salary/config/tax-rule'
import { HrmSalaryTaxCycleTypeOptions } from '@/views/hrm/utils/constants'
import SalaryTaxRuleForm from './SalaryTaxRuleForm.vue'

defineOptions({ name: 'HrmSalaryTaxRule' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 列表加载中
const list = ref<SalaryTaxRuleApi.SalaryTaxRuleVO[]>([]) // 计税规则列表
const formRef = ref<InstanceType<typeof SalaryTaxRuleForm>>() // 计税规则表单

/** 查询计税规则列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await SalaryTaxRuleApi.getSalaryTaxRuleList()
  } finally {
    loading.value = false
  }
}

/** 打开计税规则表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 删除计税规则 */
async function handleDelete(id?: number) {
  if (!id) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SalaryTaxRuleApi.deleteSalaryTaxRule(id)
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
