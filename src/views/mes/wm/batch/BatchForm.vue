<template>
  <Dialog title="批次详情" v-model="dialogVisible" width="980px">
    <el-form
      :model="formData"
      label-width="120px"
      v-loading="formLoading"
      disabled
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="批次编号">
            <el-input v-model="formData.code" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物料编码">
            <el-input v-model="formData.itemCode" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物料名称">
            <el-input v-model="formData.itemName" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="规格型号">
            <el-input v-model="formData.itemSpecification" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单位">
            <el-input v-model="formData.unitName" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产批号">
            <el-input v-model="formData.lotNumber" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="生产日期">
            <el-input :model-value="formData.produceDate ? formatDate(formData.produceDate, 'YYYY-MM-DD') : ''" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="有效期">
            <el-input :model-value="formData.expireDate ? formatDate(formData.expireDate, 'YYYY-MM-DD') : ''" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库日期">
            <el-input :model-value="formData.receiptDate ? formatDate(formData.receiptDate, 'YYYY-MM-DD') : ''" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="供应商">
            <el-input v-model="formData.vendorName" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户">
            <el-input v-model="formData.clientName" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作站">
            <el-input v-model="formData.workstationCode" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="采购订单编号">
            <el-input v-model="formData.purchaseOrderCode" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="销售订单编号">
            <el-input v-model="formData.salesOrderCode" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产工单">
            <el-input v-model="formData.workOrderCode" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="formData.remark" type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatDate } from '@/utils/formatTime'
import { BatchApi, BatchVO } from '@/api/mes/wm/batch'

defineOptions({ name: 'BatchForm' })

const dialogVisible = ref(false)
const formLoading = ref(false)
const formData = ref<BatchVO>({} as BatchVO)

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  formLoading.value = true
  try {
    formData.value = await BatchApi.getBatch(id)
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
