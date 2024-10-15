<template>
  <!-- 默认使其全部展开 -->
  <el-collapse :modelValue="title">
    <el-collapse-item :name="title">
      <template #icon="{ isActive }">
        <div
          class="ml-20px flex items-center"
          :class="['transition-transform duration-300', isActive ? 'rotate-180' : 'rotate-0']"
        >
          <Icon icon="ep:arrow-down-bold" color="#999" />
        </div>
        <div class="ml-auto mr-45px flex items-center">
          <template v-if="!isSorting">
            <el-button link type="info" class="mr-20px" @click.stop="handleSort">
              <Icon icon="fa:sort-amount-desc" class="mr-5px" />
              排序
            </el-button>
            <el-dropdown @command="(command) => handleCategoryCommand(command)" placement="bottom">
              <el-button link type="info" @click.stop="handleGroup">
                <Icon icon="ep:setting" class="mr-5px" />
                分类
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="handleRename"> 重命名 </el-dropdown-item>
                  <el-dropdown-item command="handleDeleteGroup"> 删除该类 </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button @click.stop="cancelSort"> 取 消 </el-button>
            <el-button type="primary" @click.stop="saveSort"> 保存排序 </el-button>
          </template>
        </div>
      </template>
      <template #title>
        <div class="flex items-center">
          <el-tooltip content="拖动排序" v-if="isCategorySorting">
            <Icon
              :size="22"
              icon="ic:round-drag-indicator"
              class="ml-10px category-drag-icon cursor-move text-#8a909c"
            />
          </el-tooltip>
          <h3 class="ml-20px mr-8px text-18px">{{ title }}</h3>
          <div class="color-gray-600 text-16px"> ({{ dataList?.length || 0 }}) </div>
        </div>
      </template>
      <el-table
        :class="title"
        ref="tableRef"
        :header-cell-style="{ backgroundColor: isDark ? '' : '#edeff0', paddingLeft: '10px' }"
        :cell-style="{ paddingLeft: '10px' }"
        :data="tableData"
        row-key="id"
      >
        <el-table-column label="流程名" prop="name" min-width="150">
          <template #default="scope">
            <div class="flex items-center">
              <el-tooltip content="拖动排序" v-if="isSorting">
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
              v-if="scope.row.formType === 10"
              type="primary"
              link
              @click="handleFormDetail(scope.row)"
            >
              <span>{{ scope.row.formName }}</span>
            </el-button>
            <el-button
              v-else-if="scope.row.formType === 20"
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
              @click="openForm('update', scope.row.id)"
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
              @command="(command) => handleCommand(command, scope.row)"
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
    </el-collapse-item>
  </el-collapse>

  <!-- 弹窗：重命名分类 -->
  <Dialog :fullscreen="false" class="rename-dialog" v-model="renameVisible" width="400">
    <template #title>
      <div class="pl-10px font-bold text-18px"> 重命名分类 </div>
    </template>
    <div class="px-30px">
      <el-input v-model="renameVal" />
    </div>
    <template #footer>
      <div class="pr-25px pb-25px">
        <el-button @click="renameVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleRenameConfirm">确 定</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import Sortable from 'sortablejs'
import { propTypes } from '@/utils/propTypes'
import { formatDate } from '@/utils/formatTime'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { setConfAndFields2 } from '@/utils/formCreate'
import { BpmModelType } from '@/utils/constants'
import { checkPermi } from '@/utils/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'
import { cloneDeep } from 'lodash-es'

defineOptions({ name: 'BpmModel' })

const renameVisible = ref(false)
const props = defineProps({
  // 分类后的数据
  dataList: propTypes.object.def([]),
  title: propTypes.string.def(''),
  isCategorySorting: propTypes.bool.def(false)
})
const emit = defineEmits(['success'])
const appStore = useAppStore()
const message = useMessage() // 消息弹窗
const isDark = computed(() => appStore.getIsDark)
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由
const userStore = useUserStoreWithOut() // 用户信息缓存
const isSorting = ref(false) // 是否正处于排序状态
const tableData: any = ref([])
const originalData: any = ref([]) // 原始数据

/** '更多'操作按钮 */
const handleCommand = (command: string, row: any) => {
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

/* '分类'操作按钮 */
const handleCategoryCommand = (command: string) => {
  switch (command) {
    case 'handleRename':
      renameVal.value = props.title
      renameVisible.value = true
      break
    case 'handleDeleteGroup':
      handleDeleteGroup()
      break
    default:
      break
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
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
      name: 'SimpleWorkflowDesignEditor',
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
const handleDefinitionList = (row) => {
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

/* 排序 */
const handleSort = () => {
  // 保存初始数据
  originalData.value = cloneDeep(props.dataList)
  isSorting.value = true
  initSort()
}

const saveSort = () => {
  // 接口调用
  console.log(tableData.value)
  // 刷新列表
  emit('success')
  isSorting.value = false
}

const cancelSort = () => {
  // 恢复初始数据
  tableData.value = cloneDeep(originalData.value)
  isSorting.value = false
}

/* 分类 */
const handleGroup = () => {
  console.log('分类')
}
const tableRef = ref()
// 创建拖拽实例
const initSort = () => {
  const table = document.querySelector(`.${props.title} .el-table__body-wrapper tbody`)
  Sortable.create(table, {
    group: 'shared',
    animation: 150,
    draggable: '.el-table__row',
    handle: '.drag-icon',
    // 结束拖动事件
    onEnd: ({ newDraggableIndex, oldDraggableIndex }) => {
      if (oldDraggableIndex !== newDraggableIndex) {
        tableData.value.splice(
          newDraggableIndex,
          0,
          tableData.value.splice(oldDraggableIndex, 1)[0]
        )
      }
    }
  })
}

// 更新表格数据
const updateTableData = () => {
  tableData.value = cloneDeep(props.dataList)
}

const renameVal = ref('')
// 重命名弹窗确定
const handleRenameConfirm = () => {
  if (!renameVal.value) {
    return message.warning('请输入名称')
  }
}

// 删除分类
const handleDeleteGroup = async () => {
  if (props.dataList.length > 0) {
    return message.warning('该分类下仍有流程定义,不允许删除')
  }
  await message.confirm('确认删除分类吗?')
  // 实际调用接口删除
}
onMounted(() => {
  updateTableData()
})

defineExpose({ updateTableData })
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
  .el-form--inline .el-form-item {
    margin-right: 10px;
  }
  .el-divider--horizontal {
    margin-top: 6px;
  }
  .el-collapse,
  .el-collapse-item__header,
  .el-collapse-item__wrap {
    border: none;
  }
  .el-collapse-item__arrow {
    margin-left: 10px;
    font-size: 20px;
    font-weight: 500;
  }
  .el-collapse-item__content {
    padding-bottom: 0;
  }
  .el-table__cell {
    border-bottom: none !important;
  }
  .el-table__row {
    height: 68px;
  }
}
</style>
