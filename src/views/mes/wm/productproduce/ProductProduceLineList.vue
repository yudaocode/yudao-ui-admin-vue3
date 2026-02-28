<!-- MES 生产入库单行列表子组件 -->
<template>
  <div>
    <el-button v-if="isUpdate" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      border
      :row-key="(row: any) => row.id"
    >
      <el-table-column type="expand">
        <template #default="scope">
          <ProductProduceDetailList
            :ref="(el: any) => setDetailListRef(scope.row.id, el)"
            :produce-id="props.produceId"
            :line-id="scope.row.id"
            :item-id="scope.row.itemId"
            :form-type="props.formType"
            @edit-detail="
              (detailId: number) =>
                openDetailForm('update', scope.row.id, scope.row.itemId, detailId)
            "
          />
        </template>
      </el-table-column>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="入库数量" align="center" prop="quantity" width="100" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="批号" align="center" prop="lotNumber" min-width="120" />
      <el-table-column
        label="有效期"
        align="center"
        prop="expireDate"
        min-width="120"
      />
      <el-table-column label="质量状态" align="center" prop="qualityStatus" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="scope.row.qualityStatus" />
        </template>
      </el-table-column>
      <el-table-column
        v-if="isUpdate"
        label="操作"
        align="center"
        width="220"
        fixed="right"
      >
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="openDetailForm('create', scope.row.id, scope.row.itemId)"
          >
            添加明细
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>

  <!-- 添加/编辑行弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品物料" prop="itemId">
            <MdItemSelect
              v-model="formData.itemId"
              placeholder="请选择产品物料"
              class="!w-1/1"
              @change="handleItemChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批号" prop="lotNumber">
            <el-input v-model="formData.lotNumber" placeholder="请输入批号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="有效期" prop="expireDate">
            <el-date-picker
              v-model="formData.expireDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择有效期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="质量状态" prop="qualityStatus">
            <el-select v-model="formData.qualityStatus" placeholder="请选择质量状态" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_QUALITY_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 入库明细添加/编辑弹窗 -->
  <ProductProduceDetailForm
    ref="detailFormRef"
    :produce-id="props.produceId"
    @success="onDetailFormSuccess"
  />
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import {
  WmProductProduceLineApi,
  WmProductProduceLineVO
} from '@/api/mes/wm/productproduce/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProductProduceDetailList from './ProductProduceDetailList.vue'
import ProductProduceDetailForm from './ProductProduceDetailForm.vue'

defineOptions({ name: 'ProductProduceLineList' })

const props = defineProps<{
  produceId: number
  formType: string
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isUpdate = computed(() => ['create', 'update'].includes(props.formType)) // 是否为编辑模式

// ==================== 列表 ====================
const loading = ref(false) // 列表的加载中
const list = ref<WmProductProduceLineVO[]>([]) // 行列表
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  produceId: undefined as number | undefined
})

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.produceId = props.produceId
    const data = await WmProductProduceLineApi.getProductProduceLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmProductProduceLineApi.deleteProductProduceLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const lineFormType = ref('') // 行表单的类型
const formData = ref({
  id: undefined,
  produceId: undefined as number | undefined,
  itemId: undefined,
  quantity: undefined,
  batchCode: undefined,
  lotNumber: undefined,
  expireDate: undefined,
  qualityStatus: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '入库数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 物料变化时，自动填充信息 */
const handleItemChange = (item: any) => {
  if (item) {
    formData.value.itemId = item.id
  }
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加生产入库单行' : '修改生产入库单行'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductProduceLineApi.getProductProduceLine(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = { ...formData.value, produceId: props.produceId } as unknown as WmProductProduceLineVO
    if (lineFormType.value === 'create') {
      await WmProductProduceLineApi.createProductProduceLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmProductProduceLineApi.updateProductProduceLine(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    produceId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchCode: undefined,
    lotNumber: undefined,
    expireDate: undefined,
    qualityStatus: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

// ==================== 展开行：入库明细 ====================
const detailListRefs = ref<Record<number, InstanceType<typeof ProductProduceDetailList>>>({})

/** 缓存子组件 ref */
const setDetailListRef = (lineId: number, el: any) => {
  if (el) {
    detailListRefs.value[lineId] = el
  }
}

// ==================== 入库明细表单（LineList 层级持有） ====================
const detailFormRef = ref()

/** 打开入库明细表单 */
const openDetailForm = (type: string, lineId: number, itemId?: number, detailId?: number) => {
  detailFormRef.value.open(type, lineId, itemId, detailId)
}

/** 明细表单提交成功后，刷新已展开行的 DetailList */
const onDetailFormSuccess = (lineId: number) => {
  detailListRefs.value[lineId]?.getList()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
