<!--
  MES 产品 BOM 子物料弹窗选择器（单选）

  从指定产品的 BOM 子物料中选择，候选范围限定为该产品已配好的 BOM 子项。
  Props:
    （无外部 props，通过 open 方法传参）
  Events:
    selected(row: MdProductBomVO) — 确认选择后触发，传递完整 BOM 行
  Expose:
    open(itemId: number, selectedBomItemId?: number) — 打开弹窗
-->
<template>
  <Dialog title="产品 BOM 物料选择" v-model="dialogVisible" width="800px">
    <!-- 数据表格 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="bomItemId"
      highlight-current-row
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
    >
      <!-- 单选 radio -->
      <el-table-column width="50" align="center">
        <template #default="{ row }">
          <el-radio
            v-model="selectedRadioId"
            :value="row.bomItemId"
            class="radio-no-label"
            @change="handleRadioChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="物料编码" align="center" prop="bomItemCode" width="160" />
      <el-table-column label="物料名称" align="left" prop="bomItemName" min-width="150" />
      <el-table-column label="规格型号" align="left" prop="bomItemSpecification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="物料/产品" align="center" prop="itemOrProduct" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="scope.row.itemOrProduct" />
        </template>
      </el-table-column>
      <el-table-column label="用量比例" align="center" prop="quantity" width="100" />
      <el-table-column
        label="备注"
        align="center"
        prop="remark"
        min-width="120"
        :show-overflow-tooltip="true"
      />
    </el-table>
    <template #footer>
      <el-button type="primary" @click="confirmSelect">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { MdProductBomApi, MdProductBomVO } from '@/api/mes/md/item/productBom'

defineOptions({ name: 'MdProductBomSelectDialog' })

const message = useMessage()
const emit = defineEmits<{
  selected: [row: MdProductBomVO]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<MdProductBomVO[]>([]) // BOM 子物料列表

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRadioId = ref<number>() // 选中的 bomItemId
const currentRow = ref<MdProductBomVO>() // 选中的行对象

/** 单选 radio 变化 */
const handleRadioChange = (row: MdProductBomVO) => {
  currentRow.value = row
}

/** 单击行：点击整行即选中 */
const handleRowClick = (row: MdProductBomVO) => {
  selectedRadioId.value = row.bomItemId
  currentRow.value = row
}

/** 双击行：直接确认 */
const handleRowDblClick = (row: MdProductBomVO) => {
  selectedRadioId.value = row.bomItemId
  currentRow.value = row
  confirmSelect()
}

/** 确认选择 */
const confirmSelect = () => {
  if (!currentRow.value) {
    message.warning('请选择一条数据')
    return
  }
  emit('selected', currentRow.value)
  dialogVisible.value = false
}

// ==================== 打开弹窗 ====================

/** 打开弹窗 */
const open = async (itemId: number, selectedBomItemId?: number) => {
  dialogVisible.value = true
  // 清空上一次的选中状态
  selectedRadioId.value = selectedBomItemId
  currentRow.value = undefined
  // 加载 BOM 子物料列表
  loading.value = true
  try {
    list.value = await MdProductBomApi.getProductBomListByItemId(itemId)
    // 恢复预选状态
    if (selectedBomItemId != null) {
      const match = list.value.find((row) => row.bomItemId === selectedBomItemId)
      if (match) {
        currentRow.value = match
      }
    }
  } finally {
    loading.value = false
  }
}
defineExpose({ open })
</script>

<style lang="scss" scoped>
/* 隐藏 radio 的 label 文字，只保留圆圈 */
.radio-no-label {
  :deep(.el-radio__label) {
    display: none;
  }
}
</style>
