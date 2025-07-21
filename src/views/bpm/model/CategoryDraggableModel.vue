<template>
  <div class="flex items-center h-50px" v-memo="[categoryInfo.name, isCategorySorting]">
    <!-- 头部：分类名 -->
    <div class="flex items-center">
      <el-tooltip :content="t('bpm.model.dragToSort')" v-if="isCategorySorting">
        <Icon
          :size="22"
          icon="ic:round-drag-indicator"
          class="ml-10px category-drag-icon cursor-move text-#8a909c"
        />
      </el-tooltip>
      <h3 class="ml-20px mr-8px text-18px">{{ categoryInfo.name }}</h3>
      <div class="color-gray-600 text-16px"> ({{ categoryInfo.modelList?.length || 0 }}) </div>
    </div>
    <!-- 头部：操作 -->
    <div class="flex-1 flex" v-show="!isCategorySorting">
      <div
        v-if="categoryInfo.modelList.length > 0"
        class="ml-20px flex items-center"
        :class="[
          'transition-transform duration-300 cursor-pointer',
          isExpand ? 'rotate-180' : 'rotate-0'
        ]"
        @click="isExpand = !isExpand"
      >
        <Icon icon="ep:arrow-down-bold" color="#999" />
      </div>
      <div class="ml-auto flex items-center" :class="isModelSorting ? 'mr-15px' : 'mr-45px'">
        <template v-if="!isModelSorting">
          <el-button
            v-if="categoryInfo.modelList.length > 0"
            link
            type="info"
            class="mr-20px"
            @click.stop="handleModelSort"
          >
            <Icon icon="fa:sort-amount-desc" class="mr-5px" />
            {{ t('bpm.model.sort') }}
          </el-button>
          <el-button v-else link type="info" class="mr-20px" @click.stop="openModelForm('create')">
            <Icon icon="fa:plus" class="mr-5px" />
            {{ t('bpm.model.create') }}
          </el-button>
          <el-dropdown
            @command="(command) => handleCategoryCommand(command, categoryInfo)"
            placement="bottom"
          >
            <el-button link type="info">
              <Icon icon="ep:setting" class="mr-5px" />
              {{ t('bpm.model.category') }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="handleRename"> {{ t('bpm.model.rename') }} </el-dropdown-item>
                <el-dropdown-item command="handleDeleteCategory"> {{ t('bpm.model.deleteCategory') }} </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button @click.stop="handleModelSortCancel"> {{ t('common.cancel') }} </el-button>
          <el-button type="primary" @click.stop="handleModelSortSubmit"> {{ t('bpm.model.saveSort') }} </el-button>
        </template>
      </div>
    </div>
  </div>

  <!-- 模型列表 -->
  <el-collapse-transition>
    <div v-show="isExpand">
      <el-table
        v-if="modelList && modelList.length > 0"
        :class="categoryInfo.name"
        ref="tableRef"
        :data="modelList"
        row-key="id"
        :header-cell-style="tableHeaderStyle"
        :cell-style="tableCellStyle"
        :row-style="{ height: '68px' }"
      >
        <el-table-column :label="t('bpm.model.processName')" prop="name" min-width="150">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-tooltip :content="t('bpm.model.dragToSort')" v-if="isModelSorting">
                <Icon
                  icon="ic:round-drag-indicator"
                  class="drag-icon cursor-move text-#8a909c mr-10px"
                />
              </el-tooltip>
              <el-image v-if="row.icon" :src="row.icon" class="h-38px w-38px mr-10px rounded" />
              <div v-else class="flow-icon">
                <span style="font-size: 12px; color: #fff">{{ subString(row.name, 0, 2) }}</span>
              </div>
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('bpm.model.visibleRange')" prop="startUserIds" min-width="150">
          <template #default="{ row }">
            <el-text v-if="!row.startUsers?.length && !row.startDepts?.length"> {{ t('bpm.model.allVisible') }} </el-text>
            <el-text v-else-if="row.startUsers.length === 1">
              {{ row.startUsers[0].nickname }}
            </el-text>
            <el-text v-else-if="row.startDepts?.length === 1">
              {{ row.startDepts[0].name }}
            </el-text>
            <el-text v-else-if="row.startDepts?.length > 1">
              <el-tooltip
                class="box-item"
                effect="dark"
                placement="top"
                :content="row.startDepts.map((dept: any) => dept.name).join('、')"
              >
                {{ row.startDepts[0].name }}{{ t('bpm.model.etc') }} {{ row.startDepts.length }} {{ t('bpm.model.deptVisible') }}
              </el-tooltip>
            </el-text>
            <el-text v-else>
              <el-tooltip
                class="box-item"
                effect="dark"
                placement="top"
                :content="row.startUsers.map((user: any) => user.nickname).join('、')"
              >
                {{ row.startUsers[0].nickname }}{{ t('bpm.model.etc') }} {{ row.startUsers.length }} {{ t('bpm.model.peopleVisible') }}
              </el-tooltip>
            </el-text>
          </template>
        </el-table-column>
        <el-table-column :label="t('bpm.model.processType')" prop="type" min-width="120">
          <template #default="{ row }">
            <dict-tag :value="row.type" :type="DICT_TYPE.BPM_MODEL_TYPE" />
          </template>
        </el-table-column>
        <el-table-column :label="t('bpm.model.formInfo')" prop="formType" min-width="150">
          <template #default="scope">
            <el-button
              v-if="scope.row.formType === BpmModelFormType.NORMAL"
              type="primary"
              link
              @click="handleFormDetail(scope.row)"
            >
              <span>{{ scope.row.formName }}</span>
            </el-button>
            <el-button
              v-else-if="scope.row.formType === BpmModelFormType.CUSTOM"
              type="primary"
              link
              @click="handleFormDetail(scope.row)"
            >
              <span>{{ scope.row.formCustomCreatePath }}</span>
            </el-button>
            <label v-else>{{ t('bpm.model.noForm') }}</label>
          </template>
        </el-table-column>
        <el-table-column :label="t('bpm.model.lastDeploy')" prop="deploymentTime" min-width="250">
          <template #default="scope">
            <div class="flex items-center">
              <span v-if="scope.row.processDefinition" class="w-150px">
                {{ formatDate(scope.row.processDefinition.deploymentTime) }}
              </span>
              <el-tag v-if="scope.row.processDefinition">
                v{{ scope.row.processDefinition.version }}
              </el-tag>
              <el-tag v-else type="warning">{{ t('bpm.model.notDeployed') }}</el-tag>
              <el-tag
                v-if="scope.row.processDefinition?.suspensionState === 2"
                type="warning"
                class="ml-10px"
              >
                {{ t('bpm.model.disabled') }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="200" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openModelForm('update', scope.row.id)"
              v-if="hasPermiUpdate"
              :disabled="!isManagerUser(scope.row)"
            >
              {{ t('action.edit') }}
            </el-button>
            <el-button
              link
              type="primary"
              @click="openModelForm('copy', scope.row.id)"
              v-if="hasPermiUpdate"
              :disabled="!isManagerUser(scope.row)"
            >
              {{ t('bpm.model.copy') }}
            </el-button>
            <el-button
              link
              class="!ml-5px"
              type="primary"
              @click="handleDeploy(scope.row)"
              v-if="hasPermiDeploy"
              :disabled="!isManagerUser(scope.row)"
            >
              {{ t('bpm.model.deploy') }}
            </el-button>
            <el-dropdown
              class="!align-middle ml-5px"
              @command="(command) => handleModelCommand(command, scope.row)"
              v-if="hasPermiMore"
            >
              <el-button type="primary" link>{{ t('action.more') }}</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="handleDefinitionList" v-if="hasPermiPdQuery">
                    {{ t('bpm.model.history') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="handleReport"
                    v-if="
                      checkPermi(['bpm:process-instance:manager-query']) &&
                      scope.row.processDefinition
                    "
                    :disabled="!isManagerUser(scope.row)"
                  >
                    {{ t('bpm.model.report') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="handleChangeState"
                    v-if="hasPermiUpdate && scope.row.processDefinition"
                    :disabled="!isManagerUser(scope.row)"
                  >
                    {{ scope.row.processDefinition.suspensionState === 1 ? t('bpm.model.disable') : t('bpm.model.enable') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    type="danger"
                    command="handleClean"
                    v-if="checkPermi(['bpm:model:clean'])"
                    :disabled="!isManagerUser(scope.row)"
                  >
                    {{ t('bpm.model.clean') }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    type="danger"
                    command="handleDelete"
                    v-if="hasPermiDelete"
                    :disabled="!isManagerUser(scope.row)"
                  >
                    {{ t('action.delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-collapse-transition>

  <!-- 弹窗：重命名分类 -->
  <Dialog :fullscreen="false" class="rename-dialog" v-model="renameCategoryVisible" width="400">
    <template #title>
      <div class="pl-10px font-bold text-18px"> {{ t('bpm.model.renameCategory') }} </div>
    </template>
    <div class="px-30px">
      <el-input v-model="renameCategoryForm.name" />
    </div>
    <template #footer>
      <div class="pr-25px pb-25px">
        <el-button @click="renameCategoryVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleRenameConfirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </Dialog>

  <!-- 弹窗：表单详情 -->
  <Dialog :title="t('bpm.model.formDetail')" :fullscreen="true" v-model="formDetailVisible">
    <form-create :rule="formDetailPreview.rule" :option="formDetailPreview.option" />
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import Sortable from 'sortablejs'
import { formatDate } from '@/utils/formatTime'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { setConfAndFields2 } from '@/utils/formCreate'
import { BpmModelFormType } from '@/utils/constants'
import { checkPermi } from '@/utils/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { cloneDeep, isEqual } from 'lodash-es'
import { useDebounceFn } from '@vueuse/core'
import { subString } from '@/utils/index'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BpmModel' })

// 优化 Props 类型定义
interface UserInfo {
  nickname: string
  [key: string]: any
}

interface ProcessDefinition {
  deploymentTime: string
  version: number
  suspensionState: number
}

interface ModelInfo {
  id: number
  name: string
  icon?: string
  startUsers?: UserInfo[]
  processDefinition?: ProcessDefinition
  formType?: number
  formId?: number
  formName?: string
  formCustomCreatePath?: string
  managerUserIds?: number[]
  [key: string]: any
}

interface CategoryInfoProps {
  id: number
  name: string
  modelList: ModelInfo[]
}

const props = defineProps<{
  categoryInfo: CategoryInfoProps
  isCategorySorting: boolean
}>()

const emit = defineEmits(['success'])
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由
const userStore = useUserStoreWithOut() // 用户信息缓存
const isDark = computed(() => useAppStore().getIsDark) // 是否黑暗模式
const router = useRouter() // 路由

const isModelSorting = ref(false) // 是否正处于排序状态
const originalData = ref<ModelInfo[]>([]) // 原始数据
const modelList = ref<ModelInfo[]>([]) // 模型列表
const isExpand = ref(false) // 是否处于展开状态

// 使用 computed 优化表格样式计算
const tableHeaderStyle = computed(() => ({
  backgroundColor: isDark.value ? '' : '#edeff0',
  paddingLeft: '10px'
}))

const tableCellStyle = computed(() => ({
  paddingLeft: '10px'
}))

/** 权限校验：通过 computed 解决列表的卡顿问题 */
const hasPermiUpdate = computed(() => {
  return checkPermi(['bpm:model:update'])
})
const hasPermiDelete = computed(() => {
  return checkPermi(['bpm:model:delete'])
})
const hasPermiDeploy = computed(() => {
  return checkPermi(['bpm:model:deploy'])
})
const hasPermiMore = computed(() => {
  return checkPermi(['bpm:process-definition:query', 'bpm:model:update', 'bpm:model:delete'])
})
const hasPermiPdQuery = computed(() => {
  return checkPermi(['bpm:process-definition:query'])
})

/** '更多'操作按钮 */
const handleModelCommand = (command: string, row: any) => {
  switch (command) {
    case 'handleDefinitionList':
      handleDefinitionList(row)
      break
    case 'handleDelete':
      handleDelete(row)
      break
    case 'handleChangeState':
      handleChangeState(row)
      break
    case 'handleClean':
      handleClean(row)
      break
    case 'handleReport':
      router.push({
        name: 'BpmProcessInstanceReport',
        query: {
          processDefinitionId: row.processDefinition.id,
          processDefinitionKey: row.key
        }
      })
      break
    default:
      break
  }
}

/** '分类'操作按钮 */
const handleCategoryCommand = async (command: string, row: any) => {
  switch (command) {
    case 'handleRename':
      renameCategoryForm.value = await CategoryApi.getCategory(row.id)
      renameCategoryVisible.value = true
      break
    case 'handleDeleteCategory':
      await handleDeleteCategory()
      break
    default:
      break
  }
}

/** 删除按钮操作 */
const handleDelete = async (row: any) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ModelApi.deleteModel(row.id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    emit('success')
  } catch {}
}

/** 清理按钮操作 */
const handleClean = async (row: any) => {
  try {
    // 清理的二次确认
    await message.confirm(t('bpm.model.confirmClean', { name: row.name }))
    // 发起清理
    await ModelApi.cleanModel(row.id)
    message.success(t('bpm.model.cleanSuccess'))
    // 刷新列表
    emit('success')
  } catch {}
}

/** 更新状态操作 */
const handleChangeState = async (row: any) => {
  const state = row.processDefinition.suspensionState
  const newState = state === 1 ? 2 : 1
  try {
    // 修改状态的二次确认
    const id = row.id
    const statusState = state === 1 ? t('bpm.model.disable') : t('bpm.model.enable')
    const content = t('bpm.model.confirmChangeState', { state: statusState, name: row.name })
    await message.confirm(content)
    // 发起修改状态
    await ModelApi.updateModelState(id, newState)
    message.success(statusState + t('common.success'))
    // 刷新列表
    emit('success')
  } catch {}
}

/** 发布流程 */
const handleDeploy = async (row: any) => {
  try {
    await message.confirm(t('bpm.model.confirmDeploy'))
    // 发起部署
    await ModelApi.deployModel(row.id)
    message.success(t('bpm.model.deploySuccess'))
    // 刷新列表
    emit('success')
  } catch {}
}

/** 跳转到指定流程定义列表 */
const handleDefinitionList = (row: any) => {
  push({
    name: 'BpmProcessDefinition',
    query: {
      key: row.key
    }
  })
}

/** 流程表单的详情按钮操作 */
const formDetailVisible = ref(false)
const formDetailPreview = ref({
  rule: [],
  option: {}
})
const handleFormDetail = async (row: any) => {
  if (row.formType == BpmModelFormType.NORMAL) {
    // 设置表单
    const data = await FormApi.getForm(row.formId)
    setConfAndFields2(formDetailPreview, data.conf, data.fields)
    // 弹窗打开
    formDetailVisible.value = true
  } else {
    await push({
      path: row.formCustomCreatePath
    })
  }
}

/** 判断是否可以操作 */
const isManagerUser = (row: any) => {
  const userId = userStore.getUser.id
  return row.managerUserIds && row.managerUserIds.includes(userId)
}

/** 处理模型的排序 **/
const handleModelSort = () => {
  // 保存初始数据
  originalData.value = cloneDeep(props.categoryInfo.modelList)
  isModelSorting.value = true
  initSort()
}

/** 处理模型的排序提交 */
const handleModelSortSubmit = async () => {
  // 保存排序
  const ids = modelList.value.map((item: any) => item.id)
  await ModelApi.updateModelSortBatch(ids)
  // 刷新列表
  isModelSorting.value = false
  message.success(t('bpm.model.sortSuccess'))
  emit('success')
}

/** 处理模型的排序取消 */
const handleModelSortCancel = () => {
  // 恢复初始数据
  modelList.value = cloneDeep(originalData.value)
  isModelSorting.value = false
}

/** 创建拖拽实例 */
const tableRef = ref()
const initSort = useDebounceFn(() => {
  const table = document.querySelector(`.${props.categoryInfo.name} .el-table__body-wrapper tbody`)
  if (!table) return

  Sortable.create(table, {
    group: 'shared',
    animation: 150,
    draggable: '.el-table__row',
    handle: '.drag-icon',
    onEnd: ({ newDraggableIndex, oldDraggableIndex }) => {
      if (oldDraggableIndex !== newDraggableIndex) {
        modelList.value.splice(
          newDraggableIndex,
          0,
          modelList.value.splice(oldDraggableIndex, 1)[0]
        )
      }
    }
  })
}, 200)

/** 更新 modelList 模型列表 */
const updateModeList = useDebounceFn(() => {
  const newModelList = props.categoryInfo.modelList
  if (!isEqual(modelList.value, newModelList)) {
    modelList.value = cloneDeep(newModelList)
    if (newModelList?.length > 0) {
      isExpand.value = true
    }
  }
}, 100)

/** 重命名弹窗确定 */
const renameCategoryVisible = ref(false)
const renameCategoryForm = ref({
  name: ''
})
const handleRenameConfirm = async () => {
  if (renameCategoryForm.value?.name.length === 0) {
    return message.warning(t('bpm.model.pleaseEnterName'))
  }
  // 发起修改
  await CategoryApi.updateCategory(renameCategoryForm.value as CategoryVO)
  message.success(t('bpm.model.renameSuccess'))
  // 刷新列表
  renameCategoryVisible.value = false
  emit('success')
}

/** 删除分类 */
const handleDeleteCategory = async () => {
  try {
    if (props.categoryInfo.modelList.length > 0) {
      return message.warning(t('bpm.model.categoryNotEmpty'))
    }
    await message.confirm(t('bpm.model.confirmDeleteCategory'))
    // 发起删除
    await CategoryApi.deleteCategory(props.categoryInfo.id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    emit('success')
  } catch {}
}

/** 添加/修改/复制流程模型弹窗 */
const openModelForm = async (type: string, id?: number) => {
  if (type === 'create') {
    await push({ name: 'BpmModelCreate' })
  } else {
    await push({
      name: 'BpmModelUpdate',
      params: { id, type }
    })
  }
}

watchEffect(() => {
  if (props.categoryInfo?.modelList) {
    updateModeList()
  }

  if (props.isCategorySorting) {
    isExpand.value = false
  }
})
</script>

<style lang="scss">
.rename-dialog.el-dialog {
  padding: 0 !important;

  .el-dialog__header {
    border-bottom: none;
  }

  .el-dialog__footer {
    border-top: none !important;
  }
}
</style>
<style lang="scss" scoped>
.flow-icon {
  display: flex;
  width: 38px;
  height: 38px;
  margin-right: 10px;
  background-color: var(--el-color-primary);
  border-radius: 0.25rem;
  align-items: center;
  justify-content: center;
}

.category-draggable-model {
  :deep(.el-table__cell) {
    overflow: hidden;
    border-bottom: none !important;
  }

  // 优化表格渲染性能
  :deep(.el-table__body) {
    will-change: transform;
    transform: translateZ(0);
  }
}
</style>
