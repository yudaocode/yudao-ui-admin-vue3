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
      >
        <el-form-item align="right" prop="key" class="ml-auto">
          <el-input
            v-model="queryParams.key"
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
                <el-dropdown-item command="handleAddCategory">
                  <Icon icon="ep:circle-plus" :size="13" class="mr-5px" />
                  新建分类
                </el-dropdown-item>
                <el-dropdown-item command="handleSort">
                  <Icon icon="fa:sort-amount-desc" :size="13" class="mr-5px" />
                  分类排序
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>
      <div class="mr-20px" v-else>
        <el-button @click="cancelSort"> 取 消 </el-button>
        <el-button type="primary" @click="saveSort"> 保存排序 </el-button>
      </div>
    </div>

    <el-divider />

    <!-- 分类卡片组 -->
    <div class="px-15px">
      <draggable v-model="categoryGroup" item-key="id" :animation="400">
        <template #item="{ element }">
          <ContentWrap v-loading="loading" :body-style="{ padding: 0 }" :key="element.id">
            <CategoryDraggableModel
              ref="categoryDraggableModelRef"
              :isCategorySorting="isCategorySorting"
              :categoryInfo="element"
              @success="getList"
            />
          </ContentWrap>
        </template>
      </draggable>
    </div>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改流程 -->
  <ModelForm ref="formRef" @success="getList" />
  <!-- 表单弹窗：添加/修改分类 -->
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
import ModelForm from './ModelForm.vue'
import CategoryForm from '../category/CategoryForm.vue'
import { groupBy, cloneDeep } from 'lodash-es'
import CategoryDraggableModel from './CategoryDraggableModel.vue'

defineOptions({ name: 'BpmModel' })

const categoryDraggableModelRef = ref()
const categoryFormRef = ref()
const loading = ref(true) // 列表的加载中
const isCategorySorting = ref(false) // 是否正处于排序状态
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  key: undefined,
  name: undefined,
  category: undefined
})
const queryFormRef = ref() // 搜索的表单
const categoryGroup: any = ref([]) // 按照category分组的数据
const originalData: any = ref([])
// 查询所有分类数据
const getAllCategory = async () => {
  // TODO 芋艿：这里需要一个不分页查全部的流程分类接口
  const data = await CategoryApi.getCategoryPage(queryParams)
  categoryGroup.value = data.list.map((item) => ({ ...item, modelList: [] }))
}

/** 查询所有流程模型接口 */
const getAllModel = async () => {
  // TODO 芋艿：这里需要一个不分页查全部的流程模型接口
  const data = await ModelApi.getModelPage(queryParams)
  const groupedData = groupBy(data.list, 'categoryName')
  Object.keys(groupedData).forEach((key) => {
    const category = categoryGroup.value.find((item) => item.name === key)
    if (category) {
      category.modelList = groupedData[key]
    }
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
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
    case 'handleAddCategory':
      handleAddCategory()
      break
    case 'handleSort':
      handleSort()
      break
    default:
      break
  }
}

// 新建分类
const handleAddCategory = () => {
  categoryFormRef.value.open('create')
}
// 分类排序
const handleSort = () => {
  // 保存初始数据
  originalData.value = cloneDeep(categoryGroup.value)
  isCategorySorting.value = true
}
// 取消排序
const cancelSort = () => {
  // 恢复初始数据
  categoryGroup.value = cloneDeep(originalData.value)
  isCategorySorting.value = false
}
// 保存排序
const saveSort = () => {
  // TODO 芋艿：这里需要一个保存分类排序接口
}

const getList = async () => {
  loading.value = true
  try {
    await getAllCategory()
    await getAllModel()
  } finally {
    loading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  getList()
})
</script>

<style lang="scss" scoped>
:deep() {
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
