<!-- MES 发货通知单行列表子组件 -->
<template>
  <div class="overflow-hidden">
    <el-button type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="发货数量" align="center" prop="quantity" width="100" />
      <el-table-column label="是否检验" align="center" prop="oqcCheckFlag" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.oqcCheckFlag" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
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
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" placeholder="请选择物料" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="批次号" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="发货数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0.01"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否检验" prop="oqcCheckFlag">
            <el-switch v-model="formData.oqcCheckFlag" />
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
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { WmSalesNoticeLineApi, WmSalesNoticeLineVO } from '@/api/mes/wm/salesnotice/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'SalesNoticeLineList' })

const props = defineProps<{
  noticeId: number
}>()

const { t } = useI18n()
const message = useMessage()

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<WmSalesNoticeLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  noticeId: undefined as number | undefined
})

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.noticeId = props.noticeId
    const data = await WmSalesNoticeLineApi.getSalesNoticeLinePage(queryParams)
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
    await WmSalesNoticeLineApi.deleteSalesNoticeLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  noticeId: undefined as number | undefined,
  itemId: undefined,
  batchCode: undefined,
  quantity: undefined,
  oqcCheckFlag: true,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [
    { required: true, message: '发货数量不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '发货数量必须大于0', trigger: 'blur' }
  ],
  oqcCheckFlag: [{ required: true, message: '是否检验不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmSalesNoticeLineApi.getSalesNoticeLine(id)
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
    const data = { ...formData.value, noticeId: props.noticeId } as unknown as WmSalesNoticeLineVO
    if (formType.value === 'create') {
      await WmSalesNoticeLineApi.createSalesNoticeLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmSalesNoticeLineApi.updateSalesNoticeLine(data)
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
    noticeId: undefined,
    itemId: undefined,
    batchCode: undefined,
    quantity: undefined,
    oqcCheckFlag: true,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
