<template>
  <el-form ref="formRef" :model="modelData" :rules="rules" label-width="120px" class="mt-20px">
    <el-form-item :label="t('bpm.model.form.formType')" prop="formType" class="mb-20px">
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
    <el-form-item 
      v-if="modelData.formType === BpmModelFormType.NORMAL" 
      :label="t('bpm.model.form.processForm')" 
      prop="formId"
    >
      <el-select v-model="modelData.formId" clearable style="width: 100%">
        <el-option v-for="formItem in formList" :key="formItem.id" :label="formItem.name" :value="formItem.id" />
      </el-select>
    </el-form-item>
    <el-form-item 
      v-if="modelData.formType === BpmModelFormType.CUSTOM" 
      :label="t('bpm.model.form.formSubmitPath')" 
      prop="formCustomCreatePath"
    >
      <el-input
        v-model="modelData.formCustomCreatePath"
        :placeholder="t('bpm.model.form.enterFormSubmitPath')"
        style="width: 330px"
      />
      <el-tooltip
        class="item"
        :content="t('bpm.model.form.customFormSubmitPathTip')"
        effect="light"
        placement="top"
      >
        <Icon icon="ep:question" class="ml-5px" />
      </el-tooltip>
    </el-form-item>
    <el-form-item 
      v-if="modelData.formType === BpmModelFormType.CUSTOM" 
      :label="t('bpm.model.form.formViewPath')" 
      prop="formCustomViewPath"
    >
      <el-input
        v-model="modelData.formCustomViewPath"
        :placeholder="t('bpm.model.form.enterFormViewPath')"
        style="width: 330px"
      />
      <el-tooltip
        class="item"
        :content="t('bpm.model.form.customFormViewPathTip')"
        effect="light"
        placement="top"
      >
        <Icon icon="ep:question" class="ml-5px" />
      </el-tooltip>
    </el-form-item>
    <!-- Form Preview -->
    <div
      v-if="modelData.formType === BpmModelFormType.NORMAL && modelData.formId && formPreview.rule.length > 0"
      class="mt-20px"
    >
      <div class="flex items-center mb-15px">
        <div class="h-15px w-4px bg-[#1890ff] mr-10px"></div>
        <span class="text-15px font-bold">{{ t('bpm.model.form.formPreview') }}</span>
      </div>
      <form-create
        v-model="formPreview.formData"
        :rule="formPreview.rule"
        :option="formPreview.option"
      />
    </div>
  </el-form>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as FormApi from '@/api/bpm/form'
import { setConfAndFields2 } from '@/utils/formCreate'
import { BpmModelFormType } from '@/utils/constants'

const { t } = useI18n() // Initialize i18n translation function

const props = defineProps({
  formList: {
    type: Array,
    required: true
  }
})

const formRef = ref()

// Create local data copy
const modelData = defineModel<any>()

// Form preview data
const formPreview = ref({
  formData: {},
  rule: [],
  option: {
    submitBtn: false,
    resetBtn: false,
    formData: {}
  }
})

// Watch form ID changes to load form data
watch(
  () => modelData.value.formId,
  async (newFormId) => {
    if (newFormId && modelData.value.formType === BpmModelFormType.NORMAL) {
      const data = await FormApi.getForm(newFormId)
      setConfAndFields2(formPreview.value, data.conf, data.fields)
      // Set readonly
      formPreview.value.rule.forEach((item: any) => {
        item.props = { ...item.props, disabled: true }
      })
    } else {
      formPreview.value.rule = []
    }
  },
  { immediate: true }
)

const rules = {
  formType: [{ required: true, message: t('bpm.model.form.formTypeRequired'), trigger: 'blur' }],
  formId: [{ required: true, message: t('bpm.model.form.processFormRequired'), trigger: 'blur' }],
  formCustomCreatePath: [{ required: true, message: t('bpm.model.form.formSubmitPathRequired'), trigger: 'blur' }],
  formCustomViewPath: [{ required: true, message: t('bpm.model.form.formViewPathRequired'), trigger: 'blur' }]
}

/** Form validation */
const validate = async () => {
  await formRef.value?.validate()
}

defineExpose({
  validate
})
</script>
