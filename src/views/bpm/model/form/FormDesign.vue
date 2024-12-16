<template>
  <el-form
    ref="formRef"
    :model="modelData"
    :rules="rules"
    label-width="120px"
    class="mt-20px"
  >
    <el-form-item label="表单类型" prop="formType" class="mb-20px">
      <el-radio-group v-model="modelData.formType">
        <el-radio
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_FORM_TYPE)"
          :key="dict.value"
          :value="dict.value"
        >
          {{ dict.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="modelData.formType === 10" label="流程表单" prop="formId">
      <el-select v-model="modelData.formId" clearable style="width: 100%">
        <el-option
          v-for="form in formList"
          :key="form.id"
          :label="form.name"
          :value="form.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="modelData.formType === 20"
      label="表单提交路由"
      prop="formCustomCreatePath"
    >
      <el-input
        v-model="modelData.formCustomCreatePath"
        placeholder="请输入表单提交路由"
        style="width: 330px"
      />
      <el-tooltip
        class="item"
        content="自定义表单的提交路径，使用 Vue 的路由地址，例如说：bpm/oa/leave/create.vue"
        effect="light"
        placement="top"
      >
        <Icon icon="ep:question" class="ml-5px" />
      </el-tooltip>
    </el-form-item>
    <el-form-item
      v-if="modelData.formType === 20"
      label="表单查看地址"
      prop="formCustomViewPath"
    >
      <el-input
        v-model="modelData.formCustomViewPath"
        placeholder="请输入表单查看的组件地址"
        style="width: 330px"
      />
      <el-tooltip
        class="item"
        content="自定义表单的查看组件地址，使用 Vue 的组件地址，例如说：bpm/oa/leave/detail.vue"
        effect="light"
        placement="top"
      >
        <Icon icon="ep:question" class="ml-5px" />
      </el-tooltip>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BpmModelFormType } from '@/utils/constants'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  formList: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const formRef = ref()

// 创建本地数据副本
const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const rules = {
  formType: [{ required: true, message: '表单类型不能为空', trigger: 'blur' }],
  formId: [{ required: true, message: '流程表单不能为空', trigger: 'blur' }],
  formCustomCreatePath: [{ required: true, message: '表单提交路由不能为空', trigger: 'blur' }],
  formCustomViewPath: [{ required: true, message: '表单查看地址不能为空', trigger: 'blur' }]
}

/** 表单校验 */
const validate = async () => {
  await formRef.value?.validate()
}

defineExpose({
  validate
})
</script> 