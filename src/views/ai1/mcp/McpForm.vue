<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="680px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="MCP 名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入MCP 名称" maxlength="100" />
      </el-form-item>
      <el-form-item label="传输方式" prop="transport">
        <el-radio-group v-model="formData.transport">
          <el-radio
            v-for="dict in getStrDictOptions(DICT_TYPE.AI1_MCP_TRANSPORT)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 远程配置 -->
      <template v-if="formData.transport === Ai1McpTransportEnum.HTTP">
        <el-form-item label="服务地址" prop="url">
          <el-input v-model="formData.url" placeholder="如 https://xxx/mcp" maxlength="200" />
        </el-form-item>
        <el-form-item label="请求头(JSON)" :error="headersError">
          <el-input
            v-model="configForm.headers"
            type="textarea"
            :rows="3"
            :placeholder="'如 ' + JSON.stringify({ Authorization: 'Bearer xxx' })"
            maxlength="500"
          />
        </el-form-item>
      </template>

      <!-- 本地进程配置 -->
      <template v-else>
        <el-form-item label="启动命令" prop="command">
          <el-input v-model="configForm.command" placeholder="如 npx" maxlength="100" />
        </el-form-item>
        <el-form-item label="参数">
          <el-input
            v-model="configForm.argsText"
            type="textarea"
            :rows="3"
            :placeholder="'每行一个参数，如 -y\n@modelcontextprotocol/server-everything'"
          />
        </el-form-item>
        <el-form-item label="环境变量(JSON)" :error="envError">
          <el-input
            v-model="configForm.env"
            type="textarea"
            :rows="3"
            :placeholder="'如 ' + JSON.stringify({ API_KEY: 'xxx' })"
            maxlength="500"
          />
        </el-form-item>
        <el-form-item label="工作目录">
          <el-input v-model="configForm.cwd" placeholder="可选，如 /opt/server" maxlength="200" />
        </el-form-item>
      </template>

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
          maxlength="500"
        />
      </el-form-item>
      <!-- MCP 配置预览 -->
      <el-form-item label="MCP 配置(生成)">
        <el-input
          :model-value="previewConfig"
          :input-style="{ resize: 'none', backgroundColor: 'var(--el-fill-color-light)' }"
          type="textarea"
          :rows="6"
          readonly
          placeholder="填写上方配置项后自动生成 MCP 配置 JSON（只读）"
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
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { jsonParseObject } from '@/utils'
import { isEmpty } from '@/utils/is'
import { McpApi, Mcp } from '@/api/ai1/mcp'
import { Ai1McpTransportEnum } from '@/views/ai1/utils/constants'

/** AI1 MCP 表单 */
defineOptions({ name: 'Ai1McpForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  name: undefined as string | undefined,
  transport: Ai1McpTransportEnum.HTTP as string,
  url: undefined as string | undefined,
  status: CommonStatusEnum.ENABLE as number,
  remark: undefined as string | undefined
})
// 配置项
const configForm = ref({
  headers: '', // 远程：请求头
  command: '', // 本地：启动命令
  argsText: '', // 本地：参数，每行一个
  env: '', // 本地：环境变量
  cwd: '' // 本地：工作目录
})
const formRules = reactive({
  name: [{ required: true, message: 'MCP 名称不能为空', trigger: 'blur' }],
  transport: [{ required: true, message: '传输方式不能为空', trigger: 'change' }],
  url: [{ required: true, message: '服务地址不能为空', trigger: 'blur' }],
  command: [
    {
      required: true,
      validator: (_rule: any, _value: any, callback: any) => {
        if (!configForm.value.command.trim()) {
          callback(new Error('本地类型必须填写启动命令（如 npx）'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
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
      const data = await McpApi.getMcp(id)
      formData.value = data
      parseConfigForm(data)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 解析配置项 */
const parseConfigForm = (data: Mcp) => {
  const config = jsonParseObject(data.config) ?? {}
  formData.value.url = config.url || data.url
  const headers = isEmpty(config.headers) ? data.headers : config.headers
  configForm.value = {
    headers: isEmpty(headers) ? '' : JSON.stringify(headers, null, 2),
    command: config.command ?? '',
    argsText: Array.isArray(config.args) ? config.args.join('\n') : '',
    env: isEmpty(config.env) ? '' : JSON.stringify(config.env, null, 2),
    cwd: config.cwd ?? ''
  }
}

/** 请求头的校验提示 */
const headersError = computed(() => {
  const text = configForm.value.headers
  return text.trim() && !jsonParseObject(text) ? '请求头需为合法 JSON 对象' : ''
})

/** 环境变量的校验提示 */
const envError = computed(() => {
  const text = configForm.value.env
  return text.trim() && !jsonParseObject(text) ? '环境变量需为合法 JSON 对象' : ''
})

/** 组装 MCP 配置 */
const buildConfig = (): Record<string, any> | undefined => {
  const config: Record<string, any> = { transport: formData.value.transport }
  if (formData.value.transport === Ai1McpTransportEnum.STDIO) {
    const command = configForm.value.command.trim()
    if (!command) {
      return undefined
    }
    config.command = command
    const args = configForm.value.argsText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    if (args.length > 0) {
      config.args = args
    }
    const env = jsonParseObject(configForm.value.env)
    if (!isEmpty(env)) {
      config.env = env
    }
    const cwd = configForm.value.cwd.trim()
    if (cwd) {
      config.cwd = cwd
    }
  } else {
    const url = formData.value.url?.trim()
    if (!url) {
      return undefined
    }
    config.url = url
    const headers = jsonParseObject(configForm.value.headers)
    if (!isEmpty(headers)) {
      config.headers = headers
    }
  }
  return config
}

/** MCP 配置预览 */
const previewConfig = computed(() => {
  const config = buildConfig()
  return config ? JSON.stringify(config, null, 2) : ''
})

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 1.1 校验表单
  await formRef.value.validate()
  // 1.2 校验 JSON 字段
  const isStdio = formData.value.transport === Ai1McpTransportEnum.STDIO
  if (!isStdio && headersError.value) {
    message.warning(headersError.value)
    return
  }
  if (isStdio && envError.value) {
    message.warning(envError.value)
    return
  }

  // 2. 组装请求
  const config = buildConfig()
  const headers = isStdio ? undefined : jsonParseObject(configForm.value.headers)
  const data = {
    ...formData.value,
    url: isStdio ? undefined : config?.url,
    headers: headers ?? {}, // 传空对象，确保能清空请求头
    config: JSON.stringify(config)
  } as Mcp

  // 3. 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await McpApi.createMcp(data)
      message.success(t('common.createSuccess'))
    } else {
      await McpApi.updateMcp(data)
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
    transport: Ai1McpTransportEnum.HTTP,
    url: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  configForm.value = {
    headers: '',
    command: '',
    argsText: '',
    env: '',
    cwd: ''
  }
  formRef.value?.resetFields()
}
</script>
