<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
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
            :data="[]"
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
          <div class="demo-image__preview pt-5px pb-5px pl-11x pr-11px">
            <el-image
              :initial-index="0"
              :preview-src-list="srcList"
              :src="url"
              :zoom-rate="1.2"
              fit="cover"
              style="width: 100%; height: 90px"
            />
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="商品轮播图" prop="sliderPicUrls">
          <el-button>添加轮播图</el-button>
          <el-carousel :interval="3000" height="200px" style="width: 100%" type="card">
            <el-carousel-item v-for="item in 6" :key="item">
              <h3 justify="center" text="2xl">{{ item }}</h3>
            </el-carousel-item>
          </el-carousel>
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
// TODO 商品封面测试数据
import { defaultProps } from '@/utils/tree'

const url = 'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg'
const srcList = ['https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg']

const formRef = ref()
const formData = ref({
  name: '', // 商品名称
  categoryId: '', // 商品分类
  keyword: '', // 关键字
  unit: '', // 单位
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  deliveryTemplateId: '', // 运费模版
  selectRule: '',
  specType: false, // 商品规格
  subCommissionType: false // 分销类型
})
const rules = reactive({
  name: [required],
  categoryId: [required],
  keyword: [required],
  unit: [required],
  picUrl: [required],
  sliderPicUrls: [required],
  deliveryTemplateId: [required],
  specType: [required],
  subCommissionType: [required]
})
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
</script>
<style scoped>
/*TODO 商品轮播图测试样式*/
.el-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
}

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}

/*TODO 商品封面测试样式*/
.demo-image__error .image-slot {
  font-size: 30px;
}

.demo-image__error .image-slot .el-icon {
  font-size: 30px;
}

.demo-image__error .el-image {
  width: 100%;
  height: 200px;
}
</style>
