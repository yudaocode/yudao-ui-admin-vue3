<!-- TODO puhui999: 没啥问题的话准备移除 -->
<template>
  <FcDesigner ref="designer" height="780px" />
</template>

<script lang="ts" setup>
import { useUploadFileRule, useUploadImgRule, useUploadImgsRule } from './config'

defineOptions({ name: 'MyFormCreateDesigner' })

const designer = ref() // 表单设计器
const uploadFileRule = useUploadFileRule()
const uploadImgRule = useUploadImgRule()
const uploadImgsRule = useUploadImgsRule()

onMounted(() => {
  // 移除自带的上传组件规则
  designer.value?.removeMenuItem('upload')
  const components = [uploadFileRule, uploadImgRule, uploadImgsRule]
  components.forEach((component) => {
    //插入组件规则
    designer.value?.addComponent(component)
    //插入拖拽按钮到`main`分类下
    designer.value?.appendMenuItem('main', {
      icon: component.icon,
      name: component.name,
      label: component.label
    })
  })
})
</script>

<style lang="scss" scoped></style>
