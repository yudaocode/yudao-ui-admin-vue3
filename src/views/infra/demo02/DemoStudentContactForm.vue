<template>
  <el-table :data="formData" :stripe="true" class="-mt-10px">
    <el-table-column label="序号" type="index" width="60" />
    <el-table-column label="名字" prop="name" width="300">
      <template #default="scope">
        <el-form-item label-width="0px" :inline-message="true" class="mb-0px!">
          <el-input v-model="scope.row.name" placeholder="请输入名字" />
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column label="手机号码">
      <template #default="{ row, $index }">
        <el-form-item
          label-width="0px"
          :prop="`demoStudentContactList.${$index}.mobile`"
          :rules="formRules.mobile"
          :inline-message="true"
          class="mb-0px!"
        >
          <el-input type="number" placeholder="输入手机号码" v-model="row.mobile" />
        </el-form-item>
      </template>
    </el-table-column>
    <el-table-column align="center" fixed="right" label="操作" width="60">
      <template #default="{ $index }">
        <el-button @click="handleRemove($index)" link>—</el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-row justify="center" class="mt-3">
    <el-button @click="handleAdd" round>+ 添加联系人</el-button>
  </el-row>
</template>
<script setup lang="ts">
const props = defineProps<{
  formData: any[]
}>()
// const formData = ref([
//   {
//     name: '芋艿',
//     mobile: '15601691300'
//   },
//   {
//     name: '土豆',
//     mobile: '15601691234'
//   }
// ])
const formRules = reactive({
  mobile: [required]
})

/** 新增按钮操作 */
const emit = defineEmits(['update:formData'])
const handleAdd = () => {
  emit('update:formData', [
    ...props.formData,
    {
      name: '土豆'
    }
  ])
}

/** 删除按钮操作 */
const handleRemove = (index) => {
  const formData = props.formData.filter((_, i) => i !== index)
  emit('update:formData', formData)
}
</script>
