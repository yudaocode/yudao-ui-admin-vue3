<template>
  <el-form ref="ProductManagementBasicInfoRef" :model="formData" :rules="rules" label-width="120px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品分类" prop="categoryId">
          <el-tree-select
            v-model="formData.categoryId"
            :data="categoryList"
            :props="defaultProps"
            check-strictly
            node-key="id"
            placeholder="请选择商品分类"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品关键字" prop="keyword">
          <el-input v-model="formData.keyword" placeholder="请输入商品关键字" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="单位" prop="unit">
          <el-input v-model="formData.unit" placeholder="请输入单位" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品简介" prop="introduction">
          <el-input
            v-model="formData.introduction"
            :rows="3"
            placeholder="请输入商品简介"
            type="textarea"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品封面图" prop="picUrl">
          <UploadImg v-model="formData.picUrl" height="80px" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="商品轮播图" prop="sliderPicUrls">
          <UploadImgs v-model="formData.sliderPicUrls" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="运费模板" prop="deliveryTemplateId">
          <el-select v-model="formData.deliveryTemplateId" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in []" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-button class="ml-20px">运费模板</el-button>
      </el-col>
      <!-- TODO 商品规格和分销类型切换待定    -->
      <el-col :span="12">
        <el-form-item label="商品规格" props="specType">
          <el-radio-group v-model="formData.specType" @change="changeSpecType(formData.specType)">
            <el-radio :label="false" class="radio">单规格</el-radio>
            <el-radio :label="true">多规格</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <!-- TODO 商品规格和分销类型切换待定    -->
      <el-col :span="12">
        <el-form-item label="分销类型" props="subCommissionType">
          <el-radio-group
            v-model="formData.subCommissionType"
            @change="changeSubCommissionType(formData.subCommissionType)"
          >
            <el-radio :label="false">默认设置</el-radio>
            <el-radio :label="true" class="radio">自行设置</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <!-- 多规格添加-->
      <el-col v-if="formData.specType" :span="24">
        <el-form-item label="选择规格" prop="">
          <div class="acea-row">
            <el-select v-model="formData.selectRule">
              <el-option
                v-for="item in []"
                :key="item.id"
                :label="item.ruleName"
                :value="item.id"
              />
            </el-select>
            <el-button class="mr-20px" type="primary" @click="confirm">确认</el-button>
            <el-button class="mr-15px" @click="addRule">添加规格</el-button>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" name="ProductManagementBasicInfoForm" setup>
import { PropType } from 'vue'
import type { SpuType } from '@/api/mall/product/management/type'
import { UploadImg, UploadImgs } from '@/components/UploadFile'
import { copyValueToTarget } from '@/utils/object'
import * as ProductCategoryApi from '@/api/mall/product/category'
import { defaultProps, handleTree } from '@/utils/tree'

const message = useMessage() // 消息弹窗
const props = defineProps({
  propFormData: {
    type: Object as PropType<SpuType>,
    default: () => {}
  }
})

const ProductManagementBasicInfoRef = ref() // 表单Ref
const formData = ref<SpuType>({
  name: '', // 商品名称
  categoryId: undefined, // 商品分类
  keyword: '', // 关键字
  unit: '', // 单位
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  deliveryTemplateId: '', // 运费模版
  selectRule: '', // 选择规则 TODO 暂定
  specType: false, // 商品规格
  subCommissionType: false // 分销类型
})
const rules = reactive({
  name: [required],
  categoryId: [required],
  keyword: [required],
  unit: [required],
  introduction: [required],
  picUrl: [required],
  sliderPicUrls: [required]
  // deliveryTemplateId: [required],
  // specType: [required],
  // subCommissionType: [required],
})
/**
 * 将传进来的值赋值给formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) return
    copyValueToTarget(formData.value, data)
  },
  {
    deep: true,
    immediate: true
  }
)
const emit = defineEmits(['update:activeName'])
/**
 * 表单校验
 */
const validate = async () => {
  // 校验表单
  if (!ProductManagementBasicInfoRef) return
  return await unref(ProductManagementBasicInfoRef).validate((valid) => {
    if (!valid) {
      message.warning('商品信息未完善！！')
      emit('update:activeName', 'basicInfo')
      // 目的截断之后的校验
      throw new Error('商品信息未完善！！')
    } else {
      // 校验通过更新数据
      Object.assign(props.propFormData, formData.value)
    }
  })
}
defineExpose({ validate })
// 选择规格
const changeSpecType = (specType) => {
  console.log(specType)
}
// 分销类型
const changeSubCommissionType = (subCommissionType) => {
  console.log(subCommissionType)
}
// 选择属性确认
const confirm = () => {}
// 添加规格
const addRule = () => {}
const categoryList = ref() // 分类树
onMounted(async () => {
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
})
</script>
