<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="模板名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入模板名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机关/公司名称" prop="authorityName">
            <el-input v-model="formData.authorityName" placeholder="请输入机关/公司名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="名称字号" prop="fontSize">
            <el-input-number v-model="formData.fontSize" :min="18" :max="72" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="字号前缀" prop="noPrefix">
            <el-input v-model="formData.noPrefix" placeholder="请输入字号前缀" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="印章图片" prop="sealPicUrl">
            <UploadImg v-model="formData.sealPicUrl!" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分隔线样式" prop="separatorType">
            <el-select
              v-model="formData.separatorType"
              placeholder="请选择分隔线样式"
              class="!w-1/1"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_SEPARATOR_TYPE)"
                :key="dict.value"
                :value="dict.value"
                :label="dict.label"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
                :label="dict.label"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              placeholder="请输入备注"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as TemplateApi from '@/api/oa/officialdoc/template'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { OaOfficialDocSeparatorType } from '@/views/oa/utils/constants'

import type { FormRules } from 'element-plus'

defineOptions({ name: 'OaOfficialDocTemplateForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<TemplateApi.OfficialDocTemplateVO>({
  id: undefined,
  name: '',
  authorityName: '',
  fontSize: 36,
  noPrefix: '',
  sealPicUrl: '',
  separatorType: OaOfficialDocSeparatorType.SINGLE,
  status: CommonStatusEnum.ENABLE,
  sort: 0,
  remark: ''
})
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  authorityName: [{ required: true, message: '机关/公司名称不能为空', trigger: 'blur' }],
  fontSize: [{ required: true, message: '名称字号不能为空', trigger: 'change' }],
  separatorType: [{ required: true, message: '分隔线样式不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await TemplateApi.getTemplate(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await TemplateApi.createTemplate(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await TemplateApi.updateTemplate(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    name: '',
    authorityName: '',
    fontSize: 36,
    noPrefix: '',
    sealPicUrl: '',
    separatorType: OaOfficialDocSeparatorType.SINGLE,
    status: CommonStatusEnum.ENABLE,
    sort: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
