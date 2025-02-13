<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form :model="formData" label-width="80px">
      <el-card class="property-group" header="积分商城活动" shadow="never">
        <PointShowcase v-model="formData.activityIds" />
      </el-card>
      <el-card class="property-group" header="商品样式" shadow="never">
        <el-form-item label="布局" prop="type">
          <el-radio-group v-model="formData.layoutType">
            <el-tooltip class="item" content="单列大图" placement="bottom">
              <el-radio-button value="oneColBigImg">
                <Icon icon="fluent:text-column-one-24-filled" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip class="item" content="单列小图" placement="bottom">
              <el-radio-button value="oneColSmallImg">
                <Icon icon="fluent:text-column-two-left-24-filled" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip class="item" content="双列" placement="bottom">
              <el-radio-button value="twoCol">
                <Icon icon="fluent:text-column-two-24-filled" />
              </el-radio-button>
            </el-tooltip>
            <!--<el-tooltip class="item" content="三列" placement="bottom">
              <el-radio-button value="threeCol">
                <Icon icon="fluent:text-column-three-24-filled" />
              </el-radio-button>
            </el-tooltip>-->
          </el-radio-group>
        </el-form-item>
        <el-form-item label="商品名称" prop="fields.name.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.name.color" />
            <el-checkbox v-model="formData.fields.name.show" />
          </div>
        </el-form-item>
        <el-form-item label="商品简介" prop="fields.introduction.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.introduction.color" />
            <el-checkbox v-model="formData.fields.introduction.show" />
          </div>
        </el-form-item>
        <el-form-item label="商品价格" prop="fields.price.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.price.color" />
            <el-checkbox v-model="formData.fields.price.show" />
          </div>
        </el-form-item>
        <el-form-item label="市场价" prop="fields.marketPrice.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.marketPrice.color" />
            <el-checkbox v-model="formData.fields.marketPrice.show" />
          </div>
        </el-form-item>
        <el-form-item label="商品销量" prop="fields.salesCount.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.salesCount.color" />
            <el-checkbox v-model="formData.fields.salesCount.show" />
          </div>
        </el-form-item>
        <el-form-item label="商品库存" prop="fields.stock.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.stock.color" />
            <el-checkbox v-model="formData.fields.stock.show" />
          </div>
        </el-form-item>
      </el-card>
      <el-card class="property-group" header="角标" shadow="never">
        <el-form-item label="角标" prop="badge.show">
          <el-switch v-model="formData.badge.show" />
        </el-form-item>
        <el-form-item v-if="formData.badge.show" label="角标" prop="badge.imgUrl">
          <UploadImg v-model="formData.badge.imgUrl" height="44px" width="72px">
            <template #tip> 建议尺寸：36 * 22</template>
          </UploadImg>
        </el-form-item>
      </el-card>
      <el-card class="property-group" header="按钮" shadow="never">
        <el-form-item label="按钮类型" prop="btnBuy.type">
          <el-radio-group v-model="formData.btnBuy.type">
            <el-radio-button value="text">文字</el-radio-button>
            <el-radio-button value="img">图片</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="formData.btnBuy.type === 'text'">
          <el-form-item label="按钮文字" prop="btnBuy.text">
            <el-input v-model="formData.btnBuy.text" />
          </el-form-item>
          <el-form-item label="左侧背景" prop="btnBuy.bgBeginColor">
            <ColorInput v-model="formData.btnBuy.bgBeginColor" />
          </el-form-item>
          <el-form-item label="右侧背景" prop="btnBuy.bgEndColor">
            <ColorInput v-model="formData.btnBuy.bgEndColor" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="图片" prop="btnBuy.imgUrl">
            <UploadImg v-model="formData.btnBuy.imgUrl" height="56px" width="56px">
              <template #tip> 建议尺寸：56 * 56</template>
            </UploadImg>
          </el-form-item>
        </template>
      </el-card>
      <el-card class="property-group" header="商品样式" shadow="never">
        <el-form-item label="上圆角" prop="borderRadiusTop">
          <el-slider
            v-model="formData.borderRadiusTop"
            :max="100"
            :min="0"
            :show-input-controls="false"
            input-size="small"
            show-input
          />
        </el-form-item>
        <el-form-item label="下圆角" prop="borderRadiusBottom">
          <el-slider
            v-model="formData.borderRadiusBottom"
            :max="100"
            :min="0"
            :show-input-controls="false"
            input-size="small"
            show-input
          />
        </el-form-item>
        <el-form-item label="间隔" prop="space">
          <el-slider
            v-model="formData.space"
            :max="100"
            :min="0"
            :show-input-controls="false"
            input-size="small"
            show-input
          />
        </el-form-item>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
</template>

<script lang="ts" setup>
import { PromotionPointProperty } from './config'
import { useVModel } from '@vueuse/core'
import PointShowcase from '@/views/mall/promotion/point/components/PointShowcase.vue'

// 秒杀属性面板
defineOptions({ name: 'PromotionPointProperty' })

const props = defineProps<{ modelValue: PromotionPointProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)
</script>

<style lang="scss" scoped></style>
