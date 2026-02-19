<!-- MES 工艺路线产品列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button type="primary" plain @click="openForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 关联产品
      </el-button>
    </el-row>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="产品编码" align="center" prop="itemCode" width="150" />
      <el-table-column label="产品名称" align="center" prop="itemName" width="150" />
      <el-table-column label="规格型号" align="center" prop="specification" width="150" />
      <el-table-column label="单位" align="center" prop="unitName" width="80" />
      <el-table-column label="生产数量" align="center" prop="quantity" width="100" />
      <el-table-column label="生产用时" align="center" width="120">
        <template #default="scope">
          <span v-if="scope.row.productionTime">
            {{ scope.row.productionTime }}
            <dict-tag :type="DICT_TYPE.MES_TIME_UNIT_TYPE" :value="scope.row.timeUnitType" />
          </span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openBomDialog(scope.row)">BOM</el-button>
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="formTitle" v-model="formVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="产品" prop="itemId">
          <el-select v-model="formData.itemId" placeholder="请选择产品" filterable>
            <el-option
              v-for="item in itemList"
              :key="item.id"
              :label="item.name + (item.code ? ' (' + item.code + ')' : '')"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生产数量" prop="quantity">
          <el-input-number v-model="formData.quantity" :min="1" controls-position="right" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="14">
            <el-form-item label="生产用时" prop="productionTime">
              <el-input-number
                v-model="formData.productionTime"
                :min="0"
                :precision="2"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="时间单位" prop="timeUnitType">
              <el-select v-model="formData.timeUnitType" placeholder="请选择">
                <el-option
                  v-for="dict in getStrDictOptions(DICT_TYPE.MES_TIME_UNIT_TYPE)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
      </template>
    </Dialog>

    <!-- 产品 BOM 弹窗 -->
    <Dialog title="产品 BOM 配置" v-model="bomDialogVisible" width="800px">
      <RouteProductBomList
        v-if="bomDialogVisible"
        :routeId="routeId"
        :productId="currentProduct.itemId"
        :productName="currentProduct.itemName"
      />
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProRouteProductApi, ProRouteProductVO } from '@/api/mes/pro/route/product'
import { MdItemApi } from '@/api/mes/md/item'
import RouteProductBomList from './RouteProductBomList.vue'

defineOptions({ name: 'RouteProductList' })

const props = defineProps<{
  routeId: number
}>()

// TODO @AI：注释参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/qc/template/TemplateIndicatorList.vue

const message = useMessage()
const { t } = useI18n()

const loading = ref(false)
const list = ref<ProRouteProductVO[]>([])
const itemList = ref<any[]>([])

// 表单相关
const formVisible = ref(false)
const formTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()
const formData = ref<any>({})
const formRules = reactive({
  itemId: [{ required: true, message: '产品不能为空', trigger: 'change' }]
})

// BOM 弹窗相关
const bomDialogVisible = ref(false)
const currentProduct = ref<any>({})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await ProRouteProductApi.getRouteProductListByRoute(props.routeId)
  } finally {
    loading.value = false
  }
}

/** 加载物料列表 */
const loadItemList = async () => {
  itemList.value = await MdItemApi.getItemSimpleList()
}

/** 添加/修改操作 */
const openForm = (type: string, row?: ProRouteProductVO) => {
  formVisible.value = true
  formTitle.value = type === 'create' ? '关联产品' : '编辑产品'
  formType.value = type
  if (type === 'create') {
    formData.value = {
      routeId: props.routeId,
      quantity: 1,
      productionTime: 1,
      timeUnitType: 'MINUTE'
    }
  } else {
    formData.value = { ...row }
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ProRouteProductApi.createRouteProduct(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ProRouteProductApi.updateRouteProduct(formData.value)
      message.success(t('common.updateSuccess'))
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProRouteProductApi.deleteRouteProduct(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 打开 BOM 弹窗 */
const openBomDialog = (row: ProRouteProductVO) => {
  currentProduct.value = row
  bomDialogVisible.value = true
}

/** 监听路线编号变化 */
watch(
  () => props.routeId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)

/** 初始化 */
onMounted(() => {
  loadItemList()
})
</script>
