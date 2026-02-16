<!-- MES 产品BOM 列表 -->
<template>
  <div>
    <el-button type="primary" plain size="small" @click="handleAdd" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加 BOM 物料
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="物料编码" align="center" prop="bomItemCode" />
      <el-table-column label="物料名称" align="center" prop="bomItemName" />
      <el-table-column label="规格型号" align="center" prop="bomItemSpecification" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="物料/产品" align="center" prop="itemOrProduct" width="100">
        <template #default="scope">
          {{ getItemOrProductLabel(scope.row.itemOrProduct) }}
        </template>
      </el-table-column>
      <el-table-column label="用量比例" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑 BOM 弹窗 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        v-loading="formLoading"
      >
        <el-form-item label="BOM 物料编码" prop="bomItemCode">
          <el-input v-model="formData.bomItemCode" readonly />
        </el-form-item>
        <el-form-item label="BOM 物料名称" prop="bomItemName">
          <el-input v-model="formData.bomItemName" readonly />
        </el-form-item>
        <el-form-item label="规格型号" prop="bomItemSpecification">
          <el-input v-model="formData.bomItemSpecification" readonly />
        </el-form-item>
        <el-form-item label="单位" prop="unitMeasureName">
          <el-input v-model="formData.unitMeasureName" readonly />
        </el-form-item>
        <el-form-item label="用量比例" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="0"
            :precision="4"
            :step="0.1"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>

    <!-- 物料选择弹窗 -->
    <ItemProductSelect ref="itemSelectRef" @selected="handleItemSelected" />
  </div>
</template>

<script setup lang="ts">
import { MdProductBomApi, MdProductBomVO } from '@/api/mes/md/item/productBom'
import { MdItemVO } from '@/api/mes/md/item'
import { getItemOrProductLabel } from '@/views/mes/utils/constants'
import ItemProductSelect from '@/views/mes/md/components/ItemProductSelect.vue'

defineOptions({ name: 'MdProductBomForm' })

const props = defineProps<{
  itemId: number // 物料产品编号
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表的加载中
const list = ref<MdProductBomVO[]>([]) // BOM 列表

/** 加载 BOM 列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdProductBomApi.getProductBomListByItemId(props.itemId)
  } finally {
    loading.value = false
  }
}

// ==================== 物料选择 ====================
const itemSelectRef = ref() // 物料选择弹窗 Ref

/** 点击添加按钮 → 打开物料选择弹窗 */
const handleAdd = () => {
  itemSelectRef.value.open()
}

/** 物料选中回调：直接批量创建 BOM（默认用量比例为 1） */
const handleItemSelected = async (rows: MdItemVO[]) => {
  if (!rows || rows.length === 0) {
    return
  }
  for (const item of rows) {
    await MdProductBomApi.createProductBom({
      itemId: props.itemId,
      bomItemId: item.id,
      quantity: 1
    } as unknown as MdProductBomVO)
  }
  message.success(t('common.createSuccess'))
  await getList()
}

// ==================== 添加/编辑 BOM ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  itemId: undefined as number | undefined,
  bomItemId: undefined as number | undefined,
  bomItemCode: undefined as string | undefined, // 只读展示
  bomItemName: undefined as string | undefined, // 只读展示
  bomItemSpecification: undefined as string | undefined, // 只读展示
  unitMeasureName: undefined as string | undefined, // 只读展示
  quantity: 1,
  remark: undefined as string | undefined
}) // 表单数据
const formRules = reactive({
  quantity: [{ required: true, message: '用量比例不能为空', trigger: 'blur' }]
}) // 表单校验规则

/** 打开表单弹窗 */
const openForm = (type: string, row?: MdProductBomVO) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (type === 'update' && row) {
    formData.value = {
      id: row.id,
      itemId: row.itemId,
      bomItemId: row.bomItemId,
      bomItemCode: row.bomItemCode,
      bomItemName: row.bomItemName,
      bomItemSpecification: row.bomItemSpecification,
      unitMeasureName: row.unitMeasureName,
      quantity: row.quantity,
      remark: row.remark
    }
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    itemId: props.itemId,
    bomItemId: undefined,
    bomItemCode: undefined,
    bomItemName: undefined,
    bomItemSpecification: undefined,
    unitMeasureName: undefined,
    quantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as MdProductBomVO
    if (formType.value === 'create') {
      await MdProductBomApi.createProductBom(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdProductBomApi.updateProductBom(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
}

// ==================== 删除 ====================

/** 删除 BOM */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MdProductBomApi.deleteProductBom(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 监听 itemId 变化 */
watch(
  () => props.itemId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>
