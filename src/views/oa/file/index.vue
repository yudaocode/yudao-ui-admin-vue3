<template>
  <doc-alert title="【办公】企业云盘" url="https://doc.iocoder.cn/oa/file/" />
  <!-- 云盘概览，独立于列表筛选 -->
  <OaFileStorage ref="storageRef" />
  <div class="flex items-start gap-20px">
    <!-- 左侧文件导航与分类 -->
    <ContentWrap class="w-210px shrink-0">
      <div class="mb-12px font-bold">企业云盘</div>
      <div class="flex flex-col gap-4px">
        <el-button
          v-for="item in OA_FILE_SCOPE_OPTIONS"
          :key="item.value"
          class="!ml-0 !justify-start"
          :type="scope === item.value ? 'primary' : 'default'"
          text
          @click="handleScope(item.value)"
        >
          <Icon :icon="item.icon" class="mr-8px" />{{ item.label }}
        </el-button>
      </div>
      <el-divider />
      <div class="mb-8px text-13px text-gray-500">文件分类</div>
      <div class="flex flex-col gap-4px">
        <el-button
          v-for="item in getIntDictOptions(DICT_TYPE.OA_FILE_CATEGORY)"
          :key="item.value"
          class="!ml-0 !justify-start"
          :type="
            (queryParams.category || OA_FILE_CATEGORY.ALL) === item.value ? 'primary' : 'default'
          "
          text
          @click="handleCategory(item.value)"
        >
          <Icon :icon="fileCategoryIcons[item.value]" class="mr-8px" />{{ item.label }}
        </el-button>
      </div>
    </ContentWrap>

    <div class="min-w-0 flex-1">
      <!-- 查询与操作 -->
      <ContentWrap>
        <el-form
          ref="queryFormRef"
          :model="queryParams"
          :inline="true"
          label-width="68px"
          class="-mb-15px"
        >
          <el-form-item label="名称" prop="name">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入名称"
              clearable
              class="!w-240px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="类型" prop="category">
            <el-select
              v-model="queryParams.category"
              placeholder="请选择类型"
              clearable
              class="!w-240px"
            >
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_FILE_CATEGORY).filter(
                  (item) => item.value !== OA_FILE_CATEGORY.ALL
                )"
                :key="item.value"
                :label="item.label"
                :value="item.value"
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
          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
            <el-button
              v-if="canCreate"
              v-hasPermi="['oa:file:create']"
              type="primary"
              plain
              @click="openForm('create')"
            >
              <Icon icon="ep:folder-add" /> 新建文件夹
            </el-button>
            <OaFileUpload
              v-if="canCreate"
              v-hasPermi="['oa:file:create']"
              :parent-id="currentParentId"
              class="ml-12px flex items-center"
              @success="handleSuccess"
            />
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 文件列表与目录面包屑 -->
      <ContentWrap>
        <el-breadcrumb separator="/" class="mb-20px">
          <el-breadcrumb-item v-for="(item, index) in paths" :key="item.id">
            <el-link :underline="false" @click="handlePath(index)">{{ item.name }}</el-link>
          </el-breadcrumb-item>
        </el-breadcrumb>
        <el-table v-loading="loading" :data="list" row-key="id">
          <el-table-column label="名称" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="flex items-center gap-8px">
                <Icon
                  :icon="
                    row.type === OA_FILE_NODE_TYPE.FOLDER ? 'ep:folder' : getFileIcon(row.name)
                  "
                />
                <el-link
                  v-if="scope !== OA_FILE_SCOPE.RECYCLE"
                  type="primary"
                  :underline="false"
                  @click="handleOpen(row)"
                >
                  {{ row.name }}
                </el-link>
                <span v-else>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="110">
            <template #default="{ row }">
              {{ row.type === OA_FILE_NODE_TYPE.FILE ? formatFileSize(row.size || 0) : '' }}
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            prop="createTime"
            :formatter="dateFormatter"
            width="180"
          />
          <el-table-column label="操作" align="center" width="180" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center justify-center gap-12px [&_.el-button]:!ml-0">
                <template v-if="scope === OA_FILE_SCOPE.RECYCLE">
                  <el-button
                    v-hasPermi="['oa:file:delete']"
                    link
                    type="primary"
                    @click="handleRestore(row)"
                  >
                    恢复
                  </el-button>
                  <el-button
                    v-hasPermi="['oa:file:delete']"
                    link
                    type="danger"
                    @click="handleDelete(row)"
                  >
                    彻底删除
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    v-if="
                      row.type === OA_FILE_NODE_TYPE.FILE &&
                      row.level >= OA_FILE_PERMISSION_LEVEL.DOWNLOAD
                    "
                    link
                    type="primary"
                    @click="handleDownload(row)"
                  >
                    下载
                  </el-button>
                  <el-button
                    v-if="
                      row.level >= OA_FILE_PERMISSION_LEVEL.MANAGE && checkPermi(['oa:file:share'])
                    "
                    link
                    type="primary"
                    @click="openPermissionForm(row.id)"
                  >
                    共享
                  </el-button>
                  <el-dropdown
                    trigger="click"
                    class="flex items-center"
                    @command="(command) => handleCommand(command, row)"
                  >
                    <el-button link type="primary">更多</el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="favorite">
                          {{ row.favorite ? '取消收藏' : '收藏' }}
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="
                            row.level >= OA_FILE_PERMISSION_LEVEL.EDIT &&
                            checkPermi(['oa:file:update'])
                          "
                          command="rename"
                        >
                          重命名
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="
                            row.level >= OA_FILE_PERMISSION_LEVEL.DOWNLOAD &&
                            checkPermi(['oa:file:create'])
                          "
                          command="copy"
                        >
                          复制
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="isOwner(row) && checkPermi(['oa:file:update'])"
                          command="move"
                        >
                          移动
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="isOwner(row) && checkPermi(['oa:file:delete'])"
                          command="recycle"
                          divided
                          class="!text-[var(--el-color-danger)]"
                        >
                          删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </div>
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
    </div>

    <!-- 文件预览、新增、重命名、移动及共享弹窗 -->
    <OaFilePreview ref="previewRef" />
    <OaFileNodeForm ref="formRef" @success="handleSuccess" />
    <OaFilePermissionList ref="permissionRef" @success="handleSuccess" />
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as NodeApi from '@/api/oa/file/node'
import * as FavoriteApi from '@/api/oa/file/favorite'
import { useUserStore } from '@/store/modules/user'
import { formatFileSize, getFileIcon } from '@/utils/file'
import { dateFormatter } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import OaFileNodeForm from './OaFileNodeForm.vue'
import OaFilePreview from './OaFilePreview.vue'
import OaFilePermissionList from './OaFilePermissionList.vue'
import OaFileStorage from './OaFileStorage.vue'
import OaFileUpload from './OaFileUpload.vue'
import {
  OA_FILE_NODE_TYPE,
  OA_FILE_PARENT_ID_ROOT,
  OA_FILE_PERMISSION_LEVEL,
  OA_FILE_SCOPE,
  OA_FILE_SCOPE_OPTIONS,
  OA_FILE_CATEGORY
} from '@/views/oa/utils/constants'

