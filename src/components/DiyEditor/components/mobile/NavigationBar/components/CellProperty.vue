<template>
  <div class="h-40px flex items-center justify-center">
    <MagicCubeEditor
      v-model="cellList"
      class="m-b-16px"
      :rows="1"
      :cols="cellCount"
      :cube-size="38"
      @hot-area-selected="handleHotAreaSelected"
    />
    <img src="@/assets/imgs/diy/app-nav-bar-mp.png" alt="" class="h-30px w-76px" v-if="isMp" />
  </div>
  <template v-for="(cell, cellIndex) in cellList" :key="cellIndex">
    <template v-if="selectedHotAreaIndex === cellIndex">
      <el-form-item label="类型" :prop="`cell[${cellIndex}].type`">
        <el-radio-group v-model="cell.type">
          <el-radio label="text">文字</el-radio>
          <el-radio label="image">图片</el-radio>
          <el-radio label="search">搜索框</el-radio>
        </el-radio-group>
      </el-form-item>
      <!-- 1. 文字 -->
      <template v-if="cell.type === 'text'">
        <el-form-item label="内容" :prop="`cell[${cellIndex}].text`">
          <el-input v-model="cell!.text" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item label="颜色" :prop="`cell[${cellIndex}].text`">
          <ColorInput v-model="cell!.textColor" />
        </el-form-item>
      </template>
      <!-- 2. 图片 -->
      <template v-else-if="cell.type === 'image'">
        <el-form-item label="图片" :prop="`cell[${cellIndex}].imgUrl`">
          <UploadImg v-model="cell.imgUrl" :limit="1" height="56px" width="56px">
            <template #tip>建议尺寸 56*56</template>
          </UploadImg>
        </el-form-item>
        <el-form-item label="链接" :prop="`cell[${cellIndex}].url`">
          <AppLinkInput v-model="cell.url" />
        </el-form-item>
      </template>
      <!-- 3. 搜索框 -->
      <template v-else>
        <el-form-item label="提示文字" :prop="`cell[${cellIndex}].placeholder`">
          <el-input v-model="cell.placeholder" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item label="圆角" :prop="`cell[${cellIndex}].borderRadius`">
          <el-slider
            v-model="cell.borderRadius"
            :max="100"
            :min="0"
            show-input
            input-size="small"
            :show-input-controls="false"
          />
        </el-form-item>
      </template>
    </template>
  </template>
</template>

<script setup lang="ts">
import { NavigationBarCellProperty } from '../config'
import { usePropertyForm } from '@/components/DiyEditor/util'
// 导航栏属性面板
defineOptions({ name: 'NavigationBarCellProperty' })

const props = defineProps<{
  modelValue: NavigationBarCellProperty[]
  isMp: boolean
}>()
const emit = defineEmits(['update:modelValue'])
const { formData: cellList } = usePropertyForm(props.modelValue, emit)
if (!cellList.value) cellList.value = []

// 单元格数量：小程序6个（右侧胶囊按钮占了2个），其它平台8个
const cellCount = computed(() => (props.isMp ? 6 : 8))

// 选中的热区
const selectedHotAreaIndex = ref(0)
const handleHotAreaSelected = (cellValue: NavigationBarCellProperty, index: number) => {
  selectedHotAreaIndex.value = index
  if (!cellValue.type) {
    cellValue.type = 'text'
    cellValue.textColor = '#111111'
  }
}
</script>

<style scoped lang="scss"></style>
