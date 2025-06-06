<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-text tag="p"> 菜单设置 </el-text>
    <el-text type="info" size="small"> 拖动左侧的小圆点可以调整顺序 </el-text>

    <!-- 表单 -->
    <el-form label-width="60px" :model="formData" class="m-t-8px">
      <Draggable v-model="formData.list" :empty-item="EMPTY_MENU_LIST_ITEM_PROPERTY">
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
        </template>
      </Draggable>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import {
  EMPTY_MENU_LIST_ITEM_PROPERTY,
  MenuListProperty
} from '@/components/DiyEditor/components/mobile/MenuList/config'

/** 列表导航属性面板 */
defineOptions({ name: 'MenuListProperty' })

const props = defineProps<{ modelValue: MenuListProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)
</script>

<style scoped lang="scss"></style>
