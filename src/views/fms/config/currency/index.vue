<template>
  <doc-alert
    title="【设置】币别、科目、辅助核算、初始余额"
    url="https://doc.iocoder.cn/fms/config/accounting/"
  />
  <!-- 操作工作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" :inline="true">
      <el-form-item>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['fms:config:currency:create']"
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
      <el-table-column label="币别编码" prop="code" min-width="160" />
      <el-table-column label="币别名称" prop="name" min-width="220" />
      <el-table-column label="汇率" align="right" min-width="180">
        <template #default="scope">
          {{ formatExchangeRate(scope.row.exchangeRate) }}
        </template>
      </el-table-column>
      <el-table-column label="本位币" align="center" width="130">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.standard" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row)"
            v-hasPermi="['fms:config:currency:update']"
            v-if="fmsStore.isAccountSetWritable"
          >
            <Icon icon="ep:edit" />编辑
          </el-button>
          <el-button
            v-if="fmsStore.isAccountSetWritable && !scope.row.standard"
            link
            type="danger"
            @click="handleDelete(scope.row)"
            v-hasPermi="['fms:config:currency:delete']"
          >
            <Icon icon="ep:delete" />删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <FmsCurrencyForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { FmsCurrencyApi } from '@/api/fms/config/currency'
import type { FmsCurrencyVO } from '@/api/fms/config/currency'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { useFmsStore } from '@/views/fms/store/fms'
import { formatExchangeRate } from '@/views/fms/utils/format'
import FmsCurrencyForm from './FmsCurrencyForm.vue'

defineOptions({ name: 'FmsCurrency' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const fmsStore = useFmsStore() // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(true) // 列表的加载中
const list = ref<FmsCurrencyVO[]>([]) // 列表的数据

watch(accountSetId, () => getList())

/** 查询币别列表 */
async function getList() {
  if (!accountSetId.value) {
    list.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    list.value = await FmsCurrencyApi.getCurrencyList(accountSetId.value)
  } finally {
    loading.value = false
  }
}

/** 打开币别表单 */
const formRef = ref<InstanceType<typeof FmsCurrencyForm>>()
function openForm(type: string, row?: FmsCurrencyVO) {
  if (!accountSetId.value) return
  formRef.value?.open(type, accountSetId.value, row)
}

/** 删除币别 */
async function handleDelete(row: FmsCurrencyVO) {
  if (!accountSetId.value) return
  try {
    // 删除的二次确认
    await message.confirm(`是否确认删除币别“${row.name}”？`)
    // 发起删除
    await FmsCurrencyApi.deleteCurrency(accountSetId.value, row.id!)
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