import { downloadByData } from '@/utils/filt'

defineOptions({ name: 'OaFile' })

// 分类图标只负责展示，分类名称与取值由字典维护。
const fileCategoryIcons: Record<number, string> = {
  [OA_FILE_CATEGORY.ALL]: 'ep:files',
  [OA_FILE_CATEGORY.IMAGE]: 'ep:picture',
  [OA_FILE_CATEGORY.DOCUMENT]: 'ep:document',
  [OA_FILE_CATEGORY.VIDEO]: 'ep:video-camera',
  [OA_FILE_CATEGORY.AUDIO]: 'ep:headset',
  [OA_FILE_CATEGORY.ARCHIVE]: 'ep:box',
  [OA_FILE_CATEGORY.OTHER]: 'ep:more-filled'
}

const message = useMessage() // 消息提示
const userStore = useUserStore() // 当前用户
const loading = ref(false) // 列表加载中
const list = ref<NodeApi.OaFileNodeVO[]>([]) // 文件列表
const total = ref(0) // 总数
const storageRef = ref() // 云盘概览 Ref
const formRef = ref() // 节点表单
const previewRef = ref() // 文件预览 Ref
const permissionRef = ref() // 共享列表
const scope = ref<string>(OA_FILE_SCOPE.MY) // 当前文件范围
const currentParentId = ref<number>(OA_FILE_PARENT_ID_ROOT) // 当前目录
const currentLevel = ref<number>(OA_FILE_PERMISSION_LEVEL.MANAGE) // 当前目录权限
const paths = ref([
  {
    id: OA_FILE_PARENT_ID_ROOT as number,
    name: '我的文件',
    level: OA_FILE_PERMISSION_LEVEL.MANAGE as number
  }
]) // 面包屑
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  category: undefined as number | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref() // 查询表单
const canCreate = computed(
  () =>
    scope.value !== OA_FILE_SCOPE.RECYCLE &&
    !queryParams.category &&
    (currentParentId.value !== OA_FILE_PARENT_ID_ROOT
      ? currentLevel.value >= OA_FILE_PERMISSION_LEVEL.EDIT
      : scope.value === OA_FILE_SCOPE.MY)
)

/** 打开节点表单 */
function openForm(type: string, row?: NodeApi.OaFileNodeVO) {
  formRef.value.open(type, row?.parentId ?? currentParentId.value, row)
}

/** 打开共享设置 */
function openPermissionForm(id: number) {
  permissionRef.value.open(id)
}

