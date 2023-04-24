<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
    <el-row>
      <el-col :span="24">
        <el-col :span="8">
          <el-form-item label="商品排序">
            <el-input-number v-model="formData.sort" :min="0" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="赠送积分">
            <el-input-number v-model="formData.giveIntegral" :min="0" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="虚拟销量">
            <el-input-number
              v-model="formData.virtualSalesCount"
              :min="0"
              placeholder="请输入虚拟销量"
            />
          </el-form-item>
        </el-col>
      </el-col>
      <el-col :span="24">
        <el-form-item label="商品推荐">
          <el-checkbox-group v-model="checkboxGroup" @change="onChangeGroup">
            <el-checkbox v-for="(item, index) in recommend" :key="index" :label="item.value">
              {{ item.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <!--   TODO tag展示暂时不考虑排序     -->
        <el-form-item label="活动优先级">
          <el-tag>默认</el-tag>
          <el-tag class="ml-2" type="success">秒杀</el-tag>
          <el-tag class="ml-2" type="info">砍价</el-tag>
          <el-tag class="ml-2" type="warning">拼团</el-tag>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="赠送优惠劵">
          <el-button>选择优惠券</el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" name="OtherSettingsForm" setup>
// 商品推荐
const recommend = [
  { name: '是否热卖', value: 'recommendHot' },
  { name: '是否优惠', value: 'recommendBenefit' },
  { name: '是否精品', value: 'recommendBest' },
  { name: '是否新品', value: 'recommendNew' },
  { name: '是否优品', value: 'recommendGood' }
]
const checkboxGroup = ref<string[]>([])
const onChangeGroup = () => {
  checkboxGroup.value.includes('recommendHot')
    ? (formData.value.recommendHot = true)
    : (formData.value.recommendHot = false)
  checkboxGroup.value.includes('recommendBenefit')
    ? (formData.value.recommendBenefit = true)
    : (formData.value.recommendBenefit = false)
  checkboxGroup.value.includes('recommendBest')
    ? (formData.value.recommendBest = true)
    : (formData.value.recommendBest = false)
  checkboxGroup.value.includes('recommendNew')
    ? (formData.value.recommendNew = true)
    : (formData.value.recommendNew = false)
  checkboxGroup.value.includes('recommendGood')
    ? (formData.value.recommendGood = true)
    : (formData.value.recommendGood = false)
}
const formRef = ref()
const formData = ref({
  sort: '',
  giveIntegral: 666,
  virtualSalesCount: 565656,
  recommendHot: false,
  recommendBenefit: false,
  recommendBest: false,
  recommendNew: false,
  recommendGood: false
})
const rules = reactive({
  sort: [required],
  giveIntegral: [required],
  virtualSalesCount: [required]
})
</script>
