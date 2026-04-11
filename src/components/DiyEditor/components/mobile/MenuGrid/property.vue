<template>
  <ComponentContainerProperty v-model="formData.style">
    <!-- 表单 -->
    <el-form label-width="80px" :model="formData" class="m-t-8px">
      <el-form-item label="每行数量" prop="column">
        <el-radio-group v-model="formData.column">
          <el-radio :value="3">3个</el-radio>
          <el-radio :value="4">4个</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-card header="菜单设置" class="property-group" shadow="never">
        <Draggable v-model="formData.list" :empty-item="EMPTY_MENU_GRID_ITEM_PROPERTY">
          <template #default="{ element }">
            <el-form-item label="图标" prop="iconUrl">
              <UploadImg v-model="element.iconUrl" height="80px" width="80px">
                <template #tip> 建议尺寸：44 * 44 </template>
              </UploadImg>
            </el-form-item>
            <el-form-item label="标题" prop="title">
              <InputWithColor v-model="element.title" v-model:color="element.titleColor" />
            </el-form-item>
            <el-form-item label="副标题" prop="subtitle">
              <InputWithColor v-model="element.subtitle" v-model:color="element.subtitleColor" />
            </el-form-item>
            <el-form-item label="链接" prop="url">
              <AppLinkInput v-model="element.url" />
            </el-form-item>
            <el-form-item label="显示角标" prop="badge.show">
              <el-switch v-model="element.badge.show" />
            </el-form-item>
            <template v-if="element.badge.show">
              <el-form-item label="角标内容" prop="badge.text">
                <InputWithColor
                  v-model="element.badge.text"
                  v-model:color="element.badge.textColor"
                />
              </el-form-item>
              <el-form-item label="背景颜色" prop="badge.bgColor">
                <ColorInput v-model="element.badge.bgColor" />
              </el-form-item>
            </template>
          </template>
        </Draggable>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import {
  EMPTY_MENU_GRID_ITEM_PROPERTY,
  MenuGridProperty
} from '@/components/DiyEditor/components/mobile/MenuGrid/config'

/** 宫格导航属性面板 */
defineOptions({ name: 'MenuGridProperty' })

const props = defineProps<{ modelValue: MenuGridProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)
</script>

<style scoped lang="scss"></style>
