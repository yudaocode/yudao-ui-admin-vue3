<template>
  <div class="flex items-center h-50px">
    <!-- 头部：分类名 -->
    <div class="flex items-center">
      <el-tooltip content="拖动排序" v-if="isCategorySorting">
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
    <div class="flex-1 flex" v-if="!isCategorySorting">
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
            排序
          </el-button>
          <el-button v-else link type="info" class="mr-20px" @click.stop="openModelForm('create')">
            <Icon icon="fa:plus" class="mr-5px" />
            新建
          </el-button>
          <el-dropdown
            @command="(command) => handleCategoryCommand(command, categoryInfo)"
            placement="bottom"
          >
            <el-button link type="info">
              <Icon icon="ep:setting" class="mr-5px" />
              分类
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="handleRename"> 重命名 </el-dropdown-item>
                <el-dropdown-item command="handleDeleteCategory"> 删除该类 </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button @click.stop="handleModelSortCancel"> 取 消 </el-button>
          <el-button type="primary" @click.stop="handleModelSortSubmit"> 保存排序 </el-button>
        </template>
      </div>
    </div>
  </div>
  <!-- 模型列表 -->
  <el-collapse-transition>
    <div v-show="isExpand">
      <el-table
        :class="categoryInfo.name"
        ref="tableRef"
        :header-cell-style="{ backgroundColor: isDark ? '' : '#edeff0', paddingLeft: '10px' }"
        :cell-style="{ paddingLeft: '10px' }"
        :row-style="{ height: '68px' }"
        :data="modelList"
        row-key="id"
      >
        <el-table-column label="流程名" prop="name" min-width="150">
          <template #default="scope">
            <div class="flex items-center">
              <el-tooltip content="拖动排序" v-if="isModelSorting">
                <Icon
                  icon="ic:round-drag-indicator"
                  class="drag-icon cursor-move text-#8a909c mr-10px"
                />
              </el-tooltip>
              <el-image :src="scope.row.icon" class="h-38px w-38px mr-10px rounded" />
              {{ scope.row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="可见范围" prop="startUserIds" min-width="100">
          <template #default="scope">
            <el-text v-if="!scope.row.startUsers || scope.row.startUsers.length === 0">
              全部可见
            </el-text>
            <el-text v-else-if="scope.row.startUsers.length == 1">
              {{ scope.row.startUsers[0].nickname }}
            </el-text>
            <el-text v-else>
              <el-tooltip
                class="box-item"
                effect="dark"
                placement="top"
                :content="scope.row.startUsers.map((user: any) => user.nickname).join('、')"
              >
                {{ scope.row.startUsers[0].nickname }}等 {{ scope.row.startUsers.length }} 人可见
              </el-tooltip>
            </el-text>
          </template>
        </el-table-column>
        <el-table-column label="表单信息" prop="formType" min-width="200">
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
            <label v-else>暂无表单</label>
          </template>
        </el-table-column>
        <el-table-column label="最后发布" prop="deploymentTime" min-width="250">
          <template #default="scope">
            <div class="flex items-center">
              <span v-if="scope.row.processDefinition" class="w-150px">
                {{ formatDate(scope.row.processDefinition.deploymentTime) }}
              </span>
              <el-tag v-if="scope.row.processDefinition">
                v{{ scope.row.processDefinition.version }}
              </el-tag>
              <el-tag v-else type="warning">未部署</el-tag>
              <el-tag
                v-if="scope.row.processDefinition?.suspensionState === 2"
                type="warning"
                class="ml-10px"
              >
                已停用
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openModelForm('update', scope.row.id)"
              v-hasPermi="['bpm:model:update']"
              :disabled="!isManagerUser(scope.row)"
            >
              修改
            </el-button>
            <el-button
              link
              class="!ml-5px"
              type="primary"
              @click="handleDesign(scope.row)"
              v-hasPermi="['bpm:model:update']"
              :disabled="!isManagerUser(scope.row)"
            >
              设计
            </el-button>
            <el-button
              link
              class="!ml-5px"
              type="primary"
              @click="handleDeploy(scope.row)"
              v-hasPermi="['bpm:model:deploy']"
              :disabled="!isManagerUser(scope.row)"
            >
              发布
            </el-button>
            <el-dropdown
              class="!align-middle ml-5px"
              @command="(command) => handleModelCommand(command, scope.row)"
              v-hasPermi="['bpm:process-definition:query', 'bpm:model:update', 'bpm:model:delete']"
            >
              <el-button type="primary" link>更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="handleDefinitionList"
                    v-if="checkPermi(['bpm:process-definition:query'])"
                  >
                    历史
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="handleChangeState"
                    v-if="checkPermi(['bpm:model:update']) && scope.row.processDefinition"
                    :disabled="!isManagerUser(scope.row)"
                  >
                    {{ scope.row.processDefinition.suspensionState === 1 ? '停用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    type="danger"
                    command="handleDelete"
                    v-if="checkPermi(['bpm:model:delete'])"
                    :disabled="!isManagerUser(scope.row)"
                  >
                    删除
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
      <div class="pl-10px font-bold text-18px"> 重命名分类 </div>
    </template>
    <div class="px-30px">
      <el-input v-model="renameCategoryForm.name" />
    </div>
    <template #footer>
      <div class="pr-25px pb-25px">
        <el-button @click="renameCategoryVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleRenameConfirm">确 定</el-button>
      </div>
    </template>
  </Dialog>

  <!-- 表单弹窗：添加流程模型 -->
  <ModelForm :categoryId="categoryInfo.code" ref="modelFormRef" @success="emit('success')" />
</template>

<script lang="ts" setup>
import ModelForm from './ModelForm.vue'
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import Sortable from 'sortablejs'
import { propTypes } from '@/utils/propTypes'
import { formatDate } from '@/utils/formatTime'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { setConfAndFields2 } from '@/utils/formCreate'
import { BpmModelFormType, BpmModelType } from '@/utils/constants'
import { checkPermi } from '@/utils/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { cloneDeep } from 'lodash-es'

defineOptions({ name: 'BpmModel' })

const props = defineProps({
  categoryInfo: propTypes.object.def([]), // 分类后的数据
  isCategorySorting: propTypes.bool.def(false) // 是否分类在排序
})
const emit = defineEmits(['success'])
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由
const userStore = useUserStoreWithOut() // 用户信息缓存
const isDark = computed(() => useAppStore().getIsDark) // 是否黑暗模式

const isModelSorting = ref(false) // 是否正处于排序状态
const originalData: any = ref([]) // 原始数据
const modelList: any = ref([]) // 模型列表
const isExpand = ref(false) // 是否处于展开状态

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

/** 更新状态操作 */
const handleChangeState = async (row: any) => {
  const state = row.processDefinition.suspensionState
  const newState = state === 1 ? 2 : 1
  try {
    // 修改状态的二次确认
    const id = row.id
    debugger
    const statusState = state === 1 ? '停用' : '启用'
    const content = '是否确认' + statusState + '流程名字为"' + row.name + '"的数据项?'
    await message.confirm(content)
    // 发起修改状态
    await ModelApi.updateModelState(id, newState)
    message.success(statusState + '成功')
    // 刷新列表
    emit('success')
  } catch {}
}

/** 设计流程 */
const handleDesign = (row: any) => {
  if (row.type == BpmModelType.BPMN) {
    push({
      name: 'BpmModelEditor',
      query: {
        modelId: row.id
      }
    })
  } else {
    push({
      name: 'SimpleModelDesign',
      query: {
        modelId: row.id
      }
    })
  }
}

/** 发布流程 */
const handleDeploy = async (row: any) => {
  try {
    // 删除的二次确认
    await message.confirm('是否部署该流程！！')
    // 发起部署
    await ModelApi.deployModel(row.id)
    message.success(t('部署成功'))
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
  if (row.formType == 10) {
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
  message.success('排序模型成功')
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
const initSort = () => {
  const table = document.querySelector(`.${props.categoryInfo.name} .el-table__body-wrapper tbody`)
  Sortable.create(table, {
    group: 'shared',
    animation: 150,
    draggable: '.el-table__row',
    handle: '.drag-icon',
    // 结束拖动事件
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
}

/** 更新 modelList 模型列表 */
const updateModeList = () => {
  modelList.value = cloneDeep(props.categoryInfo.modelList)
  if (props.categoryInfo.modelList.length > 0) {
    isExpand.value = true
  }
}

/** 重命名弹窗确定 */
const renameCategoryVisible = ref(false)
const renameCategoryForm = ref({
  name: ''
})
const handleRenameConfirm = async () => {
  if (renameCategoryForm.value?.name.length === 0) {
    return message.warning('请输入名称')
  }
  // 发起修改
  await CategoryApi.updateCategory(renameCategoryForm.value as CategoryVO)
  message.success('重命名成功')
  // 刷新列表
  renameCategoryVisible.value = false
  emit('success')
}

/** 删除分类 */
const handleDeleteCategory = async () => {
  try {
    if (props.categoryInfo.modelList.length > 0) {
      return message.warning('该分类下仍有流程定义,不允许删除')
    }
    await message.confirm('确认删除分类吗?')
    // 发起删除
    await CategoryApi.deleteCategory(props.categoryInfo.id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    emit('success')
  } catch {}
}

/** 添加流程模型弹窗 */
const modelFormRef = ref()
const openModelForm = (type: string, id?: number) => {
  modelFormRef.value.open(type, id)
}

watch(() => props.categoryInfo.modelList, updateModeList, { immediate: true })
watch(
  () => props.isCategorySorting,
  (val) => {
    if (val) isExpand.value = false
  },
  { immediate: true }
)
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
:deep() {
  .el-table__cell {
    overflow: hidden;
    border-bottom: none !important;
  }
}
</style>
