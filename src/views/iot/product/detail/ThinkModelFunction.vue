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
      <el-form-item label="功能类型" prop="name">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择功能类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_PRODUCT_FUNCTION_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['iot:think-model-function:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 添加功能
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-tabs>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="功能类型" align="center" prop="type">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_FUNCTION_TYPE" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column label="功能名称" align="center" prop="name" />
        <el-table-column label="标识符" align="center" prop="identifier" />
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="[`iot:think-model-function:update`]"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['iot:think-model-function:delete']"
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
    </el-tabs>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <ThinkModelFunctionForm ref="formRef" :product="product" @success="getList" />
</template>
<script setup lang="ts">
import { ProductVO } from '@/api/iot/product'
import { ThinkModelFunctionApi, ThinkModelFunctionVO } from '@/api/iot/thinkmodelfunction'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import ThinkModelFunctionForm from '@/views/iot/product/detail/ThinkModelFunctionForm.vue'

const props = defineProps<{ product: ProductVO }>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<ThinkModelFunctionVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined,
  productId: -1
})

const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.productId = props.product.id
    const data = await ThinkModelFunctionApi.getThinkModelFunctionPage(queryParams)
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
  queryParams.type = undefined
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ThinkModelFunctionApi.deleteThinkModelFunction(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
