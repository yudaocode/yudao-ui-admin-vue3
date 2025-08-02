<template>
  <div class="h-40px flex items-center justify-center">
    <MagicCubeEditor
      v-model="cellList"
      :cols="cellCount"
      :cube-size="38"
      :rows="1"
      class="m-b-16px"
      @hot-area-selected="handleHotAreaSelected"
    />
    <img v-if="isMp" alt="" class="h-30px w-76px" src="@/assets/imgs/diy/app-nav-bar-mp.png" />
  </div>
  <template v-for="(cell, cellIndex) in cellList" :key="cellIndex">
    <template v-if="selectedHotAreaIndex === cellIndex">
      <el-form-item :prop="`cell[${cellIndex}].type`" label="类型">
        <el-radio-group v-model="cell.type" @change="handleHotAreaSelected(cell, cellIndex)">
          <el-radio value="text">文字</el-radio>
          <el-radio value="image">图片</el-radio>
          <el-radio value="search">搜索框</el-radio>
        </el-radio-group>
      </el-form-item>
      <!-- 1. 文字 -->
      <template v-if="cell.type === 'text'">
        <el-form-item :prop="`cell[${cellIndex}].text`" label="内容">
          <el-input v-model="cell!.text" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item :prop="`cell[${cellIndex}].text`" label="颜色">
          <ColorInput v-model="cell!.textColor" />
        </el-form-item>
        <el-form-item :prop="`cell[${cellIndex}].url`" label="链接">
          <AppLinkInput v-model="cell.url" />
        </el-form-item>
      </template>
      <!-- 2. 图片 -->
      <template v-else-if="cell.type === 'image'">
        <el-form-item :prop="`cell[${cellIndex}].imgUrl`" label="图片">
          <UploadImg v-model="cell.imgUrl" :limit="1" height="56px" width="56px">
            <template #tip>建议尺寸 56*56</template>
          </UploadImg>
        </el-form-item>
        <el-form-item :prop="`cell[${cellIndex}].url`" label="链接">
          <AppLinkInput v-model="cell.url" />
        </el-form-item>
      </template>
      <!-- 3. 搜索框 -->
      <template v-else>
        <el-form-item label="框体颜色" prop="backgroundColor">
          <ColorInput v-model="cell.backgroundColor" />
        </el-form-item>
        <el-form-item class="lef" label="文本颜色" prop="textColor">
          <ColorInput v-model="cell.textColor" />
        </el-form-item>
        <el-form-item :prop="`cell[${cellIndex}].placeholder`" label="提示文字">
          <el-input v-model="cell.placeholder" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item label="文本位置" prop="placeholderPosition">
          <el-radio-group v-model="cell!.placeholderPosition">
            <el-tooltip content="居左" placement="top">
              <el-radio-button value="left">
                <Icon icon="ant-design:align-left-outlined" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip content="居中" placement="top">
              <el-radio-button value="center">
                <Icon icon="ant-design:align-center-outlined" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="扫一扫" prop="showScan">
          <el-switch v-model="cell!.showScan" />
        </el-form-item>
        <el-form-item :prop="`cell[${cellIndex}].borderRadius`" label="圆角">
          <el-slider
            v-model="cell.borderRadius"
            :max="100"
            :min="0"
            :show-input-controls="false"
            input-size="small"
            show-input
          />
        </el-form-item>
      </template>
    </template>
  </template>
</template>

<script lang="ts" setup>
import { NavigationBarCellProperty } from '../config'
import { useVModel } from '@vueuse/core'
// 导航栏属性面板
defineOptions({ name: 'NavigationBarCellProperty' })

const props = withDefaults(
  defineProps<{
    modelValue: NavigationBarCellProperty[]
    isMp: boolean
  }>(),
  {
    modelValue: () => [],
    isMp: true
  }
)
const emit = defineEmits(['update:modelValue'])
const cellList = useVModel(props, 'modelValue', emit)

// 单元格数量：小程序6个（右侧胶囊按钮占了2个），其它平台8个
const cellCount = computed(() => (props.isMp ? 6 : 8))

// 选中的热区
const selectedHotAreaIndex = ref(0)
const handleHotAreaSelected = (cellValue: NavigationBarCellProperty, index: number) => {
  selectedHotAreaIndex.value = index
  // 默认设置为选中文字，并设置属性
  if (!cellValue.type) {
    cellValue.type = 'text'
    cellValue.textColor = '#111111'
  }
  // 如果点击的是搜索框，则初始化搜索框的属性
  if (cellValue.type === 'search') {
    cellValue.placeholderPosition = 'left'
    cellValue.backgroundColor = '#EEEEEE'
    cellValue.textColor = '#969799'
  }
}
</script>

<style lang="scss" scoped></style>
