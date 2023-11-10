<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="100px"
    v-loading="formLoading"
  >
    <el-form-item label="子字段 1" prop="field1">
      <el-input v-model="formData.field1" placeholder="请输入字段 1" />
    </el-form-item>
    <el-form-item label="子字段 2" prop="field2">
      <el-input v-model="formData.field2" placeholder="请输入字段 2" />
    </el-form-item>
    <el-form-item label="子字段 3" prop="field3">
      <el-input v-model="formData.field3" placeholder="请输入字段 3" />
    </el-form-item>
  </el-form>
</template>
<script setup lang="ts">
const props = defineProps<{
  studentId: undefined // 学生编号
}>()
const formLoading = ref(false) // 表单的加载中
const formData = ref({})
const formRules = reactive({
  field1: [required]
})
const formRef = ref() // 表单 Ref

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  (val) => {
    if (val) {
      formData.value = {
        field2: '番茄',
        field3: '西瓜'
      }
    } else {
      formData.value = {}
    }
  },
  { immediate: true }
)

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}

/** 表单值 **/
const getData = () => {
  return formData.value
}

defineExpose({ validate, getData })
</script>
