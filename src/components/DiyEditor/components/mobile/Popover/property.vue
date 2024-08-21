<template>
  <el-form label-width="80px" :model="formData">
    <Draggable v-model="formData.list" :empty-item="{ showType: 'once' }">
      <template #default="{ element, index }">
        <el-form-item label="图片" :prop="`list[${index}].imgUrl`">
          <UploadImg v-model="element.imgUrl" height="56px" width="56px" />
        </el-form-item>
        <el-form-item label="跳转链接" :prop="`list[${index}].url`">
          <AppLinkInput v-model="element.url" />
        </el-form-item>
        <el-form-item label="显示次数" :prop="`list[${index}].showType`">
          <el-radio-group v-model="element.showType">
            <el-tooltip content="只显示一次，下次打开时不显示" placement="bottom">
              <el-radio label="once">一次</el-radio>
            </el-tooltip>
            <el-tooltip content="每次打开时都会显示" placement="bottom">
              <el-radio label="always">不限</el-radio>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
      </template>
    </Draggable>
  </el-form>
</template>

<script setup lang="ts">
import { PopoverProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 弹窗广告属性面板
defineOptions({ name: 'PopoverProperty' })

const props = defineProps<{ modelValue: PopoverProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
