<template>
  <doc-alert title="【办公】企业邮箱" url="https://doc.iocoder.cn/oa/mail/" />
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="68px"
      class="-mb-15px"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:mail-provider:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="名称" prop="name" min-width="160" />
      <el-table-column label="IMAP 服务器" min-width="220">
        <template #default="{ row }">{{ row.imap.host }}:{{ row.imap.port }}</template>
      </el-table-column>
      <el-table-column label="SMTP 服务器" min-width="220">
        <template #default="{ row }">{{ row.smtp.host }}:{{ row.smtp.port }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['oa:mail-provider:update']"
            type="primary"
            link
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['oa:mail-provider:delete']"
            type="danger"
            link
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 新增 / 修改弹窗 -->
  <MailProviderForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ProviderApi from '@/api/oa/mail/provider'
import MailProviderForm from './MailProviderForm.vue'

defineOptions({ name: 'OaMailProvider' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表加载状态
const list = ref<ProviderApi.MailProviderVO[]>([]) // 邮箱服务配置列表

const queryParams = reactive({
  name: '',
  status: undefined as number | undefined
}) // 查询参数
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await ProviderApi.getMailProviderList()
    list.value = data.filter(
      (item) =>
        item.name.toLowerCase().includes(queryParams.name.trim().toLowerCase()) &&
        (!Number.isInteger(queryParams.status) || item.status === queryParams.status)
    )
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 添加 / 修改操作 */
const formRef = ref() // 表单 Ref
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 删除操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProviderApi.deleteMailProvider(id)
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
