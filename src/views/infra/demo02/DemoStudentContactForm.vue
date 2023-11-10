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
      <el-table-column label="名字" prop="name" width="50">
        <template #default="row">
          <el-form-item class="mb-0px!">
            <el-input v-model="row.name" placeholder="请输入名字" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="手机号码" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.mobile`" :rules="formRules.mobile" class="mb-0px!">
            <el-input type="number" placeholder="输入手机号码" v-model="row.mobile" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.javaType`" :rules="formRules.javaType" class="mb-0px!">
            <el-select v-model="row.javaType">
              <el-option label="Long" value="Long" />
              <el-option label="String" value="String" />
              <el-option label="Integer" value="Integer" />
              <el-option label="Double" value="Double" />
              <el-option label="BigDecimal" value="BigDecimal" />
              <el-option label="LocalDateTime" value="LocalDateTime" />
              <el-option label="Boolean" value="Boolean" />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="多选" width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.sex`" :rules="formRules.sex" class="mb-0px!">
            <el-checkbox-group v-model="row.sex">
              <el-checkbox key="Long" label="Long">Long</el-checkbox>
              <el-checkbox key="String" label="String">String</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="图片上传" width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.pic`" :rules="formRules.pic" class="mb-0px!">
            <UploadImg v-model="row.pic" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="文件上传" width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.file`" :rules="formRules.file" class="mb-0px!">
            <UploadFile v-model="row.file" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="大输入框" width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.content`" :rules="formRules.content" class="mb-0px!">
            <el-input v-model="row.content" type="textarea" placeholder="请输入 content" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="HTML" width="1024">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.html`" :rules="formRules.html" class="mb-0px!">
            <Editor v-model="row.html" height="150px" />
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
  mobile: [required],
  javaType: [required],
  sex: [required],
  pic: [required]
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
          mobile: '15601691300',
          javaType: undefined,
          sex: [],
          pic: undefined,
          file: undefined
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
