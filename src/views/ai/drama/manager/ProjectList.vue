<!-- AI 短剧制作管理：项目列表 -->
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
      <el-form-item label="用户" prop="userId">
        <UserSelect v-model="queryParams.userId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入项目名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="项目状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择项目状态"
          clearable
          class="!w-240px"
        >
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
          placeholder="请选择成片状态"
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
      <el-form-item label="是否公开" prop="publicStatus">
        <el-select
          v-model="queryParams.publicStatus"
          placeholder="请选择是否公开"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="画幅" prop="aspectRatio">
        <el-select
          v-model="queryParams.aspectRatio"
          placeholder="请选择画幅"
          clearable
          class="!w-240px"
        >
          <el-option v-for="item in DRAMA_ASPECT_RATIOS" :key="item" :label="item" :value="item" />
        </el-select>
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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="90" fixed="left" />
      <el-table-column label="项目名称" prop="name" min-width="160" />
      <el-table-column label="用户" align="center" prop="userNickname" min-width="120" />
      <el-table-column label="画风" align="center" prop="style" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_DRAMA_STYLE" :value="row.style" />
        </template>
      </el-table-column>
      <el-table-column label="画幅" align="center" prop="composeAspectRatio" width="80" />
      <el-table-column label="项目状态" align="center" prop="status" width="110">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="镜头" align="center" width="90">
        <template #default="{ row }">
          {{ row.storyboardSuccessCount || 0 }} / {{ row.storyboardCount || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="成片" align="center" width="140" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <el-link
            v-if="row.composeStatus === AiDramaStatusEnum.SUCCESS && row.composeFileUrl"
            type="primary"
            :href="row.composeFileUrl"
            target="_blank"
          >
            <Icon icon="ep:video-play" class="mr-4px" />
            {{ formatDramaDuration(row.composeDuration) }}
          </el-link>
          <dict-tag
            v-else-if="row.composeStatus"
            :type="DICT_TYPE.AI_DRAMA_STATUS"
            :value="row.composeStatus"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="是否公开" align="center" prop="publicStatus" width="90">
        <template #default="{ row }">
          <el-switch
            v-model="row.publicStatus"
            :active-value="true"
            :inactive-value="false"
            :disabled="
              (!row.publicStatus && row.composeStatus !== AiDramaStatusEnum.SUCCESS) ||
              !checkPermi(['ai:drama:update'])
            "
            @change="handleUpdatePublicStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="detailRef.open(row.id)"
            v-hasPermi="['ai:drama:query']"
          >
            详情
          </el-button>
          <el-button
            link
            type="danger"
            :disabled="isAiDramaRunning(row.composeStatus)"
            @click="handleDelete(row.id)"
            v-hasPermi="['ai:drama:delete']"
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

  <ProjectDetail ref="detailRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import { DramaProjectApi, DramaProjectVO } from '@/api/ai/drama/project'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { AiDramaStatusEnum, isAiDramaRunning } from '@/views/ai/utils/constants'
import { DRAMA_ASPECT_RATIOS, formatDramaDuration } from '@/views/ai/utils/drama'
import ProjectDetail from './ProjectDetail.vue'

/** AI 短剧制作管理：项目 */
defineOptions({ name: 'AiDramaProjectList' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<DramaProjectVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  name: undefined,
  status: undefined,
  composeStatus: undefined,
  publicStatus: undefined,
  aspectRatio: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const detailRef = ref() // 详情弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DramaProjectApi.getProjectPage(queryParams)
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
    await message.delConfirm('删除项目会一并删除剧本、资产、分镜与成片记录，是否继续？')
    await DramaProjectApi.deleteProject(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 修改是否公开 */
const handleUpdatePublicStatusChange = async (row: DramaProjectVO) => {
  try {
    const text = row.publicStatus ? '公开' : '取消公开'
    await message.confirm('确认要"' + text + '"该项目吗?')
    await DramaProjectApi.updateProjectPublicStatus(row.id, row.publicStatus)
    message.success(t('common.updateSuccess'))
  } catch {
    row.publicStatus = !row.publicStatus
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
// DONE @AI：一般这种叫 list ，还是 manager（改为 ProjectList.vue；manager 是页面目录，列表组件按 yudao 习惯叫 XxxList）
</script>
