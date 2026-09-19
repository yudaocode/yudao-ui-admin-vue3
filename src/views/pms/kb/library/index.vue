<template>
  <doc-alert title="【PMS】知识库管理" url="https://doc.iocoder.cn/pms/kb/library/" />

  <ContentWrap>
    <!-- 搜索 -->
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="知识库名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入知识库名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
        <el-button
          v-hasPermi="['pms:kb:library:create']"
          type="primary"
          @click="openForm('create')"
        >
          新建知识库
        </el-button>
        <el-button
          v-hasPermi="['pms:kb:library:update']"
          plain
          type="primary"
          @click="groupFormRef?.open('create')"
        >
          新建分组
        </el-button>
        <el-button v-hasPermi="['pms:kb:library:update']" @click="groupManageRef?.open()">
          管理分组
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-tabs v-model="queryParams.groupId" @tab-change="handleGroupQuery">
      <el-tab-pane
        v-for="group in groupList"
        :key="group.id"
        :label="`${group.name}（${group.libraryCount ?? 0}）`"
        :name="group.id"
      />
    </el-tabs>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="知识库" min-width="260">
        <template #default="scope">
          <div class="flex items-center gap-12px">
            <el-image class="h-44px w-64px rounded" fit="cover" :src="scope.row.coverUrl">
              <template #error>
                <div
                  class="flex h-44px w-64px items-center justify-center bg-[var(--el-fill-color-light)] text-[var(--el-text-color-secondary)]"
                >
                  <Icon icon="ep:notebook" />
                </div>
              </template>
            </el-image>
            <div>
              <el-link type="primary" @click="openDetail(scope.row.id)">
                {{ scope.row.name }}
              </el-link>
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                {{ scope.row.description || '暂无简介' }}
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column align="center" label="可见范围" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.openStatus ? 'success' : 'info'">
            {{ scope.row.openStatus ? '公开' : '私有' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="成员" prop="memberCount" width="90" />
      <el-table-column align="center" label="文档数" prop="documentCount" width="90" />
      <el-table-column align="center" label="文件数" prop="fileCount" width="90" />
      <el-table-column label="创建人" prop="creatorUserName" width="120" />
      <el-table-column :formatter="dateFormatter" label="创建时间" prop="createTime" width="180" />
      <el-table-column align="center" fixed="right" label="是否关注" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.favoriteStatus"
            @change="handleFavoriteStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="280">
        <template #default="scope">
          <div class="flex items-center justify-center gap-12px">
            <el-dropdown
              v-if="scope.row.writeStatus"
              v-hasPermi="['pms:kb:library:update']"
              trigger="click"
              @command="(groupId) => handleMoveGroup(scope.row.id, groupId)"
            >
              <el-button class="!m-0" link type="primary">移动分组</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="group in moveTargetGroupList"
                    :key="group.id"
                    :command="group.id"
                  >
                    {{ group.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              v-if="scope.row.adminStatus"
              v-hasPermi="['pms:kb:library:update']"
              class="!m-0"
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.creatorUserId === currentUserId"
              v-hasPermi="['pms:kb:library:delete']"
              class="!m-0"
              link
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
            <el-button
              v-if="scope.row.exitStatus"
              class="!m-0"
              link
              type="danger"
              @click="handleExit(scope.row)"
            >
              退出
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 新建或修改知识库 -->
  <KnowledgeLibraryForm ref="formRef" @success="getList" />
  <!-- 新建知识库分组 -->
  <KnowledgeGroupForm ref="groupFormRef" @success="handleGroupsChanged" />
  <!-- 管理知识库分组 -->
  <KnowledgeGroupManageDialog ref="groupManageRef" @success="handleGroupsChanged" />
</template>

<script lang="ts" setup>
import * as KnowledgeFavoriteApi from '@/api/pms/kb/interaction/favorite'
import * as KnowledgeLibraryApi from '@/api/pms/kb/library'
import * as KnowledgeGroupApi from '@/api/pms/kb/library/group'
import * as KnowledgeLibraryMemberApi from '@/api/pms/kb/library/member'
import { getCurrentUserId } from '@/utils/auth'
import { dateFormatter } from '@/utils/formatTime'
import KnowledgeLibraryForm from './KnowledgeLibraryForm.vue'
import KnowledgeGroupForm from './KnowledgeGroupForm.vue'
import KnowledgeGroupManageDialog from './KnowledgeGroupManageDialog.vue'
import { PmsKnowledgeGroupType, PmsKnowledgeObjectType } from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeLibrary' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const currentUserId = getCurrentUserId() // 当前登录用户，用于判断创建人级操作
const loading = ref(true) // 数据加载中
const total = ref(0) // 数据总数
const list = ref<KnowledgeLibraryApi.PmsKnowledgeLibraryVO[]>([]) // 知识库列表
const groupList = ref<KnowledgeGroupApi.PmsKnowledgeGroupVO[]>([]) // 知识库分组列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  groupId: undefined as number | undefined
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref
const formRef = ref<InstanceType<typeof KnowledgeLibraryForm>>() // 表单 Ref
const groupFormRef = ref<InstanceType<typeof KnowledgeGroupForm>>() // 分组表单 Ref
const groupManageRef = ref<InstanceType<typeof KnowledgeGroupManageDialog>>() // 分组管理 Ref
const moveTargetGroupList = computed(() =>
  groupList.value.filter((group) => group.type !== PmsKnowledgeGroupType.ALL)
) // 可移动到的分组

/** 查询知识库列表 */
async function getList() {
  loading.value = true
  try {
    const data = await KnowledgeLibraryApi.getKnowledgeLibraryPage(queryParams)
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

/** 切换分组查询 */
function handleGroupQuery(groupId: string | number) {
  queryParams.groupId = Number(groupId)
  handleQuery()
}

/** 打开知识库表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 打开知识库详情 */
function openDetail(id: number) {
  router.push(`/pms/kb/library/${id}`)
}

/** 删除按钮操作 */
async function handleDelete(library: KnowledgeLibraryApi.PmsKnowledgeLibraryVO) {
  try {
    // 删除的二次确认
    await message.delConfirm(`确认删除知识库“${library.name}”吗？`)
    // 发起删除
    await KnowledgeLibraryApi.deleteKnowledgeLibrary(library.id)
    message.success('删除成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 退出按钮操作 */
async function handleExit(library: KnowledgeLibraryApi.PmsKnowledgeLibraryVO) {
  try {
    // 退出的二次确认
    await message.confirm(`确认退出知识库“${library.name}”吗？退出后将无法访问私有内容。`)
    // 发起退出
    await KnowledgeLibraryMemberApi.exitKnowledgeLibrary(library.id)
    message.success('已退出知识库')
    // 刷新分组和列表
    await getGroupList()
    await getList()
  } catch {}
}

/** 修改知识库关注状态 */
async function handleFavoriteStatusChange(library: KnowledgeLibraryApi.PmsKnowledgeLibraryVO) {
  try {
    // 修改关注状态的二次确认
    const text = library.favoriteStatus ? '关注' : '取消关注'
    await message.confirm(`确认${text}知识库“${library.name}”吗？`)
    // 发起修改关注状态
    if (library.favoriteStatus) {
      await KnowledgeFavoriteApi.createKnowledgeFavorite({
        type: PmsKnowledgeObjectType.LIBRARY,
        entityId: library.id!
      })
    } else {
      await KnowledgeFavoriteApi.deleteKnowledgeFavorite(
        PmsKnowledgeObjectType.LIBRARY,
        library.id!
      )
    }
    // 刷新列表
    await getList()
  } catch {
    // 取消或操作失败后，恢复开关状态
    library.favoriteStatus = !library.favoriteStatus
  }
}

/** 查询知识库分组 */
async function getGroupList() {
  groupList.value = await KnowledgeGroupApi.getKnowledgeGroupList()
  if (!groupList.value.some((group) => group.id === queryParams.groupId)) {
    queryParams.groupId = groupList.value[0]?.id
  }
}

/** 移动知识库到分组 */
async function handleMoveGroup(libraryId: number, groupId: number) {
  await KnowledgeGroupApi.moveKnowledgeLibraryToGroup(libraryId, groupId)
  message.success('移动成功')
  // 刷新分组和列表
  await getGroupList()
  await getList()
}

/** 分组变化后刷新分组与列表 */
async function handleGroupsChanged() {
  await getGroupList()
  await getList()
}

/** 初始化 */
onMounted(async () => {
  await getGroupList()
  await getList()
})
</script>
