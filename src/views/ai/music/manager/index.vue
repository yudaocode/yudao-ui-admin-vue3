<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="音乐名称" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入音乐名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="音乐状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择音乐状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_MUSIC_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="生成模式" prop="generateMode">
        <el-input
          v-model="queryParams.generateMode"
          placeholder="请输入生成模式"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="是否发布" prop="publicStatus">
        <el-select
          v-model="queryParams.publicStatus"
          placeholder="请选择是否发布"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="用户编号" align="center" prop="userId" />
      <el-table-column label="音乐名称" align="center" prop="title" />
      <el-table-column label="歌词" align="center" prop="lyric" />
      <el-table-column label="图片地址" align="center" prop="imageUrl" />
      <el-table-column label="音频地址" align="center" prop="audioUrl" />
      <el-table-column label="视频地址" align="center" prop="videoUrl" />
      <el-table-column label="音乐状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="描述词" align="center" prop="gptDescriptionPrompt" />
      <el-table-column label="提示词" align="center" prop="prompt" />
      <el-table-column label="模型平台" align="center" prop="platform" />
      <el-table-column label="模型" align="center" prop="model" />
      <el-table-column label="生成模式" align="center" prop="generateMode">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_GENERATE_MODE" :value="scope.row.generateMode" />
        </template>
      </el-table-column>
      <el-table-column label="音乐风格标签" align="center" prop="tags" />
      <el-table-column label="任务id" align="center" prop="taskId" />
      <el-table-column label="错误信息" align="center" prop="errorMessage" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="是否发布" align="center" prop="publicStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.publicStatus" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai:music:delete']"
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
</template>

<script setup lang="ts">
import { getIntDictOptions, getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { MusicApi, MusicVO } from '@/api/ai/music'

/** AI 音乐 列表 */
defineOptions({ name: 'AiMusicManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MusicVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  title: undefined,
  status: undefined,
  generateMode: undefined,
  createTime: [],
  publicStatus: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MusicApi.getMusicPage(queryParams)
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
    await MusicApi.deleteMusic(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
