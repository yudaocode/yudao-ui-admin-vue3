<!-- MES 缺陷类型表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="缺陷编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入缺陷编码">
          <template #append>
            <el-button @click="generateCode" :disabled="formType === 'update'">
              生成
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="缺陷描述" prop="name">
        <el-input type="textarea" v-model="formData.name" placeholder="请输入缺陷描述" />
      </el-form-item>
      <el-form-item label="检测项类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请选择检测项类型"
          clearable
          class="!w-1/1"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.MES_INDEX_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="缺陷等级" prop="level">
        <el-select
          v-model="formData.level"
          placeholder="请选择缺陷等级"
          clearable
          class="!w-1/1"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_DEFECT_LEVEL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { QcDefectApi, QcDefectVO } from '@/api/mes/qc/defect'
import { generateRandomStr } from '@/utils'

defineOptions({ name: 'DefectForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  level: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '缺陷编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '缺陷描述不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '检测项类型不能为空', trigger: 'change' }],
  level: [{ required: true, message: '缺陷等级不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成缺陷编码 */
const generateCode = () => {
  // TODO @芋艿：后续对接后端编码生成接口
  formData.value.code = 'DF' + generateRandomStr(12)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcDefectApi.getDefect(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcDefectVO
    if (formType.value === 'create') {
      await QcDefectApi.createDefect(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcDefectApi.updateDefect(data)
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
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    type: undefined,
    level: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
