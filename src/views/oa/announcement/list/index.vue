<template>
  <doc-alert
    title="【协作】公告、讨论、通讯录与笔记"
    url="https://doc.iocoder.cn/oa/collaboration/communication/"
  />
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="公告标题" prop="title">
        <el-input
          v-model="queryParams.title"
          clearable
          class="!w-240px"
          placeholder="请输入公告标题"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="公告类型" prop="type">
        <el-select
          v-model="queryParams.type"
          clearable
          class="!w-240px"
          placeholder="请选择公告类型"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_ANNOUNCEMENT_TYPE)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select
          v-model="queryParams.priority"
          clearable
          class="!w-240px"
          placeholder="请选择优先级"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_PRIORITY)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发布时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          end-placeholder="结束时间"
          start-placeholder="开始时间"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          v-hasPermi="['oa:announcement:create']"
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 公告列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="置顶" width="70" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.top" type="danger" effect="plain">置顶</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="公告标题" prop="title" min-width="220" show-overflow-tooltip>
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row)">
            {{ scope.row.title }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="type" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_ANNOUNCEMENT_TYPE" :value="scope.row.type ?? ''" />
        </template>
      </el-table-column>
      <el-table-column label="优先级" prop="priority" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="scope.row.priority" />
        </template>
      </el-table-column>
      <el-table-column
        label="发布人"
        prop="publisherUserName"
        min-width="120"
        show-overflow-tooltip
      >
        <template #default="scope">
          {{ scope.row.publisherUserName || '-' }}
        </template>
      </el-table-column>
      <!-- 所属部门为发布人的部门 -->
      <el-table-column
        label="所属部门"
        prop="publisherDeptName"
        min-width="140"
        show-overflow-tooltip
      >
        <template #default="scope">{{ scope.row.publisherDeptName || '-' }}</template>
      </el-table-column>
      <el-table-column label="发布时间" prop="createTime" width="180" :formatter="dateFormatter" />
      <el-table-column label="操作" align="center" width="140" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            link
            v-hasPermi="['oa:announcement:update']"
            @click="openForm('update', scope.row.id)"
          >
            修改
          </el-button>
          <el-button
            type="danger"
            link
            v-hasPermi="['oa:announcement:delete']"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 添加或修改公告对话框 -->
  <OaAnnouncementForm ref="formRef" @success="getList" />
  <!-- 公告详情 -->
  <OaAnnouncementDetail ref="detailRef" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as AnnouncementApi from '@/api/oa/announcement'
import { dateFormatter } from '@/utils/formatTime'
import OaAnnouncementDetail from './components/OaAnnouncementDetail.vue'
import OaAnnouncementForm from './OaAnnouncementForm.vue'

defineOptions({ name: 'OaAnnouncementList' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<AnnouncementApi.OaAnnouncementVO[]>([]) // 公告列表
const total = ref(0) // 列表的总条数
const formRef = ref<InstanceType<typeof OaAnnouncementForm>>() // 公告表单 Ref
const detailRef = ref<InstanceType<typeof OaAnnouncementDetail>>() // 公告详情 Ref
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  type: undefined,
  priority: undefined,
  createTime: []
}) // 查询参数
const queryFormRef = ref() // 搜索表单 Ref

/** 查询公告列表 */
async function getList() {
  loading.value = true
  try {
    const data = await AnnouncementApi.getPublishedAnnouncementPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 打开公告详情 */
function openDetail(announcement: AnnouncementApi.OaAnnouncementVO) {
  if (!announcement.id) return
  detailRef.value?.open(announcement.id, false)
}

/** 删除按钮操作 */
async function handleDelete(id?: number) {
  if (!id) return
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 删除本人发布的公告
    await AnnouncementApi.deleteAnnouncement(id)
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
