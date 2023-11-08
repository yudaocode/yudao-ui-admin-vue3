<template>
  <el-form label-width="80px" :model="formData" :rules="rules">
    <el-form-item label="页面标题" prop="title">
      <el-input v-model="formData!.title" placeholder="页面标题" maxlength="25" show-word-limit />
    </el-form-item>
    <el-form-item label="页面描述" prop="description">
      <el-input
        type="textarea"
        v-model="formData!.description"
        placeholder="用户通过微信分享给朋友时，会自动显示页面描述"
      />
    </el-form-item>
    <el-form-item label="样式" prop="styleType">
      <el-radio-group v-model="formData!.styleType">
        <el-radio label="default">默认</el-radio>
        <el-radio label="immersion">沉浸式</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="常驻显示" prop="alwaysShow" v-if="formData.styleType === 'immersion'">
      <el-radio-group v-model="formData!.alwaysShow">
        <el-radio :label="false">关闭</el-radio>
        <el-radio :label="true">开启</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="高度" prop="navBarHeight">
      <el-slider
        v-model="formData!.navBarHeight"
        :max="100"
        :min="35"
        show-input
        input-size="small"
      />
    </el-form-item>
    <el-form-item label="返回按钮" prop="showGoBack">
      <el-switch v-model="formData!.showGoBack" />
    </el-form-item>
    <el-form-item label="背景颜色" prop="backgroundColor">
      <ColorInput v-model="formData!.backgroundColor" />
    </el-form-item>
    <el-form-item label="背景图片" prop="backgroundImage">
      <UploadImg v-model="formData!.backgroundImage" :limit="1">
        <template #tip>建议宽度 750px</template>
      </UploadImg>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { NavigationBarProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
// 导航栏属性面板
defineOptions({ name: 'NavigationBarProperty' })
// 表单校验
const rules = {
  name: [{ required: true, message: '请输入页面名称', trigger: 'blur' }]
}

const props = defineProps<{ modelValue: NavigationBarProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