/** 操作成功后刷新列表与概览 */
async function handleSuccess() {
  await Promise.all([getList(), storageRef.value.getStorage()])
}

/** 查询文件列表 */
async function getList() {
  loading.value = true
  try {
    // 搜索或根目录收藏查询跨目录展示，否则只查询当前目录
    const parentId =
      queryParams.name ||
      queryParams.category ||
      queryParams.createTime?.length ||
      (scope.value === OA_FILE_SCOPE.FAVORITE && currentParentId.value === OA_FILE_PARENT_ID_ROOT)
        ? undefined
        : currentParentId.value
    const data = await NodeApi.getFileNodePage({ ...queryParams, scope: scope.value, parentId })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 切换文件范围 */
function handleScope(value: string) {
  scope.value = value
  currentParentId.value = OA_FILE_PARENT_ID_ROOT
  currentLevel.value =
    value === OA_FILE_SCOPE.MY ? OA_FILE_PERMISSION_LEVEL.MANAGE : OA_FILE_PERMISSION_LEVEL.READ
  paths.value = [
    {
      id: OA_FILE_PARENT_ID_ROOT,
      name: OA_FILE_SCOPE_OPTIONS.find((item) => item.value === value)!.label,
      level: currentLevel.value
    }
  ]
  queryParams.category = undefined
  resetQuery()
}

/** 切换分类 */
function handleCategory(value: number) {
  queryParams.category = value || undefined
  handleQuery()
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.category = undefined
  handleQuery()
}

/** 打开文件或目录 */
function handleOpen(row: NodeApi.OaFileNodeVO) {
  if (row.type === OA_FILE_NODE_TYPE.FILE) {
    previewRef.value.open(row)
    return
  }
  currentParentId.value = row.id!
  currentLevel.value = row.level || OA_FILE_PERMISSION_LEVEL.READ
  paths.value.push({
    id: row.id!,
    name: row.name,
    level: currentLevel.value
  })
  queryParams.name = undefined
  queryParams.category = undefined
  queryParams.createTime = []
  handleQuery()
}

/** 返回上级目录 */
function handlePath(index: number) {
  // 还原目标目录的路径及权限
  paths.value = paths.value.slice(0, index + 1)
  currentParentId.value = paths.value[index].id
  currentLevel.value = paths.value[index].level
  resetQuery()
}

/** 判断本人节点 */
function isOwner(row: NodeApi.OaFileNodeVO) {
  return row.creator === String(userStore.getUser.id)
}

/** 执行更多操作 */
function handleCommand(command: string, row: NodeApi.OaFileNodeVO) {
  switch (command) {
    case 'favorite':
      handleFavorite(row)
      break
    case 'rename':
    case 'move':
    case 'copy':
      openForm(command, row)
      break
    case 'recycle':
      handleRecycle(row)
      break
  }
}

/** 获得授权地址后按云盘当前名称下载文件 */
async function handleDownload(row: NodeApi.OaFileNodeVO) {
  if ((row.level || 0) < OA_FILE_PERMISSION_LEVEL.DOWNLOAD) {
    message.warning('当前仅具有查看文件信息的权限')
    return
  }
  const data = await NodeApi.getFileNode(row.id!)
  if (!data.url) {
    message.warning('当前文件不可下载')
    return
  }
  try {
    const response = await fetch(data.url)
    if (!response.ok) {
      message.error('文件下载失败，请重试')
      return
    }
    downloadByData(await response.blob(), data.name)
  } catch {
    message.error('文件下载失败，请重试')
  }
}

/** 收藏或取消收藏 */
async function handleFavorite(row: NodeApi.OaFileNodeVO) {
  if (row.favorite) {
    await FavoriteApi.deleteFileFavorite(row.id!)
  } else {
    await FavoriteApi.createFileFavorite(row.id!)
  }
  await handleSuccess()
}

/** 移入回收站 */
async function handleRecycle(row: NodeApi.OaFileNodeVO) {
  try {
    // 移入回收站的二次确认
    await message.delConfirm('是否将“' + row.name + '”移入回收站？')
    // 发起回收并刷新列表与概览
    await NodeApi.recycleFileNode(row.id!)
    message.success('已移入回收站')
    await handleSuccess()
  } catch {}
}

/** 恢复节点 */
async function handleRestore(row: NodeApi.OaFileNodeVO) {
  await NodeApi.restoreFileNode(row.id!)
  message.success('恢复成功')
  await handleSuccess()
}

/** 彻底删除业务记录 */
async function handleDelete(row: NodeApi.OaFileNodeVO) {
  try {
    // 彻底删除的二次确认
    await message.delConfirm('彻底删除“' + row.name + '”及其全部子文件后将无法恢复，是否继续？')
    // 发起删除并刷新列表与概览
    await NodeApi.deleteFileNode(row.id!)
    message.success('删除成功')
    await handleSuccess()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
