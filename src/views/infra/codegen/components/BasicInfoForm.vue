<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="表名称" prop="tableName">
          <el-input placeholder="请输入仓库名称" v-model="formData.tableName" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="表描述" prop="tableComment">
          <el-input placeholder="请输入" v-model="formData.tableComment" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="className">
          <template #label>
            <span>
              实体类名称
              <el-tooltip
                content="默认去除表名的前缀。如果存在重复，则需要手动添加前缀，避免 MyBatis 报 Alias 重复的问题。"
                placement="top"
              >
                <Icon icon="ep:question-filled" class="" />
              </el-tooltip>
            </span>
          </template>

          <el-input placeholder="请输入" v-model="formData.className" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="作者" prop="author">
          <el-input placeholder="请输入" v-model="formData.author" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" :rows="3" v-model="formData.remark" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script setup lang="ts">
import { CodegenTableVO } from '@/api/infra/codegen/types'
import { PropType } from 'vue'

const emits = defineEmits(['update:basicInfo'])
const props = defineProps({
  table: {
    type: Object as PropType<Nullable<CodegenTableVO>>,
    default: () => null
  }
})

const formRef = ref()
const formData = ref({
  tableName: '',
  tableComment: '',
  className: '',
  author: '',
  remark: ''
})

const rules = reactive({
  tableName: [required],
  tableComment: [required],
  className: [required],
  author: [required]
})

watch(
  () => props.table,
  (table) => {
    if (!table) return
    formData.value = table
  },
  {
    deep: true,
    immediate: true
  }
)
watch(
  () => formData.value,
  (val) => {
    emits('update:basicInfo', val)
  }
)
defineExpose({
  validate: async () => unref(formRef)?.validate()
})
</script>
