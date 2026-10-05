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
          v-hasPermi="['fms:config:digest:create']"
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
      <el-table-column label="摘要内容" prop="content" min-width="480" />
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
            v-hasPermi="['fms:config:digest:update']"
            v-if="fmsStore.isAccountSetWritable"
          >
            <Icon icon="ep:edit" />编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row)"
            v-hasPermi="['fms:config:digest:delete']"
            v-if="fmsStore.isAccountSetWritable"
          >
            <Icon icon="ep:delete" />删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 添加或修改常用摘要对话框 -->
  <FmsDigestForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { FmsDigestApi } from '@/api/fms/config/digest'
import type { FmsDigestVO } from '@/api/fms/config/digest'
import { dateFormatter } from '@/utils/formatTime'
import { useFmsStore } from '@/views/fms/store/fms'
import FmsDigestForm from './FmsDigestForm.vue'

defineOptions({ name: 'FmsDigest' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const fmsStore = useFmsStore() // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(true) // 列表的加载中
const list = ref<FmsDigestVO[]>([]) // 列表的数据

watch(accountSetId, getList)

/** 查询常用摘要列表 */
async function getList() {
  if (!accountSetId.value) {
    list.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    list.value = await FmsDigestApi.getDigestList(accountSetId.value)
  } finally {
    loading.value = false
  }
}

/** 打开常用摘要表单 */
const formRef = ref<InstanceType<typeof FmsDigestForm>>()
function openForm(type: string, row?: FmsDigestVO) {
  if (!accountSetId.value) return
  formRef.value?.open(type, accountSetId.value, row)
}

/** 删除常用摘要 */
async function handleDelete(row: FmsDigestVO) {
  if (!accountSetId.value) return
  try {
    // 删除的二次确认
    await message.confirm(`是否确认删除常用摘要“${row.content}”？`)
    // 发起删除
    await FmsDigestApi.deleteDigest(accountSetId.value, row.id!)
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
