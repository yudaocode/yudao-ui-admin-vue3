<template>
  <doc-alert
    title="【协作】公告、讨论、通讯录与笔记"
    url="https://doc.iocoder.cn/oa/collaboration/communication/"
  />

  <el-row :gutter="20">
    <!-- 左侧分类和类型导航 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <OaNoteSidebar
          :categories="categoryList"
          :category-id="queryParams.categoryId"
          :type="queryParams.type"
          @category-select="handleCategorySelect"
          @type-select="handleTypeSelect"
          @manage="categoryDialogRef?.open()"
        />
      </ContentWrap>
    </el-col>
    <el-col :span="20" :xs="24" class="min-w-0">
      <!-- 搜索 -->
      <ContentWrap>
        <el-form
          ref="queryFormRef"
          :inline="true"
          :model="queryParams"
          class="-mb-15px"
          label-width="68px"
        >
          <el-form-item label="笔记场景">
            <el-radio-group v-model="activeScene" @change="handleSceneChange">
              <el-radio-button :value="OA_NOTE_SCENE_TYPE.MINE">我的笔记</el-radio-button>
              <el-radio-button :value="OA_NOTE_SCENE_TYPE.SHARED">共享给我</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标题" prop="title">
            <el-input
              v-model="queryParams.title"
              clearable
              placeholder="请输入笔记标题"
              class="!w-240px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="优先级" prop="priority">
            <el-select
              v-model="queryParams.priority"
              placeholder="请选择优先级"
              clearable
              class="!w-240px"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_PRIORITY).filter(
                  (item) => item.value <= OA_PRIORITY.IMPORTANT
                )"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" prop="createTime">
            <el-date-picker
              v-model="queryParams.createTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetimerange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="收藏" prop="favorite">
            <el-select
              v-model="queryParams.favorite"
              placeholder="请选择收藏状态"
              clearable
              class="!w-240px"
            >
              <el-option label="已收藏" :value="true" />
              <el-option label="未收藏" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
            <el-button
              type="primary"
              plain
              v-hasPermi="['oa:note:create']"
              @click="openForm('create')"
            >
              <Icon icon="ep:plus" /> 新增
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <div v-if="activeScene === OA_NOTE_SCENE_TYPE.MINE" class="mb-12px">
          <el-button
            v-hasPermi="['oa:note:delete']"
            type="danger"
            plain
            :disabled="!selectedIds.length || loading || deleteLoading"
            @click="handleDeleteList"
          >
            <Icon icon="ep:delete" /> 批量删除
          </el-button>
        </div>
        <el-table
          v-loading="loading || deleteLoading"
          :data="list"
          @selection-change="handleSelectionChange"
        >
          <el-table-column
            v-if="activeScene === OA_NOTE_SCENE_TYPE.MINE"
            type="selection"
            width="55"
          />
          <el-table-column label="收藏" width="80">
            <template #default="scope">
              <el-button
                link
                :type="scope.row.favorite ? 'warning' : 'info'"
                @click="handleFavorite(scope.row)"
              >
                {{ scope.row.favorite ? '已收藏' : '收藏' }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="标题" prop="title" min-width="200" show-overflow-tooltip>
            <template #default="scope">
              <el-button type="primary" link @click="openDetail(scope.row.id)">
                {{ scope.row.title }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="目录" prop="categoryName" width="120" />
          <el-table-column label="类型" width="100">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.OA_NOTE_TYPE" :value="scope.row.type ?? ''" />
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="90">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="scope.row.priority" />
            </template>
          </el-table-column>
          <el-table-column label="创建人" prop="creatorUserName" width="120" />
          <el-table-column label="共享给" min-width="160" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.receiverUserNames?.join('、') || '-' }}
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            prop="createTime"
            :formatter="dateFormatter"
            width="180"
          />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <template v-if="activeScene === OA_NOTE_SCENE_TYPE.MINE">
                <el-button
                  type="primary"
                  link
                  v-hasPermi="['oa:note:update']"
                  @click="openForm('update', scope.row.id)"
                >
                  修改
                </el-button>
                <el-button
                  type="danger"
                  link
                  v-hasPermi="['oa:note:delete']"
                  @click="handleDelete(scope.row.id)"
                >
                  删除
                </el-button>
                <el-button
                  type="primary"
                  link
                  v-hasPermi="['oa:note:update']"
                  @click="shareFormRef?.open(scope.row.id)"
                >
                  共享
                </el-button>
              </template>
              <el-button v-else type="danger" link @click="handleDeleteReceived(scope.row.id)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </ContentWrap>
    </el-col>
  </el-row>

  <!-- 笔记表单与目录管理 -->
  <OaNoteDetail ref="detailRef" />
  <OaNoteShareForm ref="shareFormRef" @success="getList" />
  <OaNoteForm ref="formRef" @success="getList" />
  <OaNoteCategoryList ref="categoryDialogRef" @success="handleCategoryChange" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as NoteApi from '@/api/oa/note'
