<template>
  <doc-alert
    title="【设置】凭证字、常用摘要、凭证模板"
    url="https://doc.iocoder.cn/fms/config/voucher/"
  />
  <!-- 操作工作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" :inline="true">
      <el-form-item>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['fms:config:voucher-word:create']"
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
      <el-table-column label="凭证字" prop="name" min-width="180" />
      <el-table-column label="打印标题" prop="printTitle" min-width="260" />
      <el-table-column label="是否默认" align="center" width="130">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.defaultStatus" />
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
            v-hasPermi="['fms:config:voucher-word:update']"
            v-if="fmsStore.isAccountSetWritable"
          >
            <Icon icon="ep:edit" />编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row)"
            v-hasPermi="['fms:config:voucher-word:delete']"
            v-if="fmsStore.isAccountSetWritable"
          >
            <Icon icon="ep:delete" />删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 添加或修改凭证字对话框 -->
  <FmsVoucherWordForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { FmsVoucherWordApi } from '@/api/fms/config/voucher-word'
import type { FmsVoucherWordVO } from '@/api/fms/config/voucher-word'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { useFmsStore } from '@/views/fms/store/fms'
import FmsVoucherWordForm from './FmsVoucherWordForm.vue'

defineOptions({ name: 'FmsVoucherWord' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const fmsStore = useFmsStore() // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(true) // 列表的加载中
const list = ref<FmsVoucherWordVO[]>([]) // 列表的数据

watch(accountSetId, getList)

/** 查询凭证字列表 */
async function getList() {
  if (!accountSetId.value) {
    list.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    list.value = await FmsVoucherWordApi.getVoucherWordList(accountSetId.value)
  } finally {
    loading.value = false
  }
}

/** 打开凭证字表单 */
const formRef = ref<InstanceType<typeof FmsVoucherWordForm>>()
function openForm(type: string, row?: FmsVoucherWordVO) {
  if (!accountSetId.value) return
  formRef.value?.open(type, accountSetId.value, row)
}

/** 删除凭证字 */
async function handleDelete(row: FmsVoucherWordVO) {
  if (!accountSetId.value) return
  if (row.defaultStatus) {
    message.error('默认凭证字不允许删除')
    return
  }
  try {
    // 删除的二次确认
    await message.confirm(`是否确认删除凭证字“${row.name}”？`)
    // 发起删除
    await FmsVoucherWordApi.deleteVoucherWord(accountSetId.value, row.id!)
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
