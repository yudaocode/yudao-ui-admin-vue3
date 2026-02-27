<!-- MES 领料出库单行列表子组件 -->
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
          <ProductionIssueDetailList
            :ref="(el: any) => setDetailListRef(scope.row.id, el)"
            :issue-id="props.issueId"
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
      <el-table-column label="领料数量" align="center" prop="quantity" width="100" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column
        v-if="isUpdate"
        label="操作"
        align="center"
        width="160"
        fixed="right"
      >
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
            编辑
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
          <el-form-item label="物料" prop="itemId">
            <MdItemSelect
              v-model="formData.itemId"
              placeholder="请选择物料"
              class="!w-1/1"
              @change="handleItemChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="领料数量" prop="quantity">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { WmProductionIssueLineApi, WmProductionIssueLineVO } from '@/api/mes/wm/productionissue/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProductionIssueDetailList from './ProductionIssueDetailList.vue'

defineOptions({ name: 'ProductionIssueLineList' })

const message = useMessage()

const props = defineProps({
  issueId: { type: Number, required: true },
  formType: { type: String, required: true }
})

const loading = ref(false)
const list = ref<WmProductionIssueLineVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const lineFormType = ref<string>('create')
const formRef = ref()
const detailListRefs = ref<Map<number, any>>(new Map())

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  issueId: props.issueId
})

const formData = ref<WmProductionIssueLineVO>({
  id: undefined,
  issueId: props.issueId,
  itemId: 0,
  quantity: 0,
  batchCode: undefined,
  remark: undefined
})

const formRules = reactive({
  itemId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入领料数量', trigger: 'blur' }]
})

const isUpdate = computed(() => ['create', 'update'].includes(props.formType))

const setDetailListRef = (lineId: number, el: any) => {
  if (el) {
    detailListRefs.value.set(lineId, el)
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmProductionIssueLineApi.getLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加物料' : '编辑物料'
  lineFormType.value = type
  resetForm()
  // 修改/上架/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductionIssueLineApi.getLine(id)
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
    const data = formData.value
    if (lineFormType.value === 'create') {
      await WmProductionIssueLineApi.createLine(data)
      message.success('新增成功')
    } else {
      await WmProductionIssueLineApi.updateLine(data)
      message.success('修改成功')
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmProductionIssueLineApi.deleteLine(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 物料变化时，自动填充信息 */
const handleItemChange = (item: any) => {
  if (item) {
    formData.value.itemCode = item.code
    formData.value.itemName = item.name
    formData.value.specification = item.specification
    formData.value.unitMeasureName = item.unitName
  }
}

/** 打开明细表单弹窗 */
const openDetailForm = (type: string, lineId: number, itemId: number, detailId?: number) => {
  // 由子组件 ProductionIssueDetailList 处理
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    issueId: props.issueId,
    itemId: 0,
    quantity: 0,
    batchCode: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

onMounted(() => {
  getList()
})
</script>