import * as NoteCategoryApi from '@/api/oa/note/category'
import { dateFormatter } from '@/utils/formatTime'
import OaNoteForm from './OaNoteForm.vue'
import OaNoteShareForm from './components/OaNoteShareForm.vue'
import OaNoteSidebar from './components/OaNoteSidebar.vue'
import OaNoteDetail from './components/OaNoteDetail.vue'
import { OA_NOTE_SCENE_TYPE, OA_PRIORITY } from '../utils/constants'
import OaNoteCategoryList from './components/OaNoteCategoryList.vue'

defineOptions({ name: 'OaNote' })

const message = useMessage() // 消息弹窗
const shareFormRef = ref<InstanceType<typeof OaNoteShareForm>>() // 共享表单 Ref
const selectedIds = ref<number[]>([]) // 选中笔记编号
const deleteLoading = ref(false) // 批量删除中
const loading = ref(true) // 列表加载中
const list = ref<NoteApi.OaNoteVO[]>([]) // 笔记列表
const total = ref(0) // 列表总数
const categoryList = ref<NoteCategoryApi.OaNoteCategoryVO[]>([]) // 笔记目录列表
const detailRef = ref<InstanceType<typeof OaNoteDetail>>() // 笔记详情 Ref
const formRef = ref<InstanceType<typeof OaNoteForm>>() // 笔记表单 Ref
const categoryDialogRef = ref<InstanceType<typeof OaNoteCategoryList>>() // 目录管理弹窗 Ref
const activeScene = ref<number>(OA_NOTE_SCENE_TYPE.MINE) // 当前列表场景，不作为查询参数传递
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  categoryId: undefined as number | undefined,
  type: undefined as number | undefined,
  priority: undefined,
  favorite: undefined,
  createTime: []
}) // 查询参数
const queryFormRef = ref() // 搜索表单 Ref

/** 查询笔记列表 */
async function getList() {
  selectedIds.value = []
  loading.value = true
  try {
    const getPage =
      activeScene.value === OA_NOTE_SCENE_TYPE.MINE
        ? NoteApi.getMyNotePage
        : NoteApi.getReceivedNotePage
    const data = await getPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询笔记目录 */
async function getCategoryList() {
  categoryList.value = await NoteCategoryApi.getNoteCategoryList()
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 切换左侧分类 */
function handleCategorySelect(index: string) {
  // 目录属于本人，选择目录时回到我的笔记；最近展示当前场景全部目录。
  queryParams.categoryId = index === 'all' ? undefined : Number(index)
  if (queryParams.categoryId !== undefined) {
    activeScene.value = OA_NOTE_SCENE_TYPE.MINE
  }
  handleQuery()
}

/** 切换左侧笔记类型 */
function handleTypeSelect(index: string) {
  queryParams.type = index === 'all' ? undefined : Number(index)
  handleQuery()
}

/** 切换笔记场景 */
function handleSceneChange() {
  queryParams.categoryId = undefined
  handleQuery()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  activeScene.value = OA_NOTE_SCENE_TYPE.MINE
  queryParams.categoryId = undefined
  queryParams.type = undefined
  handleQuery()
}

/** 打开笔记表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id, queryParams.categoryId)
}

/** 查看笔记详情 */
function openDetail(id: number) {
  detailRef.value?.open(id)
}

/** 修改收藏状态 */
async function handleFavorite(note: NoteApi.OaNoteVO) {
  if (!note.id) return
  await NoteApi.updateNoteFavorite(note.id, !note.favorite)
  await getList()
}

/** 表格多选变更 */
function handleSelectionChange(notes: NoteApi.OaNoteVO[]) {
  selectedIds.value = notes.map((note) => note.id!).filter((id) => id !== undefined)
}

/** 批量删除本人笔记，单条失败不阻断其他条目 */
async function handleDeleteList() {
  if (deleteLoading.value || !selectedIds.value.length) return
  const ids = [...selectedIds.value]
  try {
    await message.delConfirm(
      '确认处理选中的 ' + ids.length + ' 条笔记？共享笔记仅退出本人访问，其他笔记将被删除。'
    )
  } catch {
    return
  }
  deleteLoading.value = true
  try {
    const results = await Promise.allSettled(ids.map((id) => NoteApi.deleteNote(id)))
    const successCount = results.filter((result) => result.status === 'fulfilled').length
    const failedCount = results.length - successCount
    if (failedCount) {
      message.warning('删除成功 ' + successCount + ' 条，失败 ' + failedCount + ' 条')
    } else {
      message.success('删除成功 ' + successCount + ' 条')
    }
    await getList()
  } finally {
    deleteLoading.value = false
  }
}

/** 删除笔记 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm(
      '共享笔记仅退出本人访问，其他接收人仍可查看；非共享笔记将被删除，是否继续？'
    )
    // 发起删除
    await NoteApi.deleteNote(id)
    message.success('删除成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 移除收到的共享笔记 */
async function handleDeleteReceived(id: number) {
  try {
    await message.delConfirm('确认移除这条共享笔记？笔记正文和其他接收人不受影响。')
    await NoteApi.deleteReceivedNote(id)
    message.success('移除成功')
    await getList()
  } catch {}
}

/** 目录修改成功 */
async function handleCategoryChange() {
  await getCategoryList()
  queryParams.categoryId = undefined
  handleQuery()
}

/** 初始化 */
onMounted(() => {
  getCategoryList()
  getList()
})
</script>
