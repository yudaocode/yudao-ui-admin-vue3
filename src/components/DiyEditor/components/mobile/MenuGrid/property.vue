<template>
  <ComponentContainerProperty v-model="formData.style">
    <!-- 表单 -->
    <el-form label-width="80px" :model="formData" class="m-t-8px">
      <el-form-item label="每行数量" prop="column">
        <el-radio-group v-model="formData.column">
          <el-radio :label="3">3个</el-radio>
          <el-radio :label="4">4个</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-text tag="p"> 菜单设置 </el-text>
      <el-text type="info" size="small"> 拖动左侧的小圆点可以调整顺序 </el-text>
      <template v-if="formData.list.length">
        <VueDraggable
          class="m-t-8px"
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
            </div>
          </template>
        </VueDraggable>
      </template>
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
  EMPTY_MENU_GRID_ITEM_PROPERTY,
  MenuGridProperty
} from '@/components/DiyEditor/components/mobile/MenuGrid/config'
import { cloneDeep } from 'lodash-es'

/** 宫格导航属性面板 */
defineOptions({ name: 'MenuGridProperty' })

const props = defineProps<{ modelValue: MenuGridProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

/* 添加菜单 */
const handleAddMenu = () => {
  formData.value.list.push(cloneDeep(EMPTY_MENU_GRID_ITEM_PROPERTY))
}
/* 删除菜单 */
const handleDeleteMenu = (index: number) => {
  formData.value.list.splice(index, 1)
}
</script>

<style scoped lang="scss"></style>
