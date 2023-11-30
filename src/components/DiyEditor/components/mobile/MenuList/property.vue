<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-text tag="p"> 菜单设置 </el-text>
    <el-text type="info" size="small"> 拖动左侧的小圆点可以调整顺序 </el-text>

    <!-- 表单 -->
    <el-form label-width="60px" :model="formData" class="m-t-8px">
      <div v-if="formData.list.length">
        <VueDraggable
          :list="formData.list"
          item-key="index"
          handle=".drag-icon"
          :forceFallback="true"
          :animation="200"
        >
          <template #item="{ element, index }">
            <div class="mb-4px flex flex-col gap-4px rounded bg-gray-100 p-8px">
              <div class="flex flex-row justify-between">
                <Icon icon="ic:round-drag-indicator" class="drag-icon cursor-move" />
                <Icon icon="ep:delete" class="text-red-500" @click="handleDeleteMenu(index)" />
              </div>
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
            </div>
          </template>
        </VueDraggable>
      </div>
      <el-form-item label-width="0">
        <el-button @click="handleAddMenu" type="primary" plain class="m-t-8px w-full">
          <Icon icon="ep:plus" class="mr-5px" /> 添加菜单
        </el-button>
      </el-form-item>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import VueDraggable from 'vuedraggable'
import { usePropertyForm } from '@/components/DiyEditor/util'
import {
  EMPTY_MENU_LIST_ITEM_PROPERTY,
  MenuListProperty
} from '@/components/DiyEditor/components/mobile/MenuList/config'
import { cloneDeep } from 'lodash-es'

/** 列表导航属性面板 */
defineOptions({ name: 'MenuListProperty' })

const props = defineProps<{ modelValue: MenuListProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

/* 添加菜单 */
const handleAddMenu = () => {
  formData.value.list.push(cloneDeep(EMPTY_MENU_LIST_ITEM_PROPERTY))
}
/* 删除菜单 */
const handleDeleteMenu = (index: number) => {
  formData.value.list.splice(index, 1)
}
</script>

<style scoped lang="scss"></style>
