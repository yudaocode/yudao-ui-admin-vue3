<template>
  <doc-alert title="【办公】企业邮箱" url="https://doc.iocoder.cn/oa/mail/" />
  <div
    class="h-[calc(100vh-150px)] min-h-580px overflow-x-auto rounded border border-solid border-[var(--el-border-color-light)] bg-[var(--el-bg-color)]"
  >
    <div class="flex h-full min-w-1080px">
      <!-- 左栏：账号及文件夹 -->
      <MailFolderList
        v-model:account-id="queryParams.accountId"
        :accounts="accounts"
        :folders="folders"
        :folder-key="queryParams.folderKey"
        :syncing="syncing"
        :composing="!!composeData"
        :operating="operating || detailLoading"
        @account-change="handleAccountChange"
        @folder-change="handleFolderChange"
        @compose="openForm(OA_MAIL_COMPOSE_MODE.NEW)"
        @sync="handleSync"
        @settings="router.push('/oa/mail/account')"
      />
      <!-- 中栏：查询、邮件列表及分页 -->
      <MailMessageList
        v-model:keyword="queryParams.keyword"
        v-model:filter="filter"
        v-model:page-no="queryParams.pageNo"
        :list="list"
        :loading="loading"
        :list-error="listError"
        :empty-text="emptyText"
        :selected-id="detail?.id"
        :disabled="!!composeData || operating || detailLoading"
        :total="total"
        v-model:page-size="queryParams.pageSize"
        @query="handleQuery"
        @page-change="getList"
        @select="handleDetail"
      />
      <!-- 右栏：详情操作及安全正文，写信在当前区域展开 -->
      <section v-loading="detailLoading" class="min-w-0 flex-1">
        <MailMessageForm
          v-if="composeData"
          :key="composeKey"
          :data="composeData"
          @close="composeData = undefined"
          @success="handleComposeSuccess"
        />
        <MailMessageDetail
          v-else
          :detail="detail"
          :detail-error="detailError"
          :folder-key="queryParams.folderKey"
          :operating="operating"
          @compose="openForm"
          @read="handleRead"
          @delete="handleDelete"
          @restore="handleRestore"
        />
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
import * as AccountApi from '@/api/oa/mail/account'
import * as MessageApi from '@/api/oa/mail/message'
import MailMessageForm from './MailMessageForm.vue'
import MailFolderList from './components/MailFolderList.vue'
import MailMessageList from './MailMessageList.vue'
import MailMessageDetail from './MailMessageDetail.vue'
import * as FolderApi from '@/api/oa/mail/folder'
import { OA_MAIL_COMPOSE_MODE, OA_MAIL_FOLDER_KEY } from '@/views/oa/utils/constants'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'OaMailInbox' })

const router = useRouter() // 路由
const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表加载中
const detailLoading = ref(false) // 详情加载中
const syncing = ref(false) // 同步中
const operating = ref(false) // 远端操作中
const accounts = ref<AccountApi.MailAccountVO[]>([]) // 本人邮箱账号
const folders = ref<FolderApi.MailFolderVO[]>([]) // 已同步的文件夹
const list = ref<MessageApi.MailMessageVO[]>([]) // 当前页索引
const total = ref(0) // 邮件总数
const detail = ref<MessageApi.MailMessageVO>() // 当前邮件
const composeData = ref<MessageApi.MailMessageVO>() // 写信数据
const composeKey = ref(0) // 表单重新初始化标识
const listError = ref('') // 列表错误
const detailError = ref('') // 详情错误
const filter = ref('all') // 当前筛选
const queryParams = reactive({
  accountId: undefined as number | undefined,
  folderKey: OA_MAIL_FOLDER_KEY.INBOX as string,
  keyword: '',
  pageNo: 1,
  pageSize: 20
})
const emptyText = computed(() => {
  if (!accounts.value.length) {
    return '请先添加并启用邮箱账号'
  }
  if (!folders.value.length) {
    return '请点击同步，获取邮箱邮件'
  }
  return folders.value.some((folder) => folder.key === queryParams.folderKey)
    ? '暂无邮件'
    : '未识别到此文件夹，请同步后重试'
})

