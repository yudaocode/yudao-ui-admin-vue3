<template>
  <doc-alert
    title="【协作】公告、讨论、通讯录与笔记"
    url="https://doc.iocoder.cn/oa/collaboration/communication/"
  />

  <el-row :gutter="20">
    <!-- 左侧联系人分类及共享入口 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <div
          class="mb-12px flex items-center justify-between gap-8px border-b border-[var(--el-border-color-lighter)] pb-12px font-semibold"
        >
          <span>分类</span>
          <el-button link type="primary" @click="categoryDialogRef?.open()"> 管理分类 </el-button>
        </div>
        <el-menu
          class="!border-r-0"
          :default-active="activeCategory"
          aria-label="联系人分类"
          @select="handleCategorySelect"
        >
          <el-menu-item
            class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
            index="all"
          >
            <span>全部联系人</span>
          </el-menu-item>
          <el-menu-item
            class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
            v-for="category in categoryList"
            :key="category.id"
            :index="'category-' + category.id"
          >
            <span class="truncate" :title="category.name">{{ category.name }}</span>
          </el-menu-item>
        </el-menu>
        <!-- 类型导航，与分类组合筛选 -->
        <el-divider class="!my-16px" />
        <div class="mb-12px font-semibold">类型</div>
        <el-menu
          class="!border-r-0"
          :default-active="String(activeScene)"
          aria-label="联系人类型"
          @select="handleTypeSelect"
        >
          <el-menu-item
            class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
            :index="String(OA_CONTACT_SCENE_TYPE.MINE)"
          >
            <span>我的联系人</span>
          </el-menu-item>
          <el-menu-item
            class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
            :index="String(OA_CONTACT_SCENE_TYPE.SENT)"
          >
            <span>我共享的</span>
          </el-menu-item>
          <el-menu-item
            class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
            :index="String(OA_CONTACT_SCENE_TYPE.RECEIVED)"
          >
            <span>共享与我</span>
          </el-menu-item>
        </el-menu>
      </ContentWrap>
    </el-col>
    <el-col :span="20" :xs="24" class="min-w-0">
      <!-- 搜索 -->
      <ContentWrap>
        <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
          <el-form-item label="关键字" prop="keyword">
            <el-input
              v-model="queryParams.keyword"
              clearable
              placeholder="请输入姓名、拼音、手机或公司"
              class="!w-240px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="首字母" prop="alphabet">
            <el-select
              v-model="queryParams.alphabet"
              clearable
              placeholder="请选择姓名首字母"
              class="!w-240px"
            >
              <el-option
                v-for="item in alphabetOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="activeScene === OA_CONTACT_SCENE_TYPE.RECEIVED"
            label="处理状态"
            prop="handleStatus"
          >
            <el-select
              v-model="queryParams.handleStatus"
              clearable
              placeholder="请选择处理状态"
              class="!w-240px"
            >
              <el-option label="待处理" :value="false" />
              <el-option label="已处理" :value="true" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
            <el-button
              v-if="activeScene === OA_CONTACT_SCENE_TYPE.MINE"
              v-hasPermi="['oa:contact:create']"
              type="primary"
              plain
              @click="openForm('create')"
            >
              <Icon icon="ep:plus" /> 新增
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 联系人及共享记录列表 -->
      <ContentWrap>
        <el-table v-loading="loading" :data="list">
          <el-table-column label="姓名" prop="name" min-width="130">
            <template #default="scope">
              <el-button type="primary" link @click="detailRef?.open(scope.row.id)">
                {{ scope.row.name }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="头像" width="75" align="center">
            <template #default="{ row }"><el-avatar :src="row.avatar" :size="32" /></template>
          </el-table-column>
          <el-table-column label="性别" width="80" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="row.sex" />
            </template>
          </el-table-column>
          <el-table-column label="分类" width="120">
            <template #default="scope">
              {{ scope.row.sharedCategoryName || '未分类' }}
            </template>
          </el-table-column>
          <el-table-column label="手机号码" prop="mobile" width="140" />
          <el-table-column label="邮箱" prop="email" min-width="180" show-overflow-tooltip />
          <el-table-column
            label="公司名称"
            prop="companyName"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column label="创建人" prop="ownerUserName" width="120" />
          <el-table-column
            v-if="activeScene === OA_CONTACT_SCENE_TYPE.RECEIVED"
            label="分享人"
            prop="sharerName"
            width="120"
          />
          <el-table-column
            v-if="activeScene === OA_CONTACT_SCENE_TYPE.SENT"
            label="接收人"
            prop="share.userName"
            width="120"
          />
          <el-table-column
            v-if="activeScene === OA_CONTACT_SCENE_TYPE.SENT"
            label="共享时间"
            prop="share.createTime"
            :formatter="dateFormatter"
            width="180"
          />
          <el-table-column
            v-if="activeScene === OA_CONTACT_SCENE_TYPE.SENT"
            label="处理状态"
            width="100"
          >
            <template #default="scope">
              <el-tag :type="scope.row.share?.handleStatus ? 'success' : 'warning'">
                {{ scope.row.share?.handleStatus ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="activeScene === OA_CONTACT_SCENE_TYPE.RECEIVED"
            label="处理状态"
            width="100"
          >
            <template #default="scope">
              <el-tag :type="scope.row.handleStatus ? 'success' : 'warning'">
                {{ scope.row.handleStatus ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button type="primary" link @click="openShareForm(scope.row)">共享</el-button>
              <template v-if="activeScene === OA_CONTACT_SCENE_TYPE.MINE">
                <template v-if="isContactOwner(scope.row)">
                  <el-button
                    v-hasPermi="['oa:contact:update']"
                    type="primary"
                    link
                    @click="openForm('update', scope.row.id)"
                  >
                    修改
                  </el-button>
                  <el-button
                    v-hasPermi="['oa:contact:delete']"
                    type="danger"
                    link
                    @click="handleDelete(scope.row.id, false)"
                  >
                    删除
                  </el-button>
                </template>
                <template v-else>
                  <el-button type="primary" link @click="openHandleForm(scope.row)">
                    移动
                  </el-button>
                  <el-button type="danger" link @click="handleDelete(scope.row.id, true)">
                    删除
                  </el-button>
                </template>
              </template>
              <template v-else-if="activeScene === OA_CONTACT_SCENE_TYPE.RECEIVED">
                <el-button
                  v-if="!scope.row.handleStatus"
                  type="primary"
                  link
                  @click="openHandleForm(scope.row)"
                >
                  处理
                </el-button>
                <el-button type="danger" link @click="handleDelete(scope.row.id, true)">
                  删除
                </el-button>
              </template>
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
    </el-col>
  </el-row>

  <!-- 联系人表单 -->
  <OaContactForm ref="formRef" @success="handleCategoryChange" />
  <!-- 联系人详情 -->
  <OaContactDetail ref="detailRef" />
  <!-- TODO DONE @AI：共享明细拆为独立组件，封装弹窗状态、详情加载和接收人列表。 -->
  <!-- 共享接收人明细 -->
  <!-- 共享联系人 -->
  <Dialog v-model="shareDialogVisible" title="共享联系人" width="560px">
    <el-form v-loading="shareLoading" label-width="100px">
      <el-form-item label="共享接收人">
        <UserSelectV2
          v-model="shareUserIds"
          :disabled="shareLoading"
          :clearable="false"
          multiple
          placeholder="请选择共享接收人"
        />
        <div class="text-12px text-gray-400">此处仅追加共享接收人，取消勾选不会撤销已有共享。</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        :disabled="shareLoading || !shareUserIds.some((id) => !sharedUserIds.includes(id))"
        :loading="shareLoading"
        type="primary"
        @click="submitShare"
      >
        确 定
      </el-button>
      <el-button @click="shareDialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <!-- 处理共享 -->
  <Dialog v-model="handleDialogVisible" :title="handleDialogTitle" width="480px">
    <el-form label-width="90px">
      <el-form-item label="归入分类">
        <OaContactCategorySelect
          v-model="handleCategoryId"
          :categories="categoryList"
          placeholder="不选择时暂不分类"
          class="w-full"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="handleLoading" type="primary" @click="submitHandle">确 定</el-button>
      <el-button @click="handleDialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <!-- 联系人分类管理 -->
  <OaContactCategoryList ref="categoryDialogRef" @success="handleCategoryChange" />
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import OaContactCategorySelect from './components/OaContactCategorySelect.vue'
import { dateFormatter } from '@/utils/formatTime'
import * as ContactApi from '@/api/oa/contact'
import * as ContactCategoryApi from '@/api/oa/contact/category'
import { useUserStore } from '@/store/modules/user'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import OaContactCategoryList from './components/OaContactCategoryList.vue'
import OaContactDetail from './components/OaContactDetail.vue'
import OaContactForm from './OaContactForm.vue'
import { OA_CONTACT_SCENE_TYPE } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaContact' })

const alphabetOptions = [
  { label: '全部', value: '' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((value) => ({ label: value, value }))
] // 姓名拼音首字母选项

const message = useMessage() // 消息弹窗
const currentUserId = useUserStore().getUser.id // 当前用户编号
const loading = ref(true) // 列表加载中
const list = ref<ContactApi.OaContactVO[]>([]) // 外部联系人列表
const total = ref(0) // 列表总数
const activeCategory = ref('all') // 左侧当前选中的分类
const categoryList = ref<ContactCategoryApi.OaContactCategoryVO[]>([]) // 联系人分类列表
const categoryDialogRef = ref<InstanceType<typeof OaContactCategoryList>>() // 分类管理弹窗 Ref
const detailRef = ref<InstanceType<typeof OaContactDetail>>() // 联系人详情弹窗 Ref
const formRef = ref<InstanceType<typeof OaContactForm>>() // 联系人表单 Ref
const activeScene = ref<number>(OA_CONTACT_SCENE_TYPE.MINE) // 当前列表场景，不作为查询参数传递
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined as string | undefined,
  categoryId: undefined as number | undefined,
  handleStatus: undefined as boolean | undefined,
  alphabet: ''
}) // 查询参数
const queryFormRef = ref() // 搜索表单 Ref

const shareDialogVisible = ref(false) // 共享弹窗是否显示
const shareLoading = ref(false) // 共享请求提交中
const shareContactId = ref<number>() // 共享联系人编号
const shareUserIds = ref<number[]>([]) // 共享接收人编号列表
const sharedUserIds = ref<number[]>([]) // 已共享的接收人编号列表
const handleDialogVisible = ref(false) // 处理共享弹窗是否显示
const handleLoading = ref(false) // 共享处理请求提交中
const handleDialogTitle = ref('处理共享联系人') // 处理共享弹窗标题
const handleContactId = ref<number>() // 处理联系人编号
const handleCategoryId = ref<number>() // 接收人的分类编号

/** 查询联系人列表 */
async function getList() {
  loading.value = true
  list.value = []
  total.value = 0
  try {
    const getPage =
      activeScene.value === OA_CONTACT_SCENE_TYPE.MINE
        ? ContactApi.getMyContactPage
        : activeScene.value === OA_CONTACT_SCENE_TYPE.RECEIVED
          ? ContactApi.getReceivedContactPage
          : ContactApi.getSharedContactPage
    const data = await getPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询联系人分类列表 */
async function getCategoryList() {
  categoryList.value = await ContactCategoryApi.getContactCategoryList()
}

/** 联系人分类变更操作 */
async function handleCategoryChange() {
  await getCategoryList()
  // 分类编号保持稳定；已删除的分类回到全部联系人
  if (activeCategory.value.startsWith('category-')) {
    const category = categoryList.value.find(
      (item) => 'category-' + item.id === activeCategory.value
    )
    if (!category) activeCategory.value = 'all'
    queryParams.categoryId = category?.id
  }
  handleQuery()
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 切换联系人分类 */
function handleCategorySelect(index: string) {
  activeCategory.value = index
  queryParams.categoryId = categoryList.value.find((item) => 'category-' + item.id === index)?.id
  handleQuery()
}

/** 切换联系人类型 */
function handleTypeSelect(index: string) {
  activeScene.value = Number(index)
  queryParams.handleStatus = undefined
  handleQuery()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.alphabet = ''
  handleQuery()
}

/** 判断是否为联系人创建人 */
function isContactOwner(contact: ContactApi.OaContactVO) {
  return contact.ownerUserId === currentUserId
}

/** 打开联系人表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 删除联系人 */
async function handleDelete(id: number, received: boolean) {
  try {
    // 删除的二次确认
    await message.delConfirm(
      '确认移除本人持有的联系人？其他持有人不受影响，最后一人移除时才删除正文。'
    )
    // 发起删除
    if (received) {
      await ContactApi.deleteReceivedContact(id)
    } else {
      await ContactApi.deleteContact(id)
    }
    message.success('删除成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 打开共享表单 */
async function openShareForm(contact: ContactApi.OaContactVO) {
  shareContactId.value = contact.id
  shareUserIds.value = []
  sharedUserIds.value = []
  shareDialogVisible.value = true
  shareLoading.value = true
  try {
    // 查询最新共享关系，回显已有接收人，避免使用列表中的旧数据
    const detail = await ContactApi.getContact(contact.id!)
    sharedUserIds.value = (detail.shares || []).map((share) => share.userId)
    shareUserIds.value = [...sharedUserIds.value]
  } catch {
    shareDialogVisible.value = false
  } finally {
    shareLoading.value = false
  }
}

/** 提交联系人共享 */
async function submitShare() {
  if (!shareContactId.value || shareLoading.value) return
  // 提交共享请求
  shareLoading.value = true
  try {
    await ContactApi.shareContact(shareContactId.value, shareUserIds.value)
    message.success('共享成功')
    shareDialogVisible.value = false
    await getList()
  } finally {
    shareLoading.value = false
  }
}

/** 打开共享处理表单 */
function openHandleForm(contact: ContactApi.OaContactVO) {
  handleContactId.value = contact.id
  handleCategoryId.value = contact.sharedCategoryId
  handleDialogTitle.value = contact.handleStatus ? '移动联系人分类' : '处理共享联系人'
  handleDialogVisible.value = true
}

/** 提交共享处理 */
async function submitHandle() {
  if (!handleContactId.value) return
  // 提交共享处理请求
  handleLoading.value = true
  try {
    await ContactApi.handleContactShare(handleContactId.value, handleCategoryId.value)
    message.success('处理成功')
    handleDialogVisible.value = false
    await getCategoryList()
    await getList()
  } finally {
    handleLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
  getCategoryList()
})
</script>
