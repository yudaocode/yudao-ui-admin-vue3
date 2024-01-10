<template>
  <!-- 情况一：添加/修改 -->
  <el-form
    v-if="!isDetail"
    ref="productSpuBasicInfoRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
  >
    <!-- TODO 芋艿：宽度！！ -->
    <el-form-item label="商品名称" prop="name">
      <el-input
        v-model="formData.name"
        placeholder="请输入商品名称"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 2 }"
        maxlength="64"
        :show-word-limit="true"
        :clearable="true"
      />
    </el-form-item>
    <el-form-item label="商品分类" prop="categoryId">
      <el-cascader
        v-model="formData.categoryId"
        :options="categoryList"
        :props="defaultProps"
        class="w-1/1"
        clearable
        placeholder="请选择商品分类"
        filterable
      />
    </el-form-item>
    <el-form-item label="商品关键字" prop="keyword">
      <el-input v-model="formData.keyword" placeholder="请输入商品关键字" />
    </el-form-item>
    <el-form-item label="商品简介" prop="introduction">
      <el-input
        v-model="formData.introduction"
        :rows="3"
        placeholder="请输入商品简介"
        type="textarea"
      />
    </el-form-item>
    <el-form-item label="商品封面图" prop="picUrl">
      <UploadImg v-model="formData.picUrl" height="80px" />
    </el-form-item>
    <el-form-item label="商品轮播图" prop="sliderPicUrls">
      <UploadImgs v-model:modelValue="formData.sliderPicUrls" />
    </el-form-item>
    <el-form-item label="品牌" prop="brandId">
      <el-select v-model="formData.brandId" placeholder="请选择">
        <el-option v-for="item in brandList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
  </el-form>

  <!-- 情况二：详情 -->
  <Descriptions v-if="isDetail" :data="formData" :schema="allSchemas.detailSchema">
    <template #categoryId="{ row }"> {{ formatCategoryName(row.categoryId) }}</template>
    <template #brandId="{ row }">
      {{ brandList.find((item) => item.id === row.brandId)?.name }}
    </template>
    <template #picUrl="{ row }">
      <el-image :src="row.picUrl" class="h-60px w-60px" @click="imagePreview(row.picUrl)" />
    </template>
    <template #sliderPicUrls="{ row }">
      <el-image
        v-for="(item, index) in row.sliderPicUrls"
        :key="index"
        :src="item.url"
        class="mr-10px h-60px w-60px"
        @click="imagePreview(row.sliderPicUrls)"
      />
    </template>
  </Descriptions>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { isArray } from '@/utils/is'
import { copyValueToTarget } from '@/utils'
import { propTypes } from '@/utils/propTypes'
import { defaultProps, handleTree, treeToString } from '@/utils/tree'
import { createImageViewer } from '@/components/ImageViewer'
import { basicInfoSchema } from './spu.data'
import type { Spu } from '@/api/mall/product/spu'
import * as ProductCategoryApi from '@/api/mall/product/category'
import * as ProductBrandApi from '@/api/mall/product/brand'
import * as ExpressTemplateApi from '@/api/mall/trade/delivery/expressTemplate'

defineOptions({ name: 'ProductSpuBasicInfoForm' })

// ====== 商品详情相关操作 ======
const { allSchemas } = useCrudSchemas(basicInfoSchema)
/** 商品图预览 */
const imagePreview = (args) => {
  const urlList = []
  if (isArray(args)) {
    args.forEach((item) => {
      urlList.push(item.url)
    })
  } else {
    urlList.push(args)
  }
  createImageViewer({
    urlList
  })
}

// ====== end ======

const message = useMessage() // 消息弹窗

const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  activeName: propTypes.string.def(''),
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})
const productSpuBasicInfoRef = ref() // 表单 Ref
const formData = reactive<Spu>({
  name: '', // 商品名称
  categoryId: null, // 商品分类
  keyword: '', // 关键字
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  brandId: null // 商品品牌
})
const rules = reactive({
  name: [required],
  categoryId: [required],
  keyword: [required],
  introduction: [required],
  picUrl: [required],
  sliderPicUrls: [required],
  brandId: [required]
})

/**
 * 将传进来的值赋值给 formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return
    }
    copyValueToTarget(formData, data)
    formData.sliderPicUrls = data['sliderPicUrls']?.map((item) => ({
      url: item
    }))
  },
  {
    immediate: true
  }
)

/**
 * 表单校验
 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  // 校验表单
  if (!productSpuBasicInfoRef) return
  return await unref(productSpuBasicInfoRef).validate((valid) => {
    if (!valid) {
      message.warning('商品信息未完善！！')
      emit('update:activeName', 'basicInfo')
      // 目的截断之后的校验
      throw new Error('商品信息未完善！！')
    } else {
      // 校验通过更新数据
      Object.assign(props.propFormData, formData)
    }
  })
}
defineExpose({ validate })

/** 获取分类的节点的完整结构 */
const categoryList = ref<any[]>([]) // 分类树
const formatCategoryName = (categoryId: number) => {
  return treeToString(categoryList.value, categoryId)
}

const brandList = ref([]) // 精简商品品牌列表
onMounted(async () => {
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
  // 获取商品品牌列表
  brandList.value = await ProductBrandApi.getSimpleBrandList()
})
</script>
