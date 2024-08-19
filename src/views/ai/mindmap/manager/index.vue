<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-select
          v-model="queryParams.userId"
          class="!w-240px"
          clearable
          placeholder="请输入用户编号"
        >
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="提示词" prop="prompt">
        <el-input
          v-model="queryParams.prompt"
          class="!w-240px"
          clearable
          placeholder="请输入提示词"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" fixed="left" label="编号" prop="id" width="180" />
      <el-table-column align="center" label="用户" prop="userId" width="180">
        <template #default="scope">
          <span>{{ userList.find((item) => item.id === scope.row.userId)?.nickname }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="提示词" prop="prompt" width="180" />
      <el-table-column align="center" label="思维导图" min-width="300" prop="generatedContent" />
      <el-table-column align="center" label="模型" prop="model" width="180" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180px"
      />
      <el-table-column align="center" label="错误信息" prop="errorMessage" />
      <el-table-column align="center" fixed="right" label="操作" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openPreview(scope.row)"> 预览</el-button>
          <el-button
            v-hasPermi="['ai:mind-map:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 思维导图的预览 -->
  <el-drawer v-model="previewVisible" :with-header="false" size="800px">
    <Right
      v-if="previewVisible2"
      :generatedContent="previewContent"
      :isEnd="true"
      :isGenerating="false"
      :isStart="false"
    />
  </el-drawer>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { AiMindMapApi, MindMapVO } from '@/api/ai/mindmap'
import * as UserApi from '@/api/system/user'
import Right from '@/views/ai/mindmap/index/components/Right.vue'

/** AI 思维导图 列表 */
defineOptions({ name: 'AiMindMapManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MindMapVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  prompt: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const userList = ref<UserApi.UserVO[]>([]) // 用户列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await AiMindMapApi.getMindMapPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await AiMindMapApi.deleteMindMap(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 预览操作按钮 */
const previewVisible = ref(false) // drawer 的显示隐藏
const previewVisible2 = ref(false) // right 的显示隐藏
const previewContent = ref('')
const openPreview = async (row: MindMapVO) => {
  previewVisible2.value = false
  previewVisible.value = true
  // 在 drawer 渲染完后，再渲染 right 预览，不然会报错，需要保证 width 宽度先出来
  await nextTick()
  previewVisible2.value = true
  previewContent.value = row.generatedContent
}

/** 初始化 **/
onMounted(async () => {
  getList()
  // 获得用户列表
  userList.value = await UserApi.getSimpleUserList()
})
</script>