/** 查询本地索引分页 */
async function getList(keepDetail = false) {
  if (!keepDetail) {
    detail.value = undefined
    detailLoading.value = false
    detailError.value = ''
  }
  listError.value = ''
  if (!queryParams.accountId) return
  loading.value = true
  try {
    const data = await MessageApi.getMailMessagePage({
      ...queryParams,
      readStatus: filter.value === 'unread' ? false : undefined,
      hasAttach: filter.value === 'attach' ? true : undefined
    })
    total.value = data.total
    list.value = data.list
  } catch {
    list.value = []
    total.value = 0
    listError.value = '邮件列表加载失败'
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 切换文件夹 */
function handleFolderChange(folder: string) {
  queryParams.folderKey = folder
  filter.value = 'all'
  handleQuery()
}

/** 切换邮箱账号 */
async function handleAccountChange() {
  detail.value = undefined
  list.value = []
  total.value = 0
  folders.value = []
  queryParams.folderKey = OA_MAIL_FOLDER_KEY.INBOX
  queryParams.keyword = ''
  filter.value = 'all'
  const accountId = queryParams.accountId
  if (accountId) {
    folders.value = await FolderApi.getMailFolderList(accountId)
  }
  handleQuery()
}

/** 手动全量同步索引，不受当前列表页码影响，不创建后台 Job */
async function handleSync() {
  if (!queryParams.accountId) return
  syncing.value = true
  try {
    const count = await MessageApi.syncMailMessageList(queryParams.accountId)
    folders.value = await FolderApi.getMailFolderList(queryParams.accountId)
    message.success(`同步成功，共 ${count} 封邮件`)
    // 同步后保留当前页；只有搜索、筛选和切换文件夹时回到第一页
    await getList()
  } finally {
    syncing.value = false
  }
}

/** 点击邮件读取正文，成功后同步已读状态 */
async function handleDetail(row: MessageApi.MailMessageVO) {
  if (queryParams.folderKey === OA_MAIL_FOLDER_KEY.DRAFTS) {
    detail.value = row
    await openForm(OA_MAIL_COMPOSE_MODE.DRAFT)
    return
  }
  detailLoading.value = true
  detailError.value = ''
  detail.value = undefined
  try {
    const data = await MessageApi.getMailMessage(row.id!)
    detail.value = data
    // 正文读取成功才标记已读，远端更新失败时保留正文和原状态
    if (!data.readStatus) {
      try {
        await MessageApi.updateMailMessageRead(data.id!, true)
        data.readStatus = true
        row.readStatus = true
        folders.value = await FolderApi.getMailFolderList(data.accountId)
        // 未读列表移除已读邮件，但保留正在阅读的正文
        if (queryParams.folderKey === OA_MAIL_FOLDER_KEY.UNREAD || filter.value === 'unread') {
          await getList(true)
        }
      } catch {
        message.error('正文已加载，已读状态更新失败，请重试')
      }
    }
  } catch {
    detailError.value = '邮件读取失败，请先同步后重试'
  } finally {
    detailLoading.value = false
  }
}

/** 打开写信、回复、转发或草稿 */
async function openForm(mode: string) {
  if (!queryParams.accountId) return
  if (mode === OA_MAIL_COMPOSE_MODE.NEW) {
    composeData.value = {
      accountId: queryParams.accountId,
      recipients: [],
      ccs: [],
      subject: '',
      content: '',
      mode
    }
  } else if (detail.value) {
    detailLoading.value = true
    try {
      composeData.value = await MessageApi.getMailMessageCompose(detail.value.id!, mode)
    } finally {
      detailLoading.value = false
    }
  }
  composeKey.value++
}

/** 修改已读或未读状态 */
async function handleRead() {
  if (!detail.value) return
  const current = detail.value
  operating.value = true
  try {
    await MessageApi.updateMailMessageRead(current.id!, !current.readStatus)
    current.readStatus = !current.readStatus
    const row = list.value.find((mail) => mail.id === current.id)
    if (row) row.readStatus = current.readStatus
    message.success('修改成功')
    folders.value = await FolderApi.getMailFolderList(current.accountId)
    if (queryParams.folderKey === OA_MAIL_FOLDER_KEY.UNREAD || filter.value === 'unread') {
      await getList()
    }
  } finally {
    operating.value = false
  }
}

/** 删除当前邮件，彻底删除需要明确确认 */
async function handleDelete() {
  if (!detail.value) return
  const id = detail.value.id!
  await message.confirm(
    queryParams.folderKey === OA_MAIL_FOLDER_KEY.TRASH
      ? '确认彻底删除这封邮件？此操作无法恢复。'
      : '确认将这封邮件移至已删除？'
  )
  operating.value = true
  try {
    await MessageApi.deleteMailMessage(id)
    message.success('删除成功')
    await handleSync()
  } finally {
    operating.value = false
  }
}

/** 将垃圾箱中的邮件恢复到收件箱 */
async function handleRestore() {
  if (!detail.value) return
  operating.value = true
  try {
    await MessageApi.restoreMailMessage(detail.value.id!)
    message.success('已恢复到收件箱')
    await handleSync()
  } finally {
    operating.value = false
  }
}

/** 写信成功后退出编辑 */
function handleComposeSuccess() {
  composeData.value = undefined
  getList()
}

/** 初始化 */
onMounted(async () => {
  accounts.value = await AccountApi.getMailAccountList(CommonStatusEnum.ENABLE)
  queryParams.accountId = (
    accounts.value.find((account) => account.defaultStatus) || accounts.value[0]
  )?.id
  await handleAccountChange()
})
</script>
