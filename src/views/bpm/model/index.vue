<template>
  <ContentWrap>
    <div class="flex justify-between pl-20px items-center">
      <h3 class="font-extrabold">流程模型</h3>
      <!-- 搜索工作栏 -->
      <el-form
        v-if="!isCategorySorting"
        class="-mb-15px flex mr-10px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
        @submit.prevent
      >
        <el-form-item prop="name" class="ml-auto">
          <el-input
            v-model="queryParams.name"
            placeholder="搜索流程"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          >
            <template #prefix>
              <Icon icon="ep:search" class="mx-10px" />
            </template>
          </el-input>
        </el-form-item>
        <!-- 右上角：新建模型、更多操作 -->
        <el-form-item>
          <el-button type="primary" @click="openForm('create')" v-hasPermi="['bpm:model:create']">
            <Icon icon="ep:plus" class="mr-5px" /> 新建模型
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-dropdown @command="(command) => handleCommand(command)" placement="bottom-end">
            <el-button class="w-30px" plain>
              <Icon icon="ep:setting" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="handleCategoryAdd">
                  <Icon icon="ep:circle-plus" :size="13" class="mr-5px" />
                  新建分类
                </el-dropdown-item>
                <el-dropdown-item command="handleCategorySort">
                  <Icon icon="fa:sort-amount-desc" :size="13" class="mr-5px" />
                  分类排序
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>
      <div class="mr-20px" v-else>
        <el-button @click="handleCategorySortCancel"> 取 消 </el-button>
        <el-button type="primary" @click="handleCategorySortSubmit"> 保存排序 </el-button>
      </div>
    </div>

    <el-divider />

    <!-- 按照分类，展示其所属的模型列表 -->
    <div class="px-15px">
      <draggable
        :disabled="!isCategorySorting"
        v-model="categoryGroup"
        item-key="id"
        :animation="400"
      >
        <template #item="{ element }">
          <ContentWrap
            class="rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl"
            v-loading="loading"
            :body-style="{ padding: 0 }"
            :key="element.id"
          >
            <CategoryDraggableModel
              :isCategorySorting="isCategorySorting"
              :categoryInfo="element"
              @success="getList"
            />
          </ContentWrap>
        </template>
      </draggable>
    </div>
  </ContentWrap>

  <!-- 表单弹窗：添加分类 -->
  <CategoryForm ref="categoryFormRef" @success="getList" />
  <!-- 弹窗：表单详情 -->
  <Dialog title="表单详情" v-model="formDetailVisible" width="800">
    <form-create :rule="formDetailPreview.rule" :option="formDetailPreview.option" />
  </Dialog>
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { CategoryApi } from '@/api/bpm/category'
import * as ModelApi from '@/api/bpm/model'
import CategoryForm from '../category/CategoryForm.vue'
import { cloneDeep } from 'lodash-es'
import CategoryDraggableModel from './CategoryDraggableModel.vue'

defineOptions({ name: 'BpmModel' })

const { push } = useRouter()
const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表的加载中
const isCategorySorting = ref(false) // 是否 category 正处于排序状态
const queryParams = reactive({
  name: undefined
})
const queryFormRef = ref() // 搜索的表单
const categoryGroup: any = ref([]) // 按照 category 分组的数据
const originalData: any = ref([]) // 原始数据

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 添加/修改操作 */
const openForm = (type: string, id?: number) => {
  if (type === 'create') {
    push({ name: 'BpmModelCreate' })
  } else {
    push({
      name: 'BpmModelUpdate',
      params: { id }
    })
  }
}

/** 流程表单的详情按钮操作 */
const formDetailVisible = ref(false)
const formDetailPreview = ref({
  rule: [],
  option: {}
})

/** 右上角设置按钮 */
const handleCommand = (command: string) => {
  switch (command) {
    case 'handleCategoryAdd':
      handleCategoryAdd()
      break
    case 'handleCategorySort':
      handleCategorySort()
      break
    default:
      break
  }
}

/** 新建分类 */
const categoryFormRef = ref()
const handleCategoryAdd = () => {
  categoryFormRef.value.open('create')
}

/** 分类排序的提交 */
const handleCategorySort = () => {
  // 保存初始数据
  originalData.value = cloneDeep(categoryGroup.value)
  isCategorySorting.value = true
}

/** 分类排序的取消 */
const handleCategorySortCancel = () => {
  // 恢复初始数据
  categoryGroup.value = cloneDeep(originalData.value)
  isCategorySorting.value = false
}

/** 分类排序的保存 */
const handleCategorySortSubmit = async () => {
  // 保存排序
  const ids = categoryGroup.value.map((item: any) => item.id)
  await CategoryApi.updateCategorySortBatch(ids)
  // 刷新列表
  isCategorySorting.value = false
  message.success('排序分类成功')
  await getList()
}

/** 加载数据 */
const getList = async () => {
  loading.value = true
  try {
    // 查询模型 + 分裂的列表
    const modelList = await ModelApi.getModelList(queryParams.name)
    const categoryList = await CategoryApi.getCategorySimpleList()
    // 按照 category 聚合
    // 注意：必须一次性赋值给 categoryGroup，否则每次操作后，列表会重新渲染，滚动条的位置会偏离！！！
    categoryGroup.value = categoryList.map((category: any) => ({
      ...category,
      modelList: modelList.filter((model: any) => model.categoryName == category.name)
    }))
  } finally {
    loading.value = false
  }
}

/** 初始化 **/
onActivated(() => {
  getList()
})
</script>

<style lang="scss" scoped>
:deep() {
  .el-table--fit .el-table__inner-wrapper::before {
    height: 0;
  }

  .el-card {
    border-radius: 8px;
  }

  .el-form--inline .el-form-item {
    margin-right: 10px;
  }
  
  .el-divider--horizontal {
    margin-top: 6px;
  }
}
</style>
