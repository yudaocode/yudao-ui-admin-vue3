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
        <el-button @click="openForm('update', product.id)" v-hasPermi="['crm:product:update']">
          编辑
        </el-button>
      </div>
    </div>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="vertical">
      <el-descriptions-item label="产品类别">
        {{ productCategoryList?.find((c) => c.id === product.categoryId)?.name }}
      </el-descriptions-item>
      <el-descriptions-item label="产品单位">
        <dict-tag :type="DICT_TYPE.CRM_PRODUCT_UNIT" :value="product.unit" />
      </el-descriptions-item>
      <el-descriptions-item label="产品价格">{{ fenToYuan(product.price) }}元</el-descriptions-item>
      <el-descriptions-item label="产品编码">{{ product.no }}</el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <ProductForm ref="formRef" @success="emit('refresh')" />
</template>
<script setup lang="ts">
import ProductForm from '@/views/crm/product/ProductForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { fenToYuan } from '@/utils'
import * as ProductApi from '@/api/crm/product'
import * as ProductCategoryApi from '@/api/crm/product/productCategory'

// 操作修改
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
const { product } = defineProps<{ product: ProductApi.ProductVO }>()
const emit = defineEmits(['refresh']) // 定义 success 事件，用于操作成功后的回调

/** 初始化 */
const productCategoryList = ref([]) // 产品分类树

onMounted(async () => {
  productCategoryList.value = await ProductCategoryApi.getProductCategoryList({})
})
</script>
