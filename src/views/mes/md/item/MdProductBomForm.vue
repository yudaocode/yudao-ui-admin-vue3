<!-- MES 产品BOM 列表 -->
<template>
  <div>
    <el-button type="primary" plain size="small" @click="openAddForm" class="mb-10px">
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
          <el-button link type="primary" @click="openEditForm(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加 BOM 物料弹窗 -->
    <Dialog title="添加 BOM 物料" v-model="addDialogVisible" width="500px">
      <el-form ref="addFormRef" :model="addFormData" :rules="addFormRules" label-width="100px">
        <el-form-item label="BOM 物料" prop="bomItemId">
          <el-select
            v-model="addFormData.bomItemId"
            filterable
            remote
            :remote-method="searchItems"
            :loading="itemSearchLoading"
            placeholder="请搜索物料编码/名称"
            class="w-1/1"
          >
            <el-option
              v-for="item in itemOptions"
              :key="item.id"
              :label="item.code + ' - ' + item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用量比例" prop="quantity">
          <el-input-number
            v-model="addFormData.quantity"
            :min="0"
            :precision="4"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="addFormData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitAddForm" type="primary">确 定</el-button>
        <el-button @click="addDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>

    <!-- 编辑 BOM 弹窗 -->
    <Dialog title="编辑 BOM 物料" v-model="editDialogVisible" width="500px">
      <el-form ref="editFormRef" :model="editFormData" :rules="editFormRules" label-width="100px">
        <el-form-item label="用量比例" prop="quantity">
          <el-input-number
            v-model="editFormData.quantity"
            :min="0"
            :precision="4"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editFormData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitEditForm" type="primary">确 定</el-button>
        <el-button @click="editDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { MdProductBomApi, MdProductBomVO } from '@/api/mes/md/item/productBom'
import { MdItemApi } from '@/api/mes/md/item'
import { getItemOrProductLabel } from '@/views/mes/utils/constants'

defineOptions({ name: 'MdProductBomForm' })

const props = defineProps<{
  itemId: number // 物料产品编号
}>()

const message = useMessage()
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

// ==================== 物料搜索 ====================
const itemSearchLoading = ref(false) // 物料搜索加载中
const itemOptions = ref<any[]>([]) // 物料搜索选项

/** 远程搜索物料 */
const searchItems = async (query: string) => {
  if (!query) {
    itemOptions.value = []
    return
  }
  itemSearchLoading.value = true
  try {
    const data = await MdItemApi.getItemPage({ pageNo: 1, pageSize: 20, code: query })
    itemOptions.value = data.list || []
  } finally {
    itemSearchLoading.value = false
  }
}

// ==================== 添加 BOM ====================
const addDialogVisible = ref(false) // 添加弹窗是否可见
const addFormRef = ref() // 添加表单 Ref
/** 添加表单数据 */
const addFormData = ref({
  itemId: undefined as number | undefined,
  bomItemId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
})
const addFormRules = reactive({
  bomItemId: [{ required: true, message: 'BOM 物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '用量比例不能为空', trigger: 'blur' }]
})

/** 打开添加弹窗 */
const openAddForm = () => {
  addDialogVisible.value = true
  addFormData.value = {
    itemId: props.itemId,
    bomItemId: undefined,
    quantity: 1,
    remark: undefined
  }
  itemOptions.value = []
  addFormRef.value?.resetFields()
}

/** 提交添加表单 */
const submitAddForm = async () => {
  await addFormRef.value.validate()
  await MdProductBomApi.createProductBom(addFormData.value as unknown as MdProductBomVO)
  message.success('添加成功')
  addDialogVisible.value = false
  await getList()
}

// ==================== 编辑 BOM ====================
const editDialogVisible = ref(false) // 编辑弹窗是否可见
const editFormRef = ref() // 编辑表单 Ref
/** 编辑表单数据 */
const editFormData = ref({
  id: undefined as number | undefined,
  itemId: undefined as number | undefined,
  bomItemId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
})
const editFormRules = reactive({
  quantity: [{ required: true, message: '用量比例不能为空', trigger: 'blur' }]
})

/** 打开编辑弹窗 */
const openEditForm = (row: MdProductBomVO) => {
  editDialogVisible.value = true
  editFormData.value = {
    id: row.id,
    itemId: row.itemId,
    bomItemId: row.bomItemId,
    quantity: row.quantity,
    remark: row.remark
  }
  editFormRef.value?.resetFields()
}

/** 提交编辑表单 */
const submitEditForm = async () => {
  await editFormRef.value.validate()
  await MdProductBomApi.updateProductBom(editFormData.value as unknown as MdProductBomVO)
  message.success('编辑成功')
  editDialogVisible.value = false
  await getList()
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
