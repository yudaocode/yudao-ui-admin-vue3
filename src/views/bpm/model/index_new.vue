<template>
  <ContentWrap>
    <div class="flex justify-between pl-20px items-center">
      <h3 class="font-extrabold">流程模型</h3>
      <!-- 搜索工作栏 -->
      <el-form
        class="-mb-15px flex"
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
          <el-dropdown placement="bottom-end">
            <el-button class="w-30px" plain>
              <Icon icon="ep:setting" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <Icon icon="ep:circle-plus" :size="13" class="mr-5px" />
                  新建分类
                </el-dropdown-item>
                <el-dropdown-item>
                  <Icon icon="fa:sort-amount-desc" :size="13" class="mr-5px" />
                  分类排序
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>
    </div>

    <el-divider />

    <!-- 分类卡片组 -->
    <div class="px-15px">
      <ContentWrap
        v-loading="loading"
        :body-style="{ padding: 0 }"
        v-for="(list, title) in categoryGroup"
        :key="title"
      >
        <CategoryDraggableModel :dataList="list" :title="title" @success="getList" />
      </ContentWrap>
    </div>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改流程 -->
  <ModelForm ref="formRef" @success="getList" />

  <!-- 弹窗：表单详情 -->
  <Dialog title="表单详情" v-model="formDetailVisible" width="800">
    <form-create :rule="formDetailPreview.rule" :option="formDetailPreview.option" />
  </Dialog>
</template>

<script lang="ts" setup>
import * as ModelApi from '@/api/bpm/model'
import ModelForm from './ModelForm.vue'
import { groupBy } from 'lodash-es'
import { mockData } from './mock'
import CategoryDraggableModel from './CategoryDraggableModel.vue'

defineOptions({ name: 'BpmModel' })

const loading = ref(true) // 列表的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  key: undefined,
  name: undefined,
  category: undefined
})
const queryFormRef = ref() // 搜索的表单
const categoryGroup = ref<any>({}) // 按照category分组的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // TODO 芋艿：这里需要一个不分页查全部的流程模型接口
    const data = await ModelApi.getModelPage(queryParams)
    data.list = mockData
    categoryGroup.value = groupBy(data.list, 'categoryName')
  } finally {
    loading.value = false
  }
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

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
