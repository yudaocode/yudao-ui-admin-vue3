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
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入讨论标题"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="讨论类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择讨论类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_DISCUSSION_TYPE)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发布人" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" placeholder="请选择发布人" class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 讨论列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" @sort-change="handleSortChange">
      <el-table-column label="标题" prop="title" min-width="220" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.title }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="type" width="90" sortable="custom">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_DISCUSSION_TYPE" :value="scope.row.type ?? ''" />
        </template>
      </el-table-column>
      <el-table-column label="发布人" prop="userName" width="120" />
      <el-table-column label="浏览" prop="visitCount" width="80" sortable="custom" />
      <el-table-column label="回复" prop="replyCount" width="80" />
      <el-table-column label="点赞" prop="likeCount" width="80" />
      <el-table-column label="附件" width="80">
        <template #default="scope">{{ scope.row.fileUrls?.length || 0 }}</template>
      </el-table-column>
      <el-table-column
        label="发布时间"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
        sortable="custom"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as DiscussionApi from '@/api/oa/discussion'
import { buildSortingField } from '@/utils'
import { dateFormatter } from '@/utils/formatTime'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'OaDiscussionList' })

const loading = ref(true) // 列表加载中
const list = ref<DiscussionApi.OaDiscussionVO[]>([]) // 讨论列表
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  type: undefined,
  userId: undefined as number | undefined,
  sortingFields: [] as ReturnType<typeof buildSortingField>[]
}) // 查询参数
const queryFormRef = ref() // 搜索的表单

/** 查询讨论列表 */
async function getList() {
  loading.value = true
  try {
    const data = await DiscussionApi.getDiscussionPage(queryParams)
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

/** 表格排序操作 */
function handleSortChange(params: { prop: string; order: string | null }) {
  queryParams.sortingFields = params.order ? [buildSortingField(params)] : []
  handleQuery()
}

/** 打开讨论详情 */
const router = useRouter() // 路由
function openDetail(id: number) {
  router.push({
    name: 'OaDiscussionDetail',
    params: {
      id
    }
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
