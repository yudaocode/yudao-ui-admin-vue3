<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="表名称" prop="tableName">
          <el-input v-model="formData.tableName" placeholder="请输入仓库名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="表描述" prop="tableComment">
          <el-input v-model="formData.tableComment" placeholder="请输入" />
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
                <Icon class="" icon="ep:question-filled" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="formData.className" placeholder="请输入" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="作者" prop="author">
          <el-input v-model="formData.author" placeholder="请输入" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" :rows="3" type="textarea" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import * as CodegenApi from '@/api/infra/codegen'
import { PropType } from 'vue'

defineOptions({ name: 'InfraCodegenBasicInfoForm' })

const props = defineProps({
  table: {
    type: Object as PropType<Nullable<CodegenApi.CodegenTableVO>>,
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

/** 监听 table 属性，复制给 formData 属性 */
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

defineExpose({
  validate: async () => unref(formRef)?.validate()
})
</script>
