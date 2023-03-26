<template>
  <Dialog :title="dialogTitle" v-model="modelVisible" width="800">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="角色类型" prop="type">
        <el-input :model-value="formData.type" placeholder="请输入角色类型" height="150px" />
      </el-form-item>
      <el-form-item label="角色标识" prop="code">
        <el-input :model-value="formData.code" placeholder="请输入角色标识" height="150px" />
      </el-form-item>
      <el-form-item label="显示顺序" prop="sort">
        <el-input :model-value="formData.sort" placeholder="请输入显示顺序" height="150px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import type { FormExpose } from '@/components/Form'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as RoleApi from '@/api/system/role'
// ========== CRUD 相关 ==========
const dialogTitle = ref('edit') // 弹出层标题
const formRef = ref<FormExpose>() // 表单 Ref
const { t } = useI18n() // 国际化
const dataScopeDictDatas = ref()
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改

const formData = ref({
  id: undefined,
  name: '',
  type: '',
  code: '',
  sort: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: ''
})
const formRules = reactive({
  name: [{ required: true, message: '岗位标题不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '岗位编码不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '岗位顺序不能为空', trigger: 'change' }],
  status: [{ required: true, message: '岗位状态不能为空', trigger: 'change' }],
  remark: [{ required: false, message: '岗位内容不能为空', trigger: 'blur' }]
})

/** 打开弹窗 */
const openModal = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await RoleApi.getRole(id)
    } finally {
      formLoading.value = false
    }
  }
}
/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    code: '',
    sort: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: ''
  }
  formRef.value?.resetFields()
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗
/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as RoleApi.RoleVO
    if (formType.value === 'create') {
      await RoleApi.createRole(data)
      message.success(t('common.createSuccess'))
    } else {
      await RoleApi.updateRole(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const init = () => {
  dataScopeDictDatas.value = getIntDictOptions(DICT_TYPE.SYSTEM_DATA_SCOPE)
}
// ========== 初始化 ==========
onMounted(() => {
  init()
})
</script>
<style scoped>
.card {
  width: 100%;
  max-height: 400px;
  overflow-y: scroll;
}
</style>
