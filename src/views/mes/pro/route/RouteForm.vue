<!-- MES 工艺路线表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入编码">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="说明" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入工艺路线说明"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
      <!-- 编辑时展示 Tab -->
      <template v-if="formData.id">
        <el-divider content-position="left">详细信息</el-divider>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="组成工序" name="process">
            <RouteProcessList :routeId="formData.id" />
          </el-tab-pane>
          <el-tab-pane label="关联产品" name="product">
            <RouteProductList :routeId="formData.id" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { generateRandomStr } from '@/utils'
import { ProRouteApi, ProRouteVO } from '@/api/mes/pro/route'
import RouteProcessList from './RouteProcessList.vue'
import RouteProductList from './RouteProductList.vue'

defineOptions({ name: 'RouteForm' })

// TODO @AI：注释参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/qc/template/TemplateForm.vue
const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const activeTab = ref('process')
const formData = ref<ProRouteVO>({
  id: undefined,
  code: '',
  name: '',
  description: '',
  status: 0, // TODO @AI：枚举；
  remark: ''
})
const formRules = reactive({
  code: [{ required: true, message: '编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 生成编码 */
const generateCode = () => {
  formData.value.code = 'ROUTE' + generateRandomStr(8)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增工艺路线' : '编辑工艺路线'
  formType.value = type
  activeTab.value = 'process'
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProRouteApi.getRoute(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (formType.value === 'create') {
      await ProRouteApi.createRoute(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProRouteApi.updateRoute(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: '',
    name: '',
    description: '',
    status: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
