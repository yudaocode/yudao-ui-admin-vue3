<!-- AI 短剧：我的项目 -->
<template>
  <div>
    <el-form :model="queryParams" :inline="true" label-width="68px">
      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入项目名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="项目状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_DRAMA_PROJECT_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="成片状态" prop="composeStatus">
        <el-select
          v-model="queryParams.composeStatus"
          placeholder="全部"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_DRAMA_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="emit('create')">
          <Icon icon="ep:plus" class="mr-5px" /> 新建项目
        </el-button>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="项目名称" min-width="180">
        <template #default="{ row }">
          <el-link type="primary" @click="emit('edit', row.id)">{{ row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="画风" align="center" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_DRAMA_STYLE" :value="row.style" />
        </template>
      </el-table-column>
      <el-table-column label="画幅" prop="composeAspectRatio" align="center" width="80" />
      <el-table-column label="项目状态" align="center" width="110">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <!-- DONE @AI：折行了；（prettier 为 strict 空白模式，内容紧贴标签时只能在 > 处断行；内容改为单独一行，搜索、重置按钮同理；短剧 form、manager 的同类写法一并调整） -->
      <el-table-column label="镜头视频" align="center" width="100">
        <template #default="{ row }">
          {{ row.storyboardSuccessCount }} / {{ row.storyboardCount }}
        </template>
      </el-table-column>
      <el-table-column label="成片" align="center" width="100">
        <template #default="{ row }">
          <dict-tag
            v-if="row.composeStatus"
            :type="DICT_TYPE.AI_DRAMA_STATUS"
            :value="row.composeStatus"
          />
          <span v-else class="text-[var(--el-text-color-secondary)]">未合成</span>
        </template>
      </el-table-column>
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('edit', row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { DramaProjectApi, DramaProjectVO } from '@/api/ai/drama/project'

/** AI 短剧：我的项目 */
defineOptions({ name: 'AiDramaMyList' })

const emit = defineEmits(['edit', 'create']) // 进入项目表单、新建页
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref<DramaProjectVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
  composeStatus: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DramaProjectApi.getProjectMyPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.name = undefined
  queryParams.status = undefined
  queryParams.composeStatus = undefined
  handleQuery()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm('删除后剧本、资产、分镜一并删除，是否继续？')
    await DramaProjectApi.deleteProjectMy(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}
</script>
