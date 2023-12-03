<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form label-width="80px" :model="formData">
      <el-card header="秒杀活动" class="property-group" shadow="never">
        <el-form-item label="秒杀活动" prop="activityId">
          <el-select v-model="formData.activityId">
            <el-option
              v-for="activity in activityList"
              :key="activity.id"
              :label="activity.name"
              :value="activity.id"
            />
          </el-select>
        </el-form-item>
      </el-card>
      <el-card header="商品样式" class="property-group" shadow="never">
        <el-form-item label="布局" prop="type">
          <el-radio-group v-model="formData.layoutType">
            <el-tooltip class="item" content="单列" placement="bottom">
              <el-radio-button label="oneCol">
                <Icon icon="fluent:text-column-one-24-filled" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip class="item" content="三列" placement="bottom">
              <el-radio-button label="threeCol">
                <Icon icon="fluent:text-column-three-24-filled" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="商品名称" prop="fields.name.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.name.color" />
            <el-checkbox v-model="formData.fields.name.show" />
          </div>
        </el-form-item>
        <el-form-item label="商品价格" prop="fields.price.show">
          <div class="flex gap-8px">
            <ColorInput v-model="formData.fields.price.color" />
            <el-checkbox v-model="formData.fields.price.show" />
          </div>
        </el-form-item>
      </el-card>
      <el-card header="角标" class="property-group" shadow="never">
        <el-form-item label="角标" prop="badge.show">
          <el-switch v-model="formData.badge.show" />
        </el-form-item>
        <el-form-item label="角标" prop="badge.imgUrl" v-if="formData.badge.show">
          <UploadImg v-model="formData.badge.imgUrl" height="44px" width="72px">
            <template #tip> 建议尺寸：36 * 22 </template>
          </UploadImg>
        </el-form-item>
      </el-card>
      <el-card header="商品样式" class="property-group" shadow="never">
        <el-form-item label="上圆角" prop="borderRadiusTop">
          <el-slider
            v-model="formData.borderRadiusTop"
            :max="100"
            :min="0"
            show-input
            input-size="small"
            :show-input-controls="false"
          />
        </el-form-item>
        <el-form-item label="下圆角" prop="borderRadiusBottom">
          <el-slider
            v-model="formData.borderRadiusBottom"
            :max="100"
            :min="0"
            show-input
            input-size="small"
            :show-input-controls="false"
          />
        </el-form-item>
        <el-form-item label="间隔" prop="space">
          <el-slider
            v-model="formData.space"
            :max="100"
            :min="0"
            show-input
            input-size="small"
            :show-input-controls="false"
          />
        </el-form-item>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { PromotionSeckillProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
import * as SeckillActivityApi from '@/api/mall/promotion/seckill/seckillActivity'
import { CommonStatusEnum } from '@/utils/constants'

// 秒杀属性面板
defineOptions({ name: 'PromotionSeckillProperty' })

const props = defineProps<{ modelValue: PromotionSeckillProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
// 活动列表
const activityList = ref<SeckillActivityApi.SeckillActivityVO>([])
onMounted(async () => {
  const { list } = await SeckillActivityApi.getSeckillActivityPage({
    status: CommonStatusEnum.ENABLE
  })
  activityList.value = list
})
</script>

<style scoped lang="scss"></style>
