<template>
  <el-form ref="formRef" :model="modelData" :rules="formRules" label-width="120px">
    <el-row>
      <el-col :span="24">
        <el-form-item label="流程标识" prop="code">
          <el-input v-model="modelData.code" placeholder="请输入流程标识" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="流程名称" prop="name">
          <el-input v-model="modelData.name" placeholder="请输入流程名称" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="状态" prop="status">
          <el-select v-model="modelData.status" placeholder="请选择状态">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="modelData.remark" :rows="2" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import { FormRules } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

const modelData = defineModel<any>()

const formRef = ref() // 表单 Ref
const formRules = reactive<FormRules>({
  code: [{ required: true, message: '流程标识不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

/** 表单校验 */
const validate = async () => {
  await formRef.value?.validate()
}
defineExpose({
  validate
})
</script>
