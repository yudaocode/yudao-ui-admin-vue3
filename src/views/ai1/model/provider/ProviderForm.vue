<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="720px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="模型供应商" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模型供应商" maxlength="50" />
      </el-form-item>
      <el-form-item label="接口地址" prop="baseUrl">
        <el-input
          v-model="formData.baseUrl"
          placeholder="支持 OpenAI 格式的 API 接口，如 https://api.deepseek.com/v1"
          maxlength="200"
        />
      </el-form-item>
      <el-form-item label="API 密钥" prop="apiKey">
        <!-- 留空表示不修改 -->
        <el-input
          v-model="formData.apiKey"
          :placeholder="
            formType === 'update'
              ? '留空则保持原密钥不变，也可填写 ${OPENAI_API_KEY}'
              : '明文密钥，或 ${OPENAI_API_KEY} 这样的环境变量'
          "
          type="password"
          show-password
          autocomplete="new-password"
          maxlength="200"
        />
      </el-form-item>
      <el-form-item label="请求附属 Header">
        <div class="w-full">
          <div
            v-for="(header, index) in headerList"
            :key="index"
            class="mb-8px flex items-center gap-8px"
          >
            <el-input v-model="header.key" placeholder="Header 名称" class="!w-200px" />
            <el-input v-model="header.value" placeholder="Header 值，可用 {session}" />
            <el-button link type="danger" @click="headerList.splice(index, 1)">
              <Icon icon="ep:delete" />
            </el-button>
          </div>
          <el-button plain @click="headerList.push({ key: '', value: '' })">
            <Icon icon="ep:plus" class="mr-5px" /> 添加 Header
          </el-button>
          <div class="mt-4px text-12px leading-18px text-[var(--el-text-color-secondary)]">
            值中可使用 {session} 占位符，发起请求时自动替换为当前会话编号，例如 x-opencode-session:
            {session}
          </div>
        </div>
      </el-form-item>
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
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注"
          maxlength="255"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { ProviderApi, Provider } from '@/api/ai1/model/provider'

/** AI1 模型供应商表单 */
defineOptions({ name: 'Ai1ProviderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  name: undefined as string | undefined,
  baseUrl: undefined as string | undefined,
  apiKey: undefined as string | undefined,
  status: CommonStatusEnum.ENABLE as number,
  remark: undefined as string | undefined
})
const headerList = ref<{ key: string; value: string }[]>([]) // Header 列表
const formRules = reactive({
  name: [{ required: true, message: '模型供应商不能为空', trigger: 'blur' }],
  baseUrl: [{ required: true, message: '接口地址不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
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
      const data = await ProviderApi.getProvider(id)
      formData.value = {
        ...data,
        // 仅完整的 ${ENV} 占位符回填，脱敏值和带默认值的占位符均不回填
        apiKey:
          data.apiKey?.match(/^\$\{[a-zA-Z_][a-zA-Z0-9_.-]*\}$/)?.[0] === data.apiKey
            ? data.apiKey
            : undefined
      }
      try {
        const headers = data.headers ? JSON.parse(data.headers) : []
        if (!Array.isArray(headers)) {
          throw new Error('Header 格式错误')
        }
        headerList.value = headers.map((item) => ({
          key: String(item?.key ?? ''),
          value: String(item?.value ?? '')
        }))
      } catch {
        headerList.value = []
        message.warning('附属 Header 格式错误，已清空，请重新填写')
      }
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
  // 校验 Header
  const headers = headerList.value
    .map((item) => ({ key: String(item.key ?? '').trim(), value: item.value }))
    .filter((item) => item.key || item.value)
  if (headers.some((item) => !item.key)) {
    message.warning('Header 名称不能为空')
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    // 传空串，确保能清空 Header
    const data = {
      ...formData.value,
      headers: headers.length > 0 ? JSON.stringify(headers) : ''
    } as unknown as Provider
    if (formType.value === 'create') {
      await ProviderApi.createProvider(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProviderApi.updateProvider(data)
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
    name: undefined,
    baseUrl: undefined,
    apiKey: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  headerList.value = []
  formRef.value?.resetFields()
}
</script>
