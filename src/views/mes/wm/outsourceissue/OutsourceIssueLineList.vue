<!-- MES 外协发料单行列表子组件 -->
<!-- TODO @芋艿：未 review -->
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
          <OutsourceIssueDetailList
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
      <el-table-column v-if="isUpdate" label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button v-if="isUpdate" link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button v-if="isUpdate" link type="danger" @click="handleDelete(scope.row.id)">
            删除
          </el-button>
          <!-- TODO @芋艿：这里是不是上架？ -->
          <el-button
            v-if="isUpdate"
            link
            type="success"
            @click="handleAddDetail(scope.row.id, scope.row.itemId)"
          >
            添加明细
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
          <el-form-item label="物料" prop="itemId" required>
            <MdItemSelect v-model="formData.itemId" placeholder="请选择物料" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发料数量" prop="quantity" required>
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
          <el-form-item label="批次编码" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次编码" />
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

  <!-- 发料明细添加/编辑弹窗 -->
  <OutsourceIssueDetailForm
    ref="detailFormRef"
    :issue-id="props.issueId"
    @success="onDetailFormSuccess"
  />
</template>

<script setup lang="ts">
import { WmOutsourceIssueLineApi, WmOutsourceIssueLineVO } from '@/api/mes/wm/outsourceissue/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import OutsourceIssueDetailList from './OutsourceIssueDetailList.vue'
import OutsourceIssueDetailForm from './OutsourceIssueDetailForm.vue'

defineOptions({ name: 'OutsourceIssueLineList' })

const props = defineProps<{
  issueId: number
  formType: string
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isUpdate = computed(() => ['create', 'update'].includes(props.formType)) // 是否为编辑模式

// ==================== 列表 ====================
const loading = ref(false) // 列表的加载中
const list = ref<WmOutsourceIssueLineVO[]>([]) // 行列表
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  issueId: undefined as number | undefined
})

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.issueId = props.issueId
    const data = await WmOutsourceIssueLineApi.getOutsourceIssueLinePage(queryParams)
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
    await WmOutsourceIssueLineApi.deleteOutsourceIssueLine(id)
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
  issueId: undefined as number | undefined,
  itemId: undefined,
  quantity: undefined,
  batchId: undefined,
  batchCode: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '发料数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加物料发料单行' : '修改物料发料单行'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceIssueLineApi.getOutsourceIssueLine(id)
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
    const data = { ...formData.value, issueId: props.issueId } as unknown as WmOutsourceIssueLineVO
    if (lineFormType.value === 'create') {
      await WmOutsourceIssueLineApi.createOutsourceIssueLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmOutsourceIssueLineApi.updateOutsourceIssueLine(data)
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
    issueId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

// ==================== 展开行：发料明细 ====================
const detailListRefs = ref<Record<number, InstanceType<typeof OutsourceIssueDetailList>>>({})

/** 缓存子组件 ref */
const setDetailListRef = (lineId: number, el: any) => {
  if (el) {
    detailListRefs.value[lineId] = el
  }
}

// ==================== 发料明细表单（LineList 层级持有） ====================
const detailFormRef = ref()

/** 添加明细：直接打开明细创建表单 */
const handleAddDetail = (lineId: number, itemId?: number) => {
  openDetailForm('create', lineId, itemId)
}

/** 打开发料明细表单 */
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
