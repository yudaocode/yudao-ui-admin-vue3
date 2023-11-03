<template>
  <div class="tab-bar">
    <!-- 表单 -->
    <el-form :model="formData" label-width="80px">
      <el-form-item label="主题" prop="theme">
        <el-select v-model="formData!.theme" @change="handleThemeChange">
          <el-option
            v-for="(theme, index) in THEME_LIST"
            :key="index"
            :label="theme.name"
            :value="theme.id"
          >
            <template #default>
              <div class="flex items-center justify-between">
                <Icon :icon="theme.icon" :color="theme.color" />
                <span>{{ theme.name }}</span>
              </div>
            </template>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="默认颜色">
        <ColorInput v-model="formData!.style.color" />
      </el-form-item>
      <el-form-item label="选中颜色">
        <ColorInput v-model="formData!.style.activeColor" />
      </el-form-item>
      <el-form-item label="导航背景">
        <el-radio-group v-model="formData!.style.bgType">
          <el-radio-button label="color">纯色</el-radio-button>
          <el-radio-button label="img">图片</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="选择颜色" v-if="formData!.style.bgType === 'color'">
        <ColorInput v-model="formData!.style.bgColor" />
      </el-form-item>
      <el-form-item label="选择图片" v-if="formData!.style.bgType === 'img'">
        <UploadImg v-model="formData!.style.bgImg" width="100%" height="50px" class="min-w-200px">
          <template #tip> 建议尺寸 375 * 50 </template>
        </UploadImg>
      </el-form-item>

      <el-text tag="p">图标设置</el-text>
      <el-text type="info" size="small"> 拖动左上角的小圆点可对其排序, 图标建议尺寸 44*44 </el-text>
      <draggable
        :list="formData!.items"
        item-key="index"
        :forceFallback="true"
        :animation="200"
        handle=".drag-icon"
        class="m-t-8px"
      >
        <template #item="{ element, index }">
          <div class="mb-4px flex flex-row gap-4px rounded bg-gray-100 p-8px">
            <div class="flex flex-col items-start justify-between">
              <Icon icon="ic:round-drag-indicator" class="drag-icon cursor-move" />
              <Icon
                icon="ep:delete"
                class="cursor-pointer text-red-5"
                @click="handleDeleteItem(index)"
                v-if="formData.items.length > 1"
              />
            </div>
            <div class="w-full flex flex-col">
              <div class="m-b-8px flex items-center justify-around">
                <div class="flex flex-col items-center justify-between">
                  <UploadImg
                    v-model="element.iconUrl"
                    width="40px"
                    height="40px"
                    :show-delete="false"
                    :show-btn-text="false"
                  />
                  <el-text size="small">默认图片</el-text>
                </div>
                <div>
                  <UploadImg
                    v-model="element.activeIconUrl"
                    width="40px"
                    height="40px"
                    :show-delete="false"
                    :show-btn-text="false"
                  />
                  <el-text>选中图片</el-text>
                </div>
              </div>
              <el-form-item prop="text" label-width="0" class="m-b-8px!">
                <el-input v-model="element.text" placeholder="请输入文字" />
              </el-form-item>
              <el-form-item prop="url" label-width="0" class="m-b-0!">
                <el-input v-model="element.url" placeholder="请选择链接" />
              </el-form-item>
            </div>
          </div>
        </template>
      </draggable>

      <el-form-item label-width="0">
        <!-- 添加导航按钮 -->
        <el-tooltip content="最多添加5个">
          <el-button
            @click="handleAddItem"
            class="m-b-16px w-full"
            type="primary"
            plain
            :disabled="formData!.items.length >= 5"
          >
            添加导航
          </el-button>
        </el-tooltip>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable' //拖拽组件
import { TabBarItemProperty, TabBarProperty, THEME_LIST } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
// 底部导航栏
defineOptions({ name: 'TabBarProperty' })

const props = defineProps<{ modelValue: TabBarProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

/** 添加导航项 */
const handleAddItem = () => {
  formData?.value?.items?.push({} as TabBarItemProperty)
}
/** 删除导航项 */
const handleDeleteItem = (index: number) => {
  formData?.value?.items?.splice(index, 1)
}

// 要的主题
const handleThemeChange = () => {
  const theme = THEME_LIST.find((theme) => theme.id === formData.value.theme)
  if (theme?.color) {
    formData.value.style.activeColor = theme.color
  }
}
</script>

<style lang="scss" scoped></style>
