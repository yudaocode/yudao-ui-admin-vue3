<template>
  <form-create v-bind="attrs">
    <!-- 保障 form-create 的原始插槽 -->
    <template v-for="(_, name) in slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}"></slot>
    </template>
    <!--  使用项目重新封装的文件上传组件实现文件上载  -->
    <template #type-upload="scope">
      <!--      {{ logC(scope) }}-->
      <template v-if="scope.prop.props.uploadType === 'file'">
        <!-- TODO puhui999: 考虑是否使用属性透传直接把整个 scope.prop.props 传递给组件 -->
        <UploadFile
          :disabled="scope.prop.props.disabled"
          :limit="scope.prop.props.limit"
          :modelValue="scope.model.value || scope.prop.value"
          @update:modelValue="(val) => setValue(scope, val)"
        />
      </template>
      <template v-if="scope.prop.props.uploadType === 'image' && scope.prop.props.limit === 1">
        <UploadImg
          :disabled="scope.prop.props.disabled"
          :modelValue="scope.model.value || scope.prop.value"
          @update:modelValue="(val) => setValue(scope, val)"
        />
      </template>
      <template v-if="scope.prop.props.uploadType === 'image' && scope.prop.props.limit > 1">
        <UploadImgs
          :disabled="scope.prop.props.disabled"
          :limit="scope.prop.props.limit"
          :modelValue="scope.model.value || scope.prop.value"
          @update:modelValue="(val) => setValue(scope, val)"
        />
      </template>
    </template>
  </form-create>
</template>

<script lang="ts" setup>
defineOptions({ name: 'MyFormCreate' })
const attrs = useAttrs()
const slots = useSlots()

// 测试使用，查看组件 scope 值
// const logC = (s) => {
//   console.log(s)
// }

// 设置表单值
const setValue = (scope: any, value: any) => {
  const obj = {}
  obj[scope.prop.field] = value
  scope.api.setValue(obj)
}
</script>
