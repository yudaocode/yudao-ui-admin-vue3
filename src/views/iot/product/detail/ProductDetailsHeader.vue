<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ product.name }}</span>
          </el-row>
        </el-col>
      </div>
      <div>
        <!-- 右上：按钮 -->
        <el-button @click="openForm('update', product.id)" v-hasPermi="['iot:product:update']">
          编辑
        </el-button>
      </div>
    </div>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="vertical">
      <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
      <el-descriptions-item label="产品标识">{{ product.identification }}</el-descriptions-item>
      <el-descriptions-item label="设备类型">
        <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
      </el-descriptions-item>
      <el-descriptions-item label="产品状态">
        <dict-tag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="product.status" />
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <ProductForm ref="formRef" @success="openForm('update', product.id)" />
</template>
<script setup lang="ts">
import ProductForm from '@/views/iot/product/ProductForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { ProductVO } from '@/api/iot/product'

// 操作修改
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
const { product } = defineProps<{ product: ProductVO }>()
</script>
