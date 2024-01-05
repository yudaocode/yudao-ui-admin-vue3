<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form label-width="80px" :model="formData" :rules="rules">
      <el-form-item label="公告图标" prop="iconUrl">
        <UploadImg v-model="formData.iconUrl" height="48px">
          <template #tip>建议尺寸：24 * 24</template>
        </UploadImg>
      </el-form-item>
      <el-form-item label="背景颜色" prop="backgroundColor">
        <ColorInput v-model="formData.backgroundColor" />
      </el-form-item>
      <el-form-item label="文字颜色" prop="文字颜色">
        <ColorInput v-model="formData.textColor" />
      </el-form-item>
      <el-card header="公告内容" class="property-group" shadow="never">
        <Draggable v-model="formData.contents">
          <template #default="{ element }">
            <el-form-item label="公告" prop="text" label-width="40px">
              <el-input v-model="element.text" placeholder="请输入公告" />
            </el-form-item>
            <el-form-item label="链接" prop="url" label-width="40px">
              <AppLinkInput v-model="element.url" />
            </el-form-item>
          </template>
        </Draggable>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { NoticeBarProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
// 通知栏属性面板
defineOptions({ name: 'NoticeBarProperty' })
// 表单校验
const rules = {
  content: [{ required: true, message: '请输入公告', trigger: 'blur' }]
}

const props = defineProps<{ modelValue: NoticeBarProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
