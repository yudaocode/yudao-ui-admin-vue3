<!-- 产品的物模型列表 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="功能类型" prop="name">
        <el-select
          v-model="queryParams.type"
          class="!w-240px"
          clearable
          placeholder="请选择功能类型"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_THING_MODEL_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button
          v-hasPermi="[`iot:thing-model:create`]"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          添加功能
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-tabs>
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
        <el-table-column align="center" label="功能类型" prop="type">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IOT_THING_MODEL_TYPE" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="功能名称" prop="name" />
        <el-table-column align="center" label="标识符" prop="identifier" />
        <el-table-column align="center" label="数据类型" prop="identifier">
          <template #default="{ row }">
            {{ dataTypeOptionsLabel(row.property?.dataType) ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column align="left" label="数据定义" prop="identifier">
          <template #default="{ row }">
            <DataDefinition :data="row" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作">
          <template #default="scope">
            <el-button
              v-hasPermi="[`iot:thing-model:update`]"
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPermi="['iot:thing-model:delete']"
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </el-tabs>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <ThingModelForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { ThingModelApi, ThingModelData } from '@/api/iot/thingmodel'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import ThingModelForm from './ThingModelForm.vue'
import { ProductVO } from '@/api/iot/product/product'
import { IOT_PROVIDE_KEY } from '@/views/iot/utils/constants'
import { getDataTypeOptionsLabel } from './config'
import { DataDefinition } from './components'

defineOptions({ name: 'IoTThingModel' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<ThingModelData[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined,
  productId: -1
})

const queryFormRef = ref() // 搜索的表单
const product = inject<Ref<ProductVO>>(IOT_PROVIDE_KEY.PRODUCT) // 注入产品信息
const dataTypeOptionsLabel = computed(() => (value: string) => getDataTypeOptionsLabel(value)) // 解析数据类型

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.productId = product?.value?.id || -1
    const data = await ThingModelApi.getThingModelPage(queryParams)
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
    await ThingModelApi.deleteThingModel(id)
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
