<!-- MES 工具类型表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="类型编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入类型编码" />
      </el-form-item>
      <el-form-item label="类型名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入类型名称" />
      </el-form-item>
      <el-form-item label="是否编码管理" prop="codeFlag">
        <!-- TODO @AI: linter -->
        <el-radio-group v-model="formData.codeFlag">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="保养维护类型" prop="maintenType">
        <el-select
          v-model="formData.maintenType"
          placeholder="请选择保养维护类型"
          clearable
          class="!w-1/1"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_MAINTEN_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="保养周期"
        prop="maintenPeriod"
        v-if="formData.maintenType === 1"
      >
        <el-input-number
          v-model="formData.maintenPeriod"
          :min="1"
          placeholder="请输入保养周期（天）"
          class="!w-1/1"
        />
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
import { getBoolDictOptions, getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { TmToolTypeApi, TmToolTypeVO } from '@/api/mes/tm/tooltype'

defineOptions({ name: 'ToolTypeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as unknown as number,
  code: undefined as unknown as string,
  name: undefined as unknown as string,
  codeFlag: true as boolean,
  maintenType: undefined as unknown as number,
  maintenPeriod: undefined as unknown as number,
  remark: undefined as unknown as string
})
const formRules = reactive({
  code: [{ required: true, message: '类型编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '类型名称不能为空', trigger: 'blur' }],
  codeFlag: [{ required: true, message: '是否编码管理不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await TmToolTypeApi.getToolType(id)
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
  // 如果不是定期维护，清空保养周期
  // TODO @AI：字典判断；另外，后端已经处理，貌似可以不处理，前端；
  if (formData.value.maintenType !== 1) {
    formData.value.maintenPeriod = undefined as unknown as number
  }
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as TmToolTypeVO
    if (formType.value === 'create') {
      await TmToolTypeApi.createToolType(data)
      message.success(t('common.createSuccess'))
    } else {
      await TmToolTypeApi.updateToolType(data)
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
// TODO @AI：linter 报错；参考下别的模块处理策略；
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    codeFlag: true,
    maintenType: undefined,
    maintenPeriod: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
