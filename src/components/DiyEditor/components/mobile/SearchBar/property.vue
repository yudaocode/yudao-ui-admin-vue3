<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-text tag="p"> 搜索热词 </el-text>
    <el-text type="info" size="small"> 拖动左侧的小圆点可以调整热词顺序 </el-text>

    <!-- 表单 -->
    <el-form label-width="80px" :model="formData" class="m-t-8px">
      <div v-if="formData.hotKeywords.length">
        <VueDraggable
          :list="formData.hotKeywords"
          item-key="index"
          handle=".drag-icon"
          :forceFallback="true"
          :animation="200"
        >
          <template #item="{ index }">
            <div class="mb-4px flex flex-row items-center gap-4px rounded bg-gray-100 p-8px">
              <Icon icon="ic:round-drag-indicator" class="drag-icon cursor-move" />
              <el-input v-model="formData.hotKeywords[index]" placeholder="请输入热词" />
              <Icon icon="ep:delete" class="text-red-500" @click="deleteHotWord(index)" />
            </div>
          </template>
        </VueDraggable>
      </div>
      <el-form-item label-width="0">
        <el-button @click="handleAddHotWord" type="primary" plain class="m-t-8px w-full">
          添加热词
        </el-button>
      </el-form-item>
      <el-form-item label="框体样式">
        <el-radio-group v-model="formData!.borderRadius">
          <el-tooltip content="方形" placement="top">
            <el-radio-button :label="0">
              <Icon icon="tabler:input-search" />
            </el-radio-button>
          </el-tooltip>
          <el-tooltip content="圆形" placement="top">
            <el-radio-button :label="10">
              <Icon icon="iconoir:input-search" />
            </el-radio-button>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="提示文字" prop="placeholder">
        <el-input v-model="formData.placeholder" />
      </el-form-item>
      <el-form-item label="文本位置" prop="placeholderPosition">
        <el-radio-group v-model="formData!.placeholderPosition">
          <el-tooltip content="居左" placement="top">
            <el-radio-button label="left">
              <Icon icon="ant-design:align-left-outlined" />
            </el-radio-button>
          </el-tooltip>
          <el-tooltip content="居中" placement="top">
            <el-radio-button label="center">
              <Icon icon="ant-design:align-center-outlined" />
            </el-radio-button>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="扫一扫" prop="showScan">
        <el-switch v-model="formData!.showScan" />
      </el-form-item>
      <el-form-item label="框体高度" prop="height">
        <el-slider v-model="formData!.height" :max="50" :min="28" show-input input-size="small" />
      </el-form-item>
      <el-form-item label="框体颜色" prop="backgroundColor">
        <ColorInput v-model="formData.backgroundColor" />
      </el-form-item>
      <el-form-item class="lef" label="文本颜色" prop="textColor">
        <ColorInput v-model="formData.textColor" />
      </el-form-item>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import VueDraggable from 'vuedraggable'
import { usePropertyForm } from '@/components/DiyEditor/util'
import { SearchProperty } from '@/components/DiyEditor/components/mobile/SearchBar/config'

/** 搜索框属性面板 */
defineOptions({ name: 'SearchProperty' })

const props = defineProps<{ modelValue: SearchProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

/* 添加热词 */
const handleAddHotWord = () => {
  formData.value.hotKeywords.push('')
}
/* 删除热词 */
const deleteHotWord = (index: number) => {
  formData.value.hotKeywords.splice(index, 1)
}
</script>

<style scoped lang="scss"></style>
