<template>
  <ComponentContainerProperty v-model="formData.style">
    <!-- 表单 -->
    <el-form label-width="80px" :model="formData" class="m-t-8px">
      <el-form-item label="布局" prop="layout">
        <el-radio-group v-model="formData.layout">
          <el-radio label="iconText">图标+文字</el-radio>
          <el-radio label="icon">仅图标</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="行数" prop="row">
        <el-radio-group v-model="formData.row">
          <el-radio :label="1">1行</el-radio>
          <el-radio :label="2">2行</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="列数" prop="column">
        <el-radio-group v-model="formData.column">
          <el-radio :label="3">3列</el-radio>
          <el-radio :label="4">4列</el-radio>
          <el-radio :label="5">5列</el-radio>
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
                  <template #tip> 建议尺寸：98 * 98 </template>
                </UploadImg>
              </el-form-item>
              <el-form-item label="标题" prop="title">
                <InputWithColor v-model="element.title" v-model:color="element.titleColor" />
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
  EMPTY_MENU_SWIPER_ITEM_PROPERTY,
  MenuSwiperProperty
} from '@/components/DiyEditor/components/mobile/MenuSwiper/config'
import { cloneDeep } from 'lodash-es'

/** 菜单导航属性面板 */
defineOptions({ name: 'MenuSwiperProperty' })

const props = defineProps<{ modelValue: MenuSwiperProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

/* 添加菜单 */
const handleAddMenu = () => {
  formData.value.list.push(cloneDeep(EMPTY_MENU_SWIPER_ITEM_PROPERTY))
}
/* 删除菜单 */
const handleDeleteMenu = (index: number) => {
  formData.value.list.splice(index, 1)
}
</script>

<style scoped lang="scss"></style>
