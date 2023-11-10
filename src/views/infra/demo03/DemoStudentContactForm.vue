<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="0px"
    v-loading="formLoading"
    :inline-message="true"
  >
    <el-table :data="formData" class="-mt-10px">
      <el-table-column label="序号" type="index" width="100" />
      <el-table-column label="名字" prop="name" width="300">
        <template #default="row">
          <el-form-item class="mb-0px!">
            <el-input v-model="row.name" placeholder="请输入名字" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="手机号码">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.mobile`" :rules="formRules.mobile" class="mb-0px!">
            <el-input type="number" placeholder="输入手机号码" v-model="row.mobile" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60">
        <template #default="{ $index }">
          <el-button @click="handleDelete($index)" link>—</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
  <el-row justify="center" class="mt-3">
    <el-button @click="handleAdd" round>+ 添加联系人</el-button>
  </el-row>
</template>
<script setup lang="ts">
const props = defineProps<{
  studentId: undefined // 学生编号
}>()
const formLoading = ref(false) // 表单的加载中
const formData = ref([])
const formRules = reactive({
  mobile: [required]
})
const formRef = ref() // 表单 Ref

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  (val) => {
    if (val) {
      formData.value = [
        {
          name: '芋艿',
          mobile: '15601691300'
        }
      ]
    } else {
      formData.value = []
    }
  },
  { immediate: true }
)

/** 新增按钮操作 */
const handleAdd = () => {
  formData.value.push({
    name: '土豆'
  })
}

/** 删除按钮操作 */
const handleDelete = (index) => {
  formData.value.splice(index, 1)
}

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
