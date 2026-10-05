<template>
  <doc-alert
    title="【设置】账套管理、财务参数、财务指标"
    url="https://doc.iocoder.cn/fms/config/account-set/"
  />
  <!-- 操作工作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" :inline="true">
      <el-form-item>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['fms:config:finance-indicator:create']"
          v-if="fmsStore.isAccountSetWritable"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" stripe>
      <el-table-column label="名称" prop="name" min-width="160" />
      <el-table-column label="编码" prop="code" min-width="140" />
      <el-table-column label="取数报表" align="center" width="140">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.FMS_FINANCE_INDICATOR_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="公式" prop="formula" min-width="280" show-overflow-tooltip />
      <el-table-column label="排序" prop="sort" width="90" />
      <el-table-column label="状态" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="160">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['fms:config:finance-indicator:update']"
            v-if="fmsStore.isAccountSetWritable"
          >
            <Icon icon="ep:edit" />编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row)"
            v-hasPermi="['fms:config:finance-indicator:delete']"
            v-if="fmsStore.isAccountSetWritable"
          >
            <Icon icon="ep:delete" />删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 添加或修改财务指标对话框 -->
  <FmsFinanceIndicatorForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { FmsFinanceIndicatorApi } from '@/api/fms/config/finance-indicator'
import type { FmsFinanceIndicatorVO } from '@/api/fms/config/finance-indicator'
import { DICT_TYPE } from '@/utils/dict'
import { useFmsStore } from '@/views/fms/store/fms'
import FmsFinanceIndicatorForm from './FmsFinanceIndicatorForm.vue'

defineOptions({ name: 'FmsFinanceIndicator' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const fmsStore = useFmsStore() // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(true) // 列表的加载中
const list = ref<FmsFinanceIndicatorVO[]>([]) // 列表的数据

watch(accountSetId, getList)

/** 查询财务指标列表 */
async function getList() {
  if (!accountSetId.value) {
    list.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    list.value = await FmsFinanceIndicatorApi.getFinanceIndicatorList(accountSetId.value)
  } finally {
    loading.value = false
  }
}

// TODO DONE @AI：type string 啊。type 按 System 表单风格使用 string。
/** 打开财务指标表单 */
const formRef = ref<InstanceType<typeof FmsFinanceIndicatorForm>>()
function openForm(type: string, id?: number) {
  if (!accountSetId.value) return
  formRef.value?.open(type, accountSetId.value, id)
}

/** 删除财务指标 */
async function handleDelete(row: FmsFinanceIndicatorVO) {
  if (!accountSetId.value) return
  try {
    // 删除的二次确认
    await message.confirm(`是否确认删除财务指标“${row.name}”？`)
    // 发起删除
    await FmsFinanceIndicatorApi.deleteFinanceIndicator(accountSetId.value, row.id!)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

// TODO DONE @AI：取数报表类型接入 fms_finance_indicator_type 数据字典，统一列表名称和颜色。

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
