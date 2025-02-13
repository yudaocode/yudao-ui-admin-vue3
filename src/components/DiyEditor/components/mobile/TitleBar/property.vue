<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form :model="formData" :rules="rules" label-width="85px">
      <el-card class="property-group" header="风格" shadow="never">
        <el-form-item label="标题位置" prop="textAlign">
          <el-radio-group v-model="formData!.textAlign">
            <el-tooltip content="居左" placement="top">
              <el-radio-button value="left">
                <Icon icon="ant-design:align-left-outlined" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip content="居中" placement="top">
              <el-radio-button value="center">
                <Icon icon="ant-design:align-center-outlined" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
      </el-card>
      <el-card class="property-group" header="主标题" shadow="never">
        <el-form-item label="文字" label-width="40px" prop="title">
          <InputWithColor
            v-model="formData.title"
            v-model:color="formData.titleColor"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="大小" label-width="40px" prop="titleSize">
          <el-slider
            v-model="formData.titleSize"
            :max="60"
            :min="10"
            input-size="small"
            show-input
          />
        </el-form-item>
        <el-form-item label="粗细" label-width="40px" prop="titleWeight">
          <el-slider
            v-model="formData.titleWeight"
            :max="900"
            :min="100"
            :step="100"
            input-size="small"
            show-input
          />
        </el-form-item>
      </el-card>
      <el-card class="property-group" header="副标题" shadow="never">
        <el-form-item label="文字" label-width="40px" prop="description">
          <InputWithColor
            v-model="formData.description"
            v-model:color="formData.descriptionColor"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="大小" label-width="40px" prop="descriptionSize">
          <el-slider
            v-model="formData.descriptionSize"
            :max="60"
            :min="10"
            input-size="small"
            show-input
          />
        </el-form-item>
        <el-form-item label="粗细" label-width="40px" prop="descriptionWeight">
          <el-slider
            v-model="formData.descriptionWeight"
            :max="900"
            :min="100"
            :step="100"
            input-size="small"
            show-input
          />
        </el-form-item>
      </el-card>
      <el-card class="property-group" header="查看更多" shadow="never">
        <el-form-item label="是否显示" prop="more.show">
          <el-checkbox v-model="formData.more.show" />
        </el-form-item>
        <!-- 更多按钮的 样式选择 -->
        <template v-if="formData.more.show">
          <el-form-item label="样式" prop="more.type">
            <el-radio-group v-model="formData.more.type">
              <el-radio value="text">文字</el-radio>
              <el-radio value="icon">图标</el-radio>
              <el-radio value="all">文字+图标</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-show="formData.more.type !== 'icon'" label="更多文字" prop="more.text">
            <el-input v-model="formData.more.text" />
          </el-form-item>
          <el-form-item label="跳转链接" prop="more.url">
            <AppLinkInput v-model="formData.more.url" />
          </el-form-item>
        </template>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
</template>
<script lang="ts" setup>
import { TitleBarProperty } from './config'
import { useVModel } from '@vueuse/core'
// 导航栏属性面板
defineOptions({ name: 'TitleBarProperty' })

const props = defineProps<{ modelValue: TitleBarProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)

// 表单校验
const rules = {}
</script>

<style lang="scss" scoped></style>
