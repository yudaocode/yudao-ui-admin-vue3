<!-- MES 生产工单 BOM 子组件 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px" v-if="!disabled">
      <el-button type="primary" plain @click="openBomForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加物料
      </el-button>
    </el-row>
    <!-- BOM 列表 -->
    <el-table v-loading="loading" :data="bomList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="itemSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="物料/产品" align="center" prop="itemOrProduct" width="100">
        <template #default="scope">
          {{ getItemOrProductLabel(scope.row.itemOrProduct) }}
        </template>
      </el-table-column>
      <el-table-column label="预计使用量" align="center" prop="quantity" width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="130" v-if="!disabled">
        <template #default="scope">
          <el-button link type="primary" @click="openBomForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDeleteBom(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="bomTotal"
      v-model:page="bomQueryParams.pageNo"
      v-model:limit="bomQueryParams.pageSize"
      @pagination="getBomList"
    />

    <!-- BOM 表单弹窗 -->
    <Dialog :title="bomDialogTitle" v-model="bomDialogVisible" width="600px">
      <el-form
        ref="bomFormRef"
        :model="bomFormData"
        :rules="bomFormRules"
        label-width="100px"
        v-loading="bomFormLoading"
      >
        <el-form-item label="物料" prop="itemId">
          <el-select
            v-model="bomFormData.itemId"
            placeholder="请选择物料"
            filterable
            class="!w-1/1"
            @change="handleBomItemChange"
          >
            <el-option
              v-for="item in itemList"
              :key="item.id"
              :label="item.name + (item.code ? ' (' + item.code + ')' : '')"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单位" prop="unitMeasureId">
          <el-select
            v-model="bomFormData.unitMeasureId"
            placeholder="请选择单位"
            filterable
            class="!w-1/1"
          >
            <el-option
              v-for="item in unitMeasureList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物料/产品" prop="itemOrProduct">
          <el-select v-model="bomFormData.itemOrProduct" placeholder="请选择" class="!w-1/1">
            <el-option label="物料" value="ITEM" />
            <el-option label="产品" value="PRODUCT" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计使用量" prop="quantity">
          <el-input-number
            v-model="bomFormData.quantity"
            :min="0"
            :precision="2"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="bomFormData.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitBomForm" type="primary" :disabled="bomFormLoading">确 定</el-button>
        <el-button @click="bomDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ProWorkorderBomApi, ProWorkorderBomVO } from '@/api/mes/pro/workorder/bom'
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'
import { MdUnitMeasureApi } from '@/api/mes/md/unitmeasure'
import { getItemOrProductLabel } from '@/views/mes/utils/constants'

defineOptions({ name: 'WorkorderBom' })

const props = defineProps<{
  workorderId: number
  disabled?: boolean
}>()

const message = useMessage()
const { t } = useI18n()

// ==================== BOM 列表 ====================
const loading = ref(false)
const bomList = ref<ProWorkorderBomVO[]>([])
const bomTotal = ref(0)
const bomQueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  workorderId: undefined as number | undefined
})

/** 查询 BOM 列表 */
const getBomList = async () => {
  loading.value = true
  try {
    bomQueryParams.workorderId = props.workorderId
    const data = await ProWorkorderBomApi.getWorkorderBomPage(bomQueryParams)
    bomList.value = data.list
    bomTotal.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除 BOM */
const handleDeleteBom = async (id: number) => {
  try {
    await message.delConfirm()
    await ProWorkorderBomApi.deleteWorkorderBom(id)
    message.success(t('common.delSuccess'))
    await getBomList()
  } catch {}
}

// ==================== BOM 表单 ====================
const bomDialogVisible = ref(false)
const bomDialogTitle = ref('')
const bomFormLoading = ref(false)
const bomFormType = ref('')
const bomFormData = ref({
  id: undefined,
  workorderId: undefined as number | undefined,
  itemId: undefined,
  unitMeasureId: undefined,
  itemOrProduct: 'ITEM',
  quantity: undefined,
  remark: undefined
})
const bomFormRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  unitMeasureId: [{ required: true, message: '单位不能为空', trigger: 'change' }],
  itemOrProduct: [{ required: true, message: '物料产品标识不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '预计使用量不能为空', trigger: 'blur' }]
})
const bomFormRef = ref()
const itemList = ref<MdItemVO[]>([])
const unitMeasureList = ref<any[]>([])

/** 打开 BOM 表单弹窗 */
const openBomForm = async (type: string, row?: any) => {
  bomDialogVisible.value = true
  bomDialogTitle.value = type === 'create' ? '添加物料' : '编辑物料'
  bomFormType.value = type
  // 加载物料和单位列表
  itemList.value = await MdItemApi.getItemSimpleList()
  unitMeasureList.value = await MdUnitMeasureApi.getUnitMeasureSimpleList()
  // 重置表单
  bomFormData.value = {
    id: undefined,
    workorderId: props.workorderId,
    itemId: undefined,
    unitMeasureId: undefined,
    itemOrProduct: 'ITEM',
    quantity: undefined,
    remark: undefined
  }
  // 编辑时设置数据
  if (row) {
    bomFormData.value = { ...row }
  }
}

/** 物料变更：自动填充单位 */
const handleBomItemChange = (itemId: number) => {
  const item = itemList.value.find((i) => i.id === itemId)
  if (item && item.unitMeasureId) {
    bomFormData.value.unitMeasureId = item.unitMeasureId
  }
}

/** 提交 BOM 表单 */
const submitBomForm = async () => {
  await bomFormRef.value.validate()
  bomFormLoading.value = true
  try {
    const data = bomFormData.value as unknown as ProWorkorderBomVO
    if (bomFormType.value === 'create') {
      await ProWorkorderBomApi.createWorkorderBom(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProWorkorderBomApi.updateWorkorderBom(data)
      message.success(t('common.updateSuccess'))
    }
    bomDialogVisible.value = false
    await getBomList()
  } finally {
    bomFormLoading.value = false
  }
}

// ==================== 初始化 ====================
onMounted(async () => {
  await getBomList()
})
</script>
