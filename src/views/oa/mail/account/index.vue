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
      <el-form-item label="邮箱地址" prop="mail">
        <el-input
          v-model="queryParams.mail"
          placeholder="请输入邮箱地址"
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
          v-hasPermi="['oa:mail-account:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 我的账号 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="邮箱" prop="mail" min-width="220" />
      <el-table-column label="邮箱服务" min-width="150">
        <template #default="{ row }">
          {{ providers.find((item) => item.id === row.providerId)?.name }}
        </template>
      </el-table-column>
      <el-table-column label="默认" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.defaultStatus" type="success">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['oa:mail-account:update']"
            type="primary"
            link
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            :disabled="row.status !== CommonStatusEnum.ENABLE || testingId !== undefined"
            :loading="testingId === row.id"
            type="primary"
            link
            @click="handleTest(row.id)"
          >
            测试连接
          </el-button>
          <el-button
            v-if="!row.defaultStatus && row.status === CommonStatusEnum.ENABLE"
            v-hasPermi="['oa:mail-account:update']"
            type="primary"
            link
            @click="handleDefault(row.id)"
          >
            设为默认
          </el-button>
          <el-button
            v-hasPermi="['oa:mail-account:delete']"
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
  <!-- 绑定 / 修改弹窗 -->
  <MailAccountForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as AccountApi from '@/api/oa/mail/account'
import * as ProviderApi from '@/api/oa/mail/provider'
import MailAccountForm from './MailAccountForm.vue'

defineOptions({ name: 'OaMailAccount' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表加载状态
const list = ref<AccountApi.MailAccountVO[]>([]) // 本人账号列表
const providers = ref<ProviderApi.MailProviderVO[]>([]) // 服务配置列表
const testingId = ref<number>() // 当前测试账号编号

const queryParams = reactive({
  mail: '',
  status: undefined as number | undefined
}) // 查询参数
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const [accounts, mailProviders] = await Promise.all([
      AccountApi.getMailAccountList(),
      ProviderApi.getSimpleMailProviderList()
    ])
    providers.value = mailProviders
    // 接口仅返回本人完整账号列表，搜索不改变账号归属范围
    list.value = accounts.filter(
      (item: AccountApi.MailAccountVO) =>
        item.mail.toLowerCase().includes(queryParams.mail.trim().toLowerCase()) &&
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

/** 测试连接，不发测试邮件 */
async function handleTest(id: number) {
  testingId.value = id
  try {
    const result = await AccountApi.testMailAccountConnection(id)
    const text =
      'IMAP：' +
      (result.imap ? '连接成功' : '连接失败') +
      '；SMTP：' +
      (result.smtp ? '连接成功' : '连接失败')
    await message.alert(text)
  } finally {
    testingId.value = undefined
  }
}

/** 设置默认账号 */
async function handleDefault(id: number) {
  await AccountApi.updateMailAccountDefault(id)
  message.success('设置成功')
  await getList()
}

/** 删除操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await AccountApi.deleteMailAccount(id)
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
