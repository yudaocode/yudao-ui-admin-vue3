<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form label-width="85px" :model="formData" :rules="rules">
      <el-card header="风格" class="property-group" shadow="never">
        <el-form-item label="背景图片" prop="bgImgUrl">
          <UploadImg v-model="formData.bgImgUrl" width="100%" height="40px">
            <template #tip>建议尺寸 750*80</template>
          </UploadImg>
        </el-form-item>
        <el-form-item label="标题位置" prop="textAlign">
          <el-radio-group v-model="formData!.textAlign">
            <el-tooltip content="居左" placement="top">
              <el-radio-button label="left">
                <Icon icon="ant-design:align-left-outlined" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip content="居中" placement="top">
              <el-radio-button label="center">
                <Icon icon="ant-design:align-center-outlined" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
      </el-card>
      <el-card header="主标题" class="property-group" shadow="never">
        <el-form-item label="文字" prop="title" label-width="40px">
          <InputWithColor
            v-model="formData.title"
            v-model:color="formData.titleColor"
            show-word-limit
            maxlength="20"
          />
        </el-form-item>
        <el-form-item label="大小" prop="titleSize" label-width="40px">
          <el-slider
            v-model="formData.titleSize"
            :max="60"
            :min="10"
            show-input
            input-size="small"
          />
        </el-form-item>
        <el-form-item label="粗细" prop="titleWeight" label-width="40px">
          <el-slider
            v-model="formData.titleWeight"
            :min="100"
            :max="900"
            :step="100"
            show-input
            input-size="small"
          />
        </el-form-item>
      </el-card>
      <el-card header="副标题" class="property-group" shadow="never">
        <el-form-item label="文字" prop="description" label-width="40px">
          <InputWithColor
            v-model="formData.description"
            v-model:color="formData.descriptionColor"
            show-word-limit
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="大小" prop="descriptionSize" label-width="40px">
          <el-slider
            v-model="formData.descriptionSize"
            :max="60"
            :min="10"
            show-input
            input-size="small"
          />
        </el-form-item>
        <el-form-item label="粗细" prop="descriptionWeight" label-width="40px">
          <el-slider
            v-model="formData.descriptionWeight"
            :min="100"
            :max="900"
            :step="100"
            show-input
            input-size="small"
          />
        </el-form-item>
      </el-card>
      <el-card header="查看更多" class="property-group" shadow="never">
        <el-form-item label="是否显示" prop="more.show">
          <el-checkbox v-model="formData.more.show" />
        </el-form-item>
        <!-- 更多按钮的 样式选择 -->
        <template v-if="formData.more.show">
          <el-form-item label="样式" prop="more.type">
            <el-radio-group v-model="formData.more.type">
              <el-radio label="text">文字</el-radio>
              <el-radio label="icon">图标</el-radio>
              <el-radio label="all">文字+图标</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="更多文字" prop="more.text" v-show="formData.more.type !== 'icon'">
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
<script setup lang="ts">
import { TitleBarProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
// 导航栏属性面板
defineOptions({ name: 'TitleBarProperty' })

const props = defineProps<{ modelValue: TitleBarProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

// 表单校验
const rules = {}
</script>

<style scoped lang="scss"></style>
