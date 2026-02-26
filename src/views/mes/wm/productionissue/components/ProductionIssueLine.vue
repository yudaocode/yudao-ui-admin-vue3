<!-- 生产领料单行项目组件 - 用于 PREPARE 状态下编辑行项目 -->
<!-- TODO @AI：参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/wm/arrivalnotice -->
<template>
  <div>
    <el-button type="primary" @click="handleAdd" class="mb-10px" v-if="!readonly">
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>

    <el-table :data="lines" border>
      <el-table-column label="物料编号" prop="itemCode" width="150" />
      <el-table-column label="物料名称" prop="itemName" width="200" />
      <el-table-column label="规格型号" prop="specification" width="150" />
      <el-table-column label="单位" prop="unitOfMeasure" width="100" />
      <el-table-column label="领料数量" prop="quantityIssued" width="120" />
      <el-table-column label="批次号" prop="batchCode" width="150" />
      <el-table-column label="备注" prop="remark" min-width="150" />
      <el-table-column label="操作" width="150" fixed="right" v-if="!readonly">
        <template #default="scope">
          <el-button link type="primary" @click="handleEdit(scope.row, scope.$index)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.$index)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="物料" prop="itemId">
          <el-input
            v-model="formData.itemCode"
            placeholder="请选择物料"
            readonly
            @click="handleSelectItem"
            class="cursor-pointer"
          >
            <template #append>
              <el-button @click="handleSelectItem">
                <Icon icon="ep:search" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="formData.itemName" disabled />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="formData.specification" disabled />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="formData.unitOfMeasure" disabled />
        </el-form-item>
        <el-form-item label="领料数量" prop="quantityIssued">
          <el-input-number
            v-model="formData.quantityIssued"
            :min="0"
            :precision="2"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 物料选择器 -->
    <ItemSelect ref="itemSelectRef" @select="handleItemSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ItemSelect from '@/components/MES/ItemSelect.vue'

defineOptions({ name: 'ProductionIssueLine' })

interface LineItem {
  id?: number
  issueId?: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitOfMeasure?: string
  quantityIssued: number
  batchId?: number
  batchCode?: string
  remark?: string
}

const props = defineProps({
  modelValue: {
    type: Array as () => LineItem[],
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const lines = ref<LineItem[]>(props.modelValue || [])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editIndex = ref(-1)
const formRef = ref()
const itemSelectRef = ref()

const formData = reactive<LineItem>({
  itemId: 0,
  itemCode: '',
  itemName: '',
  specification: '',
  unitOfMeasure: '',
  quantityIssued: 0,
  batchCode: '',
  remark: ''
})

const formRules = {
  itemId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  quantityIssued: [{ required: true, message: '请输入领料数量', trigger: 'blur' }]
}

const handleAdd = () => {
  dialogTitle.value = '添加物料'
  editIndex.value = -1
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: LineItem, index: number) => {
  dialogTitle.value = '编辑物料'
  editIndex.value = index
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleDelete = (index: number) => {
  lines.value.splice(index, 1)
  emit('update:modelValue', lines.value)
}

const handleSelectItem = () => {
  itemSelectRef.value.open()
}

const handleItemSelected = (item: any) => {
  formData.itemId = item.itemId
  formData.itemCode = item.itemCode
  formData.itemName = item.itemName
  formData.specification = item.specification
  formData.unitOfMeasure = item.unitName
}

const handleConfirm = async () => {
  await formRef.value.validate()

  const lineData = { ...formData }

  if (editIndex.value >= 0) {
    lines.value[editIndex.value] = lineData
  } else {
    lines.value.push(lineData)
  }

  emit('update:modelValue', lines.value)
  dialogVisible.value = false
}

const resetForm = () => {
  Object.assign(formData, {
    itemId: 0,
    itemCode: '',
    itemName: '',
    specification: '',
    unitOfMeasure: '',
    quantityIssued: 0,
    batchCode: '',
    remark: ''
  })
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
